import type { ID, ISODateString } from './common.types'

/** Un produit physique (stock geree) ou une prestation de service. */
export type ProductType = 'product' | 'service'

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
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** Payload de creation d'un produit/service. */
export type CreateProductPayload = Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>

/** Payload de mise a jour partielle d'un produit/service. */
export type UpdateProductPayload = Partial<CreateProductPayload>
