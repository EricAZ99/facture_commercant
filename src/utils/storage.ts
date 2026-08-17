/**
 * Fine couche au-dessus de `localStorage` pour centraliser la persistance
 * cote client et rester tolerant en environnement sans `window` (SSR/tests).
 */
export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Stockage indisponible (mode prive, quota depasse...): on ignore
      // silencieusement, l'application reste fonctionnelle en memoire.
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
}
