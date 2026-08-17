/**
 * Validateurs generiques reutilisables dans les formulaires
 * (composants et composables).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}

export function isRequired(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  return value !== null && value !== undefined
}

export function minLength(value: string, min: number): boolean {
  return value.trim().length >= min
}

export function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}
