import { onUnmounted, ref, watch } from 'vue'

import { useInvoicesStore, useKitsStore } from '@/stores'
import type { ApiError, CreateKitPayload, ID, ProductKit, UpdateKitPayload } from '@/types'

import { usePagination } from './usePagination'
import { useToast } from './useToast'

const SEARCH_DEBOUNCE_MS = 350

/**
 * Orchestre le catalogue de kits (produits groupes) : recherche debouncee,
 * pagination serveur, et actions CRUD avec notifications. Meme pattern que
 * `useProducts`, sur `kits.store.ts`.
 */
export function useKits() {
  const store = useKitsStore()
  const toast = useToast()
  const pagination = usePagination(10)

  const search = ref('')
  const isSubmitting = ref(false)
  const isDeleting = ref(false)

  async function load(): Promise<void> {
    await store.fetchKits({
      page: pagination.page.value,
      perPage: pagination.perPage.value,
      search: search.value.trim() || undefined
    })
    if (store.status === 'success') pagination.applyMeta(store.meta)
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

  async function submitCreate(payload: CreateKitPayload): Promise<ApiError | null> {
    isSubmitting.value = true
    try {
      await store.createKit(payload)
      toast.success('Kit cree avec succes.')
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

  async function submitUpdate(id: ID, payload: UpdateKitPayload): Promise<ApiError | null> {
    isSubmitting.value = true
    try {
      await store.updateKit(id, payload)
      toast.success('Kit modifie avec succes.')
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

  async function removeKit(kit: ProductKit): Promise<boolean> {
    isDeleting.value = true
    try {
      await store.deleteKit(kit.id)
      toast.success(`${kit.name} a ete supprime.`)
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
    removeKit
  }
}

/**
 * Cree une facture brouillon a partir de la composition d'un kit (une ligne
 * par produit du kit, avec la quantite prevue). Construit le payload
 * cote client a partir de donnees deja connues (comme `duplicateInvoice`
 * dans `useInvoices.ts`) : ne touche a aucune route ni au schema du module
 * Factures, deja verifie ailleurs.
 */
export function useKitInvoicing() {
  const invoicesStore = useInvoicesStore()
  const toast = useToast()

  const isCreating = ref(false)

  async function createInvoiceFromKit(kit: ProductKit, clientId: ID) {
    isCreating.value = true
    try {
      const invoice = await invoicesStore.createInvoice({
        clientId,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date().toISOString().slice(0, 10),
        items: kit.items.map((item) => ({
          productId: item.productId,
          description: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate
        })),
        discountType: 'percentage',
        discountValue: 0,
        notes: `Facture generee depuis le kit "${kit.name}".`,
        status: 'draft'
      })
      toast.success(`Facture ${invoice.number} creee depuis le kit (brouillon).`)
      return invoice
    } catch (err) {
      toast.error((err as ApiError).message)
      return null
    } finally {
      isCreating.value = false
    }
  }

  return { isCreating, createInvoiceFromKit }
}
