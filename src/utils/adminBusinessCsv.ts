import { SUBSCRIPTION_STATUS_LABELS } from '@/constants'
import type { AdminBusinessSummary } from '@/types'

import { toCsv } from './csv'

const HEADER = [
  'Commerce',
  'Type',
  'Proprietaire',
  'Email proprietaire',
  'Statut',
  'Abonnement',
  'Plan',
  "Chiffre d'affaires",
  'Inscrit le'
]

/** Export CSV de la liste des commerces (vue admin), pour la liste complete ou une selection. */
export function adminBusinessesToCsv(businesses: AdminBusinessSummary[]): string {
  const rows = businesses.map((b) => [
    b.name,
    b.businessType,
    b.ownerName,
    b.ownerEmail,
    b.isSuspended ? 'Suspendu' : 'Actif',
    SUBSCRIPTION_STATUS_LABELS[b.subscriptionStatus],
    b.planName,
    String(b.revenueTotal),
    b.createdAt.slice(0, 10)
  ])
  return toCsv([HEADER, ...rows])
}
