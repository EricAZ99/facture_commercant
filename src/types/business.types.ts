import type { ID, ISODateString } from './common.types'

/**
 * Categorie de commerce. Determine certains libelles/parametrages par
 * defaut mais ne change pas la structure des donnees.
 */
export type BusinessType =
  'restaurant' | 'boutique' | 'salon_coiffure' | 'hotel' | 'pharmacie' | 'pme' | 'autre'

/** Parametres de numerotation et de conditions de paiement des factures. */
export interface InvoiceSettings {
  /** Prefixe des numeros de facture (ex: "FA-"). */
  numberPrefix: string
  /** Prochain numero de sequence qui sera attribue a la prochaine facture. */
  nextNumber: number
  /** Nombre de chiffres du numero de sequence, complete par des zeros (ex: 4 -> "0007"). */
  numberPadding: number
  /** Delai de paiement par defaut (en jours), applique aux nouvelles factures. */
  defaultPaymentTermDays: number
  /** Conditions de paiement affichees sur les factures (texte libre). */
  paymentTerms?: string
}

/** Un commerce (tenant) client du SaaS: unite d'isolation multi-tenant. */
export interface Business {
  id: ID
  name: string
  businessType: BusinessType
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
  /** Identifiant fiscal (ex: numero de contribuable / RCCM). */
  taxId?: string
  logoUrl?: string
  currency: string
  timezone: string
  /** Le commerce est-il assujetti a la TVA ? */
  vatEnabled: boolean
  /** Taux de TVA par defaut (%), propose par defaut sur les produits/factures. */
  defaultVatRate: number
  invoiceSettings: InvoiceSettings
  /**
   * Suspendu par un administrateur de la plateforme (impaye, abus...). Un
   * commerce suspendu perd l'acces a l'API cote backend (voir `requireAuth`
   * du mock-server) : ce champ n'est jamais modifiable par le commerce
   * lui-meme, uniquement par l'espace admin.
   */
  isSuspended: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
}

/**
 * Payload de mise a jour des parametres du commerce. Le logo se gere via un
 * endpoint dedie (upload de fichier), jamais via ce payload JSON.
 */
export type UpdateBusinessPayload = Partial<
  Omit<Business, 'id' | 'createdAt' | 'updatedAt' | 'logoUrl'>
>
