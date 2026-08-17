import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreateInvoicePayload,
  ID,
  Invoice,
  InvoiceListParams,
  PaginatedResponse,
  UpdateInvoicePayload
} from '@/types'

import { apiClient } from './api'

/** Service de gestion des factures. */
export const invoiceService = {
  async list(params?: InvoiceListParams): Promise<PaginatedResponse<Invoice>> {
    const { data } = await apiClient.get<PaginatedResponse<Invoice>>(API_ENDPOINTS.invoices.base, {
      params
    })
    return data
  },

  async getById(id: ID): Promise<Invoice> {
    const { data } = await apiClient.get<ApiResponse<Invoice>>(API_ENDPOINTS.invoices.byId(id))
    return data.data
  },

  async create(payload: CreateInvoicePayload): Promise<Invoice> {
    const { data } = await apiClient.post<ApiResponse<Invoice>>(
      API_ENDPOINTS.invoices.base,
      payload
    )
    return data.data
  },

  async update(id: ID, payload: UpdateInvoicePayload): Promise<Invoice> {
    const { data } = await apiClient.patch<ApiResponse<Invoice>>(
      API_ENDPOINTS.invoices.byId(id),
      payload
    )
    return data.data
  },

  async remove(id: ID): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.invoices.byId(id))
  },

  async send(id: ID): Promise<Invoice> {
    const { data } = await apiClient.post<ApiResponse<Invoice>>(API_ENDPOINTS.invoices.send(id))
    return data.data
  }
}
