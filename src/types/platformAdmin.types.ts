import type { ID, ISODateString, ListQueryParams } from './common.types'
import type { BusinessType } from './business.types'
import type { Subscription, SubscriptionPlan, SubscriptionStatus } from './subscription.types'

/**
 * Role d'un administrateur plateforme : `super_admin` peut gerer d'autres
 * comptes admin, les parametres globaux et appliquer des remises ;
 * `support` a acces a tout le reste (commerces, tickets, apercu) mais en
 * lecture seule sur ces deux perimetres.
 */
export type PlatformAdminRole = 'super_admin' | 'support'

/**
 * Identite d'un administrateur de la plateforme (l'operateur du SaaS).
 * N'appartient a AUCUN commerce (pas de `businessId`) : c'est un realm
 * d'identite entierement separe des utilisateurs commercants (`User`).
 */
export interface PlatformAdmin {
  id: ID
  firstName: string
  lastName: string
  email: string
  role: PlatformAdminRole
  isActive: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface InviteAdminPayload {
  firstName: string
  lastName: string
  email: string
  role?: PlatformAdminRole
}

export type UpdateAdminPayload = Partial<{ role: PlatformAdminRole; isActive: boolean }>

/** Entree de l'historique de connexion des administrateurs. */
export interface AdminLoginHistoryEntry {
  id: ID
  adminId: ID
  adminName: string
  ipAddress: string
  createdAt: ISODateString
}

export interface AdminLoginCredentials {
  email: string
  password: string
}

export interface AdminAuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AdminAuthResponse {
  admin: PlatformAdmin
  tokens: AdminAuthTokens
}

/** Ligne de la liste des commerces, vue admin (resume). */
export interface AdminBusinessSummary {
  id: ID
  name: string
  businessType: BusinessType
  ownerName: string
  ownerEmail: string
  isSuspended: boolean
  subscriptionStatus: SubscriptionStatus
  planId?: ID
  planName: string
  /** Chiffre d'affaires total facture par ce commerce a ses propres clients. */
  revenueTotal: number
  createdAt: ISODateString
}

/** Detail complet d'un commerce, vue admin. */
export interface AdminBusinessDetail extends AdminBusinessSummary {
  email: string
  phone?: string
  currency: string
  usersCount: number
  clientsCount: number
  invoicesCount: number
  subscription: Subscription
}

/** Parametres de filtrage/pagination de la liste admin des commerces. */
export interface AdminBusinessListParams extends ListQueryParams {
  subscriptionStatus?: SubscriptionStatus | ''
  planId?: ID
  dateFrom?: ISODateString
  dateTo?: ISODateString
  minRevenue?: number
  maxRevenue?: number
}

export interface UpdateBusinessStatusPayload {
  isSuspended: boolean
}

/** Reponse de la demande de mode "apercu" : ticket a usage unique, echangeable cote tenant. */
export interface ImpersonationTicket {
  ticket: string
}

export interface AdminChangePlanPayload {
  planId: ID
}

/** Entree du journal d'audit des actions admin (par commerce). */
export interface AdminAuditLogEntry {
  id: ID
  adminId: ID
  adminName: string
  businessId: ID
  businessName: string
  action: string
  message: string
  createdAt: ISODateString
}

/** Indicateurs plateforme agreges, pour le tableau de bord admin. */
export interface PlatformStats {
  totalBusinesses: number
  businessesByStatus: Record<SubscriptionStatus, number>
  /** Somme des prix des plans des abonnements actifs/en retard de paiement. */
  monthlyRecurringRevenue: number
  newBusinessesLast30Days: number
}

/** Payload de creation/modification d'un plan du catalogue (cote admin uniquement). */
export type CreatePlanPayload = Omit<SubscriptionPlan, 'id'>
export type UpdatePlanPayload = Partial<CreatePlanPayload>

/** Point de la courbe de tendance du MRR (approximation, voir mock-server). */
export interface MrrTrendPoint {
  month: string
  mrr: number
}

/** Ligne de repartition du revenu recurrent par plan. */
export interface RevenueByPlanItem {
  planId: ID
  planName: string
  amount: number
  count: number
}

/** Taux de churn/retention approximatif de la plateforme. */
export interface ChurnStats {
  totalBusinesses: number
  churnedBusinesses: number
  churnRatePercent: number
  retentionRatePercent: number
}

/** Valeur vie client (LTV) moyenne approximee. */
export interface LtvStats {
  averageLtv: number
  sampleSize: number
}

export interface ApplyDiscountPayload {
  discountPercent: number
}

/** Parametres globaux de la plateforme. */
export interface PlatformSettings {
  supportedCurrencies: string[]
  legalMentions: string
  defaultTermsAndConditions: string
}

export type UpdatePlatformSettingsPayload = Partial<PlatformSettings>

/** Evenement plateforme notifiable aux admins (nouveau commerce, nouveau ticket...). */
export interface PlatformEvent {
  id: ID
  type: string
  message: string
  createdAt: ISODateString
}

// --- Support : tickets commercant <-> admin --------------------------------

export type SupportTicketStatus = 'open' | 'closed'

export interface SupportTicketMessage {
  id: ID
  author: 'business' | 'admin'
  authorName: string
  body: string
  createdAt: ISODateString
}

export interface SupportTicket {
  id: ID
  businessId: ID
  businessName: string
  subject: string
  status: SupportTicketStatus
  messages: SupportTicketMessage[]
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface CreateSupportTicketPayload {
  subject: string
  message: string
}
