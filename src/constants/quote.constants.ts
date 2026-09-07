import type { QuoteStatus } from '@/types'

/** Libelles affichables des statuts de devis. */
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'quoteStatuses.draft',
  sent: 'quoteStatuses.sent',
  accepted: 'quoteStatuses.accepted',
  declined: 'quoteStatuses.declined',
  expired: 'quoteStatuses.expired',
  converted: 'quoteStatuses.converted'
}

/** Variante de `BaseBadge` associee a chaque statut de devis. */
export const QUOTE_STATUS_BADGE_VARIANT: Record<
  QuoteStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  draft: 'default',
  sent: 'info',
  accepted: 'success',
  declined: 'danger',
  expired: 'warning',
  converted: 'success'
}

/** Seul un devis en brouillon peut etre modifie en detail (lignes, remise). */
export function canEditQuote(status: QuoteStatus): boolean {
  return status === 'draft'
}

/** Un devis refuse, expire ou deja converti ne peut plus etre converti en facture. */
export function canConvertQuote(status: QuoteStatus): boolean {
  return status !== 'declined' && status !== 'expired' && status !== 'converted'
}

/** Un devis converti en facture ne peut plus etre supprime (voir mock-server). */
export function canDeleteQuote(status: QuoteStatus): boolean {
  return status !== 'converted'
}
