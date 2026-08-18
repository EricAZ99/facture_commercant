import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreateQuotePayload,
  ID,
  Invoice,
  PaginatedResponse,
  Quote,
  QuoteListParams,
  UpdateQuotePayload
} from '@/types'

import { apiClient } from './api'

/** Service de gestion des devis. */
export const quoteService = {
  async list(params?: QuoteListParams): Promise<PaginatedResponse<Quote>> {
    const { data } = await apiClient.get<PaginatedResponse<Quote>>(API_ENDPOINTS.quotes.base, {
      params
    })
    return data
  },

  async getById(id: ID): Promise<Quote> {
    const { data } = await apiClient.get<ApiResponse<Quote>>(API_ENDPOINTS.quotes.byId(id))
    return data.data
  },

  async create(payload: CreateQuotePayload): Promise<Quote> {
    const { data } = await apiClient.post<ApiResponse<Quote>>(API_ENDPOINTS.quotes.base, payload)
    return data.data
  },

  async update(id: ID, payload: UpdateQuotePayload): Promise<Quote> {
    const { data } = await apiClient.patch<ApiResponse<Quote>>(
      API_ENDPOINTS.quotes.byId(id),
      payload
    )
    return data.data
  },

  async remove(id: ID): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.quotes.byId(id))
  },

  /** Convertit un devis en facture et retourne la facture creee. */
  async convert(id: ID): Promise<Invoice> {
    const { data } = await apiClient.post<ApiResponse<Invoice>>(API_ENDPOINTS.quotes.convert(id))
    return data.data
  }
}
