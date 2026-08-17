import { API_ENDPOINTS } from '@/constants'
import type { AdminAuthResponse, AdminLoginCredentials, ApiResponse, PlatformAdmin } from '@/types'

import { adminApiClient } from './adminApi'

/** Service d'authentification de l'espace admin plateforme (realm separe des commercants). */
export const adminAuthService = {
  async login(credentials: AdminLoginCredentials): Promise<AdminAuthResponse> {
    const { data } = await adminApiClient.post<ApiResponse<AdminAuthResponse>>(
      API_ENDPOINTS.adminAuth.login,
      credentials
    )
    return data.data
  },

  async logout(): Promise<void> {
    await adminApiClient.post(API_ENDPOINTS.adminAuth.logout)
  },

  async getCurrentAdmin(): Promise<PlatformAdmin> {
    const { data } = await adminApiClient.get<ApiResponse<PlatformAdmin>>(
      API_ENDPOINTS.adminAuth.me
    )
    return data.data
  }
}
