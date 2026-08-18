import { ref } from 'vue'

import { adminSettingsService } from '@/services'
import type { ApiError, PlatformSettings, UpdatePlatformSettingsPayload } from '@/types'

import { useToast } from './useToast'

/** Orchestre les parametres globaux de la plateforme (espace admin). */
export function useAdminSettings() {
  const toast = useToast()

  const settings = ref<PlatformSettings | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      settings.value = await adminSettingsService.get()
    } finally {
      isLoading.value = false
    }
  }

  async function submitUpdate(payload: UpdatePlatformSettingsPayload): Promise<boolean> {
    isSaving.value = true
    try {
      settings.value = await adminSettingsService.update(payload)
      toast.success('Parametres plateforme mis a jour.')
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isSaving.value = false
    }
  }

  return { settings, isLoading, isSaving, load, submitUpdate }
}
