import { computed, ref } from 'vue'

import { invoiceDownloadService, invoiceService, paymentService } from '@/services'
import type {
  ApiError,
  Client,
  CreateInvoicePayload,
  DiscountType,
  ID,
  Invoice,
  InvoiceCustomField,
  PaymentMethod,
  PriceBreak,
  Product
} from '@/types'
import { computeInvoiceTotals } from '@/utils/invoiceCalculations'
import { resolveUnitPrice } from '@/utils/productPricing'

import { useToast } from './useToast'

/** Ligne de facture en cours d'edition (etat local, avant envoi a l'API). */
export interface InvoiceBuilderLine {
  /** Identifiant local (UI uniquement, jamais envoye a l'API). */
  key: string
  productId?: ID
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  /**
   * Prix de base et tarifs degressifs du produit source (etat local
   * uniquement, jamais envoye a l'API) : permet de reajuster `unitPrice`
   * automatiquement quand la quantite change. Absent pour une ligne libre.
   */
  basePrice?: number
  priceBreaks?: PriceBreak[]
}

export type InvoiceSubmitMode = 'draft' | 'final'

export interface UseInvoiceBuilderOptions {
  /** Facture existante a modifier ; absente = mode creation. */
  invoice?: Invoice
  /** Client de la facture existante (pour l'affichage immediat du selecteur). */
  client?: Client | null
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function defaultIssueDate(): string {
  return toDateInputValue(new Date())
}

export function defaultDueDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return toDateInputValue(date)
}

function makeLocalError(message: string): ApiError {
  return { status: 0, code: 'VALIDATION_ERROR', message }
}

function linesFromInvoice(invoice: Invoice): InvoiceBuilderLine[] {
  return invoice.items.map((item) => ({
    key: crypto.randomUUID(),
    productId: item.productId,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    taxRate: item.taxRate
  }))
}

/**
 * Etat et logique de creation/edition d'une facture : client, lignes,
 * remise, TVA, totaux (via `utils/invoiceCalculations.ts`, jamais calcules
 * ici ni dans un template) et paiement. Expose `submit()` pour finaliser ou
 * enregistrer un brouillon, avec garde anti-double-soumission.
 *
 * Passer `options.invoice` bascule en mode edition : `submit()` appelle
 * alors `invoiceService.update` au lieu de `invoiceService.create`. Seules
 * les factures en brouillon sont editables (voir `canEditInvoice`), c'est a
 * l'appelant de le garantir avant d'utiliser ce mode.
 */
export function useInvoiceBuilder(options: UseInvoiceBuilderOptions = {}) {
  const toast = useToast()

  const editingInvoiceId = ref<ID | null>(options.invoice?.id ?? null)
  const isEditing = computed(() => editingInvoiceId.value !== null)

  const client = ref<Client | null>(options.client ?? null)
  const lines = ref<InvoiceBuilderLine[]>(options.invoice ? linesFromInvoice(options.invoice) : [])
  const discountType = ref<DiscountType>(options.invoice?.discountType ?? 'percentage')
  const discountValue = ref(options.invoice?.discountValue ?? 0)
  const paymentMethod = ref<PaymentMethod | ''>('')
  const issueDate = ref(options.invoice?.issueDate.slice(0, 10) ?? defaultIssueDate())
  const dueDate = ref(options.invoice?.dueDate.slice(0, 10) ?? defaultDueDate())
  const notes = ref(options.invoice?.notes ?? '')
  const internalNotes = ref(options.invoice?.internalNotes ?? '')
  const customFields = ref<InvoiceCustomField[]>(
    options.invoice?.customFields ? options.invoice.customFields.map((f) => ({ ...f })) : []
  )

  const submittingMode = ref<InvoiceSubmitMode | null>(null)
  const isSubmitting = computed(() => submittingMode.value !== null)
  const submitError = ref<ApiError | null>(null)
  const isPreviewingPdf = ref(false)

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

  /** Ajoute une ligne pre-remplie depuis un produit/service du catalogue. */
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

    // Un changement de quantite sur une ligne issue du catalogue reapplique
    // automatiquement le palier de tarif degressif correspondant.
    if (patch.quantity !== undefined && line.basePrice !== undefined) {
      line.unitPrice = resolveUnitPrice(line.basePrice, line.priceBreaks, line.quantity)
    }
  }

  function removeLine(key: string): void {
    lines.value = lines.value.filter((item) => item.key !== key)
  }

  function addCustomField(): void {
    customFields.value.push({ label: '', value: '' })
  }

  function removeCustomField(index: number): void {
    customFields.value.splice(index, 1)
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

  function validate(mode: InvoiceSubmitMode): string | null {
    if (!client.value) return 'Selectionnez un client pour continuer.'
    if (mode === 'final' && !hasValidLines.value) {
      return 'Ajoutez au moins une ligne valide (description, quantite et prix).'
    }
    return null
  }

  /** Champs personnalises complets (label ET valeur non vides) uniquement. */
  const validCustomFields = computed(() =>
    customFields.value
      .map((f) => ({ label: f.label.trim(), value: f.value.trim() }))
      .filter((f) => f.label && f.value)
  )

  function toPayload(mode: InvoiceSubmitMode): CreateInvoicePayload {
    return {
      clientId: client.value!.id,
      issueDate: issueDate.value,
      dueDate: dueDate.value,
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
      internalNotes: internalNotes.value.trim() || undefined,
      customFields: validCustomFields.value.length > 0 ? validCustomFields.value : undefined,
      status: mode === 'draft' ? 'draft' : 'sent'
    }
  }

  /**
   * Genere un apercu PDF en direct de l'etat courant du formulaire (rien
   * n'est persiste). Utilise `toPayload('draft')` pour reutiliser exactement
   * la meme construction de payload que la sauvegarde reelle.
   */
  async function previewPdf(): Promise<void> {
    if (!client.value) {
      toast.error("Selectionnez un client avant de generer l'apercu.")
      return
    }
    isPreviewingPdf.value = true
    try {
      const blob = await invoiceDownloadService.fetchPreviewPdfBlob(toPayload('draft'))
      const url = URL.createObjectURL(blob)
      const opened = window.open(url, '_blank', 'noopener,noreferrer')
      if (!opened) {
        URL.revokeObjectURL(url)
        toast.error("L'apercu n'a pas pu s'ouvrir (bloqueur de fenetres popup ?).")
        return
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      toast.error((err as ApiError).message)
    } finally {
      isPreviewingPdf.value = false
    }
  }

  /** Enregistre un brouillon ou finalise/met a jour la facture. Ignore les clics repetes. */
  async function submit(mode: InvoiceSubmitMode): Promise<Invoice | null> {
    if (isSubmitting.value) return null // empeche la soumission multiple

    const validationMessage = validate(mode)
    if (validationMessage) {
      submitError.value = makeLocalError(validationMessage)
      return null
    }

    submittingMode.value = mode
    submitError.value = null

    try {
      const payload = toPayload(mode)
      const invoice = editingInvoiceId.value
        ? await invoiceService.update(editingInvoiceId.value, payload)
        : await invoiceService.create(payload)

      if (mode === 'final' && paymentMethod.value && invoice.total > 0) {
        try {
          await paymentService.create({
            invoiceId: invoice.id,
            amount: invoice.total,
            method: paymentMethod.value,
            paidAt: new Date().toISOString()
          })
        } catch {
          toast.error("Facture enregistree, mais l'enregistrement du paiement a echoue.")
        }
      }

      toast.success(
        mode === 'draft'
          ? 'Brouillon enregistre.'
          : isEditing.value
            ? 'Facture mise a jour et finalisee.'
            : 'Facture creee avec succes.'
      )
      return invoice
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
    paymentMethod,
    issueDate,
    dueDate,
    notes,
    internalNotes,
    customFields,
    totals,
    isSubmitting,
    submittingMode,
    submitError,
    isPreviewingPdf,
    canSaveDraft,
    canFinalize,
    setClient,
    addLine,
    addProduct,
    updateLine,
    removeLine,
    addCustomField,
    removeCustomField,
    submit,
    previewPdf
  }
}
