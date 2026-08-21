/**
 * Fonctions de formatage d'affichage. Volontairement pures et sans
 * dependance au store afin de rester testables et reutilisables partout
 * (composants, composables, services).
 */

/** Formate un montant selon une devise ISO 4217 (par defaut XOF). */
export function formatCurrency(amount: number, currency = 'XOF', locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'XOF' ? 0 : 2
  }).format(amount)
}

/** Formate une date ISO en format court lisible (ex: 12/08/2026). */
export function formatDate(date: string | Date, locale = 'fr-FR'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(d)
}

/** Formate une date ISO avec l'heure (ex: 12/08/2026 14:30). */
export function formatDateTime(date: string | Date, locale = 'fr-FR'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(d)
}

/** Formate un nombre avec separateurs de milliers. */
export function formatNumber(value: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(value)
}

/** Formate une taille de fichier en octets vers l'unite lisible la plus pertinente (Ko/Mo). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/** Formate une date en duree relative lisible (ex: "il y a 3 heures"). */
export function formatRelativeTime(date: string | Date, locale = 'fr-FR'): string {
  const target = typeof date === 'string' ? new Date(date) : date
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'seconds' },
    { amount: 60, unit: 'minutes' },
    { amount: 24, unit: 'hours' },
    { amount: 7, unit: 'days' },
    { amount: 4.34524, unit: 'weeks' },
    { amount: 12, unit: 'months' },
    { amount: Number.POSITIVE_INFINITY, unit: 'years' }
  ]

  let duration = (target.getTime() - Date.now()) / 1000
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return rtf.format(Math.round(duration), 'years')
}

/** Construit les initiales (2 lettres max) a partir d'un nom complet. */
export function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
