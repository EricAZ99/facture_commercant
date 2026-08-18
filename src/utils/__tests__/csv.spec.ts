import { describe, expect, it } from 'vitest'

import { parseCsv, toCsv } from '../csv'

describe('toCsv', () => {
  it('joint les champs par des virgules et les lignes par CRLF', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['c', 'd']
      ])
    ).toBe('a,b\r\nc,d')
  })

  it('met entre guillemets un champ contenant une virgule', () => {
    expect(toCsv([['Dupont, Jean']])).toBe('"Dupont, Jean"')
  })

  it('echappe les guillemets internes en les doublant', () => {
    expect(toCsv([['Le "Grand" Magasin']])).toBe('"Le ""Grand"" Magasin"')
  })

  it('met entre guillemets un champ contenant un retour a la ligne', () => {
    expect(toCsv([['ligne1\nligne2']])).toBe('"ligne1\nligne2"')
  })
})

describe('parseCsv', () => {
  it('parse des lignes simples separees par des virgules', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ])
  })

  it('parse un champ entre guillemets contenant une virgule', () => {
    expect(parseCsv('"Dupont, Jean",Client')).toEqual([['Dupont, Jean', 'Client']])
  })

  it('deseschappe les guillemets doubles', () => {
    expect(parseCsv('"Le ""Grand"" Magasin"')).toEqual([['Le "Grand" Magasin']])
  })

  it("est l'inverse exact de toCsv sur des donnees avec virgules et guillemets", () => {
    const original = [
      ['Prenom', 'Nom'],
      ['Jean, Pierre', 'D"Artagnan']
    ]
    expect(parseCsv(toCsv(original))).toEqual(original)
  })

  it('ignore les lignes vides en fin de fichier', () => {
    expect(parseCsv('a,b\n\n')).toEqual([['a', 'b']])
  })
})
