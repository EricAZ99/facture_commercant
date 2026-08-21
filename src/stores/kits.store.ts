import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { kitService } from '@/services'
import type {
  ApiError,
  AsyncStatus,
  CreateKitPayload,
  ID,
  ListQueryParams,
  PaginationMeta,
  ProductKit,
  UpdateKitPayload
} from '@/types'

const EMPTY_META: PaginationMeta = { page: 1, perPage: 10, total: 0, totalPages: 1 }

/** Etat global de la liste des kits (produits groupes), meme pattern que `products.store.ts`. */
export const useKitsStore = defineStore('kits', () => {
  const items = ref<ProductKit[]>([])
  const meta = ref<PaginationMeta>(EMPTY_META)
  const status = ref<AsyncStatus>('idle')
  const error = ref<ApiError | null>(null)

  const isLoading = computed(() => status.value === 'loading')

  async function fetchKits(params?: ListQueryParams): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      const response = await kitService.list(params)
      items.value = response.data
      meta.value = response.meta
      status.value = 'success'
    } catch (err) {
      error.value = err as ApiError
      status.value = 'error'
    }
  }

  function createKit(payload: CreateKitPayload): Promise<ProductKit> {
    return kitService.create(payload)
  }

  function updateKit(id: ID, payload: UpdateKitPayload): Promise<ProductKit> {
    return kitService.update(id, payload)
  }

  function deleteKit(id: ID): Promise<void> {
    return kitService.remove(id)
  }

  return {
    items,
    meta,
    status,
    error,
    isLoading,
    fetchKits,
    createKit,
    updateKit,
    deleteKit
  }
})
