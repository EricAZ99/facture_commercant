import { onUnmounted, ref, watch } from 'vue'

import { useProductsStore } from '@/stores'
import type { ApiError, CreateProductPayload, ID, Product, UpdateProductPayload } from '@/types'

import { usePagination } from './usePagination'
import { useToast } from './useToast'

const SEARCH_DEBOUNCE_MS = 350

/**
 * Orchestre le catalogue produits/services : recherche debouncee,
 * pagination serveur, et actions CRUD avec notifications. S'appuie sur
 * `products.store.ts` pour l'etat/les appels API et sur `usePagination`
 * pour la logique de pagination generique.
 */
export function useProducts() {
  const store = useProductsStore()
  const toast = useToast()
  const pagination = usePagination(10)

  const search = ref('')
  const isSubmitting = ref(false)
  const isDeleting = ref(false)

  async function load(): Promise<void> {
    await store.fetchProducts({
      page: pagination.page.value,
      perPage: pagination.perPage.value,
      search: search.value.trim() || undefined
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

  // Debounce de la recherche : evite une requete a chaque frappe.
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

  async function submitCreate(payload: CreateProductPayload): Promise<ApiError | null> {
    isSubmitting.value = true
    try {
      await store.createProduct(payload)
      toast.success('Produit cree avec succes.')
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

  async function submitUpdate(id: ID, payload: UpdateProductPayload): Promise<ApiError | null> {
    isSubmitting.value = true
    try {
      await store.updateProduct(id, payload)
      toast.success('Produit modifie avec succes.')
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

  async function removeProduct(product: Product): Promise<boolean> {
    isDeleting.value = true
    try {
      await store.deleteProduct(product.id)
      toast.success(`${product.name} a ete supprime.`)

      // Etat local mis a jour par un refetch cible (pas de rechargement de
      // toute la page) ; on recule d'une page si on vient de vider la
      // derniere entree d'une page > 1.
      if (store.items.length === 1 && pagination.page.value > 1) {
        pagination.goToPage(pagination.page.value - 1)
      }
      await load()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isDeleting.value = false
    }
  }

  return {
    store,
    search,
    pagination,
    isSubmitting,
    isDeleting,
    load,
    goToPage,
    nextPage,
    prevPage,
    submitCreate,
    submitUpdate,
    removeProduct
  }
}
