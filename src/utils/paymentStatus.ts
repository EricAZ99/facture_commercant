import type { InvoicePaymentStatus } from '@/types'

/**
 * Solde et statut de paiement d'une facture, centralises ici : jamais
 * recalcules directement dans un composant ou un template.
 */

/** Solde restant du (jamais negatif). */
export function getInvoiceBalance(amountPaid: number, total: number): number {
  return Math.max(total - amountPaid, 0)
}

/** Statut de paiement derive du montant paye par rapport au total de la facture. */
export function getInvoicePaymentStatus(amountPaid: number, total: number): InvoicePaymentStatus {
  if (amountPaid <= 0) return 'unpaid'
  if (amountPaid >= total) return 'paid'
  return 'partially_paid'
}
