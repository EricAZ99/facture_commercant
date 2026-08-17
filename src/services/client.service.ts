import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  Client,
  CreateClientPayload,
  ID,
  ListQueryParams,
  PaginatedResponse,
  UpdateClientPayload
} from '@/types'

import { apiClient } from './api'

/** Service de gestion des clients du commerce. */
export const clientService = {
  async list(params?: ListQueryParams): Promise<PaginatedResponse<Client>> {
    const { data } = await apiClient.get<PaginatedResponse<Client>>(API_ENDPOINTS.clients.base, {
      params
    })
    return data
  },

  async getById(id: ID): Promise<Client> {
    const { data } = await apiClient.get<ApiResponse<Client>>(API_ENDPOINTS.clients.byId(id))
    return data.data
  },

  async create(payload: CreateClientPayload): Promise<Client> {
    const { data } = await apiClient.post<ApiResponse<Client>>(API_ENDPOINTS.clients.base, payload)
    return data.data
  },

  async update(id: ID, payload: UpdateClientPayload): Promise<Client> {
    const { data } = await apiClient.patch<ApiResponse<Client>>(
      API_ENDPOINTS.clients.byId(id),
      payload
    )
    return data.data
  },

  async remove(id: ID): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.clients.byId(id))
  }
}
