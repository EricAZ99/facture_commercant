import type { ID, ISODateString } from './common.types'

/** Ligne d'avoir (meme forme qu'une ligne de facture). */
export interface CreditNoteItem {
  id: ID
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
}

/**
 * Avoir (note de credit) rattache a une facture existante. Document
 * comptable simple et immuable une fois emis : pas de statut de cycle de
 * vie, pas de modification apres creation (a la difference des factures/
 * devis).
 */
export interface CreditNote {
  id: ID
  businessId: ID
  invoiceId: ID
  /** Numero de la facture d'origine (confort d'affichage). */
  invoiceNumber?: string
  clientId: ID
  clientName?: string
  number: string
  issueDate: ISODateString
  items: CreditNoteItem[]
  subtotal: number
  taxTotal: number
  total: number
  reason: string
  createdAt: ISODateString
}

export type CreditNoteItemPayload = Omit<CreditNoteItem, 'id' | 'total'>

/** Payload d'emission d'un avoir. */
export interface CreateCreditNotePayload {
  invoiceId: ID
  items: CreditNoteItemPayload[]
  reason: string
}
