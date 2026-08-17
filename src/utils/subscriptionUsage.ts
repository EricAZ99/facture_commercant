import { SUBSCRIPTION_LIMIT_WARNING_THRESHOLD } from '@/constants'
import type { Subscription } from '@/types'

/** Une ligne d'utilisation comparee a sa limite, prete a afficher. */
export interface LimitUsage {
  key: 'invoices' | 'clients' | 'users'
  label: string
  current: number
  /** `null` = illimite. */
  limit: number | null
  /** Ratio 0-1 (plafonne a 1), `null` si illimite. */
  ratio: number | null
  isApproachingLimit: boolean
  isLimitReached: boolean
}

/**
 * Calcul pur (aucun effet de bord) des trois limites d'usage suivies par
 * l'abonnement : nombre de factures (periode en cours), de clients et
 * d'utilisateurs. Centralise ici pour ne jamais etre recalcule dans un
 * template ou duplique entre la page Abonnement et une eventuelle alerte
 * globale.
 */
export function computeLimitUsages(subscription: Subscription): LimitUsage[] {
  const { usage, plan } = subscription

  const rows: Array<[LimitUsage['key'], string, number, number | null]> = [
    ['invoices', 'Factures ce mois-ci', usage.invoicesThisPeriod, plan.limits.maxInvoicesPerMonth],
    ['clients', 'Clients', usage.clientsCount, plan.limits.maxClients],
    ['users', 'Utilisateurs', usage.usersCount, plan.limits.maxUsers]
  ]

  return rows.map(([key, label, current, limit]) => {
    const ratio = limit === null || limit <= 0 ? null : Math.min(current / limit, 1)
    return {
      key,
      label,
      current,
      limit,
      ratio,
      isApproachingLimit:
        ratio !== null && ratio >= SUBSCRIPTION_LIMIT_WARNING_THRESHOLD && ratio < 1,
      isLimitReached: ratio !== null && ratio >= 1
    }
  })
}
