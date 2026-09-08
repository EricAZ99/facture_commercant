import type { BusinessType, Weekday } from '@/types'

/** Libelles affichables des categories de commerce. */
export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  restaurant: 'businessTypes.restaurant',
  boutique: 'businessTypes.boutique',
  salon_coiffure: 'businessTypes.salon_coiffure',
  hotel: 'businessTypes.hotel',
  pharmacie: 'businessTypes.pharmacie',
  pme: 'businessTypes.pme',
  autre: 'businessTypes.autre'
}

/** Options pretes a l'emploi pour un `<select>` de categorie de commerce. */
export const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string }> = (
  Object.entries(BUSINESS_TYPE_LABELS) as Array<[BusinessType, string]>
).map(([value, label]) => ({ value, label }))

/** Devises proposees dans les parametres du commerce. */
export const CURRENCY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'XOF', label: 'currencies.XOF' },
  { value: 'XAF', label: 'currencies.XAF' },
  { value: 'EUR', label: 'currencies.EUR' },
  { value: 'USD', label: 'currencies.USD' },
  { value: 'GBP', label: 'currencies.GBP' },
  { value: 'MAD', label: 'currencies.MAD' },
  { value: 'GNF', label: 'currencies.GNF' },
  { value: 'NGN', label: 'currencies.NGN' }
]

/** Taille maximale acceptee pour le logo du commerce (en octets). */
export const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024

/** Types MIME acceptes pour le logo du commerce. */
export const LOGO_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

/** Jours de la semaine dans l'ordre d'affichage, avec leur libelle. */
export const WEEKDAYS: Array<{ value: Weekday; label: string }> = [
  { value: 'monday', label: 'weekdays.monday' },
  { value: 'tuesday', label: 'weekdays.tuesday' },
  { value: 'wednesday', label: 'weekdays.wednesday' },
  { value: 'thursday', label: 'weekdays.thursday' },
  { value: 'friday', label: 'weekdays.friday' },
  { value: 'saturday', label: 'weekdays.saturday' },
  { value: 'sunday', label: 'weekdays.sunday' }
]

/** Evenements disponibles pour les webhooks developpeur (mock : ne declenche jamais reellement d'appel). */
export const WEBHOOK_EVENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'invoice.created', label: 'webhookEvents.invoiceCreated' },
  { value: 'invoice.paid', label: 'webhookEvents.invoicePaid' },
  { value: 'payment.received', label: 'webhookEvents.paymentReceived' },
  { value: 'client.created', label: 'webhookEvents.clientCreated' }
]
