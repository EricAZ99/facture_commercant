import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse, PublicInvoiceView } from '@/types'

import { apiClient } from './api'

/**
 * Consultation publique d'une facture via son lien partageable, sans
 * authentification (le visiteur est le client de la facture, jamais
 * connecte a l'espace commercant). Volontairement distinct de
 * `invoice.service.ts` : ne renvoie/n'accepte jamais que ce que ce lien
 * public est cense exposer.
 */
export const publicInvoiceService = {
  async getByToken(token: string): Promise<PublicInvoiceView> {
    const { data } = await apiClient.get<ApiResponse<PublicInvoiceView>>(
      API_ENDPOINTS.publicInvoices.byToken(token)
    )
    return data.data
  },

  async fetchPdfBlob(token: string): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(API_ENDPOINTS.publicInvoices.pdf(token), {
      responseType: 'blob'
    })
    return data
  }
}
