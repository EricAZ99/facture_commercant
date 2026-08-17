import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreateUserPayload,
  ID,
  ListQueryParams,
  PaginatedResponse,
  UpdateUserPayload,
  User
} from '@/types'

import { apiClient } from './api'

/** Service de gestion des utilisateurs du commerce (equipe). */
export const userService = {
  async list(params?: ListQueryParams): Promise<PaginatedResponse<User>> {
    const { data } = await apiClient.get<PaginatedResponse<User>>(API_ENDPOINTS.users.base, {
      params
    })
    return data
  },

  async getById(id: ID): Promise<User> {
    const { data } = await apiClient.get<ApiResponse<User>>(API_ENDPOINTS.users.byId(id))
    return data.data
  },

  async create(payload: CreateUserPayload): Promise<User> {
    const { data } = await apiClient.post<ApiResponse<User>>(API_ENDPOINTS.users.base, payload)
    return data.data
  },

  async update(id: ID, payload: UpdateUserPayload): Promise<User> {
    const { data } = await apiClient.patch<ApiResponse<User>>(API_ENDPOINTS.users.byId(id), payload)
    return data.data
  },

  async remove(id: ID): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.users.byId(id))
  }
}
