import { ref } from 'vue'

import { STORAGE_KEYS } from '@/constants'
import { storage } from '@/utils/storage'

export type FontScale = 'normal' | 'large' | 'xlarge'

interface AccessibilityPrefs {
  fontScale: FontScale
  highContrast: boolean
}

const FONT_SCALE_CLASSES: Record<FontScale, string | null> = {
  normal: null,
  large: 'a11y-scale-large',
  xlarge: 'a11y-scale-xlarge'
}

function readPrefs(): AccessibilityPrefs {
  const raw = storage.get(STORAGE_KEYS.accessibilityPrefs)
  if (!raw) return { fontScale: 'normal', highContrast: false }
  try {
    const parsed = JSON.parse(raw) as Partial<AccessibilityPrefs>
    return {
      fontScale:
        parsed.fontScale === 'large' || parsed.fontScale === 'xlarge' ? parsed.fontScale : 'normal',
      highContrast: Boolean(parsed.highContrast)
    }
  } catch {
    return { fontScale: 'normal', highContrast: false }
  }
}

function applyToDocument(prefs: AccessibilityPrefs): void {
  const root = document.documentElement
  root.classList.remove('a11y-scale-large', 'a11y-scale-xlarge')
  const scaleClass = FONT_SCALE_CLASSES[prefs.fontScale]
  if (scaleClass) root.classList.add(scaleClass)
  root.classList.toggle('a11y-high-contrast', prefs.highContrast)
}

// Etat partage entre tous les usages du composable (une seule preference
// globale par navigateur, pas par composant) : module-level plutot que
// recree a chaque appel.
const prefs = ref<AccessibilityPrefs>(readPrefs())
applyToDocument(prefs.value)

function persist(): void {
  storage.set(STORAGE_KEYS.accessibilityPrefs, JSON.stringify(prefs.value))
  applyToDocument(prefs.value)
}

/** Preferences d'accessibilite (taille de police, contraste eleve), persistees par navigateur. */
export function useAccessibility() {
  function setFontScale(scale: FontScale): void {
    prefs.value.fontScale = scale
    persist()
  }

  function toggleHighContrast(): void {
    prefs.value.highContrast = !prefs.value.highContrast
    persist()
  }

  return { prefs, setFontScale, toggleHighContrast }
}
