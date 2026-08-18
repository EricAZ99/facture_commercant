import { computed, ref } from 'vue'

import { useAuthStore, useBusinessStore } from '@/stores'
import type { ApiError, UpdateBusinessPayload } from '@/types'

import { useToast } from './useToast'

/**
 * Orchestre la modification des parametres du commerce (informations,
 * configuration des factures), l'upload du logo/tampon, la cle API
 * developpeur, l'export de sauvegarde et la suppression du compte, avec
 * notifications et remontee des erreurs de validation backend vers le
 * formulaire appelant. Le commerce lui-meme se lit depuis
 * `authStore.business` (source unique de verite), jamais duplique ici.
 */
export function useBusiness() {
  const authStore = useAuthStore()
  const store = useBusinessStore()
  const toast = useToast()

  const business = computed(() => authStore.business)
  const isSaving = ref(false)
  const isUploadingLogo = ref(false)
  const isUploadingStamp = ref(false)
  const isRegeneratingApiKey = ref(false)
  const isExporting = ref(false)
  const isDeletingAccount = ref(false)

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

  async function submitStamp(file: File): Promise<ApiError | null> {
    isUploadingStamp.value = true
    try {
      await store.uploadStamp(file)
      toast.success('Tampon mis a jour avec succes.')
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isUploadingStamp.value = false
    }
  }

  async function regenerateApiKey(): Promise<boolean> {
    isRegeneratingApiKey.value = true
    try {
      await store.regenerateApiKey()
      toast.success('Nouvelle cle API generee.')
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isRegeneratingApiKey.value = false
    }
  }

  /** Telecharge une sauvegarde complete des donnees du commerce au format JSON. */
  async function exportData(): Promise<void> {
    isExporting.value = true
    try {
      const data = await store.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sauvegarde-${business.value?.name || 'commerce'}-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Sauvegarde telechargee.')
    } catch (err) {
      toast.error((err as ApiError).message)
    } finally {
      isExporting.value = false
    }
  }

  /** Supprime definitivement le compte commerce (proprietaire uniquement) et termine la session locale. */
  async function deleteAccount(confirmName: string): Promise<ApiError | null> {
    isDeletingAccount.value = true
    try {
      await store.deleteAccount(confirmName)
      authStore.clearSession()
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isDeletingAccount.value = false
    }
  }

  return {
    business,
    isSaving,
    isUploadingLogo,
    isUploadingStamp,
    isRegeneratingApiKey,
    isExporting,
    isDeletingAccount,
    submitUpdate,
    submitLogo,
    submitStamp,
    regenerateApiKey,
    exportData,
    deleteAccount
  }
}
