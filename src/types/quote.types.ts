import type { ID, ISODateString, ListQueryParams } from './common.types'
import type { DiscountType } from './invoice.types'

/**
 * Statut du cycle de vie d'un devis. Distinct de `InvoiceStatus` : un devis
 * n'est jamais "paye" ni "en retard", et `converted` marque son passage
 * definitif en facture (voir `convertedInvoiceId`).
 */
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted'

/** Ligne de devis (meme forme qu'une ligne de facture). */
export interface QuoteItem {
  id: ID
  productId?: ID
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
}

/** Devis (proforma) emis par le commerce a destination d'un client, convertible en facture. */
export interface Quote {
  id: ID
  businessId: ID
  clientId: ID
  /** Nom complet du client au moment de la lecture (confort d'affichage, voir `Invoice.clientName`). */
  clientName?: string
  number: string
  status: QuoteStatus
  issueDate: ISODateString
  /** Date de validite du devis, au-dela de laquelle il devrait etre considere expire. */
  expiryDate: ISODateString
  items: QuoteItem[]
  discountType: DiscountType
  discountValue: number
  discountAmount: number
  subtotal: number
  taxTotal: number
  total: number
  notes?: string
  /** Renseigne uniquement une fois le devis converti (statut `converted`). */
  convertedInvoiceId?: ID
  createdAt: ISODateString
  updatedAt: ISODateString
}

export type QuoteItemPayload = Omit<QuoteItem, 'id' | 'total'>

/** Payload de creation d'un devis. */
export interface CreateQuotePayload {
  clientId: ID
  issueDate: ISODateString
  expiryDate: ISODateString
  items: QuoteItemPayload[]
  discountType: DiscountType
  discountValue: number
  notes?: string
  status?: Extract<QuoteStatus, 'draft' | 'sent'>
}

/** Payload de mise a jour partielle d'un devis. */
export type UpdateQuotePayload = Partial<Omit<CreateQuotePayload, 'status'>> & {
  status?: QuoteStatus
}

/** Parametres de filtrage/pagination de la liste des devis. */
export interface QuoteListParams extends ListQueryParams {
  status?: QuoteStatus
  clientId?: ID
}
