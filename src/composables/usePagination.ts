import { computed, ref } from 'vue'

import type { PaginationMeta } from '@/types'

/** Gestion generique de la pagination pour les pages de listing. */
export function usePagination(initialPerPage = 20) {
  const page = ref(1)
  const perPage = ref(initialPerPage)
  const total = ref(0)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)))
  const hasNextPage = computed(() => page.value < totalPages.value)
  const hasPrevPage = computed(() => page.value > 1)

  function applyMeta(meta: PaginationMeta): void {
    page.value = meta.page
    perPage.value = meta.perPage
    total.value = meta.total
  }

  function nextPage(): void {
    if (hasNextPage.value) page.value += 1
  }

  function prevPage(): void {
    if (hasPrevPage.value) page.value -= 1
  }

  function goToPage(target: number): void {
    page.value = Math.min(Math.max(1, target), totalPages.value)
  }

  return {
    page,
    perPage,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    applyMeta,
    nextPage,
    prevPage,
    goToPage
  }
}
