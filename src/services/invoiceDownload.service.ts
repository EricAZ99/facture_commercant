import { API_ENDPOINTS } from '@/constants'
import type { ID, Invoice, PreviewInvoicePdfPayload } from '@/types'
import { downloadBlob } from '@/utils/download'

import { apiClient } from './api'

/**
 * Recuperation et telechargement du PDF officiel d'une facture.
 *
 * Regle d'architecture : le frontend ne genere JAMAIS lui-meme le document
 * de facture. Ce service est l'unique point de contact avec le PDF fourni
 * par le backend ; toutes les actions qui en ont besoin (telecharger,
 * ouvrir, imprimer, partager) passent par `fetchPdfBlob`.
 */
export const invoiceDownloadService = {
  /** Recupere le PDF officiel depuis l'API, sous forme de `Blob` brut. */
  async fetchPdfBlob(invoiceId: ID): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(API_ENDPOINTS.invoices.pdf(invoiceId), {
      responseType: 'blob'
    })
    return data
  },

  /** Recupere le PDF officiel et declenche son telechargement cote navigateur. */
  async downloadPdf(invoice: Pick<Invoice, 'id' | 'number'>): Promise<void> {
    const blob = await this.fetchPdfBlob(invoice.id)
    downloadBlob(blob, `${invoice.number}.pdf`)
  },

  /**
   * Apercu PDF en direct pendant la saisie : envoie l'etat courant du
   * formulaire (rien n'est persiste cote backend) et recupere le PDF
   * resultant, filigrane "APERCU".
   */
  async fetchPreviewPdfBlob(payload: PreviewInvoicePdfPayload): Promise<Blob> {
    const { data } = await apiClient.post<Blob>(API_ENDPOINTS.invoices.previewPdf, payload, {
      responseType: 'blob'
    })
    return data
  }
}
