import { describe, expect, it } from 'vitest'

import { clientsToCsv, parseClientsCsv } from '../clientCsv'
import type { Client } from '@/types'

function fakeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'c1',
    businessId: 'b1',
    firstName: 'Jean',
    lastName: 'Kouadio',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

describe('clientsToCsv', () => {
  it("inclut une ligne d'entete suivie d'une ligne par client", () => {
    const csv = clientsToCsv([fakeClient()])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe(
      'Prenom,Nom,Telephone,Email,Adresse,Ville,Pays,Identifiant fiscal,Notes,Etiquettes'
    )
    expect(lines[1]).toBe('Jean,Kouadio,,,,,,,,')
  })

  it('joint plusieurs etiquettes avec le separateur "|"', () => {
    const csv = clientsToCsv([fakeClient({ tags: ['VIP', 'Grossiste'] })])
    expect(csv.split('\r\n')[1]).toContain('VIP|Grossiste')
  })
})

describe('parseClientsCsv', () => {
  it('parse une ligne valide en payload client', () => {
    const result = parseClientsCsv('Prenom,Nom,Telephone\nJean,Kouadio,+225000')
    expect(result.errors).toEqual([])
    expect(result.clients).toHaveLength(1)
    expect(result.clients[0]?.payload).toMatchObject({
      firstName: 'Jean',
      lastName: 'Kouadio',
      phone: '+225000'
    })
  })

  it("fonctionne aussi sans ligne d'entete", () => {
    const result = parseClientsCsv('Jean,Kouadio')
    expect(result.clients).toHaveLength(1)
  })

  it('reporte une erreur pour une ligne sans prenom/nom, sans bloquer les autres', () => {
    const result = parseClientsCsv('Prenom,Nom\nJean,Kouadio\n,\nAwa,Traore')
    expect(result.clients).toHaveLength(2)
    expect(result.errors).toEqual([{ row: 2, message: 'Prenom et nom sont requis.' }])
  })

  it('reconstitue le tableau d\'etiquettes a partir du separateur "|"', () => {
    const result = parseClientsCsv(
      'Prenom,Nom,Telephone,Email,Adresse,Ville,Pays,Identifiant fiscal,Notes,Etiquettes\nJean,Kouadio,,,,,,,,VIP|Grossiste'
    )
    expect(result.clients[0]?.payload.tags).toEqual(['VIP', 'Grossiste'])
  })

  it('renvoie une liste vide pour un texte vide', () => {
    expect(parseClientsCsv('')).toEqual({ clients: [], errors: [] })
  })
})
