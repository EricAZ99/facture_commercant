import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { quoteService } from '@/services'
import type {
  ApiError,
  AsyncStatus,
  CreateQuotePayload,
  ID,
  PaginationMeta,
  Quote,
  QuoteListParams,
  UpdateQuotePayload
} from '@/types'

const EMPTY_META: PaginationMeta = { page: 1, perPage: 10, total: 0, totalPages: 1 }

/**
 * Etat global de la liste des devis, sur le meme modele que
 * `useInvoicesStore` : les mutations appellent simplement le service, c'est
 * a l'appelant (`useQuotes`) de decider quand rafraichir la liste.
 */
export const useQuotesStore = defineStore('quotes', () => {
  const items = ref<Quote[]>([])
  const meta = ref<PaginationMeta>(EMPTY_META)
  const status = ref<AsyncStatus>('idle')
  const error = ref<ApiError | null>(null)

  const isLoading = computed(() => status.value === 'loading')

  async function fetchQuotes(params?: QuoteListParams): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      const response = await quoteService.list(params)
      items.value = response.data
      meta.value = response.meta
      status.value = 'success'
    } catch (err) {
      error.value = err as ApiError
      status.value = 'error'
    }
  }

  function createQuote(payload: CreateQuotePayload): Promise<Quote> {
    return quoteService.create(payload)
  }

  function updateQuote(id: ID, payload: UpdateQuotePayload): Promise<Quote> {
    return quoteService.update(id, payload)
  }

  return {
    items,
    meta,
    status,
    error,
    isLoading,
    fetchQuotes,
    createQuote,
    updateQuote
  }
})
