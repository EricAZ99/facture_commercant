import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse, Business, BusinessDataExport, UpdateBusinessPayload } from '@/types'

import { apiClient } from './api'

/** Service de gestion des parametres du commerce (tenant courant). */
export const businessService = {
  async update(payload: UpdateBusinessPayload): Promise<Business> {
    const { data } = await apiClient.patch<ApiResponse<Business>>(
      API_ENDPOINTS.business.base,
      payload
    )
    return data.data
  },

  async uploadLogo(file: File): Promise<Business> {
    const formData = new FormData()
    formData.append('logo', file)

    const { data } = await apiClient.post<ApiResponse<Business>>(
      API_ENDPOINTS.business.logo,
      formData,
      {
        // L'instance Axios fixe `Content-Type: application/json` par defaut
        // (voir `services/api.ts`) : on le retire explicitement pour ce
        // seul appel, sinon le corps FormData serait converti en JSON et le
        // fichier perdu. `undefined` laisse le navigateur poser
        // lui-meme l'en-tete `multipart/form-data; boundary=...` correct.
        headers: { 'Content-Type': undefined }
      }
    )
    return data.data
  },

  async uploadStamp(file: File): Promise<Business> {
    const formData = new FormData()
    formData.append('stamp', file)

    const { data } = await apiClient.post<ApiResponse<Business>>(
      API_ENDPOINTS.business.stamp,
      formData,
      { headers: { 'Content-Type': undefined } }
    )
    return data.data
  },

  async regenerateApiKey(): Promise<Business> {
    const { data } = await apiClient.post<ApiResponse<Business>>(
      API_ENDPOINTS.business.regenerateApiKey
    )
    return data.data
  },

  async exportData(): Promise<BusinessDataExport> {
    const { data } = await apiClient.get<ApiResponse<BusinessDataExport>>(
      API_ENDPOINTS.business.export
    )
    return data.data
  },

  async deleteAccount(confirmName: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.business.base, { data: { confirmName } })
  }
}
