import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse, Business, UpdateBusinessPayload } from '@/types'

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
  }
}
