import type { ProductType } from '@/types'

/** Libelles affichables des types d'article du catalogue. */
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  product: 'Produit',
  service: 'Service'
}

/** Taille maximale acceptee pour la photo d'un produit (en octets). */
export const PRODUCT_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024

/** Types MIME acceptes pour la photo d'un produit. */
export const PRODUCT_IMAGE_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
