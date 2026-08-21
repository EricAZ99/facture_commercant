import type { ID, ISODateString } from './common.types'

/**
 * Categorie de produit/service, organisee en arborescence (`parentId`
 * optionnel). Entite a part entiere (plutot qu'un champ texte libre sur le
 * produit) pour rester robuste : pas de doublons quasi-identiques, et une
 * hierarchie reelle (ex: "Vetements" > "T-shirts").
 */
export interface ProductCategory {
  id: ID
  businessId: ID
  name: string
  /** Categorie parente ; absente = categorie racine. */
  parentId?: ID
  /**
   * Chemin complet lisible (ex: "Vetements > T-shirts"), fourni par le
   * backend en complement de `parentId` (donnee de confort pour
   * l'affichage, jamais la source de verite de la hierarchie).
   */
  path?: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** Payload de creation d'une categorie. */
export interface CreateProductCategoryPayload {
  name: string
  parentId?: ID
}

/** Payload de mise a jour partielle d'une categorie (renommer, deplacer). */
export type UpdateProductCategoryPayload = Partial<CreateProductCategoryPayload>
