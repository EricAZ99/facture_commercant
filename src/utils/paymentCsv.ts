import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/constants'
import { i18n } from '@/i18n'
import type { Payment } from '@/types'

import { toCsv } from './csv'
import { formatDate } from './formatters'

const HEADER = [
  'Date',
  'Facture',
  'Reference',
  'Moyen de paiement',
  'Statut',
  'Montant',
  'Montant rembourse'
]

/**
 * Genere un export CSV "comptable" des paiements : une ligne par
 * encaissement, colonnes stables adaptees a un import dans un logiciel de
 * comptabilite generique (montants en nombres bruts, pas de formatage
 * devise/locale qui casserait un parseur).
 */
export function paymentsToAccountingCsv(payments: Payment[]): string {
  const rows = payments.map((payment) => [
    formatDate(payment.paidAt),
    payment.invoiceNumber ?? '',
    payment.reference ?? '',
    i18n.global.t(PAYMENT_METHOD_LABELS[payment.method]),
    i18n.global.t(PAYMENT_STATUS_LABELS[payment.status]),
    String(payment.amount),
    String(payment.refundedAmount ?? 0)
  ])
  return toCsv([HEADER, ...rows])
}
