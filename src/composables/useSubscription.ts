import { computed, ref } from 'vue'

import { subscriptionService } from '@/services'
import { useSubscriptionStore } from '@/stores'
import type { ApiError, ID, SubscriptionInvoice } from '@/types'
import { downloadBlob } from '@/utils/download'
import { computeLimitUsages, type LimitUsage } from '@/utils/subscriptionUsage'

import { useToast } from './useToast'

/**
 * Orchestre la page Abonnement : chargement de l'abonnement courant et du
 * catalogue de plans, changement de plan, annulation, et derivation des
 * limites d'usage (avec alerte de rapprochement de limite). Aucune donnee
 * bancaire n'est manipulee ici : changer de plan ne fait que transmettre un
 * `planId`, le paiement reel restant du ressort exclusif du backend.
 */
export function useSubscription() {
  const store = useSubscriptionStore()
  const toast = useToast()

  const isChangingPlan = ref(false)
  const isCancelling = ref(false)

  const invoices = ref<SubscriptionInvoice[]>([])
  const isLoadingInvoices = ref(false)
  const downloadingReceiptId = ref<ID | null>(null)

  async function load(): Promise<void> {
    await Promise.all([store.fetchCurrent(), store.fetchPlans(), loadInvoices()])
  }

  async function loadInvoices(): Promise<void> {
    isLoadingInvoices.value = true
    try {
      invoices.value = await subscriptionService.listInvoices()
    } catch {
      invoices.value = []
    } finally {
      isLoadingInvoices.value = false
    }
  }

  async function downloadReceipt(invoice: SubscriptionInvoice): Promise<void> {
    downloadingReceiptId.value = invoice.id
    try {
      const blob = await subscriptionService.downloadReceipt(invoice.id)
      downloadBlob(blob, `recu-${invoice.issuedAt.slice(0, 10)}.pdf`)
    } catch (err) {
      toast.error((err as ApiError).message)
    } finally {
      downloadingReceiptId.value = null
    }
  }

  async function selectPlan(planId: ID, promoCode?: string): Promise<boolean> {
    if (store.current?.plan.id === planId) return false

    isChangingPlan.value = true
    try {
      await store.changePlan(planId, promoCode)
      toast.success('Votre plan a ete mis a jour avec succes.')
      await loadInvoices()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isChangingPlan.value = false
    }
  }

  async function cancelSubscription(): Promise<boolean> {
    isCancelling.value = true
    try {
      await store.cancel()
      toast.success('Votre abonnement a ete resilie.')
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isCancelling.value = false
    }
  }

  const limitUsages = computed<LimitUsage[]>(() =>
    store.current ? computeLimitUsages(store.current) : []
  )

  /** Limites approchees ou deja atteintes : de quoi construire une alerte. */
  const limitAlerts = computed(() =>
    limitUsages.value.filter((usage) => usage.isApproachingLimit || usage.isLimitReached)
  )

  return {
    store,
    isChangingPlan,
    isCancelling,
    invoices,
    isLoadingInvoices,
    downloadingReceiptId,
    load,
    selectPlan,
    cancelSubscription,
    downloadReceipt,
    limitUsages,
    limitAlerts
  }
}
