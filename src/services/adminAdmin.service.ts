import { API_ENDPOINTS } from '@/constants'
import type {
  AdminLoginHistoryEntry,
  ApiResponse,
  ID,
  InviteAdminPayload,
  ListQueryParams,
  PaginatedResponse,
  PlatformAdmin,
  UpdateAdminPayload
} from '@/types'

import { adminApiClient } from './adminApi'

/** Service de gestion des comptes administrateurs (reserve aux super-admins pour les mutations). */
export const adminAdminService = {
  async list(): Promise<PlatformAdmin[]> {
    const { data } = await adminApiClient.get<ApiResponse<PlatformAdmin[]>>(
      API_ENDPOINTS.admin.admins
    )
    return data.data
  },

  async invite(payload: InviteAdminPayload): Promise<PlatformAdmin> {
    const { data } = await adminApiClient.post<ApiResponse<PlatformAdmin>>(
      API_ENDPOINTS.admin.admins,
      payload
    )
    return data.data
  },

  async update(id: ID, payload: UpdateAdminPayload): Promise<PlatformAdmin> {
    const { data } = await adminApiClient.patch<ApiResponse<PlatformAdmin>>(
      API_ENDPOINTS.admin.adminById(id),
      payload
    )
    return data.data
  },

  async getLoginHistory(
    params?: ListQueryParams
  ): Promise<PaginatedResponse<AdminLoginHistoryEntry>> {
    const { data } = await adminApiClient.get<PaginatedResponse<AdminLoginHistoryEntry>>(
      API_ENDPOINTS.admin.adminLoginHistory,
      { params }
    )
    return data
  }
}
