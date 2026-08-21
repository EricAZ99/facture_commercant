import type { ID, ISODateString } from './common.types'

/** Ligne de composition d'un kit : un produit du catalogue et sa quantite. */
export interface KitItemPayload {
  productId: ID
  quantity: number
}

/**
 * Ligne de composition enrichie telle que renvoyee par le backend (nom/prix
 * du produit au moment de la lecture, donnee de confort pour l'affichage —
 * jamais la source de verite, qui reste `productId`).
 */
export interface KitItem extends KitItemPayload {
  productName: string
  unitPrice: number
  taxRate: number
}

/**
 * Produit groupe / kit : un ensemble de produits du catalogue vendus comme
 * un seul article. Entite distincte du produit (voir backlog) plutot qu'une
 * variante de `Product`, pour ne pas fragiliser la relation produit <-> ligne
 * de facture deja verifiee ailleurs dans l'application.
 */
export interface ProductKit {
  id: ID
  businessId: ID
  name: string
  description?: string
  sku?: string
  items: KitItem[]
  /** Prix de vente force ; absent = utilise `computedPrice` (somme des composants). */
  customPrice?: number
  isActive: boolean
  /** Somme des prix des composants (prix unitaire x quantite), calculee par le backend. */
  computedPrice: number
  /** `customPrice` si defini, sinon `computedPrice`. */
  effectivePrice: number
  /**
   * Nombre de kits assemblables avec le stock actuel des composants
   * (minimum de `stock composant / quantite requise`). `null` si aucun
   * composant du kit n'a de stock suivi (ex: kit compose uniquement de
   * services).
   */
  availableStock: number | null
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** Payload de creation d'un kit. */
export interface CreateKitPayload {
  name: string
  description?: string
  sku?: string
  items: KitItemPayload[]
  customPrice?: number
  isActive?: boolean
}

/** Payload de mise a jour partielle d'un kit. */
export type UpdateKitPayload = Partial<CreateKitPayload>
