import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'

import { clientService, quoteService } from '@/services'
import { useQuotesStore } from '@/stores'
import type { ApiError, Client, Invoice, Quote, QuoteStatus } from '@/types'

import { usePagination } from './usePagination'
import { useToast } from './useToast'

const SEARCH_DEBOUNCE_MS = 350
const PER_PAGE = 10

interface QuoteFiltersState {
  search: string
  status: QuoteStatus | ''
  clientId: string
  page: number
}

function toQueryString(value: LocationQuery[string] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

/**
 * Actions reutilisables sur un devis existant (supprimer, convertir en
 * facture), independantes de la liste/des filtres : utilisables aussi bien
 * depuis la liste que depuis la page de detail.
 */
export function useQuoteActions() {
  const toast = useToast()

  const isRemoving = ref(false)
  const isConverting = ref(false)

  async function removeQuote(quote: Quote): Promise<boolean> {
    isRemoving.value = true
    try {
      await quoteService.remove(quote.id)
      toast.success(`Devis ${quote.number} supprime.`)
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isRemoving.value = false
    }
  }

  /** Convertit le devis en facture et retourne la facture creee (pour redirection). */
  async function convertQuote(quote: Quote): Promise<Invoice | null> {
    isConverting.value = true
    try {
      const invoice = await quoteService.convert(quote.id)
      toast.success(`Devis ${quote.number} converti en facture ${invoice.number}.`)
      return invoice
    } catch (err) {
      toast.error((err as ApiError).message)
      return null
    } finally {
      isConverting.value = false
    }
  }

  return { isRemoving, isConverting, removeQuote, convertQuote }
}

/**
 * Liste des devis : filtres (recherche, statut, client) synchronises avec
 * les query parameters de l'URL, pagination serveur. Meme architecture que
 * `useInvoices` (URL = source de verite).
 */
export function useQuotes() {
  const route = useRoute()
  const router = useRouter()
  const store = useQuotesStore()
  const pagination = usePagination(PER_PAGE)
  const actions = useQuoteActions()

  const filters = reactive<QuoteFiltersState>({
    search: '',
    status: '',
    clientId: '',
    page: 1
  })
  const selectedClient = ref<Client | null>(null)

  function buildQuery(): LocationQueryRaw {
    const query: LocationQueryRaw = {}
    if (filters.search) query.search = filters.search
    if (filters.status) query.status = filters.status
    if (filters.clientId) query.clientId = filters.clientId
    if (filters.page > 1) query.page = String(filters.page)
    return query
  }

  function pushToUrl(): void {
    void router.replace({ query: buildQuery() })
  }

  async function load(): Promise<void> {
    await store.fetchQuotes({
      page: filters.page,
      perPage: PER_PAGE,
      search: filters.search || undefined,
      status: filters.status || undefined,
      clientId: filters.clientId || undefined
    })
    if (store.status === 'success') pagination.applyMeta(store.meta)
  }

  watch(
    () => route.query,
    (query) => {
      filters.search = toQueryString(query.search)
      filters.status = toQueryString(query.status) as QuoteStatus | ''
      filters.clientId = toQueryString(query.clientId)
      filters.page = Number(query.page) || 1
      void load()
    },
    { immediate: true }
  )

  watch(
    () => filters.clientId,
    async (id) => {
      if (!id) {
        selectedClient.value = null
        return
      }
      if (selectedClient.value?.id === id) return
      try {
        selectedClient.value = await clientService.getById(id)
      } catch {
        selectedClient.value = null
      }
    },
    { immediate: true }
  )

  let searchDebounce: ReturnType<typeof setTimeout> | undefined
  watch(
    () => filters.search,
    () => {
      if (searchDebounce) clearTimeout(searchDebounce)
      searchDebounce = setTimeout(() => {
        filters.page = 1
        pushToUrl()
      }, SEARCH_DEBOUNCE_MS)
    }
  )

  watch(
    () => [filters.status, filters.clientId],
    () => {
      filters.page = 1
      pushToUrl()
    }
  )

  function setClientFilter(client: Client | null): void {
    selectedClient.value = client
    filters.clientId = client?.id ?? ''
  }

  function resetFilters(): void {
    if (searchDebounce) clearTimeout(searchDebounce)
    filters.search = ''
    filters.status = ''
    filters.clientId = ''
    filters.page = 1
    pushToUrl()
  }

  function goToPage(target: number): void {
    if (target === filters.page) return
    filters.page = target
    pushToUrl()
  }

  function nextPage(): void {
    if (!pagination.hasNextPage.value) return
    goToPage(filters.page + 1)
  }

  function prevPage(): void {
    if (!pagination.hasPrevPage.value) return
    goToPage(filters.page - 1)
  }

  return {
    store,
    filters,
    selectedClient,
    pagination,
    load,
    goToPage,
    nextPage,
    prevPage,
    setClientFilter,
    resetFilters,
    ...actions
  }
}
