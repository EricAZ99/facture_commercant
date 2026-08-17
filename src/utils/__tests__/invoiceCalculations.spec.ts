import { describe, expect, it } from 'vitest'

import {
  computeDiscountAmount,
  computeInvoiceTotals,
  computeLineTotal
} from '../invoiceCalculations'

describe('computeLineTotal', () => {
  it('multiplie la quantite par le prix unitaire', () => {
    expect(computeLineTotal({ quantity: 3, unitPrice: 1500, taxRate: 0 })).toBe(4500)
  })

  it('arrondit a 2 decimales', () => {
    expect(computeLineTotal({ quantity: 3, unitPrice: 0.1, taxRate: 0 })).toBe(0.3)
  })

  it('traite une quantite ou un prix manquant comme 0', () => {
    expect(computeLineTotal({ quantity: 0, unitPrice: 1000, taxRate: 0 })).toBe(0)
  })
})

describe('computeDiscountAmount (remise)', () => {
  it('calcule un pourcentage du sous-total', () => {
    expect(computeDiscountAmount(10000, 'percentage', 10)).toBe(1000)
  })

  it('applique un montant fixe directement', () => {
    expect(computeDiscountAmount(10000, 'fixed', 2500)).toBe(2500)
  })

  it('plafonne la remise au sous-total (jamais de remise negative sur le total)', () => {
    expect(computeDiscountAmount(1000, 'fixed', 5000)).toBe(1000)
  })

  it('ignore une remise nulle ou negative', () => {
    expect(computeDiscountAmount(10000, 'percentage', 0)).toBe(0)
    expect(computeDiscountAmount(10000, 'fixed', -100)).toBe(0)
  })

  it('renvoie 0 si le sous-total est nul', () => {
    expect(computeDiscountAmount(0, 'percentage', 10)).toBe(0)
  })
})

describe('computeInvoiceTotals (TVA + remise combinees)', () => {
  it('calcule les totaux sans remise ni TVA', () => {
    const totals = computeInvoiceTotals(
      [{ quantity: 2, unitPrice: 5000, taxRate: 0 }],
      'percentage',
      0
    )
    expect(totals).toEqual({
      subtotal: 10000,
      discountAmount: 0,
      taxableAmount: 10000,
      taxTotal: 0,
      total: 10000
    })
  })

  it("applique la TVA sur le sous-total quand il n'y a pas de remise", () => {
    const totals = computeInvoiceTotals(
      [{ quantity: 1, unitPrice: 10000, taxRate: 18 }],
      'percentage',
      0
    )
    expect(totals.taxTotal).toBe(1800)
    expect(totals.total).toBe(11800)
  })

  it('applique la TVA sur la base imposable APRES remise (pas sur le sous-total brut)', () => {
    // 10 000 - 10% de remise = 9 000 imposables, TVA 18% => 1 620.
    const totals = computeInvoiceTotals(
      [{ quantity: 1, unitPrice: 10000, taxRate: 18 }],
      'percentage',
      10
    )
    expect(totals.subtotal).toBe(10000)
    expect(totals.discountAmount).toBe(1000)
    expect(totals.taxableAmount).toBe(9000)
    expect(totals.taxTotal).toBe(1620)
    expect(totals.total).toBe(10620)
  })

  it('repartit la remise au prorata entre lignes a taux de TVA differents', () => {
    // Ligne A : 8000 (TVA 18%), Ligne B : 2000 (TVA 0%). Sous-total 10000,
    // remise fixe de 1000 (10%) repartie au prorata : A perd 800, B perd 200.
    // TVA = (8000 - 800) * 18% = 1296 ; B ne genere aucune TVA.
    const totals = computeInvoiceTotals(
      [
        { quantity: 1, unitPrice: 8000, taxRate: 18 },
        { quantity: 1, unitPrice: 2000, taxRate: 0 }
      ],
      'fixed',
      1000
    )
    expect(totals.subtotal).toBe(10000)
    expect(totals.discountAmount).toBe(1000)
    expect(totals.taxTotal).toBe(1296)
    expect(totals.total).toBe(10296)
  })

  it('gere une liste de lignes vide', () => {
    expect(computeInvoiceTotals([], 'percentage', 0)).toEqual({
      subtotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      taxTotal: 0,
      total: 0
    })
  })
})
