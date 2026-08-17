import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { adminBusinessService } from '@/services'
import type {
  AdminBusinessDetail,
  AdminBusinessListParams,
  AdminBusinessSummary,
  AdminChangePlanPayload,
  ApiError,
  AsyncStatus,
  ID,
  PaginationMeta,
  PlatformStats,
  UpdateBusinessStatusPayload
} from '@/types'

const EMPTY_META: PaginationMeta = { page: 1, perPage: 10, total: 0, totalPages: 1 }

/** Etat de la liste des commerces (tenants) et des indicateurs plateforme, vus depuis l'espace admin. */
export const useAdminBusinessesStore = defineStore('adminBusinesses', () => {
  const items = ref<AdminBusinessSummary[]>([])
  const meta = ref<PaginationMeta>(EMPTY_META)
  const status = ref<AsyncStatus>('idle')
  const error = ref<ApiError | null>(null)

  const stats = ref<PlatformStats | null>(null)
  const statsStatus = ref<AsyncStatus>('idle')

  const isLoading = computed(() => status.value === 'loading')

  async function fetchBusinesses(params?: AdminBusinessListParams): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      const response = await adminBusinessService.list(params)
      items.value = response.data
      meta.value = response.meta
      status.value = 'success'
    } catch (err) {
      error.value = err as ApiError
      status.value = 'error'
    }
  }

  async function fetchStats(): Promise<void> {
    statsStatus.value = 'loading'
    try {
      stats.value = await adminBusinessService.getStats()
      statsStatus.value = 'success'
    } catch {
      statsStatus.value = 'error'
    }
  }

  function getBusiness(id: ID): Promise<AdminBusinessDetail> {
    return adminBusinessService.getById(id)
  }

  function updateBusinessStatus(
    id: ID,
    payload: UpdateBusinessStatusPayload
  ): Promise<AdminBusinessDetail> {
    return adminBusinessService.updateStatus(id, payload)
  }

  function changeBusinessPlan(
    id: ID,
    payload: AdminChangePlanPayload
  ): Promise<AdminBusinessDetail> {
    return adminBusinessService.changePlan(id, payload)
  }

  return {
    items,
    meta,
    status,
    error,
    isLoading,
    stats,
    statsStatus,
    fetchBusinesses,
    fetchStats,
    getBusiness,
    updateBusinessStatus,
    changeBusinessPlan
  }
})
