import type { Product, ProductImportPayload, ProductType } from '@/types'

import { parseCsv, toCsv } from './csv'

const CSV_HEADERS = ['Nom', 'Categorie', 'Type', 'Prix', 'TVA', 'SKU', 'Stock', 'Code-barres']

export function productsToCsv(products: Product[]): string {
  const rows = products.map((product) => [
    product.name,
    product.categoryPath ?? '',
    product.type,
    String(product.price),
    String(product.taxRate),
    product.sku ?? '',
    product.stock !== undefined ? String(product.stock) : '',
    product.barcode ?? ''
  ])
  return toCsv([CSV_HEADERS, ...rows])
}

export interface ParsedProductRow {
  row: number
  payload: ProductImportPayload
}

export interface ProductCsvParseResult {
  products: ParsedProductRow[]
  errors: Array<{ row: number; message: string }>
}

/**
 * Parse un CSV de produits (memes colonnes que l'export, entete optionnelle).
 * La colonne Categorie reste du texte libre (chemin eventuellement
 * hierarchique, ex: "Vetements > T-shirts") : elle est resolue en
 * `categoryId` cote backend (voir `findOrCreateCategoryPath`), pas ici.
 */
export function parseProductsCsv(text: string): ProductCsvParseResult {
  const rows = parseCsv(text)
  if (rows.length === 0) return { products: [], errors: [] }

  const firstCell = rows[0]?.[0]?.trim().toLowerCase()
  const dataRows = firstCell === 'nom' ? rows.slice(1) : rows

  const products: ParsedProductRow[] = []
  const errors: Array<{ row: number; message: string }> = []

  dataRows.forEach((cells, index) => {
    const rowNumber = index + 1
    const [name, categoryPath, typeRaw, priceRaw, taxRateRaw, sku, stockRaw, barcode] = cells

    if (!name?.trim() || !categoryPath?.trim()) {
      errors.push({ row: rowNumber, message: 'Nom et categorie sont requis.' })
      return
    }

    const price = Number(priceRaw)
    if (!priceRaw?.trim() || !Number.isFinite(price) || price <= 0) {
      errors.push({ row: rowNumber, message: 'Le prix doit etre un nombre positif.' })
      return
    }

    const type: ProductType = typeRaw?.trim().toLowerCase() === 'service' ? 'service' : 'product'
    const stock = stockRaw?.trim() ? Number(stockRaw) : undefined

    products.push({
      row: rowNumber,
      payload: {
        name: name.trim(),
        categoryPath: categoryPath.trim(),
        type,
        price,
        taxRate: taxRateRaw?.trim() ? Number(taxRateRaw) : 0,
        sku: sku?.trim() || undefined,
        stock:
          type === 'product' && stock !== undefined && Number.isFinite(stock) ? stock : undefined,
        barcode: barcode?.trim() || undefined
      }
    })
  })

  return { products, errors }
}
