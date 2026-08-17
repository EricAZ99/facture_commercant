import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { STORAGE_KEYS } from '@/constants'
import { adminAuthService, setAdminUnauthorizedHandler } from '@/services'
import type { AdminLoginCredentials, PlatformAdmin } from '@/types'
import { storage } from '@/utils/storage'

/**
 * Store de session de l'espace admin plateforme. Entierement independant de
 * `auth.store.ts` (identite, jetons et stockage separes) : un admin n'est
 * jamais un `User` de commerce, et une session admin ne donne jamais acces
 * aux endpoints commercants (voir `services/adminApi.ts`).
 */
export const useAdminAuthStore = defineStore('adminAuth', () => {
  const admin = ref<PlatformAdmin | null>(null)
  const accessToken = ref<string | null>(storage.get(STORAGE_KEYS.adminAccessToken))
  const loading = ref(false)
  const isInitializing = ref(true)

  const authenticated = computed(() => admin.value !== null && accessToken.value !== null)

  function setSession(payload: {
    admin: PlatformAdmin
    tokens: { accessToken: string; refreshToken: string }
  }): void {
    admin.value = payload.admin
    accessToken.value = payload.tokens.accessToken
    storage.set(STORAGE_KEYS.adminAccessToken, payload.tokens.accessToken)
    storage.set(STORAGE_KEYS.adminRefreshToken, payload.tokens.refreshToken)
  }

  function clearSession(): void {
    admin.value = null
    accessToken.value = null
    storage.remove(STORAGE_KEYS.adminAccessToken)
    storage.remove(STORAGE_KEYS.adminRefreshToken)
  }

  async function login(credentials: AdminLoginCredentials): Promise<void> {
    loading.value = true
    try {
      const response = await adminAuthService.login(credentials)
      setSession(response)
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    try {
      await adminAuthService.logout()
    } finally {
      clearSession()
      loading.value = false
    }
  }

  /** Restaure la session admin a partir du jeton persiste, au demarrage de l'app. */
  async function fetchCurrentAdmin(): Promise<void> {
    if (!accessToken.value) {
      isInitializing.value = false
      return
    }

    loading.value = true
    try {
      admin.value = await adminAuthService.getCurrentAdmin()
    } catch {
      clearSession()
    } finally {
      loading.value = false
      isInitializing.value = false
    }
  }

  setAdminUnauthorizedHandler(() => clearSession())

  return {
    admin,
    accessToken,
    loading,
    isInitializing,
    authenticated,
    login,
    logout,
    fetchCurrentAdmin,
    clearSession
  }
})
