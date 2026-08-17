import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { invoiceService } from '@/services'
import type {
  ApiError,
  AsyncStatus,
  CreateInvoicePayload,
  ID,
  Invoice,
  InvoiceListParams,
  PaginationMeta,
  UpdateInvoicePayload
} from '@/types'

const EMPTY_META: PaginationMeta = { page: 1, perPage: 10, total: 0, totalPages: 1 }

/**
 * Etat global de la liste des factures (page courante, filtres appliques,
 * pagination, statut). Les mutations se contentent d'appeler le service et
 * de renvoyer le resultat : c'est a l'appelant (voir `useInvoices`) de
 * decider quand rafraichir la liste.
 */
export const useInvoicesStore = defineStore('invoices', () => {
  const items = ref<Invoice[]>([])
  const meta = ref<PaginationMeta>(EMPTY_META)
  const status = ref<AsyncStatus>('idle')
  const error = ref<ApiError | null>(null)

  const isLoading = computed(() => status.value === 'loading')

  async function fetchInvoices(params?: InvoiceListParams): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      const response = await invoiceService.list(params)
      items.value = response.data
      meta.value = response.meta
      status.value = 'success'
    } catch (err) {
      error.value = err as ApiError
      status.value = 'error'
    }
  }

  function updateInvoice(id: ID, payload: UpdateInvoicePayload): Promise<Invoice> {
    return invoiceService.update(id, payload)
  }

  /** Cree une nouvelle facture a partir d'un payload (utilise pour la duplication). */
  function createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
    return invoiceService.create(payload)
  }

  return {
    items,
    meta,
    status,
    error,
    isLoading,
    fetchInvoices,
    updateInvoice,
    createInvoice
  }
})
