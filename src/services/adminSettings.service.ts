import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse, PlatformSettings, UpdatePlatformSettingsPayload } from '@/types'

import { adminApiClient } from './adminApi'

/** Service des parametres globaux de la plateforme (espace admin). */
export const adminSettingsService = {
  async get(): Promise<PlatformSettings> {
    const { data } = await adminApiClient.get<ApiResponse<PlatformSettings>>(
      API_ENDPOINTS.admin.settings
    )
    return data.data
  },

  async update(payload: UpdatePlatformSettingsPayload): Promise<PlatformSettings> {
    const { data } = await adminApiClient.patch<ApiResponse<PlatformSettings>>(
      API_ENDPOINTS.admin.settings,
      payload
    )
    return data.data
  }
}
