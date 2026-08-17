import { onUnmounted, ref, watch } from 'vue'

import { useClientsStore } from '@/stores'
import type { ApiError, Client, CreateClientPayload, ID, UpdateClientPayload } from '@/types'

import { usePagination } from './usePagination'
import { useToast } from './useToast'

const SEARCH_DEBOUNCE_MS = 350

/**
 * Orchestre la liste des clients : recherche debouncee, pagination
 * serveur, et actions CRUD avec notifications. S'appuie sur
 * `clients.store.ts` pour l'etat/les appels API et sur `usePagination`
 * pour la logique de pagination generique (pas de duplication).
 */
export function useClients() {
  const store = useClientsStore()
  const toast = useToast()
  const pagination = usePagination(10)

  const search = ref('')
  const isSubmitting = ref(false)
  const isDeleting = ref(false)

  async function load(): Promise<void> {
    await store.fetchClients({
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

  async function submitCreate(payload: CreateClientPayload): Promise<ApiError | null> {
    isSubmitting.value = true
    try {
      await store.createClient(payload)
      toast.success('Client cree avec succes.')
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

  async function submitUpdate(id: ID, payload: UpdateClientPayload): Promise<ApiError | null> {
    isSubmitting.value = true
    try {
      await store.updateClient(id, payload)
      toast.success('Client modifie avec succes.')
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

  async function removeClient(client: Client): Promise<boolean> {
    isDeleting.value = true
    try {
      await store.deleteClient(client.id)
      toast.success(`${client.firstName} ${client.lastName} a ete supprime.`)

      // Si on vide la derniere entree d'une page > 1, on recule d'une page
      // plutot que d'afficher une page vide.
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
    removeClient
  }
}
