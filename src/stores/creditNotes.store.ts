import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { creditNoteService } from '@/services'
import type {
  ApiError,
  AsyncStatus,
  CreateCreditNotePayload,
  CreditNote,
  ID,
  ListQueryParams,
  PaginationMeta
} from '@/types'

const EMPTY_META: PaginationMeta = { page: 1, perPage: 10, total: 0, totalPages: 1 }

/** Etat global de la liste des avoirs, sur le meme modele que `useInvoicesStore`. */
export const useCreditNotesStore = defineStore('creditNotes', () => {
  const items = ref<CreditNote[]>([])
  const meta = ref<PaginationMeta>(EMPTY_META)
  const status = ref<AsyncStatus>('idle')
  const error = ref<ApiError | null>(null)

  const isLoading = computed(() => status.value === 'loading')

  async function fetchCreditNotes(
    params?: ListQueryParams & { clientId?: ID; invoiceId?: ID }
  ): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      const response = await creditNoteService.list(params)
      items.value = response.data
      meta.value = response.meta
      status.value = 'success'
    } catch (err) {
      error.value = err as ApiError
      status.value = 'error'
    }
  }

  function createCreditNote(payload: CreateCreditNotePayload): Promise<CreditNote> {
    return creditNoteService.create(payload)
  }

  return {
    items,
    meta,
    status,
    error,
    isLoading,
    fetchCreditNotes,
    createCreditNote
  }
})
