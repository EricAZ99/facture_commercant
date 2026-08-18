import type { Client, CreateClientPayload } from '@/types'

import { parseCsv, toCsv } from './csv'

/** Ordre des colonnes utilise a la fois par l'export et l'import CSV des clients. */
const CSV_HEADERS = [
  'Prenom',
  'Nom',
  'Telephone',
  'Email',
  'Adresse',
  'Ville',
  'Pays',
  'Identifiant fiscal',
  'Notes',
  'Etiquettes'
]

/** Les etiquettes multiples sont separees par "|" a l'interieur d'une meme cellule CSV. */
const TAGS_SEPARATOR = '|'

export function clientsToCsv(clients: Client[]): string {
  const rows = clients.map((client) => [
    client.firstName,
    client.lastName,
    client.phone ?? '',
    client.email ?? '',
    client.address ?? '',
    client.city ?? '',
    client.country ?? '',
    client.taxId ?? '',
    client.notes ?? '',
    (client.tags ?? []).join(TAGS_SEPARATOR)
  ])
  return toCsv([CSV_HEADERS, ...rows])
}

export interface ParsedClientRow {
  /** Numero de ligne cote humain (1 = premiere ligne de donnees, apres l'entete). */
  row: number
  payload: CreateClientPayload
}

export interface ClientCsvParseResult {
  clients: ParsedClientRow[]
  errors: Array<{ row: number; message: string }>
}

/**
 * Parse un CSV de clients (memes colonnes que l'export, entete optionnelle
 * mais recommandee). Une ligne sans prenom/nom est rapportee en erreur mais
 * n'empeche pas le traitement des autres lignes.
 */
export function parseClientsCsv(text: string): ClientCsvParseResult {
  const rows = parseCsv(text)
  if (rows.length === 0) return { clients: [], errors: [] }

  // Detecte une ligne d'entete (premiere cellule ressemblant a "Prenom").
  const firstCell = rows[0]?.[0]?.trim().toLowerCase()
  const dataRows = firstCell === 'prenom' ? rows.slice(1) : rows

  const clients: ParsedClientRow[] = []
  const errors: Array<{ row: number; message: string }> = []

  dataRows.forEach((cells, index) => {
    const rowNumber = index + 1
    const [firstName, lastName, phone, email, address, city, country, taxId, notes, tags] = cells

    if (!firstName?.trim() || !lastName?.trim()) {
      errors.push({ row: rowNumber, message: 'Prenom et nom sont requis.' })
      return
    }

    clients.push({
      row: rowNumber,
      payload: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || undefined,
        email: email?.trim() || undefined,
        address: address?.trim() || undefined,
        city: city?.trim() || undefined,
        country: country?.trim() || undefined,
        taxId: taxId?.trim() || undefined,
        notes: notes?.trim() || undefined,
        tags: tags?.trim()
          ? tags
              .split(TAGS_SEPARATOR)
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined
      }
    })
  })

  return { clients, errors }
}
