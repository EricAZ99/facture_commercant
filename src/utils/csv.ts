/**
 * Lecture/ecriture CSV minimalistes (RFC 4180 : champs entre guillemets,
 * virgules et retours a la ligne echappes). Volontairement sans dependance
 * externe — le besoin (import/export de listes simples) ne justifie pas
 * une librairie complete de type SheetJS.
 */

/** Parse un texte CSV en tableau de lignes (chaque ligne = tableau de champs). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  // Normalise les fins de ligne avant le parcours caractere par caractere.
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i]

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  // Derniere ligne (pas forcement terminee par un saut de ligne).
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => !(r.length === 1 && (r[0] ?? '').trim() === ''))
}

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Convertit un tableau de lignes en texte CSV pret a etre telecharge. */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\r\n')
}

/** Declenche le telechargement d'un texte CSV deja construit (voir `toCsv`) dans le navigateur. */
export function downloadCsv(filename: string, csvText: string): void {
  // BOM UTF-8 : Excel n'interprete correctement les accents que si le
  // fichier commence par ce marqueur.
  const blob = new Blob(['﻿' + csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
