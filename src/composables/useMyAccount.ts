import { ref } from 'vue'

import { authService, userService } from '@/services'
import { useAuthStore } from '@/stores'
import type { ApiError, ChangeEmailPayload, UserDataExport, UserLoginHistoryEntry } from '@/types'
import { downloadBlob } from '@/utils/download'

import { useToast } from './useToast'

/**
 * Orchestre les actions "mon compte" de l'utilisateur connecte (distinctes
 * des parametres du commerce) : photo de profil, changement d'email,
 * historique de connexion, export RGPD, suppression du compte individuel.
 */
export function useMyAccount() {
  const authStore = useAuthStore()
  const toast = useToast()

  const isUploadingAvatar = ref(false)
  const isChangingEmail = ref(false)
  const isExporting = ref(false)
  const isDeleting = ref(false)

  const loginHistory = ref<UserLoginHistoryEntry[]>([])
  const isLoadingHistory = ref(false)

  async function loadLoginHistory(): Promise<void> {
    isLoadingHistory.value = true
    try {
      loginHistory.value = await userService.getMyLoginHistory()
    } finally {
      isLoadingHistory.value = false
    }
  }

  async function submitAvatar(file: File): Promise<ApiError | null> {
    isUploadingAvatar.value = true
    try {
      const user = await userService.uploadMyAvatar(file)
      authStore.setUser(user)
      toast.success('Photo de profil mise a jour.')
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isUploadingAvatar.value = false
    }
  }

  async function submitChangeEmail(payload: ChangeEmailPayload): Promise<ApiError | null> {
    isChangingEmail.value = true
    try {
      const user = await authService.changeEmail(payload)
      authStore.setUser(user)
      toast.success('Email mis a jour avec succes.')
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isChangingEmail.value = false
    }
  }

  /** Telecharge une copie de mes donnees personnelles au format JSON (droit a l'oubli / RGPD). */
  async function exportMyData(): Promise<void> {
    isExporting.value = true
    try {
      const data: UserDataExport = await userService.exportMyData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      downloadBlob(blob, `mes-donnees-${new Date().toISOString().slice(0, 10)}.json`)
      toast.success('Export telecharge.')
    } catch (err) {
      toast.error((err as ApiError).message)
    } finally {
      isExporting.value = false
    }
  }

  /** Supprime mon compte individuel (jamais le proprietaire, voir mock-server) et termine la session. */
  async function removeMyAccount(): Promise<ApiError | null> {
    isDeleting.value = true
    try {
      await userService.removeMyAccount()
      authStore.clearSession()
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isDeleting.value = false
    }
  }

  return {
    isUploadingAvatar,
    isChangingEmail,
    isExporting,
    isDeleting,
    loginHistory,
    isLoadingHistory,
    loadLoginHistory,
    submitAvatar,
    submitChangeEmail,
    exportMyData,
    removeMyAccount
  }
}
