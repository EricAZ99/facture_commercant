import { computed } from 'vue'

import { useProductCategoriesStore } from '@/stores'
import type {
  ApiError,
  CreateProductCategoryPayload,
  ID,
  UpdateProductCategoryPayload
} from '@/types'
import { buildCategoryOptions } from '@/utils/categoryTree'

import { useToast } from './useToast'

/**
 * Orchestre les categories de produits (arborescence) : chargement,
 * creation/renommage/deplacement, suppression avec garde-fou serveur
 * (categorie utilisee par une sous-categorie ou un produit). Partage un seul
 * etat (`productCategories.store.ts`) entre le formulaire produit et le
 * gestionnaire de categories, pour rester synchronise sans rechargement
 * redondant.
 */
export function useProductCategories() {
  const store = useProductCategoriesStore()
  const toast = useToast()

  const options = computed(() => buildCategoryOptions(store.items))

  async function ensureLoaded(): Promise<void> {
    if (store.status === 'idle') await store.fetchCategories()
  }

  async function submitCreate(payload: CreateProductCategoryPayload): Promise<ApiError | null> {
    try {
      await store.createCategory(payload)
      toast.success('Categorie creee avec succes.')
      await store.fetchCategories()
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    }
  }

  async function submitUpdate(
    id: ID,
    payload: UpdateProductCategoryPayload
  ): Promise<ApiError | null> {
    try {
      await store.updateCategory(id, payload)
      toast.success('Categorie modifiee avec succes.')
      await store.fetchCategories()
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    }
  }

  async function removeCategory(id: ID): Promise<boolean> {
    try {
      await store.deleteCategory(id)
      toast.success('Categorie supprimee.')
      await store.fetchCategories()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    }
  }

  return {
    store,
    options,
    ensureLoaded,
    submitCreate,
    submitUpdate,
    removeCategory
  }
}
