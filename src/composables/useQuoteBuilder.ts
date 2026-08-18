import { computed, ref } from 'vue'

import { quoteService } from '@/services'
import type {
  ApiError,
  Client,
  CreateQuotePayload,
  DiscountType,
  ID,
  Product,
  Quote
} from '@/types'
import { computeInvoiceTotals } from '@/utils/invoiceCalculations'
import { resolveUnitPrice } from '@/utils/productPricing'

import { defaultIssueDate, type InvoiceBuilderLine } from './useInvoiceBuilder'
import { useToast } from './useToast'

export type { InvoiceBuilderLine as QuoteBuilderLine } from './useInvoiceBuilder'

export type QuoteSubmitMode = 'draft' | 'final'

export interface UseQuoteBuilderOptions {
  /** Devis existant a modifier ; absent = mode creation. */
  quote?: Quote
  /** Client du devis existant (pour l'affichage immediat du selecteur). */
  client?: Client | null
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Validite par defaut d'un nouveau devis : 30 jours a compter d'aujourd'hui. */
export function defaultExpiryDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return toDateInputValue(date)
}

function makeLocalError(message: string): ApiError {
  return { status: 0, code: 'VALIDATION_ERROR', message }
}

function linesFromQuote(quote: Quote): InvoiceBuilderLine[] {
  return quote.items.map((item) => ({
    key: crypto.randomUUID(),
    productId: item.productId,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    taxRate: item.taxRate
  }))
}

/**
 * Etat et logique de creation/edition d'un devis : sur le meme modele que
 * `useInvoiceBuilder`, en reutilisant `InvoiceBuilderLine` et
 * `computeInvoiceTotals` (les lignes et le calcul de totaux sont
 * structurellement identiques a une facture). Seule la notion de "date
 * d'echeance" est remplacee par une "date de validite".
 */
export function useQuoteBuilder(options: UseQuoteBuilderOptions = {}) {
  const toast = useToast()

  const editingQuoteId = ref<ID | null>(options.quote?.id ?? null)
  const isEditing = computed(() => editingQuoteId.value !== null)

  const client = ref<Client | null>(options.client ?? null)
  const lines = ref<InvoiceBuilderLine[]>(options.quote ? linesFromQuote(options.quote) : [])
  const discountType = ref<DiscountType>(options.quote?.discountType ?? 'percentage')
  const discountValue = ref(options.quote?.discountValue ?? 0)
  const issueDate = ref(options.quote?.issueDate.slice(0, 10) ?? defaultIssueDate())
  const expiryDate = ref(options.quote?.expiryDate.slice(0, 10) ?? defaultExpiryDate())
  const notes = ref(options.quote?.notes ?? '')

  const submittingMode = ref<QuoteSubmitMode | null>(null)
  const isSubmitting = computed(() => submittingMode.value !== null)
  const submitError = ref<ApiError | null>(null)

  const totals = computed(() =>
    computeInvoiceTotals(lines.value, discountType.value, discountValue.value)
  )

  function setClient(next: Client | null): void {
    client.value = next
  }

  function addLine(seed: Partial<Omit<InvoiceBuilderLine, 'key'>> = {}): void {
    lines.value.push({
      key: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      ...seed
    })
  }

  function addProduct(product: Product): void {
    const quantity = 1
    addLine({
      productId: product.id,
      description: product.name,
      quantity,
      unitPrice: resolveUnitPrice(product.price, product.priceBreaks, quantity),
      taxRate: product.taxRate,
      basePrice: product.price,
      priceBreaks: product.priceBreaks
    })
  }

  function updateLine(key: string, patch: Partial<Omit<InvoiceBuilderLine, 'key'>>): void {
    const line = lines.value.find((item) => item.key === key)
    if (!line) return

    Object.assign(line, patch)

    if (patch.quantity !== undefined && line.basePrice !== undefined) {
      line.unitPrice = resolveUnitPrice(line.basePrice, line.priceBreaks, line.quantity)
    }
  }

  function removeLine(key: string): void {
    lines.value = lines.value.filter((item) => item.key !== key)
  }

  const hasValidLines = computed(
    () =>
      lines.value.length > 0 &&
      lines.value.every(
        (line) => line.description.trim().length > 0 && line.quantity > 0 && line.unitPrice >= 0
      )
  )
  const canSaveDraft = computed(() => client.value !== null)
  const canFinalize = computed(() => client.value !== null && hasValidLines.value)

  function validate(mode: QuoteSubmitMode): string | null {
    if (!client.value) return 'Selectionnez un client pour continuer.'
    if (mode === 'final' && !hasValidLines.value) {
      return 'Ajoutez au moins une ligne valide (description, quantite et prix).'
    }
    return null
  }

  function toPayload(mode: QuoteSubmitMode): CreateQuotePayload {
    return {
      clientId: client.value!.id,
      issueDate: issueDate.value,
      expiryDate: expiryDate.value,
      items: lines.value.map((line) => ({
        productId: line.productId,
        description: line.description.trim(),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate
      })),
      discountType: discountType.value,
      discountValue: discountValue.value,
      notes: notes.value.trim() || undefined,
      status: mode === 'draft' ? 'draft' : 'sent'
    }
  }

  /** Enregistre un brouillon ou finalise/met a jour le devis. Ignore les clics repetes. */
  async function submit(mode: QuoteSubmitMode): Promise<Quote | null> {
    if (isSubmitting.value) return null

    const validationMessage = validate(mode)
    if (validationMessage) {
      submitError.value = makeLocalError(validationMessage)
      return null
    }

    submittingMode.value = mode
    submitError.value = null

    try {
      const payload = toPayload(mode)
      const quote = editingQuoteId.value
        ? await quoteService.update(editingQuoteId.value, payload)
        : await quoteService.create(payload)

      toast.success(
        mode === 'draft'
          ? 'Brouillon de devis enregistre.'
          : isEditing.value
            ? 'Devis mis a jour et envoye.'
            : 'Devis cree avec succes.'
      )
      return quote
    } catch (err) {
      submitError.value = err as ApiError
      toast.error((err as ApiError).message)
      return null
    } finally {
      submittingMode.value = null
    }
  }

  return {
    isEditing,
    client,
    lines,
    discountType,
    discountValue,
    issueDate,
    expiryDate,
    notes,
    totals,
    isSubmitting,
    submittingMode,
    submitError,
    canSaveDraft,
    canFinalize,
    setClient,
    addLine,
    addProduct,
    updateLine,
    removeLine,
    submit
  }
}
