import { computed, ref } from 'vue'

import { paymentService } from '@/services'
import type { ApiError, CreatePaymentPayload, CreateRefundPayload, ID, Payment } from '@/types'

import { useToast } from './useToast'

/**
 * Paiements d'une facture donnee : historique et enregistrement d'un
 * nouveau paiement. Apres un enregistrement reussi, l'historique est
 * rafraichi automatiquement ; c'est a l'appelant (page de detail) de
 * rafraichir la facture elle-meme (solde/statut recalcules cote backend).
 */
export function usePayments(invoiceId: ID) {
  const toast = useToast()

  const payments = ref<Payment[]>([])
  const isLoading = ref(false)
  const error = ref<ApiError | null>(null)

  const isSubmitting = ref(false)
  const submitError = ref<ApiError | null>(null)

  const isRefunding = ref(false)
  const refundError = ref<ApiError | null>(null)

  const totalRegistered = computed(() =>
    payments.value.reduce((sum, payment) => sum + payment.amount, 0)
  )

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      payments.value = await paymentService.listByInvoice(invoiceId)
    } catch (err) {
      error.value = err as ApiError
    } finally {
      isLoading.value = false
    }
  }

  /** Enregistre un paiement. Ignore les clics repetes (anti double-soumission). */
  async function registerPayment(
    payload: Omit<CreatePaymentPayload, 'invoiceId'>
  ): Promise<Payment | null> {
    if (isSubmitting.value) return null

    isSubmitting.value = true
    submitError.value = null
    try {
      const payment = await paymentService.create({ ...payload, invoiceId })
      toast.success('Paiement enregistre avec succes.')
      await load()
      return payment
    } catch (err) {
      submitError.value = err as ApiError
      toast.error((err as ApiError).message)
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  /** Rembourse (totalement ou partiellement) un paiement. */
  async function refundPayment(
    payment: Payment,
    payload: CreateRefundPayload
  ): Promise<Payment | null> {
    isRefunding.value = true
    refundError.value = null
    try {
      const updated = await paymentService.refund(payment.id, payload)
      payments.value = payments.value.map((p) => (p.id === updated.id ? updated : p))
      toast.success('Remboursement enregistre.')
      return updated
    } catch (err) {
      refundError.value = err as ApiError
      toast.error((err as ApiError).message)
      return null
    } finally {
      isRefunding.value = false
    }
  }

  return {
    payments,
    isLoading,
    error,
    isSubmitting,
    submitError,
    isRefunding,
    refundError,
    totalRegistered,
    load,
    registerPayment,
    refundPayment
  }
}
