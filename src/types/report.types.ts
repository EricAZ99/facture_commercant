import type { ID } from './common.types'
import type { InvoiceStatus } from './invoice.types'

/**
 * Fenetre temporelle appliquee aux rapports. Meme forme que
 * `DashboardPeriod` (voir `dashboard.types.ts`) mais definie separement :
 * Reports et Dashboard sont deux modules independants qui partagent ce
 * concept sans dependre l'un de l'autre.
 */
export type ReportPeriod = 'today' | '7d' | '30d' | '3m' | 'year'

/** Filtres communs a tous les rapports, transmis tels quels a l'API. */
export interface ReportFilters {
  period?: ReportPeriod
  productId?: ID
  clientId?: ID
  status?: InvoiceStatus
}

/** Indicateurs cles de synthese (chiffre d'affaires, ventes, factures, impayes). */
export interface ReportSummary {
  revenueTotal: number
  salesCount: number
  invoicesCount: number
  unpaidTotal: number
  unpaidCount: number
}

/** Repartition des factures par statut, avec le montant associe. */
export interface InvoiceStatusReportItem {
  status: InvoiceStatus
  count: number
  amount: number
}

/** Ligne du classement "produits les plus vendus". */
export interface TopProductReportItem {
  productId: ID
  name: string
  quantitySold: number
  revenue: number
}

/** Ligne du classement "meilleurs clients". */
export interface TopClientReportItem {
  clientId: ID
  name: string
  invoicesCount: number
  totalSpent: number
}
