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
  category: string
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
  'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'imageUrl'
>

/** Payload de mise a jour partielle d'un produit/service. */
export type UpdateProductPayload = Partial<CreateProductPayload>

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
