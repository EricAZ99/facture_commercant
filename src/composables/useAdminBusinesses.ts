import { computed, onUnmounted, reactive, ref, watch } from 'vue'

import { adminBusinessService } from '@/services'
import { useAdminBusinessesStore } from '@/stores'
import type {
  AdminAuditLogEntry,
  AdminBusinessDetail,
  AdminBusinessSummary,
  ApiError,
  ID,
  PaginationMeta,
  SubscriptionStatus
} from '@/types'

import { usePagination } from './usePagination'
import { useToast } from './useToast'

const SEARCH_DEBOUNCE_MS = 350

interface AdminBusinessFiltersState {
  search: string
  subscriptionStatus: SubscriptionStatus | ''
  planId: string
  dateFrom: string
  dateTo: string
  minRevenue: string
  maxRevenue: string
}

/**
 * Orchestre la liste des commerces : recherche, filtres avances (statut,
 * plan, periode d'inscription, chiffre d'affaires facture), pagination
 * serveur, selection multiple et actions groupees (suspendre/reactiver/
 * exporter).
 */
export function useAdminBusinesses() {
  const store = useAdminBusinessesStore()
  const toast = useToast()
  const pagination = usePagination(10)

  const filters = reactive<AdminBusinessFiltersState>({
    search: '',
    subscriptionStatus: '',
    planId: '',
    dateFrom: '',
    dateTo: '',
    minRevenue: '',
    maxRevenue: ''
  })

  const selectedIds = ref<Set<ID>>(new Set())
  const isBulkActing = ref(false)

  async function load(): Promise<void> {
    await store.fetchBusinesses({
      page: pagination.page.value,
      perPage: pagination.perPage.value,
      search: filters.search.trim() || undefined,
      subscriptionStatus: filters.subscriptionStatus || undefined,
      planId: filters.planId || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      minRevenue: filters.minRevenue ? Number(filters.minRevenue) : undefined,
      maxRevenue: filters.maxRevenue ? Number(filters.maxRevenue) : undefined
    })
    if (store.status === 'success') {
      pagination.applyMeta(store.meta)
    }
    selectedIds.value = new Set()
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
    if (status === filters.subscriptionStatus) return
    filters.subscriptionStatus = status
    pagination.goToPage(1)
    void load()
  }

  function setPlanFilter(planId: string): void {
    if (planId === filters.planId) return
    filters.planId = planId
    pagination.goToPage(1)
    void load()
  }

  function applyDateAndRevenueFilters(): void {
    pagination.goToPage(1)
    void load()
  }

  function resetFilters(): void {
    filters.search = ''
    filters.subscriptionStatus = ''
    filters.planId = ''
    filters.dateFrom = ''
    filters.dateTo = ''
    filters.minRevenue = ''
    filters.maxRevenue = ''
    pagination.goToPage(1)
    void load()
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(
    () => filters.search,
    () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        pagination.goToPage(1)
        void load()
      }, SEARCH_DEBOUNCE_MS)
    }
  )
  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  async function loadStats(): Promise<void> {
    await store.fetchStats()
  }

  // --- Selection multiple / actions groupees --------------------------------

  function toggleSelection(id: ID): void {
    const next = new Set(selectedIds.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    selectedIds.value = next
  }

  function toggleSelectAll(): void {
    selectedIds.value =
      selectedIds.value.size === store.items.length
        ? new Set()
        : new Set(store.items.map((b) => b.id))
  }

  function clearSelection(): void {
    selectedIds.value = new Set()
  }

  const selectedBusinesses = computed<AdminBusinessSummary[]>(() =>
    store.items.filter((b) => selectedIds.value.has(b.id))
  )

  /** Suspend ou reactive tous les commerces selectionnes, un par un (le mock-server n'a pas de route de lot). */
  async function bulkSetSuspended(isSuspended: boolean): Promise<void> {
    if (selectedIds.value.size === 0) return
    isBulkActing.value = true
    try {
      const ids = Array.from(selectedIds.value)
      await Promise.all(ids.map((id) => store.updateBusinessStatus(id, { isSuspended })))
      toast.success(
        isSuspended
          ? `${ids.length} commerce(s) suspendu(s).`
          : `${ids.length} commerce(s) reactive(s).`
      )
      await load()
    } catch (err) {
      toast.error((err as ApiError).message)
    } finally {
      isBulkActing.value = false
    }
  }

  return {
    store,
    filters,
    pagination,
    selectedIds,
    selectedBusinesses,
    isBulkActing,
    load,
    goToPage,
    nextPage,
    prevPage,
    setStatusFilter,
    setPlanFilter,
    applyDateAndRevenueFilters,
    resetFilters,
    loadStats,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    bulkSetSuspended
  }
}

/** Orchestre le detail d'un commerce : chargement, suspension/reactivation, changement de plan, suppression, apercu, journal d'audit. */
export function useAdminBusinessDetail(id: ID) {
  const store = useAdminBusinessesStore()
  const toast = useToast()

  const business = ref<AdminBusinessDetail | null>(null)
  const isLoading = ref(false)
  const loadError = ref<ApiError | null>(null)
  const isMutating = ref(false)
  const isDeleting = ref(false)
  const isImpersonating = ref(false)

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

  /** Applique une remise administrative a l'abonnement (distincte du code promo self-service). */
  async function applyDiscount(discountPercent: number): Promise<boolean> {
    isMutating.value = true
    try {
      business.value = await adminBusinessService.applyDiscount(id, { discountPercent })
      toast.success('Remise appliquee.')
      void loadAuditLog()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isMutating.value = false
    }
  }

  /** Suppression definitive : reservee a un usage avec confirmation explicite (voir `DeleteBusinessDialog.vue`). */
  async function removeBusiness(confirmName: string): Promise<ApiError | null> {
    isDeleting.value = true
    try {
      await store.removeBusiness(id, confirmName)
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isDeleting.value = false
    }
  }

  /** Ouvre le mode "apercu" du commerce dans un nouvel onglet. */
  async function openPreview(): Promise<void> {
    isImpersonating.value = true
    try {
      const { ticket } = await store.impersonateBusiness(id)
      window.open(`/apercu/${ticket}`, '_blank', 'noopener')
    } catch (err) {
      toast.error((err as ApiError).message)
    } finally {
      isImpersonating.value = false
    }
  }

  return {
    business,
    isLoading,
    loadError,
    isMutating,
    isDeleting,
    isImpersonating,
    auditLog,
    auditLogMeta,
    isLoadingAuditLog,
    load,
    loadAuditLog,
    toggleSuspension,
    changePlan,
    applyDiscount,
    removeBusiness,
    openPreview
  }
}
