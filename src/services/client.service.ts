import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  Client,
  ClientImportResult,
  CreateClientPayload,
  ID,
  ListQueryParams,
  MergeClientsPayload,
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
  },

  /** Importe plusieurs clients en une fois (ex: issus d'un CSV) ; renvoie un bilan ligne par ligne. */
  async importMany(clients: CreateClientPayload[]): Promise<ClientImportResult> {
    const { data } = await apiClient.post<ApiResponse<ClientImportResult>>(
      API_ENDPOINTS.clients.import,
      { clients }
    )
    return data.data
  },

  /** Fusionne deux fiches en doublon (voir `MergeClientsPayload`). */
  async merge(payload: MergeClientsPayload): Promise<Client> {
    const { data } = await apiClient.post<ApiResponse<Client>>(API_ENDPOINTS.clients.merge, payload)
    return data.data
  }
}
