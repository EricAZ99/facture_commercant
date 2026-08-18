import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreateCreditNotePayload,
  CreditNote,
  ID,
  ListQueryParams,
  PaginatedResponse
} from '@/types'

import { apiClient } from './api'

/** Service de gestion des avoirs (notes de credit). */
export const creditNoteService = {
  async list(
    params?: ListQueryParams & { clientId?: ID; invoiceId?: ID }
  ): Promise<PaginatedResponse<CreditNote>> {
    const { data } = await apiClient.get<PaginatedResponse<CreditNote>>(
      API_ENDPOINTS.creditNotes.base,
      { params }
    )
    return data
  },

  async getById(id: ID): Promise<CreditNote> {
    const { data } = await apiClient.get<ApiResponse<CreditNote>>(
      API_ENDPOINTS.creditNotes.byId(id)
    )
    return data.data
  },

  async listByInvoice(invoiceId: ID): Promise<CreditNote[]> {
    const { data } = await apiClient.get<ApiResponse<CreditNote[]>>(
      API_ENDPOINTS.creditNotes.byInvoice(invoiceId)
    )
    return data.data
  },

  async create(payload: CreateCreditNotePayload): Promise<CreditNote> {
    const { data } = await apiClient.post<ApiResponse<CreditNote>>(
      API_ENDPOINTS.creditNotes.base,
      payload
    )
    return data.data
  }
}
