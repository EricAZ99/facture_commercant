import type { ID, ISODateString } from './common.types'

/** Un produit physique (stock geree) ou une prestation de service. */
export type ProductType = 'product' | 'service'

/** Palier de tarif degressif : a partir de `minQuantity` unites, `price` s'applique (au lieu du prix de base). */
export interface PriceBreak {
  minQuantity: number
  price: number
}

/** Article du catalogue (produit ou service), utilisable dans une facture. */
export interface Product {
  id: ID
  businessId: ID
  name: string
  description?: string
  /** Reference vers une `ProductCategory` (voir `productCategory.types.ts`). */
  categoryId: ID
  /**
   * Chemin complet lisible de la categorie (ex: "Vetements > T-shirts"),
   * fourni par le backend en complement de `categoryId` (donnee de confort
   * pour l'affichage, jamais la source de verite de la relation).
   */
  categoryPath?: string
  type: ProductType
  price: number
  taxRate: number
  sku?: string
  /** Quantite en stock. Non pertinent pour un service. */
  stock?: number
  imageUrl?: string
  /** Code-barres (EAN/UPC...), saisi manuellement. */
  barcode?: string
  /**
   * Seuil a partir duquel ce produit est signale en stock bas (centre
   * d'alertes du tableau de bord). `undefined` = utilise le seuil par
   * defaut de la plateforme.
   */
  lowStockThreshold?: number
  /** Tarifs degressifs par quantite, tries par `minQuantity` croissant. */
  priceBreaks?: PriceBreak[]
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** Payload de creation d'un produit/service. */
export type CreateProductPayload = Omit<
  Product,
  'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'imageUrl' | 'categoryPath'
>

/** Payload de mise a jour partielle d'un produit/service. */
export type UpdateProductPayload = Partial<CreateProductPayload>

/**
 * Ligne d'import CSV : la categorie y est saisie en texte libre (chemin
 * eventuellement hierarchique, ex: "Vetements > T-shirts"), resolue cote
 * backend en `categoryId` (creation automatique de la chaine manquante si
 * besoin) — l'import en masse reste ainsi aussi simple qu'avant l'entite
 * `ProductCategory`, sans forcer une selection ligne par ligne.
 */
export type ProductImportPayload = Omit<CreateProductPayload, 'categoryId'> & {
  categoryPath: string
}

/** Mouvement de stock (ajustement manuel, historique). */
export interface ProductStockMovement {
  id: ID
  productId: ID
  /** Variation appliquee (positive = entree, negative = sortie). */
  delta: number
  /** Quantite en stock apres application de ce mouvement. */
  stockAfter: number
  reason: string
  createdAt: ISODateString
}

/** Payload d'ajustement manuel du stock. */
export interface AdjustStockPayload {
  delta: number
  reason: string
}

/** Resultat d'un import en masse de produits (CSV). */
export interface ProductImportResult {
  createdCount: number
  errors: Array<{ row: number; message: string }>
}
