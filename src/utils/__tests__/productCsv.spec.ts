import { describe, expect, it } from 'vitest'

import { parseProductsCsv, productsToCsv } from '../productCsv'
import type { Product } from '@/types'

function fakeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    businessId: 'b1',
    name: 'T-shirt',
    categoryId: 'cat1',
    categoryPath: 'Vetements',
    type: 'product',
    price: 5000,
    taxRate: 18,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

describe('productsToCsv', () => {
  it("inclut une ligne d'entete suivie d'une ligne par produit", () => {
    const csv = productsToCsv([fakeProduct({ stock: 10 })])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('Nom,Categorie,Type,Prix,TVA,SKU,Stock,Code-barres')
    expect(lines[1]).toBe('T-shirt,Vetements,product,5000,18,,10,')
  })
})

describe('parseProductsCsv', () => {
  it('parse une ligne produit valide', () => {
    const result = parseProductsCsv('Nom,Categorie,Type,Prix\nT-shirt,Vetements,product,5000')
    expect(result.errors).toEqual([])
    expect(result.products[0]?.payload).toMatchObject({
      name: 'T-shirt',
      categoryPath: 'Vetements',
      type: 'product',
      price: 5000
    })
  })

  it('applique la TVA a 0 et le type "product" par defaut si non precises', () => {
    const result = parseProductsCsv('Nom,Categorie,Type,Prix\nConsultation,Services,,15000')
    expect(result.products[0]?.payload.taxRate).toBe(0)
    expect(result.products[0]?.payload.type).toBe('product')
  })

  it('reconnait le type "service" et ignore le stock pour ce type', () => {
    const result = parseProductsCsv(
      'Nom,Categorie,Type,Prix,TVA,SKU,Stock\nCoupe,Services,service,3000,0,,10'
    )
    expect(result.products[0]?.payload.type).toBe('service')
    expect(result.products[0]?.payload.stock).toBeUndefined()
  })

  it('reporte une erreur pour un prix invalide, sans bloquer les autres lignes', () => {
    const result = parseProductsCsv(
      'Nom,Categorie,Type,Prix\nProduitA,Cat,product,abc\nProduitB,Cat,product,1000'
    )
    expect(result.products).toHaveLength(1)
    expect(result.errors).toEqual([{ row: 1, message: 'Le prix doit etre un nombre positif.' }])
  })

  it('reporte une erreur pour une ligne sans nom/categorie', () => {
    const result = parseProductsCsv('Nom,Categorie,Type,Prix\n,,product,1000')
    expect(result.errors).toEqual([{ row: 1, message: 'Nom et categorie sont requis.' }])
  })
})
