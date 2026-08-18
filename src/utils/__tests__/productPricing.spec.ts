import { describe, expect, it } from 'vitest'

import { resolveUnitPrice } from '../productPricing'

describe('resolveUnitPrice (tarifs degressifs)', () => {
  it("renvoie le prix de base si aucun palier n'est defini", () => {
    expect(resolveUnitPrice(1000, undefined, 5)).toBe(1000)
    expect(resolveUnitPrice(1000, [], 5)).toBe(1000)
  })

  it('renvoie le prix de base si la quantite est sous le premier palier', () => {
    const breaks = [{ minQuantity: 10, price: 900 }]
    expect(resolveUnitPrice(1000, breaks, 5)).toBe(1000)
  })

  it("applique le palier exact quand la quantite l'atteint", () => {
    const breaks = [{ minQuantity: 10, price: 900 }]
    expect(resolveUnitPrice(1000, breaks, 10)).toBe(900)
  })

  it('applique le palier le plus eleve encore valide parmi plusieurs', () => {
    const breaks = [
      { minQuantity: 10, price: 900 },
      { minQuantity: 50, price: 800 },
      { minQuantity: 100, price: 700 }
    ]
    expect(resolveUnitPrice(1000, breaks, 60)).toBe(800)
    expect(resolveUnitPrice(1000, breaks, 150)).toBe(700)
    expect(resolveUnitPrice(1000, breaks, 9)).toBe(1000)
  })

  it("fonctionne quels que soient l'ordre de declaration des paliers", () => {
    const breaks = [
      { minQuantity: 100, price: 700 },
      { minQuantity: 10, price: 900 }
    ]
    expect(resolveUnitPrice(1000, breaks, 60)).toBe(900)
  })
})
