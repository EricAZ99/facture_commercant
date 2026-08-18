import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreateUserPayload,
  ID,
  ListQueryParams,
  PaginatedResponse,
  UpdateUserPayload,
  User,
  UserDataExport,
  UserLoginHistoryEntry
} from '@/types'

import { apiClient } from './api'

/** Service de gestion des utilisateurs du commerce (equipe). */
export const userService = {
  async list(params?: ListQueryParams & { department?: string }): Promise<PaginatedResponse<User>> {
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
  },

  /** Historique de connexion de l'utilisateur courant. */
  async getMyLoginHistory(): Promise<UserLoginHistoryEntry[]> {
    const { data } = await apiClient.get<ApiResponse<UserLoginHistoryEntry[]>>(
      API_ENDPOINTS.users.meLoginHistory
    )
    return data.data
  },

  /** Export des donnees personnelles de l'utilisateur courant (RGPD). */
  async exportMyData(): Promise<UserDataExport> {
    const { data } = await apiClient.get<ApiResponse<UserDataExport>>(API_ENDPOINTS.users.meExport)
    return data.data
  },

  async uploadMyAvatar(file: File): Promise<User> {
    const formData = new FormData()
    formData.append('avatar', file)
    const { data } = await apiClient.post<ApiResponse<User>>(
      API_ENDPOINTS.users.meAvatar,
      formData,
      { headers: { 'Content-Type': undefined } }
    )
    return data.data
  },

  /** Supprime le compte individuel de l'utilisateur courant (jamais le proprietaire, voir mock-server). */
  async removeMyAccount(): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.users.me)
  }
}
