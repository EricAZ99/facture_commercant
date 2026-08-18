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
  /** Somme des remboursements deja emis sur ce paiement (donnee de confort, calculee cote serveur). */
  refundedAmount?: number
  /** Numero de la facture reglee (donnee de confort, calculee cote serveur). */
  invoiceNumber?: string
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

/** Remboursement (total ou partiel) d'un paiement encaisse. */
export interface Refund {
  id: ID
  businessId: ID
  paymentId: ID
  invoiceId: ID
  amount: number
  reason: string
  createdAt: ISODateString
}

/** Payload de demande de remboursement d'un paiement. */
export interface CreateRefundPayload {
  amount: number
  reason: string
}

/** Statut d'une echeance d'un echeancier de paiement. */
export type InstallmentStatus = 'pending' | 'paid' | 'overdue'

/** Echeance individuelle d'un echeancier de paiement en plusieurs fois. */
export interface PaymentInstallment {
  id: ID
  dueDate: ISODateString
  amount: number
  status: InstallmentStatus
  paidAt?: ISODateString
  /** Paiement effectivement encaisse pour cette echeance, une fois payee. */
  paymentId?: ID
}

/** Echeancier de paiement en plusieurs fois associe a une facture. */
export interface InstallmentPlan {
  id: ID
  businessId: ID
  invoiceId: ID
  installments: PaymentInstallment[]
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface CreateInstallmentPlanPayload {
  installments: Array<{ dueDate: ISODateString; amount: number }>
}

/** Payload d'encaissement d'une echeance de l'echeancier. */
export interface PayInstallmentPayload {
  method: PaymentMethod
  reference?: string
  paidAt?: ISODateString
}
