import { ref } from 'vue'

import { adminBusinessService } from '@/services'
import type { AdminAuditLogEntry, PaginationMeta } from '@/types'

const EMPTY_META: PaginationMeta = { page: 1, perPage: 20, total: 0, totalPages: 1 }

/** Journal d'audit global de la plateforme (toutes actions admin, tous commerces confondus). */
export function useAdminAuditLog() {
  const items = ref<AdminAuditLogEntry[]>([])
  const meta = ref<PaginationMeta>(EMPTY_META)
  const isLoading = ref(false)
  const page = ref(1)

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      const response = await adminBusinessService.getGlobalAuditLog({
        page: page.value,
        perPage: 20
      })
      items.value = response.data
      meta.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  function goToPage(target: number): void {
    if (target === page.value) return
    page.value = target
    void load()
  }

  return { items, meta, isLoading, page, load, goToPage }
}
