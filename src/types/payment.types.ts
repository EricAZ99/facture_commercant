import type { ID, ISODateString } from './common.types'

/** Moyen de paiement enregistre pour un encaissement. */
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other'

/** Statut d'un paiement. */
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

/**
 * Statut de paiement d'une facture, derive du montant paye par rapport au
 * total (voir `utils/paymentStatus.ts`). Distinct de `InvoiceStatus` qui
 * couvre tout le cycle de vie (brouillon, envoyee, en retard, annulee...) :
 * ceci ne regarde que l'aspect financier.
 */
export type InvoicePaymentStatus = 'unpaid' | 'partially_paid' | 'paid'

/** Paiement encaisse en reglement (total ou partiel) d'une facture. */
export interface Payment {
  id: ID
  businessId: ID
  invoiceId: ID
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  reference?: string
  paidAt: ISODateString
  notes?: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** Payload d'enregistrement d'un paiement. */
export interface CreatePaymentPayload {
  invoiceId: ID
  amount: number
  method: PaymentMethod
  reference?: string
  paidAt: ISODateString
  notes?: string
}
