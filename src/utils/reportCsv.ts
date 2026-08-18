import type { TopClientReportItem, TopProductReportItem, VatReport } from '@/types'

import { toCsv } from './csv'

/**
 * Combine les tableaux du rapport (produits les plus vendus, meilleurs
 * clients, ventilation TVA) en un seul CSV, chaque section separee par une
 * ligne vide et son propre en-tete — plus simple qu'un export multi-fichiers
 * pour ce volume de donnees, et s'ouvre correctement dans Excel/LibreOffice.
 */
export function reportsToCsv(data: {
  topProducts: TopProductReportItem[]
  topClients: TopClientReportItem[]
  vat: VatReport | null
}): string {
  const sections: string[] = []

  sections.push(
    toCsv([
      ['Produits les plus vendus'],
      ['Produit', 'Quantite vendue', "Chiffre d'affaires"],
      ...data.topProducts.map((p) => [p.name, String(p.quantitySold), String(p.revenue)])
    ])
  )

  sections.push(
    toCsv([
      ['Meilleurs clients'],
      ['Client', 'Nombre de factures', 'Total depense'],
      ...data.topClients.map((c) => [c.name, String(c.invoicesCount), String(c.totalSpent)])
    ])
  )

  if (data.vat) {
    sections.push(
      toCsv([
        ['TVA collectee'],
        ['Taux', 'Base imposable', 'TVA collectee'],
        ...data.vat.items.map((v) => [
          `${v.taxRate}%`,
          String(v.taxableAmount),
          String(v.taxAmount)
        ]),
        ['Total', String(data.vat.totalTaxableAmount), String(data.vat.totalTaxAmount)]
      ])
    )
  }

  return sections.join('\r\n\r\n')
}
