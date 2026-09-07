import { createI18n } from 'vue-i18n'

import { STORAGE_KEYS } from '@/constants'
import { storage } from '@/utils/storage'

import en from '@/locales/en.json'
import es from '@/locales/es.json'
import fr from '@/locales/fr.json'
import it from '@/locales/it.json'

export type AppLocale = 'fr' | 'en' | 'es' | 'it'

export const SUPPORTED_LOCALES: AppLocale[] = ['fr', 'en', 'es', 'it']

/**
 * Francais par defaut, sans detection de la langue du navigateur : ce
 * dernier point est deliberement evite pour rester previsible d'une visite
 * a l'autre (et pour ne pas dependre de la langue du navigateur de qui fait
 * tourner les tests). L'utilisateur choisit explicitement sa langue via le
 * selecteur de la barre du haut, ensuite persistee par navigateur.
 */
const DEFAULT_LOCALE: AppLocale = 'fr'

function isAppLocale(value: string | null): value is AppLocale {
  return value !== null && (SUPPORTED_LOCALES as string[]).includes(value)
}

function readLocale(): AppLocale {
  const stored = storage.get(STORAGE_KEYS.locale)
  return isAppLocale(stored) ? stored : DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: readLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { fr, en, es, it }
})

document.documentElement.setAttribute('lang', i18n.global.locale.value)
