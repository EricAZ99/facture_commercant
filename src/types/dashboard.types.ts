import type { ID, ISODateString } from './common.types'
import type { InvoiceStatus } from './invoice.types'
import type { PaymentMethod } from './payment.types'

/** Fenetre temporelle appliquee aux indicateurs et graphiques du tableau de bord. */
export type DashboardPeriod = 'today' | '7d' | '30d' | '3m' | 'year'

/** Indicateurs cles affiches sur le tableau de bord. */
export interface DashboardStats {
  revenueTotal: number
  revenueThisMonth: number
  outstandingAmount: number
  invoicesCount: number
  paidInvoicesCount: number
  unpaidInvoicesCount: number
  overdueInvoicesCount: number
  clientsCount: number
  productsCount: number
}

/** Point d'une serie temporelle (evolution du chiffre d'affaires). */
export interface RevenueDataPoint {
  date: ISODateString
  amount: number
}

/** Repartition des factures par statut. */
export interface InvoiceStatusBreakdown {
  status: InvoiceStatus
  count: number
}

/** Repartition des paiements encaisses par moyen de paiement. */
export interface PaymentMethodBreakdown {
  method: PaymentMethod
  amount: number
  count: number
}

/** Type d'evenement journalise dans le fil d'activite recente. */
export type ActivityType =
  'invoice_created' | 'invoice_sent' | 'payment_received' | 'client_created' | 'product_created'

/** Evenement du fil d'activite recente du commerce. */
export interface ActivityItem {
  id: ID
  type: ActivityType
  message: string
  createdAt: ISODateString
}
