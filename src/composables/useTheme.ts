import { ref } from 'vue'

import { STORAGE_KEYS } from '@/constants'
import { storage } from '@/utils/storage'

export type ThemeMode = 'light' | 'dark'

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function readTheme(): ThemeMode {
  const stored = storage.get(STORAGE_KEYS.theme)
  if (stored === 'light' || stored === 'dark') return stored
  return systemPrefersDark() ? 'dark' : 'light'
}

function applyToDocument(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

/**
 * Etat partage entre tous les usages (un seul theme par navigateur), applique
 * des le chargement du module. Doublon volontaire de la logique du script
 * inline de `index.html` (qui evite le flash au tout premier chargement) :
 * ce module reste la source de verite pour tout changement ulterieur.
 */
const theme = ref<ThemeMode>(readTheme())
applyToDocument(theme.value)

/** Theme clair/sombre de l'espace commercant, persiste par navigateur. */
export function useTheme() {
  function setTheme(mode: ThemeMode): void {
    theme.value = mode
    storage.set(STORAGE_KEYS.theme, mode)
    applyToDocument(mode)
  }

  function toggleTheme(): void {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme }
}
