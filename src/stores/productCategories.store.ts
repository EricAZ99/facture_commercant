import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { productCategoryService } from '@/services'
import type {
  ApiError,
  AsyncStatus,
  CreateProductCategoryPayload,
  ID,
  ProductCategory,
  UpdateProductCategoryPayload
} from '@/types'

/**
 * Etat global des categories de produits (petite liste, chargee entierement
 * et partagee entre le formulaire produit et le gestionnaire de categories,
 * plutot que paginee comme les produits eux-memes).
 */
export const useProductCategoriesStore = defineStore('productCategories', () => {
  const items = ref<ProductCategory[]>([])
  const status = ref<AsyncStatus>('idle')
  const error = ref<ApiError | null>(null)

  const isLoading = computed(() => status.value === 'loading')

  async function fetchCategories(): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      items.value = await productCategoryService.list()
      status.value = 'success'
    } catch (err) {
      error.value = err as ApiError
      status.value = 'error'
    }
  }

  function createCategory(payload: CreateProductCategoryPayload): Promise<ProductCategory> {
    return productCategoryService.create(payload)
  }

  function updateCategory(id: ID, payload: UpdateProductCategoryPayload): Promise<ProductCategory> {
    return productCategoryService.update(id, payload)
  }

  function deleteCategory(id: ID): Promise<void> {
    return productCategoryService.remove(id)
  }

  return {
    items,
    status,
    error,
    isLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  }
})
