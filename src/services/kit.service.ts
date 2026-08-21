import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreateKitPayload,
  ID,
  ListQueryParams,
  PaginatedResponse,
  ProductKit,
  UpdateKitPayload
} from '@/types'

import { apiClient } from './api'

/** Service de gestion des kits (produits groupes). */
export const kitService = {
  async list(params?: ListQueryParams): Promise<PaginatedResponse<ProductKit>> {
    const { data } = await apiClient.get<PaginatedResponse<ProductKit>>(API_ENDPOINTS.kits.base, {
      params
    })
    return data
  },

  async getById(id: ID): Promise<ProductKit> {
    const { data } = await apiClient.get<ApiResponse<ProductKit>>(API_ENDPOINTS.kits.byId(id))
    return data.data
  },

  async create(payload: CreateKitPayload): Promise<ProductKit> {
    const { data } = await apiClient.post<ApiResponse<ProductKit>>(API_ENDPOINTS.kits.base, payload)
    return data.data
  },

  async update(id: ID, payload: UpdateKitPayload): Promise<ProductKit> {
    const { data } = await apiClient.patch<ApiResponse<ProductKit>>(
      API_ENDPOINTS.kits.byId(id),
      payload
    )
    return data.data
  },

  async remove(id: ID): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.kits.byId(id))
  }
}
