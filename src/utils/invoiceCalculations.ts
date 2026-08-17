import type { DiscountType } from '@/types'

/**
 * Calculs de facturation centralises. Ce module est la SEULE source de
 * verite pour ces calculs : aucun composant ni template ne doit
 * recalculer un sous-total, une remise, une TVA ou un total lui-meme.
 */

/** Champs minimaux d'une ligne necessaires aux calculs (independant du type `InvoiceItem`). */
export interface InvoiceLineAmounts {
  quantity: number
  unitPrice: number
  taxRate: number
}

export interface InvoiceTotals {
  /** Somme des lignes avant remise. */
  subtotal: number
  /** Montant de remise effectivement applique (jamais negatif, jamais > subtotal). */
  discountAmount: number
  /** subtotal - discountAmount. */
  taxableAmount: number
  /** TVA calculee sur la base imposable, ligne par ligne (taux propre a chaque ligne). */
  taxTotal: number
  /** taxableAmount + taxTotal : montant final de la facture. */
  total: number
}

/** Arrondit a 2 decimales (evite les erreurs de flottants sur les montants). */
function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Total d'une ligne (quantite x prix unitaire), avant remise. */
export function computeLineTotal(line: InvoiceLineAmounts): number {
  const amount = (line.quantity || 0) * (line.unitPrice || 0)
  return roundCurrency(Number.isFinite(amount) ? amount : 0)
}

/** Montant de remise applique a un sous-total donne, borne entre 0 et le sous-total. */
export function computeDiscountAmount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number
): number {
  if (!Number.isFinite(discountValue) || discountValue <= 0 || subtotal <= 0) return 0
  const rawAmount = discountType === 'percentage' ? subtotal * (discountValue / 100) : discountValue
  return roundCurrency(Math.min(Math.max(rawAmount, 0), subtotal))
}

/**
 * Calcule l'ensemble des totaux d'une facture a partir de ses lignes et de
 * sa remise globale. La remise est repartie au prorata sur chaque ligne
 * avant application du taux de TVA propre a cette ligne, afin de rester
 * correct meme si les lignes n'ont pas toutes le meme taux.
 */
export function computeInvoiceTotals(
  lines: InvoiceLineAmounts[],
  discountType: DiscountType,
  discountValue: number
): InvoiceTotals {
  const subtotal = roundCurrency(lines.reduce((sum, line) => sum + computeLineTotal(line), 0))
  const discountAmount = computeDiscountAmount(subtotal, discountType, discountValue)
  const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0

  const taxTotal = roundCurrency(
    lines.reduce((sum, line) => {
      const lineTotal = computeLineTotal(line)
      const taxableLineAmount = lineTotal * (1 - discountRatio)
      return sum + taxableLineAmount * ((line.taxRate || 0) / 100)
    }, 0)
  )

  const taxableAmount = roundCurrency(subtotal - discountAmount)
  const total = roundCurrency(taxableAmount + taxTotal)

  return { subtotal, discountAmount, taxableAmount, taxTotal, total }
}
