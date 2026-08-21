import type { ID, ISODateString, ListQueryParams } from './common.types'

/** Statut du cycle de vie d'une facture. */
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'

/** Type de remise applicable a une facture (globale, pas ligne par ligne). */
export type DiscountType = 'percentage' | 'fixed'

/** Ligne de facture, adossee optionnellement a un produit du catalogue. */
export interface InvoiceItem {
  id: ID
  productId?: ID
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  /** quantity * unitPrice, avant remise. */
  total: number
}

/** Champ personnalise libre (label/valeur) ajoute a une facture. */
export interface InvoiceCustomField {
  label: string
  value: string
}

/** Piece jointe libre associee a une facture (devis fournisseur, bon signe...). */
export interface InvoiceAttachment {
  id: ID
  invoiceId: ID
  /** Nom de fichier original tel qu'envoye par l'utilisateur. */
  filename: string
  url: string
  sizeBytes: number
  createdAt: ISODateString
}

/** Facture emise par le commerce a destination d'un client. */
export interface Invoice {
  id: ID
  businessId: ID
  clientId: ID
  /**
   * Nom complet du client au moment de la lecture, fourni par le backend en
   * complement de `clientId` (donnee de confort pour l'affichage en liste,
   * jamais la source de verite de la relation).
   */
  clientName?: string
  number: string
  status: InvoiceStatus
  issueDate: ISODateString
  dueDate: ISODateString
  items: InvoiceItem[]
  discountType: DiscountType
  /** Pourcentage (0-100) ou montant fixe selon `discountType`. */
  discountValue: number
  /** Montant de remise effectivement deduit (calcule, toujours en devise). */
  discountAmount: number
  /** Somme des lignes avant remise. */
  subtotal: number
  taxTotal: number
  /** subtotal - discountAmount + taxTotal. */
  total: number
  amountPaid: number
  notes?: string
  /** Visibles uniquement en interne (jamais sur le PDF ni le lien public). */
  internalNotes?: string
  /** Champs personnalises libres, affiches sur la facture (et le lien public), jamais sur le PDF texte. */
  customFields?: InvoiceCustomField[]
  /** Date/heure du dernier rappel manuel envoye au client, si applicable. */
  lastReminderSentAt?: ISODateString
  /**
   * Jeton du lien public de consultation (genere a la demande, voir
   * `invoiceService.getShareLink`). Absent tant qu'aucun lien n'a ete
   * genere pour cette facture.
   */
  shareToken?: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** Payload d'une ligne lors de la creation/mise a jour d'une facture. */
export type InvoiceItemPayload = Omit<InvoiceItem, 'id' | 'total'>

/** Payload de creation d'une facture. */
export interface CreateInvoicePayload {
  clientId: ID
  issueDate: ISODateString
  dueDate: ISODateString
  items: InvoiceItemPayload[]
  discountType: DiscountType
  discountValue: number
  notes?: string
  internalNotes?: string
  customFields?: InvoiceCustomField[]
  /** `draft` = brouillon (validation allegee) ; omis = facture finalisee ("sent"). */
  status?: Extract<InvoiceStatus, 'draft' | 'sent'>
}

/** Payload d'apercu PDF en direct (memes champs que la creation, mais rien n'est persiste). */
export type PreviewInvoicePdfPayload = CreateInvoicePayload

/**
 * Payload de mise a jour partielle d'une facture. `status` accepte tout
 * `InvoiceStatus` (ex: `cancelled`), contrairement a la creation qui ne
 * permet de choisir qu'entre brouillon et facture finalisee.
 */
export type UpdateInvoicePayload = Partial<Omit<CreateInvoicePayload, 'status'>> & {
  status?: InvoiceStatus
}

/** Parametres de filtrage/pagination de la liste des factures. */
export interface InvoiceListParams extends ListQueryParams {
  status?: InvoiceStatus
  clientId?: ID
  /** Bornes inclusives sur `issueDate`, au format `YYYY-MM-DD`. */
  dateFrom?: string
  dateTo?: string
  /** Bornes inclusives sur `total`. */
  amountMin?: number
  amountMax?: number
}

/**
 * Vue publique en lecture seule d'une facture (via le lien partageable) :
 * volontairement un sous-ensemble de `Invoice`, sans `internalNotes` ni
 * aucune donnee interne, avec quelques champs commerce ajoutes pour
 * l'affichage (le visiteur n'est jamais authentifie).
 */
export interface PublicInvoiceView {
  number: string
  status: InvoiceStatus
  issueDate: ISODateString
  dueDate: ISODateString
  items: InvoiceItem[]
  subtotal: number
  discountAmount: number
  taxTotal: number
  total: number
  amountPaid: number
  notes?: string
  customFields?: InvoiceCustomField[]
  businessName: string
  businessEmail?: string
  businessPhone?: string
  currency: string
  clientName?: string
}
