import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'

import { clientService, invoiceActions, invoiceService } from '@/services'
import { useAuthStore, useInvoicesStore } from '@/stores'
import type {
  ApiError,
  Client,
  CreateInvoicePayload,
  ID,
  Invoice,
  InvoiceAttachment,
  InvoiceStatus
} from '@/types'

import { defaultDueDate, defaultIssueDate } from './useInvoiceBuilder'
import { usePagination } from './usePagination'
import { useToast } from './useToast'

const SEARCH_DEBOUNCE_MS = 350
const PER_PAGE = 10

interface InvoiceFiltersState {
  search: string
  status: InvoiceStatus | ''
  clientId: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  page: number
}

function toQueryString(value: LocationQuery[string] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

/**
 * Message d'erreur adapte pour toute action liee au PDF officiel (telecharger,
 * ouvrir, imprimer, partager) : distingue une interruption reseau d'une
 * autre erreur, sans jamais pretendre avoir genere un document nous-memes.
 */
function documentErrorMessage(err: unknown): string {
  const apiError = err as Partial<ApiError>
  if (apiError.code === 'NETWORK_ERROR') {
    return 'Le telechargement a ete interrompu. Verifiez votre connexion et reessayez.'
  }
  return apiError.message || 'Une erreur est survenue.'
}

/**
 * Actions reutilisables sur une facture existante (annuler, dupliquer,
 * telecharger/ouvrir/imprimer le PDF officiel, partager, envoyer par email
 * ou WhatsApp), independantes de la liste/des filtres : utilisables aussi
 * bien depuis la liste que depuis la page de detail. Chaque action expose
 * son propre indicateur de chargement (`isXxx`) pour piloter loading/
 * succes/erreur au plus pres du bouton qui l'a declenchee.
 */
export function useInvoiceActions() {
  const store = useInvoicesStore()
  const authStore = useAuthStore()
  const toast = useToast()

  const isCancelling = ref(false)
  const isDuplicating = ref(false)
  const isDownloading = ref(false)
  const isOpeningPdf = ref(false)
  const isPrinting = ref(false)
  const isSharing = ref(false)
  const isSendingEmail = ref(false)
  const isSendingWhatsApp = ref(false)
  const isSendingReminder = ref(false)
  const isBulkDownloading = ref(false)
  const isBulkCancelling = ref(false)

  function currency(): string {
    return authStore.business?.currency ?? 'XOF'
  }

  async function cancelInvoice(invoice: Invoice): Promise<boolean> {
    isCancelling.value = true
    try {
      await store.updateInvoice(invoice.id, { status: 'cancelled' })
      toast.success(`Facture ${invoice.number} annulee.`)
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isCancelling.value = false
    }
  }

  /** Cree une nouvelle facture brouillon a partir des lignes d'une facture existante. */
  async function duplicateInvoice(invoice: Invoice): Promise<Invoice | null> {
    isDuplicating.value = true
    try {
      const payload: CreateInvoicePayload = {
        clientId: invoice.clientId,
        issueDate: defaultIssueDate(),
        dueDate: defaultDueDate(),
        items: invoice.items.map(({ productId, description, quantity, unitPrice, taxRate }) => ({
          productId,
          description,
          quantity,
          unitPrice,
          taxRate
        })),
        discountType: invoice.discountType,
        discountValue: invoice.discountValue,
        notes: invoice.notes,
        status: 'draft'
      }
      const created = await store.createInvoice(payload)
      toast.success(`Facture dupliquee sous ${created.number} (brouillon).`)
      return created
    } catch (err) {
      toast.error((err as ApiError).message)
      return null
    } finally {
      isDuplicating.value = false
    }
  }

  /** Telecharge le PDF officiel (jamais genere cote frontend, voir `invoiceDownloadService`). */
  async function downloadInvoice(invoice: Invoice): Promise<void> {
    isDownloading.value = true
    try {
      await invoiceActions.downloadInvoicePdf(invoice)
    } catch (err) {
      toast.error(documentErrorMessage(err))
    } finally {
      isDownloading.value = false
    }
  }

  /** Ouvre le PDF officiel dans un nouvel onglet. */
  async function openInvoicePdf(invoice: Invoice): Promise<void> {
    isOpeningPdf.value = true
    try {
      await invoiceActions.openInvoicePdf(invoice)
    } catch (err) {
      toast.error(documentErrorMessage(err))
    } finally {
      isOpeningPdf.value = false
    }
  }

  /** Imprime le PDF officiel (jamais la page HTML). */
  async function printInvoice(invoice: Invoice): Promise<void> {
    isPrinting.value = true
    try {
      await invoiceActions.printInvoicePdf(invoice)
    } catch (err) {
      toast.error(documentErrorMessage(err))
    } finally {
      isPrinting.value = false
    }
  }

  /** Partage natif (Web Share API) ; avertit si indisponible sur cet appareil. */
  async function shareInvoice(invoice: Invoice): Promise<void> {
    isSharing.value = true
    try {
      const shared = await invoiceActions.shareInvoice(invoice, currency())
      if (!shared) {
        toast.error("Le partage n'est pas disponible sur cet appareil. Utilisez Email ou WhatsApp.")
      }
    } catch (err) {
      toast.error(documentErrorMessage(err))
    } finally {
      isSharing.value = false
    }
  }

  /** Ouvre un brouillon d'email pre-rempli et telecharge le PDF a joindre manuellement. */
  async function sendInvoiceByEmail(invoice: Invoice): Promise<void> {
    isSendingEmail.value = true
    try {
      await invoiceActions.sendInvoiceByEmail(invoice, currency())
      toast.success('Client email ouvert. Le PDF a ete telecharge pour etre joint.')
    } catch (err) {
      toast.error(documentErrorMessage(err))
    } finally {
      isSendingEmail.value = false
    }
  }

  /** Ouvre WhatsApp avec un message pre-rempli et telecharge le PDF a joindre manuellement. */
  async function sendInvoiceByWhatsApp(invoice: Invoice): Promise<void> {
    isSendingWhatsApp.value = true
    try {
      await invoiceActions.sendInvoiceByWhatsApp(invoice, currency())
      toast.success('WhatsApp ouvert. Le PDF a ete telecharge pour etre joint.')
    } catch (err) {
      toast.error(documentErrorMessage(err))
    } finally {
      isSendingWhatsApp.value = false
    }
  }

  /**
   * Envoie un rappel ponctuel au client (mailto pre-rempli + PDF a joindre,
   * meme mecanisme que `sendInvoiceByEmail`) et enregistre l'envoi cote
   * backend (`lastReminderSentAt`) pour tracabilite. Distinct de la relance
   * automatique programmee (differee, necessite un ordonnanceur reel).
   */
  async function sendReminder(invoice: Invoice): Promise<Invoice | null> {
    isSendingReminder.value = true
    try {
      await invoiceActions.sendInvoiceReminderByEmail(invoice, currency())
      const updated = await invoiceService.sendReminder(invoice.id)
      toast.success('Rappel envoye et enregistre.')
      return updated
    } catch (err) {
      toast.error(documentErrorMessage(err))
      return null
    } finally {
      isSendingReminder.value = false
    }
  }

  /** Telecharge les PDFs de plusieurs factures en sequence. */
  async function bulkDownloadInvoices(invoices: Invoice[]): Promise<void> {
    isBulkDownloading.value = true
    try {
      for (const invoice of invoices) {
        await invoiceActions.downloadInvoicePdf(invoice)
      }
      toast.success(`${invoices.length} facture(s) telechargee(s).`)
    } catch (err) {
      toast.error(documentErrorMessage(err))
    } finally {
      isBulkDownloading.value = false
    }
  }

  /** Annule plusieurs factures en sequence (uniquement celles annulables). */
  async function bulkCancelInvoices(invoices: Invoice[]): Promise<number> {
    isBulkCancelling.value = true
    let cancelled = 0
    try {
      for (const invoice of invoices) {
        try {
          await store.updateInvoice(invoice.id, { status: 'cancelled' })
          cancelled++
        } catch {
          // continue les autres
        }
      }
      if (cancelled > 0) toast.success(`${cancelled} facture(s) annulee(s).`)
    } finally {
      isBulkCancelling.value = false
    }
    return cancelled
  }

  return {
    isCancelling,
    isDuplicating,
    isDownloading,
    isOpeningPdf,
    isPrinting,
    isSharing,
    isSendingEmail,
    isSendingWhatsApp,
    isSendingReminder,
    isBulkDownloading,
    isBulkCancelling,
    cancelInvoice,
    duplicateInvoice,
    downloadInvoice,
    openInvoicePdf,
    printInvoice,
    shareInvoice,
    sendInvoiceByEmail,
    sendInvoiceByWhatsApp,
    sendReminder,
    bulkDownloadInvoices,
    bulkCancelInvoices
  }
}

/**
 * Liste des factures : filtres (recherche, statut, client, periode,
 * montant) synchronises avec les query parameters de l'URL, pagination
 * serveur, et actions de mutation. L'URL est la source de verite : chaque
 * changement de filtre met a jour l'URL, et c'est l'observation de l'URL
 * qui declenche le chargement (evite de dupliquer la logique de fetch et
 * garde l'etat coherent avec le bouton retour du navigateur).
 */
export function useInvoices() {
  const route = useRoute()
  const router = useRouter()
  const store = useInvoicesStore()
  const pagination = usePagination(PER_PAGE)
  const actions = useInvoiceActions()

  const filters = reactive<InvoiceFiltersState>({
    search: '',
    status: '',
    clientId: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    page: 1
  })
  const selectedClient = ref<Client | null>(null)

  function buildQuery(): LocationQueryRaw {
    const query: LocationQueryRaw = {}
    if (filters.search) query.search = filters.search
    if (filters.status) query.status = filters.status
    if (filters.clientId) query.clientId = filters.clientId
    if (filters.dateFrom) query.dateFrom = filters.dateFrom
    if (filters.dateTo) query.dateTo = filters.dateTo
    if (filters.amountMin) query.amountMin = filters.amountMin
    if (filters.amountMax) query.amountMax = filters.amountMax
    if (filters.page > 1) query.page = String(filters.page)
    return query
  }

  function pushToUrl(): void {
    void router.replace({ query: buildQuery() })
  }

  async function load(): Promise<void> {
    await store.fetchInvoices({
      page: filters.page,
      perPage: PER_PAGE,
      search: filters.search || undefined,
      status: filters.status || undefined,
      clientId: filters.clientId || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      amountMin: filters.amountMin ? Number(filters.amountMin) : undefined,
      amountMax: filters.amountMax ? Number(filters.amountMax) : undefined
    })
    if (store.status === 'success') pagination.applyMeta(store.meta)
  }

  // L'URL est la source de verite : on la relit a chaque changement (notre
  // propre navigation comprise) et c'est ce seul point qui declenche le
  // chargement, pour ne jamais charger deux fois pour un seul changement.
  watch(
    () => route.query,
    (query) => {
      filters.search = toQueryString(query.search)
      filters.status = toQueryString(query.status) as InvoiceStatus | ''
      filters.clientId = toQueryString(query.clientId)
      filters.dateFrom = toQueryString(query.dateFrom)
      filters.dateTo = toQueryString(query.dateTo)
      filters.amountMin = toQueryString(query.amountMin)
      filters.amountMax = toQueryString(query.amountMax)
      filters.page = Number(query.page) || 1
      void load()
    },
    { immediate: true }
  )

  // Resout le nom du client filtre (utile apres un refresh/partage d'URL,
  // ou seul l'id est connu).
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
    () => [
      filters.status,
      filters.clientId,
      filters.dateFrom,
      filters.dateTo,
      filters.amountMin,
      filters.amountMax
    ],
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
    filters.dateFrom = ''
    filters.dateTo = ''
    filters.amountMin = ''
    filters.amountMax = ''
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

/** Orchestre les pieces jointes libres d'une facture donnee (upload/liste/suppression). */
export function useInvoiceAttachments(invoiceId: ID) {
  const toast = useToast()

  const attachments = ref<InvoiceAttachment[]>([])
  const isLoading = ref(false)
  const isUploading = ref(false)
  const removingId = ref<ID | null>(null)

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      attachments.value = await invoiceService.listAttachments(invoiceId)
    } catch (err) {
      toast.error((err as ApiError).message)
    } finally {
      isLoading.value = false
    }
  }

  async function upload(file: File): Promise<boolean> {
    isUploading.value = true
    try {
      const attachment = await invoiceService.uploadAttachment(invoiceId, file)
      attachments.value = [attachment, ...attachments.value]
      toast.success('Piece jointe ajoutee.')
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isUploading.value = false
    }
  }

  async function remove(attachment: InvoiceAttachment): Promise<void> {
    removingId.value = attachment.id
    try {
      await invoiceService.removeAttachment(invoiceId, attachment.id)
      attachments.value = attachments.value.filter((a) => a.id !== attachment.id)
      toast.success('Piece jointe supprimee.')
    } catch (err) {
      toast.error((err as ApiError).message)
    } finally {
      removingId.value = null
    }
  }

  return { attachments, isLoading, isUploading, removingId, load, upload, remove }
}
