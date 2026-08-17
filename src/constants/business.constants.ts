import type { BusinessType } from '@/types'

/** Libelles affichables des categories de commerce. */
export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  restaurant: 'Restaurant',
  boutique: 'Boutique',
  salon_coiffure: 'Salon de coiffure',
  hotel: 'Hotel',
  pharmacie: 'Pharmacie',
  pme: 'PME',
  autre: 'Autre'
}

/** Options pretes a l'emploi pour un `<select>` de categorie de commerce. */
export const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string }> = (
  Object.entries(BUSINESS_TYPE_LABELS) as Array<[BusinessType, string]>
).map(([value, label]) => ({ value, label }))

/** Devises proposees dans les parametres du commerce. */
export const CURRENCY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'XOF', label: 'XOF - Franc CFA (UEMOA)' },
  { value: 'XAF', label: 'XAF - Franc CFA (CEMAC)' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - Dollar americain' },
  { value: 'GBP', label: 'GBP - Livre sterling' },
  { value: 'MAD', label: 'MAD - Dirham marocain' },
  { value: 'GNF', label: 'GNF - Franc guineen' },
  { value: 'NGN', label: 'NGN - Naira nigerian' }
]

/** Taille maximale acceptee pour le logo du commerce (en octets). */
export const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024

/** Types MIME acceptes pour le logo du commerce. */
export const LOGO_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
