import { ref } from 'vue'

import { creditNoteService } from '@/services'
import { useCreditNotesStore } from '@/stores'
import type { ApiError, CreateCreditNotePayload, CreditNote, ID } from '@/types'

import { useToast } from './useToast'

/**
 * Avoirs lies a une facture donnee : chargement de la liste et emission
 * d'un nouvel avoir. Utilise depuis la page de detail d'une facture (pas de
 * pagination/filtres ici, une facture n'a jamais qu'une poignee d'avoirs).
 */
export function useInvoiceCreditNotes(invoiceId: ID) {
  const toast = useToast()

  const creditNotes = ref<CreditNote[]>([])
  const isLoading = ref(false)
  const isCreating = ref(false)
  const error = ref<ApiError | null>(null)
  const submitError = ref<ApiError | null>(null)

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      creditNotes.value = await creditNoteService.listByInvoice(invoiceId)
    } catch (err) {
      error.value = err as ApiError
    } finally {
      isLoading.value = false
    }
  }

  async function issueCreditNote(payload: CreateCreditNotePayload): Promise<CreditNote | null> {
    isCreating.value = true
    submitError.value = null
    try {
      const creditNote = await creditNoteService.create(payload)
      creditNotes.value = [creditNote, ...creditNotes.value]
      toast.success(`Avoir ${creditNote.number} emis.`)
      return creditNote
    } catch (err) {
      submitError.value = err as ApiError
      toast.error((err as ApiError).message)
      return null
    } finally {
      isCreating.value = false
    }
  }

  return { creditNotes, isLoading, isCreating, error, submitError, load, issueCreditNote }
}

/**
 * Liste globale des avoirs (page "Avoirs") : pagination serveur simple,
 * sans filtres avances (recherche par numero/client suffit pour ce volume).
 */
export function useCreditNotes() {
  const store = useCreditNotesStore()
  const page = ref(1)
  const perPage = 10

  async function load(): Promise<void> {
    await store.fetchCreditNotes({ page: page.value, perPage })
  }

  function goToPage(target: number): void {
    if (target === page.value) return
    page.value = target
    void load()
  }

  return { store, page, goToPage, load }
}
