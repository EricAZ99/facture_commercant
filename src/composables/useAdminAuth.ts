import { useRoute, useRouter } from 'vue-router'

import { ROUTE_NAMES } from '@/constants'
import { useAdminAuthStore } from '@/stores'
import type { AdminLoginCredentials, ApiError } from '@/types'

import { useToast } from './useToast'

function errorMessage(err: unknown, fallback: string): string {
  return (err as Partial<ApiError>).message ?? fallback
}

function isSafeRedirect(target: unknown): target is string {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
}

/** Actions d'authentification de l'espace admin, avec leurs effets de bord UI (navigation, toasts). */
export function useAdminAuth() {
  const adminAuthStore = useAdminAuthStore()
  const router = useRouter()
  const route = useRoute()
  const toast = useToast()

  async function loginAndRedirect(credentials: AdminLoginCredentials): Promise<boolean> {
    try {
      await adminAuthStore.login(credentials)
      const redirect = route.query.redirect
      await router.push(isSafeRedirect(redirect) ? redirect : { name: ROUTE_NAMES.adminDashboard })
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Connexion impossible.'))
      return false
    }
  }

  async function logoutAndRedirect(): Promise<void> {
    await adminAuthStore.logout()
    await router.push({ name: ROUTE_NAMES.adminLogin })
  }

  return { adminAuthStore, loginAndRedirect, logoutAndRedirect }
}
