import type { SubscriptionStatus } from '@/types'

/** Libelles affichables des statuts d'abonnement. */
export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: "Periode d'essai",
  active: 'Actif',
  past_due: 'Paiement en retard',
  canceled: 'Annule',
  expired: 'Expire'
}

/** Variante `BaseBadge` associee a chaque statut d'abonnement. */
export const SUBSCRIPTION_STATUS_BADGE_VARIANT: Record<
  SubscriptionStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  trial: 'info',
  active: 'success',
  past_due: 'warning',
  canceled: 'default',
  expired: 'danger'
}

/**
 * Seuil (0-1) a partir duquel une limite d'usage est consideree "bientot
 * atteinte" et declenche une alerte.
 */
export const SUBSCRIPTION_LIMIT_WARNING_THRESHOLD = 0.8
