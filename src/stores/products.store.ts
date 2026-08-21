import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { productService, type ProductListParams } from '@/services'
import type {
  ApiError,
  AsyncStatus,
  CreateProductPayload,
  ID,
  PaginationMeta,
  Product,
  UpdateProductPayload
} from '@/types'

const EMPTY_META: PaginationMeta = { page: 1, perPage: 10, total: 0, totalPages: 1 }

/**
 * Etat global de la liste des produits/services (page courante, pagination,
 * statut). Les mutations (create/update/delete) se contentent d'appeler le
 * service et de renvoyer le resultat : c'est a l'appelant (voir
 * `useProducts`) de decider quand rafraichir la liste.
 */
export const useProductsStore = defineStore('products', () => {
  const items = ref<Product[]>([])
  const meta = ref<PaginationMeta>(EMPTY_META)
  const status = ref<AsyncStatus>('idle')
  const error = ref<ApiError | null>(null)

  const isLoading = computed(() => status.value === 'loading')

  async function fetchProducts(params?: ProductListParams): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      const response = await productService.list(params)
      items.value = response.data
      meta.value = response.meta
      status.value = 'success'
    } catch (err) {
      error.value = err as ApiError
      status.value = 'error'
    }
  }

  function createProduct(payload: CreateProductPayload): Promise<Product> {
    return productService.create(payload)
  }

  function updateProduct(id: ID, payload: UpdateProductPayload): Promise<Product> {
    return productService.update(id, payload)
  }

  function deleteProduct(id: ID): Promise<void> {
    return productService.remove(id)
  }

  return {
    items,
    meta,
    status,
    error,
    isLoading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  }
})
