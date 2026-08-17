import { onUnmounted, ref, watch } from 'vue'

import { adminBusinessService } from '@/services'
import { useAdminBusinessesStore } from '@/stores'
import type {
  AdminAuditLogEntry,
  AdminBusinessDetail,
  ApiError,
  ID,
  PaginationMeta,
  SubscriptionStatus
} from '@/types'

import { usePagination } from './usePagination'
import { useToast } from './useToast'

const SEARCH_DEBOUNCE_MS = 350

/** Orchestre la liste des commerces (recherche, filtre par statut d'abonnement, pagination serveur). */
export function useAdminBusinesses() {
  const store = useAdminBusinessesStore()
  const pagination = usePagination(10)

  const search = ref('')
  const subscriptionStatus = ref<SubscriptionStatus | ''>('')

  async function load(): Promise<void> {
    await store.fetchBusinesses({
      page: pagination.page.value,
      perPage: pagination.perPage.value,
      search: search.value.trim() || undefined,
      subscriptionStatus: subscriptionStatus.value || undefined
    })
    if (store.status === 'success') {
      pagination.applyMeta(store.meta)
    }
  }

  function goToPage(target: number): void {
    if (target === pagination.page.value) return
    pagination.goToPage(target)
    void load()
  }

  function nextPage(): void {
    if (!pagination.hasNextPage.value) return
    pagination.nextPage()
    void load()
  }

  function prevPage(): void {
    if (!pagination.hasPrevPage.value) return
    pagination.prevPage()
    void load()
  }

  function setStatusFilter(status: SubscriptionStatus | ''): void {
    if (status === subscriptionStatus.value) return
    subscriptionStatus.value = status
    pagination.goToPage(1)
    void load()
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(search, () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      pagination.goToPage(1)
      void load()
    }, SEARCH_DEBOUNCE_MS)
  })
  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  async function loadStats(): Promise<void> {
    await store.fetchStats()
  }

  return {
    store,
    search,
    subscriptionStatus,
    pagination,
    load,
    goToPage,
    nextPage,
    prevPage,
    setStatusFilter,
    loadStats
  }
}

/** Orchestre le detail d'un commerce : chargement, suspension/reactivation, changement de plan, journal d'audit. */
export function useAdminBusinessDetail(id: ID) {
  const store = useAdminBusinessesStore()
  const toast = useToast()

  const business = ref<AdminBusinessDetail | null>(null)
  const isLoading = ref(false)
  const loadError = ref<ApiError | null>(null)
  const isMutating = ref(false)

  const auditLog = ref<AdminAuditLogEntry[]>([])
  const auditLogMeta = ref<PaginationMeta | null>(null)
  const isLoadingAuditLog = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    loadError.value = null
    try {
      business.value = await store.getBusiness(id)
    } catch (err) {
      loadError.value = err as ApiError
    } finally {
      isLoading.value = false
    }
  }

  async function loadAuditLog(): Promise<void> {
    isLoadingAuditLog.value = true
    try {
      const response = await adminBusinessService.getAuditLog(id, { page: 1, perPage: 20 })
      auditLog.value = response.data
      auditLogMeta.value = response.meta
    } finally {
      isLoadingAuditLog.value = false
    }
  }

  async function toggleSuspension(): Promise<boolean> {
    if (!business.value) return false
    isMutating.value = true
    try {
      business.value = await store.updateBusinessStatus(id, {
        isSuspended: !business.value.isSuspended
      })
      toast.success(business.value.isSuspended ? 'Commerce suspendu.' : 'Commerce reactive.')
      void loadAuditLog()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isMutating.value = false
    }
  }

  async function changePlan(planId: ID): Promise<boolean> {
    isMutating.value = true
    try {
      business.value = await store.changeBusinessPlan(id, { planId })
      toast.success('Plan du commerce mis a jour.')
      void loadAuditLog()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isMutating.value = false
    }
  }

  return {
    business,
    isLoading,
    loadError,
    isMutating,
    auditLog,
    auditLogMeta,
    isLoadingAuditLog,
    load,
    loadAuditLog,
    toggleSuspension,
    changePlan
  }
}
