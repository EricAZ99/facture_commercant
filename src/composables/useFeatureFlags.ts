import { useAuthStore } from '@/stores'
import type { FeatureFlagKey } from '@/types'

/**
 * Verifications de fonctionnalites activables/desactivables par commerce
 * (navigation, acces aux pages) pour l'UI. Distinct de `usePermissions` :
 * une permission depend du role de l'utilisateur, une fonctionnalite
 * depend du commerce lui-meme (reglee par un administrateur plateforme).
 */
export function useFeatureFlags() {
  const authStore = useAuthStore()

  function isEnabled(flag: FeatureFlagKey): boolean {
    return authStore.hasFeature(flag)
  }

  return { isEnabled }
}
