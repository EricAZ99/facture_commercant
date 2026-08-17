import type { ID, ISODateString, ListQueryParams } from './common.types'
import type { BusinessType } from './business.types'
import type { Subscription, SubscriptionPlan, SubscriptionStatus } from './subscription.types'

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
  isActive: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
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
  planName: string
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
}

export interface UpdateBusinessStatusPayload {
  isSuspended: boolean
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
