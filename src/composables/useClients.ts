import { onUnmounted, ref, watch } from 'vue'

import { clientService } from '@/services'
import { useClientsStore } from '@/stores'
import type {
  ApiError,
  Client,
  ClientImportResult,
  CreateClientPayload,
  ID,
  UpdateClientPayload
} from '@/types'
import { clientsToCsv, parseClientsCsv } from '@/utils/clientCsv'
import { downloadCsv } from '@/utils/csv'

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
  const isExporting = ref(false)
  const isImporting = ref(false)
  const isMerging = ref(false)
  const isBulkDeleting = ref(false)

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

  /** Exporte en CSV une selection de clients par leurs IDs. */
  async function exportSelectedClients(ids: ID[]): Promise<void> {
    isExporting.value = true
    try {
      const response = await clientService.list({ page: 1, perPage: 10000 })
      const selected = response.data.filter((c) => ids.includes(c.id))
      const csv = clientsToCsv(selected)
      downloadCsv(`clients-selection-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    } catch (err) {
      toast.error((err as ApiError).message)
    } finally {
      isExporting.value = false
    }
  }

  /** Supprime plusieurs clients en une seule operation. */
  async function bulkDeleteClients(ids: ID[]): Promise<boolean> {
    isBulkDeleting.value = true
    try {
      await clientService.deleteMany(ids)
      toast.success(`${ids.length} client(s) supprime(s).`)
      if (store.items.length <= ids.length && pagination.page.value > 1) {
        pagination.goToPage(pagination.page.value - 1)
      }
      await load()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isBulkDeleting.value = false
    }
  }

  /** Exporte en CSV tous les clients correspondant a la recherche en cours (pas seulement la page affichee). */
  async function exportClients(): Promise<void> {
    isExporting.value = true
    try {
      const response = await clientService.list({
        search: search.value.trim() || undefined,
        page: 1,
        perPage: 10000
      })
      const csv = clientsToCsv(response.data)
      downloadCsv(`clients-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    } catch (err) {
      toast.error((err as ApiError).message)
    } finally {
      isExporting.value = false
    }
  }

  /** Parse et importe un fichier CSV de clients ; renvoie le bilan (succes/erreurs par ligne). */
  async function importClientsFromCsv(fileText: string): Promise<ClientImportResult | null> {
    const { clients, errors: parseErrors } = parseClientsCsv(fileText)
    if (clients.length === 0) {
      toast.error('Aucune ligne valide trouvee dans le fichier.')
      return { createdCount: 0, errors: parseErrors }
    }

    isImporting.value = true
    try {
      const result = await clientService.importMany(clients.map((c) => c.payload))
      const allErrors = [...parseErrors, ...result.errors]
      if (result.createdCount > 0) {
        toast.success(`${result.createdCount} client(s) importe(s) avec succes.`)
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

  /** Fusionne deux fiches en doublon : `duplicate` est supprime, ses factures/paiements rattaches a `primary`. */
  async function mergeClients(primary: Client, duplicate: Client): Promise<boolean> {
    isMerging.value = true
    try {
      await clientService.merge({ primaryId: primary.id, duplicateId: duplicate.id })
      toast.success(
        `${duplicate.firstName} ${duplicate.lastName} a ete fusionne avec ${primary.firstName} ${primary.lastName}.`
      )
      await load()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isMerging.value = false
    }
  }

  return {
    store,
    search,
    pagination,
    isSubmitting,
    isDeleting,
    isExporting,
    isImporting,
    isMerging,
    isBulkDeleting,
    load,
    goToPage,
    nextPage,
    prevPage,
    submitCreate,
    submitUpdate,
    removeClient,
    exportClients,
    exportSelectedClients,
    bulkDeleteClients,
    importClientsFromCsv,
    mergeClients
  }
}
