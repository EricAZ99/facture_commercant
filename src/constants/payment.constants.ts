import type { InstallmentStatus, InvoicePaymentStatus, PaymentMethod, PaymentStatus } from '@/types'

/** Libelles affichables des moyens de paiement. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Especes',
  card: 'Carte bancaire',
  bank_transfer: 'Virement bancaire',
  mobile_money: 'Mobile Money',
  other: 'Autre'
}

/** Couleurs (classes Tailwind) associees a chaque moyen de paiement dans les graphiques. */
export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: 'bg-emerald-500',
  card: 'bg-primary-500',
  bank_transfer: 'bg-violet-500',
  mobile_money: 'bg-amber-500',
  other: 'bg-gray-400'
}

/** Libelles affichables du statut d'un paiement individuel. */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'En attente',
  completed: 'Complete',
  failed: 'Echoue',
  refunded: 'Rembourse'
}

/** Variante de `BaseBadge` associee au statut d'un paiement individuel. */
export const PAYMENT_STATUS_BADGE_VARIANT: Record<
  PaymentStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  pending: 'warning',
  completed: 'success',
  failed: 'danger',
  refunded: 'default'
}

/** Libelles affichables du statut de paiement d'une facture (montant paye vs total). */
export const INVOICE_PAYMENT_STATUS_LABELS: Record<InvoicePaymentStatus, string> = {
  unpaid: 'Non payee',
  partially_paid: 'Partiellement payee',
  paid: 'Payee'
}

/** Variante de `BaseBadge` associee au statut de paiement d'une facture. */
export const INVOICE_PAYMENT_STATUS_BADGE_VARIANT: Record<
  InvoicePaymentStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  unpaid: 'danger',
  partially_paid: 'warning',
  paid: 'success'
}

/** Libelles affichables du statut d'une echeance d'echeancier de paiement. */
export const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = {
  pending: 'A venir',
  paid: 'Payee',
  overdue: 'En retard'
}

/** Variante de `BaseBadge` associee au statut d'une echeance d'echeancier de paiement. */
export const INSTALLMENT_STATUS_BADGE_VARIANT: Record<
  InstallmentStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  pending: 'default',
  paid: 'success',
  overdue: 'danger'
}
