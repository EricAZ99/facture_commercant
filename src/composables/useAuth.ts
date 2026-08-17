import { useRoute, useRouter } from 'vue-router'

import { ROUTE_NAMES } from '@/constants'
import { useAuthStore } from '@/stores'
import type {
  ApiError,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload
} from '@/types'

import { useToast } from './useToast'

/** Erreur inconnue -> message affichable, en repli sur un libelle par defaut. */
function errorMessage(err: unknown, fallback: string): string {
  return (err as Partial<ApiError>).message ?? fallback
}

/** N'autorise que les redirections internes (`/...`) pour eviter les open-redirects. */
function isSafeRedirect(target: unknown): target is string {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
}

/**
 * Regroupe les actions d'authentification avec leurs effets de bord UI
 * (navigation, notifications), reutilisees par les pages de login,
 * inscription, mot de passe oublie/reinitialisation et deconnexion.
 */
export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()
  const toast = useToast()

  async function loginAndRedirect(credentials: LoginCredentials): Promise<boolean> {
    try {
      await authStore.login(credentials)
      const redirect = route.query.redirect
      await router.push(isSafeRedirect(redirect) ? redirect : { name: ROUTE_NAMES.dashboard })
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Connexion impossible.'))
      return false
    }
  }

  async function registerAndRedirect(payload: RegisterPayload): Promise<boolean> {
    try {
      await authStore.register(payload)
      await router.push({ name: ROUTE_NAMES.dashboard })
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Inscription impossible.'))
      return false
    }
  }

  async function logoutAndRedirect(): Promise<void> {
    await authStore.logout()
    await router.push({ name: ROUTE_NAMES.login })
  }

  async function requestPasswordReset(payload: ForgotPasswordPayload): Promise<boolean> {
    try {
      await authStore.forgotPassword(payload)
      return true
    } catch (err) {
      toast.error(errorMessage(err, "L'envoi du lien de reinitialisation a echoue."))
      return false
    }
  }

  async function resetPasswordAndRedirect(payload: ResetPasswordPayload): Promise<boolean> {
    try {
      await authStore.resetPassword(payload)
      toast.success('Mot de passe reinitialise avec succes. Vous pouvez vous connecter.')
      await router.push({ name: ROUTE_NAMES.login })
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'La reinitialisation du mot de passe a echoue.'))
      return false
    }
  }

  return {
    authStore,
    loginAndRedirect,
    registerAndRedirect,
    logoutAndRedirect,
    requestPasswordReset,
    resetPasswordAndRedirect
  }
}
