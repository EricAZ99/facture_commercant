import { computed, ref } from 'vue'

import { useAuthStore, useBusinessStore } from '@/stores'
import type { ApiError, UpdateBusinessPayload } from '@/types'

import { useToast } from './useToast'

/**
 * Orchestre la modification des parametres du commerce (informations,
 * configuration des factures) et l'upload du logo, avec notifications et
 * remontee des erreurs de validation backend vers le formulaire appelant.
 * Le commerce lui-meme se lit depuis `authStore.business` (source unique de
 * verite), jamais duplique ici.
 */
export function useBusiness() {
  const authStore = useAuthStore()
  const store = useBusinessStore()
  const toast = useToast()

  const business = computed(() => authStore.business)
  const isSaving = ref(false)
  const isUploadingLogo = ref(false)

  async function submitUpdate(payload: UpdateBusinessPayload): Promise<ApiError | null> {
    isSaving.value = true
    try {
      await store.updateBusiness(payload)
      toast.success('Parametres du commerce mis a jour avec succes.')
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isSaving.value = false
    }
  }

  async function submitLogo(file: File): Promise<ApiError | null> {
    isUploadingLogo.value = true
    try {
      await store.uploadLogo(file)
      toast.success('Logo mis a jour avec succes.')
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isUploadingLogo.value = false
    }
  }

  return {
    business,
    isSaving,
    isUploadingLogo,
    submitUpdate,
    submitLogo
  }
}
