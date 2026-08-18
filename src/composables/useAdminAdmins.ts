import { ref } from 'vue'

import { adminAdminService } from '@/services'
import type {
  AdminLoginHistoryEntry,
  ApiError,
  ID,
  InviteAdminPayload,
  PlatformAdmin,
  UpdateAdminPayload
} from '@/types'

import { useToast } from './useToast'

/** Orchestre la gestion des comptes administrateurs plateforme (liste, invitation, role/desactivation, historique de connexion). */
export function useAdminAdmins() {
  const toast = useToast()

  const items = ref<PlatformAdmin[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)

  const loginHistory = ref<AdminLoginHistoryEntry[]>([])
  const isLoadingHistory = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      items.value = await adminAdminService.list()
    } finally {
      isLoading.value = false
    }
  }

  async function loadLoginHistory(): Promise<void> {
    isLoadingHistory.value = true
    try {
      const response = await adminAdminService.getLoginHistory({ page: 1, perPage: 20 })
      loginHistory.value = response.data
    } finally {
      isLoadingHistory.value = false
    }
  }

  async function invite(payload: InviteAdminPayload): Promise<ApiError | null> {
    isSubmitting.value = true
    try {
      const admin = await adminAdminService.invite(payload)
      toast.success(`${admin.firstName} ${admin.lastName} a ete invite(e) comme administrateur.`)
      await load()
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isSubmitting.value = false
    }
  }

  async function update(id: ID, payload: UpdateAdminPayload): Promise<boolean> {
    isSubmitting.value = true
    try {
      await adminAdminService.update(id, payload)
      toast.success('Administrateur mis a jour.')
      await load()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    items,
    isLoading,
    isSubmitting,
    loginHistory,
    isLoadingHistory,
    load,
    loadLoginHistory,
    invite,
    update
  }
}
