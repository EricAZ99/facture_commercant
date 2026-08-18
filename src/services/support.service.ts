import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse, CreateSupportTicketPayload, ID, SupportTicket } from '@/types'

import { apiClient } from './api'

/** Service des tickets support du commerce courant (contacter l'assistance Facture IA). */
export const supportService = {
  async list(): Promise<SupportTicket[]> {
    const { data } = await apiClient.get<ApiResponse<SupportTicket[]>>(
      API_ENDPOINTS.support.tickets
    )
    return data.data
  },

  async getById(id: ID): Promise<SupportTicket> {
    const { data } = await apiClient.get<ApiResponse<SupportTicket>>(
      API_ENDPOINTS.support.ticketById(id)
    )
    return data.data
  },

  async create(payload: CreateSupportTicketPayload): Promise<SupportTicket> {
    const { data } = await apiClient.post<ApiResponse<SupportTicket>>(
      API_ENDPOINTS.support.tickets,
      payload
    )
    return data.data
  },

  async reply(id: ID, message: string): Promise<SupportTicket> {
    const { data } = await apiClient.post<ApiResponse<SupportTicket>>(
      API_ENDPOINTS.support.ticketMessages(id),
      { message }
    )
    return data.data
  }
}
