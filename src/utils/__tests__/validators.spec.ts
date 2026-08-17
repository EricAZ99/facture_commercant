import { describe, expect, it } from 'vitest'

import { isPositiveNumber, isRequired, isValidEmail, minLength } from '../validators'

describe('isValidEmail', () => {
  it('accepte un email valide', () => {
    expect(isValidEmail('contact@commerce.com')).toBe(true)
  })

  it('accepte un email avec espaces en trop (trim avant validation)', () => {
    expect(isValidEmail('  contact@commerce.com  ')).toBe(true)
  })

  it('rejette une chaine sans @', () => {
    expect(isValidEmail('contact-commerce.com')).toBe(false)
  })

  it('rejette une chaine sans domaine', () => {
    expect(isValidEmail('contact@')).toBe(false)
  })

  it('rejette une chaine vide', () => {
    expect(isValidEmail('')).toBe(false)
  })
})

describe('isRequired', () => {
  it('rejette une chaine vide', () => {
    expect(isRequired('')).toBe(false)
  })

  it("rejette une chaine composee uniquement d'espaces", () => {
    expect(isRequired('   ')).toBe(false)
  })

  it('accepte une chaine non vide', () => {
    expect(isRequired('Jean')).toBe(true)
  })

  it('rejette null/undefined', () => {
    expect(isRequired(null)).toBe(false)
    expect(isRequired(undefined)).toBe(false)
  })

  it('accepte un nombre (y compris 0)', () => {
    expect(isRequired(0)).toBe(true)
  })
})

describe('minLength', () => {
  it('accepte une chaine de longueur suffisante', () => {
    expect(minLength('password123', 8)).toBe(true)
  })

  it('rejette une chaine trop courte', () => {
    expect(minLength('short', 8)).toBe(false)
  })

  it('ignore les espaces en trop pour le calcul de longueur', () => {
    expect(minLength('  1234  ', 4)).toBe(true)
  })
})

describe('isPositiveNumber', () => {
  it('accepte un nombre positif', () => {
    expect(isPositiveNumber(42)).toBe(true)
  })

  it('accepte zero', () => {
    expect(isPositiveNumber(0)).toBe(true)
  })

  it('rejette un nombre negatif', () => {
    expect(isPositiveNumber(-1)).toBe(false)
  })

  it('rejette NaN et Infinity', () => {
    expect(isPositiveNumber(NaN)).toBe(false)
    expect(isPositiveNumber(Infinity)).toBe(false)
  })
})
