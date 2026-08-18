import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  ID,
  ListQueryParams,
  PaginatedResponse,
  PlatformEvent,
  SupportTicket,
  SupportTicketStatus
} from '@/types'

import { adminApiClient } from './adminApi'

/** Service des tickets support (vue admin, tous commerces confondus) et des notifications plateforme. */
export const adminSupportService = {
  async listTickets(
    params?: ListQueryParams & { status?: SupportTicketStatus | '' }
  ): Promise<PaginatedResponse<SupportTicket>> {
    const { data } = await adminApiClient.get<PaginatedResponse<SupportTicket>>(
      API_ENDPOINTS.admin.supportTickets,
      { params }
    )
    return data
  },

  async getTicket(id: ID): Promise<SupportTicket> {
    const { data } = await adminApiClient.get<ApiResponse<SupportTicket>>(
      API_ENDPOINTS.admin.supportTicketById(id)
    )
    return data.data
  },

  async reply(id: ID, message: string): Promise<SupportTicket> {
    const { data } = await adminApiClient.post<ApiResponse<SupportTicket>>(
      API_ENDPOINTS.admin.supportTicketMessages(id),
      { message }
    )
    return data.data
  },

  async setStatus(id: ID, status: SupportTicketStatus): Promise<SupportTicket> {
    const { data } = await adminApiClient.patch<ApiResponse<SupportTicket>>(
      API_ENDPOINTS.admin.supportTicketStatus(id),
      { status }
    )
    return data.data
  },

  async listNotifications(limit?: number): Promise<PlatformEvent[]> {
    const { data } = await adminApiClient.get<ApiResponse<PlatformEvent[]>>(
      API_ENDPOINTS.admin.notifications,
      { params: { limit } }
    )
    return data.data
  }
}
