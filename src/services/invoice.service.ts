import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreateInvoicePayload,
  ID,
  Invoice,
  InvoiceAttachment,
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
  },

  /** Envoie un rappel ponctuel au client pour une facture impayee/en retard. */
  async sendReminder(id: ID): Promise<Invoice> {
    const { data } = await apiClient.post<ApiResponse<Invoice>>(API_ENDPOINTS.invoices.remind(id))
    return data.data
  },

  /** Genere (si besoin) et renvoie le jeton du lien public de consultation. */
  async getShareLink(id: ID): Promise<{ shareToken: string }> {
    const { data } = await apiClient.post<ApiResponse<{ shareToken: string }>>(
      API_ENDPOINTS.invoices.shareLink(id)
    )
    return data.data
  },

  async listAttachments(id: ID): Promise<InvoiceAttachment[]> {
    const { data } = await apiClient.get<ApiResponse<InvoiceAttachment[]>>(
      API_ENDPOINTS.invoices.attachments(id)
    )
    return data.data
  },

  async uploadAttachment(id: ID, file: File): Promise<InvoiceAttachment> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post<ApiResponse<InvoiceAttachment>>(
      API_ENDPOINTS.invoices.attachments(id),
      formData,
      // Voir `business.service.ts` : retire le Content-Type par defaut pour
      // laisser le navigateur poser lui-meme le boundary multipart.
      { headers: { 'Content-Type': undefined } }
    )
    return data.data
  },

  async removeAttachment(id: ID, attachmentId: ID): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.invoices.attachmentById(id, attachmentId))
  }
}
