import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreatePaymentPayload,
  CreateRefundPayload,
  ID,
  ListQueryParams,
  PaginatedResponse,
  Payment
} from '@/types'

import { apiClient } from './api'

/** Service de gestion des paiements/encaissements. */
export const paymentService = {
  async list(params?: ListQueryParams): Promise<PaginatedResponse<Payment>> {
    const { data } = await apiClient.get<PaginatedResponse<Payment>>(API_ENDPOINTS.payments.base, {
      params
    })
    return data
  },

  async listByInvoice(invoiceId: ID): Promise<Payment[]> {
    const { data } = await apiClient.get<ApiResponse<Payment[]>>(
      API_ENDPOINTS.payments.byInvoice(invoiceId)
    )
    return data.data
  },

  async getById(id: ID): Promise<Payment> {
    const { data } = await apiClient.get<ApiResponse<Payment>>(API_ENDPOINTS.payments.byId(id))
    return data.data
  },

  async create(payload: CreatePaymentPayload): Promise<Payment> {
    const { data } = await apiClient.post<ApiResponse<Payment>>(
      API_ENDPOINTS.payments.base,
      payload
    )
    return data.data
  },

  async remove(id: ID): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.payments.byId(id))
  },

  /** Rembourse (totalement ou partiellement) un paiement ; retourne le paiement mis a jour. */
  async refund(id: ID, payload: CreateRefundPayload): Promise<Payment> {
    const { data } = await apiClient.post<ApiResponse<Payment>>(
      API_ENDPOINTS.payments.refund(id),
      payload
    )
    return data.data
  }
}
