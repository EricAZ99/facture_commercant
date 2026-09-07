import type { DiscountType, InvoiceStatus } from '@/types'

/** Libelles affichables des types de remise. */
export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'discountTypes.percentage',
  fixed: 'discountTypes.fixed'
}

/** Libelles affichables des statuts de facture. */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'invoiceStatuses.draft',
  sent: 'invoiceStatuses.sent',
  paid: 'invoiceStatuses.paid',
  partially_paid: 'invoiceStatuses.partially_paid',
  overdue: 'invoiceStatuses.overdue',
  cancelled: 'invoiceStatuses.cancelled'
}

/** Variante de `BaseBadge` associee a chaque statut de facture. */
export const INVOICE_STATUS_BADGE_VARIANT: Record<
  InvoiceStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  draft: 'default',
  sent: 'info',
  paid: 'success',
  partially_paid: 'warning',
  overdue: 'danger',
  cancelled: 'default'
}

/** Couleurs (classes Tailwind) associees a chaque statut de facture dans les graphiques. */
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-400',
  sent: 'bg-primary-500',
  paid: 'bg-emerald-500',
  partially_paid: 'bg-amber-500',
  overdue: 'bg-red-500',
  cancelled: 'bg-gray-300'
}

/**
 * Seule une facture en brouillon peut etre modifiee en detail (lignes,
 * remise) : une fois envoyee, on emet plutot un avoir plutot que de
 * reecrire l'historique.
 */
export function canEditInvoice(status: InvoiceStatus): boolean {
  return status === 'draft'
}

/** Une facture deja payee ou deja annulee ne peut plus etre annulee. */
export function canCancelInvoice(status: InvoiceStatus): boolean {
  return status !== 'paid' && status !== 'cancelled'
}
