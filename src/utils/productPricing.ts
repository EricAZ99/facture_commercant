import type { PriceBreak } from '@/types'

/**
 * Prix unitaire applicable pour une quantite donnee, compte tenu des
 * tarifs degressifs du produit. Regle : le palier retenu est celui dont
 * `minQuantity` est le plus eleve tout en restant <= quantite ; si aucun
 * palier ne s'applique (quantite trop faible, ou aucun palier defini), le
 * prix de base du produit s'applique.
 */
export function resolveUnitPrice(
  basePrice: number,
  priceBreaks: PriceBreak[] | undefined,
  quantity: number
): number {
  if (!priceBreaks || priceBreaks.length === 0) return basePrice

  const applicable = priceBreaks
    .filter((tier) => quantity >= tier.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0]

  return applicable ? applicable.price : basePrice
}
