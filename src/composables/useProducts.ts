import { onUnmounted, ref, watch } from 'vue'

import { productService } from '@/services'
import { useProductsStore } from '@/stores'
import type {
  ApiError,
  CreateProductPayload,
  ID,
  Product,
  ProductImportPayload,
  ProductImportResult,
  ProductStockMovement,
  UpdateProductPayload
} from '@/types'
import { downloadCsv } from '@/utils/csv'
import { parseProductsCsv, productsToCsv } from '@/utils/productCsv'

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
  /** Filtre optionnel par categorie (inclut ses sous-categories cote backend). */
  const categoryFilter = ref<ID | ''>('')
  const isSubmitting = ref(false)
  const isDeleting = ref(false)
  const isExporting = ref(false)
  const isImporting = ref(false)

  async function load(): Promise<void> {
    await store.fetchProducts({
      page: pagination.page.value,
      perPage: pagination.perPage.value,
      search: search.value.trim() || undefined,
      categoryId: categoryFilter.value || undefined
    })
    if (store.status === 'success') {
      pagination.applyMeta(store.meta)
    }
  }

  watch(categoryFilter, () => {
    pagination.goToPage(1)
    void load()
  })

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

  /** Exporte en CSV tous les produits correspondant a la recherche/au filtre categorie en cours. */
  async function exportProducts(): Promise<void> {
    isExporting.value = true
    try {
      const response = await productService.list({
        search: search.value.trim() || undefined,
        categoryId: categoryFilter.value || undefined,
        page: 1,
        perPage: 10000
      })
      downloadCsv(
        `produits-${new Date().toISOString().slice(0, 10)}.csv`,
        productsToCsv(response.data)
      )
    } catch (err) {
      toast.error((err as ApiError).message)
    } finally {
      isExporting.value = false
    }
  }

  /** Parse et importe un fichier CSV de produits ; renvoie le bilan (succes/erreurs par ligne). */
  async function importProductsFromCsv(fileText: string): Promise<ProductImportResult | null> {
    const { products, errors: parseErrors } = parseProductsCsv(fileText)
    if (products.length === 0) {
      toast.error('Aucune ligne valide trouvee dans le fichier.')
      return { createdCount: 0, errors: parseErrors }
    }

    isImporting.value = true
    try {
      const result = await productService.importMany(
        products.map((p): ProductImportPayload => p.payload)
      )
      const allErrors = [...parseErrors, ...result.errors]
      if (result.createdCount > 0) {
        toast.success(`${result.createdCount} produit(s) importe(s) avec succes.`)
        await load()
      }
      if (allErrors.length > 0) {
        toast.error(`${allErrors.length} ligne(s) n'ont pas pu etre importees.`)
      }
      return { createdCount: result.createdCount, errors: allErrors }
    } catch (err) {
      toast.error((err as ApiError).message)
      return null
    } finally {
      isImporting.value = false
    }
  }

  return {
    store,
    search,
    categoryFilter,
    pagination,
    isSubmitting,
    isDeleting,
    isExporting,
    isImporting,
    load,
    goToPage,
    nextPage,
    prevPage,
    submitCreate,
    submitUpdate,
    removeProduct,
    exportProducts,
    importProductsFromCsv
  }
}

/** Orchestre la photo et le stock (ajustement + historique) d'un produit donne. */
export function useProductStock(id: ID) {
  const toast = useToast()

  const isUploadingImage = ref(false)
  const isAdjustingStock = ref(false)
  const movements = ref<ProductStockMovement[]>([])
  const isLoadingMovements = ref(false)

  async function uploadImage(file: File): Promise<Product | null> {
    isUploadingImage.value = true
    try {
      const product = await productService.uploadImage(id, file)
      toast.success('Photo mise a jour avec succes.')
      return product
    } catch (err) {
      toast.error((err as ApiError).message)
      return null
    } finally {
      isUploadingImage.value = false
    }
  }

  async function loadMovements(): Promise<void> {
    isLoadingMovements.value = true
    try {
      const response = await productService.getStockMovements(id, { page: 1, perPage: 20 })
      movements.value = response.data
    } finally {
      isLoadingMovements.value = false
    }
  }

  async function adjustStock(delta: number, reason: string): Promise<Product | null> {
    isAdjustingStock.value = true
    try {
      const product = await productService.adjustStock(id, { delta, reason })
      toast.success('Stock mis a jour avec succes.')
      void loadMovements()
      return product
    } catch (err) {
      toast.error((err as ApiError).message)
      return null
    } finally {
      isAdjustingStock.value = false
    }
  }

  return {
    isUploadingImage,
    isAdjustingStock,
    movements,
    isLoadingMovements,
    uploadImage,
    loadMovements,
    adjustStock
  }
}
