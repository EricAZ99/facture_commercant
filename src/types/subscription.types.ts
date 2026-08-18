import type { ID, ISODateString } from './common.types'

/**
 * Statut de l'abonnement du commerce au SaaS.
 * - `trial` : periode d'essai gratuite, avant premier engagement.
 * - `active` : abonnement en regle.
 * - `past_due` : paiement du dernier cycle en echec (le backend de
 *   production gere la relance/le moyen de paiement, jamais ce frontend).
 * - `canceled` : resilie par le commercant.
 * - `expired` : periode ecoulee sans renouvellement (ex: essai non converti).
 */
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'expired'

/** Cycle de facturation de l'abonnement. */
export type BillingCycle = 'monthly' | 'yearly'

/**
 * Limites d'utilisation associees a un plan. `null` signifie "illimite".
 * Purement informatif cote frontend : le blocage effectif d'une action au
 * dela d'une limite est de la responsabilite du backend.
 */
export interface SubscriptionLimits {
  maxInvoicesPerMonth: number | null
  maxClients: number | null
  maxUsers: number | null
}

/** Plan tarifaire disponible. */
export interface SubscriptionPlan {
  id: ID
  name: string
  description?: string
  price: number
  billingCycle: BillingCycle
  features: string[]
  limits: SubscriptionLimits
}

/** Utilisation courante du commerce, comparee aux limites de son plan. */
export interface SubscriptionUsage {
  /** Nombre de factures emises depuis le debut de la periode en cours. */
  invoicesThisPeriod: number
  clientsCount: number
  usersCount: number
}

/**
 * Abonnement en cours du commerce. Ne contient et ne doit jamais contenir
 * aucune donnee bancaire (numero de carte, IBAN...) : ce frontend ne
 * manipule que des identifiants de plan et des etats, jamais de moyens de
 * paiement.
 */
export interface Subscription {
  id: ID
  businessId: ID
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodStart: ISODateString
  currentPeriodEnd: ISODateString
  cancelAtPeriodEnd: boolean
  usage: SubscriptionUsage
  /** Code promo/parrainage applique au dernier changement de plan, le cas echeant. */
  promoCode?: string
  /** Remise (%) resultant du code applique. */
  discountPercent?: number
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** Payload de changement de plan. `promoCode` accepte un code promo ou un code de parrainage. */
export interface ChangePlanPayload {
  planId: ID
  promoCode?: string
}

/** Recu/facture d'un cycle de facturation SaaS passe (historique de facturation, distinct des factures emises par le commerce a SES clients). */
export interface SubscriptionInvoice {
  id: ID
  businessId: ID
  planName: string
  amount: number
  currency: string
  billingCycle: BillingCycle
  issuedAt: ISODateString
}
