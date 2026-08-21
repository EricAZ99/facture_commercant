import type { ID, ISODateString } from './common.types'
import type { InvoiceStatus } from './invoice.types'
import type { PaymentMethod } from './payment.types'

/** Fenetre temporelle appliquee aux indicateurs et graphiques du tableau de bord. */
export type DashboardPeriod = 'today' | '7d' | '30d' | '3m' | 'year'

/**
 * Variation d'un indicateur par rapport a la periode precedente de meme
 * duree. `null` = pas de base de comparaison valable (0 sur la periode
 * precedente) : a afficher comme "Nouveau", jamais comme "0 %" ni "∞".
 */
export interface DashboardStatsComparison {
  revenueChangePercent: number | null
  invoicesChangePercent: number | null
  clientsChangePercent: number | null
}

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
  comparison: DashboardStatsComparison
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
  | 'invoice_created'
  | 'invoice_sent'
  | 'invoice_reminder_sent'
  | 'payment_received'
  | 'payment_refunded'
  | 'client_created'
  | 'product_created'
  | 'kit_created'
  | 'quote_created'
  | 'quote_sent'
  | 'quote_converted'
  | 'credit_note_created'
  | 'installment_plan_created'
  | 'user_invited'
  | 'subscription_changed'
  | 'subscription_canceled'

/** Evenement du fil d'activite recente du commerce. */
export interface ActivityItem {
  id: ID
  type: ActivityType
  message: string
  createdAt: ISODateString
}

/** Facture en retard, telle que resumee dans le centre d'alertes. */
export interface OverdueInvoiceAlert {
  id: ID
  number: string
  clientName: string
  balance: number
  dueDate: ISODateString
}

/** Produit en stock bas, tel que resume dans le centre d'alertes. */
export interface LowStockProductAlert {
  id: ID
  name: string
  stock: number
}

/**
 * Alertes proactives regroupees du tableau de bord : factures en retard,
 * stock bas, abonnement bientot a renouveler. Purement informatif — ne
 * bloque aucune action, contrairement aux limites de plan (backend).
 */
export interface DashboardAlerts {
  overdueInvoicesCount: number
  overdueInvoices: OverdueInvoiceAlert[]
  lowStockCount: number
  lowStockProducts: LowStockProductAlert[]
  subscriptionExpiringSoon: boolean
  /** `null` si pas d'abonnement actif/en essai/en retard de paiement. */
  subscriptionDaysRemaining: number | null
}
