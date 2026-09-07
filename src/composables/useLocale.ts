import { useI18n } from 'vue-i18n'

import { STORAGE_KEYS } from '@/constants'
import { type AppLocale, SUPPORTED_LOCALES } from '@/i18n'
import { storage } from '@/utils/storage'

export interface LocaleOption {
  code: AppLocale
  /** Nom de la langue dans sa propre langue (convention standard des selecteurs de langue : jamais traduit). */
  nativeName: string
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'fr', nativeName: 'Français' },
  { code: 'en', nativeName: 'English' },
  { code: 'es', nativeName: 'Español' },
  { code: 'it', nativeName: 'Italiano' }
]

/** Langue de l'interface, persistee par navigateur. Voir `src/i18n/index.ts` pour la resolution initiale. */
export function useLocale() {
  const { locale } = useI18n({ useScope: 'global' })

  function setLocale(code: AppLocale): void {
    locale.value = code
    storage.set(STORAGE_KEYS.locale, code)
    document.documentElement.setAttribute('lang', code)
  }

  return { locale, setLocale, options: LOCALE_OPTIONS, supportedLocales: SUPPORTED_LOCALES }
}
