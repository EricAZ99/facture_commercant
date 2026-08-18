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

/**
 * Parametres de numerotation d'une serie de documents autre que la facture
 * (devis, avoir...) : chaque type de document a sa propre sequence, jamais
 * melangee avec celle des factures.
 */
export interface DocumentNumberingSettings {
  numberPrefix: string
  nextNumber: number
  numberPadding: number
}

/** Adresse structuree (utilisee pour l'adresse de livraison, distincte de l'adresse principale). */
export interface Address {
  address?: string
  city?: string
  country?: string
}

/** Jour de la semaine, cle des horaires d'ouverture. */
export type Weekday =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

/** Plage horaire d'un jour donne ; `closed: true` signifie ferme ce jour-la. */
export interface OpeningHoursDay {
  open?: string
  close?: string
  closed: boolean
}

export type OpeningHours = Record<Weekday, OpeningHoursDay>

/** Liens externes affichables du commerce (site web, reseaux sociaux). */
export interface SocialLinks {
  website?: string
  facebook?: string
  instagram?: string
  whatsapp?: string
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
  /** Adresse de livraison, si differente de l'adresse principale (facturation). */
  shippingAddress?: Address
  openingHours?: OpeningHours
  socialLinks?: SocialLinks
  /** Conditions generales de vente, affichables sur les documents (texte libre). */
  termsAndConditions?: string
  /** Tampon/signature numerique du commerce (image), gere via un endpoint d'upload dedie. */
  stampUrl?: string
  /** Cle API developpeur (mock : generee/regeneree a la demande, jamais consommee reellement ici). */
  apiKey?: string
  webhookUrl?: string
  webhookEvents?: string[]
  /** Code de parrainage du commerce, partageable pour offrir une remise a un filleul. */
  referralCode: string
  /** Nombre de fois ou le code de parrainage de ce commerce a ete utilise. */
  referralRedemptions: number
  currency: string
  timezone: string
  /** Le commerce est-il assujetti a la TVA ? */
  vatEnabled: boolean
  /** Taux de TVA par defaut (%), propose par defaut sur les produits/factures. */
  defaultVatRate: number
  invoiceSettings: InvoiceSettings
  /** Numerotation de la serie des devis (independante de celle des factures). */
  quoteSettings: DocumentNumberingSettings
  /** Numerotation de la serie des avoirs (independante de celle des factures). */
  creditNoteSettings: DocumentNumberingSettings
  /**
   * Suspendu par un administrateur de la plateforme (impaye, abus...). Un
   * commerce suspendu perd l'acces a l'API cote backend (voir `requireAuth`
   * du mock-server) : ce champ n'est jamais modifiable par le commerce
   * lui-meme, uniquement par l'espace admin.
   */
  isSuspended: boolean
  /** Objectif de chiffre d'affaires du mois en cours, affiche sur le tableau de bord. `null`/absent = pas d'objectif defini. */
  monthlyRevenueTarget?: number | null
  createdAt: ISODateString
  updatedAt: ISODateString
}

/**
 * Payload de mise a jour des parametres du commerce. Le logo et le tampon se
 * gerent via des endpoints dedies (upload de fichier), l'API key via son
 * propre endpoint de (re)generation — jamais via ce payload JSON.
 */
export type UpdateBusinessPayload = Partial<
  Omit<Business, 'id' | 'createdAt' | 'updatedAt' | 'logoUrl' | 'stampUrl' | 'apiKey'>
>

/** Export complet des donnees du commerce (sauvegarde manuelle self-service). */
export interface BusinessDataExport {
  exportedAt: ISODateString
  business: Business
  clients: unknown[]
  products: unknown[]
  invoices: unknown[]
  quotes: unknown[]
  creditNotes: unknown[]
  payments: unknown[]
  users: unknown[]
}
