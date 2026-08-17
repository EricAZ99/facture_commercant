import { describe, expect, it } from 'vitest'

import { getInvoiceBalance, getInvoicePaymentStatus } from '../paymentStatus'

describe('getInvoiceBalance', () => {
  it('renvoie le solde restant', () => {
    expect(getInvoiceBalance(3000, 10000)).toBe(7000)
  })

  it('ne renvoie jamais un solde negatif (trop-percu)', () => {
    expect(getInvoiceBalance(12000, 10000)).toBe(0)
  })

  it("renvoie le total complet si rien n'a ete paye", () => {
    expect(getInvoiceBalance(0, 10000)).toBe(10000)
  })
})

describe('getInvoicePaymentStatus', () => {
  it('est "unpaid" si rien n\'a ete paye', () => {
    expect(getInvoicePaymentStatus(0, 10000)).toBe('unpaid')
  })

  it('est "partially_paid" si le paiement est partiel', () => {
    expect(getInvoicePaymentStatus(4000, 10000)).toBe('partially_paid')
  })

  it('est "paid" quand le montant paye couvre exactement le total', () => {
    expect(getInvoicePaymentStatus(10000, 10000)).toBe('paid')
  })

  it('est "paid" meme en cas de trop-percu', () => {
    expect(getInvoicePaymentStatus(11000, 10000)).toBe('paid')
  })
})
