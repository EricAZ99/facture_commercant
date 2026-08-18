import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { STORAGE_KEYS } from '@/constants'
import { authService, setBusinessIdProvider, setUnauthorizedHandler } from '@/services'
import type {
  AuthResponse,
  Business,
  ForgotPasswordPayload,
  LoginCredentials,
  Permission,
  RegisterPayload,
  ResetPasswordPayload,
  User,
  UserRole
} from '@/types'
import { storage } from '@/utils/storage'

/**
 * Store de session: utilisateur courant, commerce actif (tenant), jeton
 * d'acces et permissions. Source unique de verite pour l'etat
 * d'authentification de l'application (architecture multi-tenant: chaque
 * session est rattachee a un commerce).
 *
 * Seuls les jetons (access/refresh) sont persistes en localStorage — voir
 * `utils/storage.ts`. `user`/`business` ne vivent qu'en memoire et sont
 * restaures via `fetchCurrentUser()` a chaque chargement de l'application.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const business = ref<Business | null>(null)
  const accessToken = ref<string | null>(storage.get(STORAGE_KEYS.accessToken))
  /** true pendant toute operation d'authentification (login, register, logout, refresh session...). */
  const loading = ref(false)
  /** true tant que la restauration de session au demarrage n'est pas terminee. */
  const isInitializing = ref(true)

  const authenticated = computed(() => user.value !== null && accessToken.value !== null)
  const permissions = computed<Permission[]>(() => user.value?.permissions ?? [])
  const role = computed<UserRole | null>(() => user.value?.role ?? null)

  function hasPermission(permission: Permission): boolean {
    return permissions.value.includes(permission)
  }

  function hasAnyPermission(required: Permission[]): boolean {
    return required.some((permission) => permissions.value.includes(permission))
  }

  function setSession(payload: AuthResponse): void {
    user.value = payload.user
    business.value = payload.business
    accessToken.value = payload.tokens.accessToken
    storage.set(STORAGE_KEYS.accessToken, payload.tokens.accessToken)
    storage.set(STORAGE_KEYS.refreshToken, payload.tokens.refreshToken)
  }

  /**
   * Remplace le commerce actif suite a une modification de ses parametres
   * (voir `business.store.ts`). `authStore.business` reste la source unique
   * de verite : aucun autre store ne conserve sa propre copie du commerce.
   */
  function setBusiness(updated: Business): void {
    business.value = updated
  }

  /** Remplace l'utilisateur courant suite a une modification de son profil (avatar, email...). */
  function setUser(updated: User): void {
    user.value = updated
  }

  function clearSession(): void {
    user.value = null
    business.value = null
    accessToken.value = null
    storage.remove(STORAGE_KEYS.accessToken)
    storage.remove(STORAGE_KEYS.refreshToken)
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true
    try {
      const response = await authService.login(credentials)
      setSession(response)
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload): Promise<void> {
    loading.value = true
    try {
      const response = await authService.register(payload)
      setSession(response)
    } finally {
      loading.value = false
    }
  }

  /** Echange un ticket de mode "apercu" (emis par l'espace admin) contre une vraie session commercant. */
  async function loginWithImpersonationTicket(ticket: string): Promise<void> {
    loading.value = true
    try {
      const response = await authService.exchangeImpersonationTicket(ticket)
      setSession(response)
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    try {
      await authService.logout()
    } finally {
      clearSession()
      loading.value = false
    }
  }

  async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    loading.value = true
    try {
      await authService.forgotPassword(payload)
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
    loading.value = true
    try {
      await authService.resetPassword(payload)
    } finally {
      loading.value = false
    }
  }

  /** Restaure la session (profil + commerce) a partir du token persiste, au demarrage de l'app. */
  async function fetchCurrentUser(): Promise<void> {
    if (!accessToken.value) {
      isInitializing.value = false
      return
    }

    loading.value = true
    try {
      const session = await authService.getCurrentUser()
      user.value = session.user
      business.value = session.business
    } catch {
      clearSession()
    } finally {
      loading.value = false
      isInitializing.value = false
    }
  }

  // Cablage avec la couche services, decouple pour eviter toute dependance
  // circulaire entre `services/api.ts` et les stores Pinia.
  setUnauthorizedHandler(() => clearSession())
  setBusinessIdProvider(() => business.value?.id ?? null)

  return {
    user,
    business,
    accessToken,
    loading,
    isInitializing,
    authenticated,
    permissions,
    role,
    hasPermission,
    hasAnyPermission,
    login,
    register,
    loginWithImpersonationTicket,
    logout,
    forgotPassword,
    resetPassword,
    fetchCurrentUser,
    setBusiness,
    setUser,
    clearSession
  }
})
