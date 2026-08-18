import { ref } from 'vue'

import { installmentPlanService } from '@/services'
import type {
  ApiError,
  CreateInstallmentPlanPayload,
  ID,
  InstallmentPlan,
  PayInstallmentPayload
} from '@/types'

import { useToast } from './useToast'

/**
 * Echeancier de paiement en plusieurs fois d'une facture donnee : au plus
 * un echeancier par facture. `plan` reste `null` tant qu'aucun n'a ete cree
 * (etat normal, pas une erreur — voir `installmentPlanService.getByInvoice`).
 */
export function useInstallmentPlan(invoiceId: ID) {
  const toast = useToast()

  const plan = ref<InstallmentPlan | null>(null)
  const isLoading = ref(false)
  const error = ref<ApiError | null>(null)

  const isCreating = ref(false)
  const createError = ref<ApiError | null>(null)
  const payingInstallmentId = ref<ID | null>(null)

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      plan.value = await installmentPlanService.getByInvoice(invoiceId)
    } catch (err) {
      error.value = err as ApiError
    } finally {
      isLoading.value = false
    }
  }

  async function createPlan(payload: CreateInstallmentPlanPayload): Promise<boolean> {
    isCreating.value = true
    createError.value = null
    try {
      plan.value = await installmentPlanService.create(invoiceId, payload)
      toast.success('Echeancier cree.')
      return true
    } catch (err) {
      createError.value = err as ApiError
      toast.error((err as ApiError).message)
      return false
    } finally {
      isCreating.value = false
    }
  }

  /** Encaisse une echeance : cree un vrai paiement et met a jour la facture (voir mock-server). */
  async function payInstallment(
    installmentId: ID,
    payload: PayInstallmentPayload
  ): Promise<boolean> {
    payingInstallmentId.value = installmentId
    try {
      plan.value = await installmentPlanService.payInstallment(invoiceId, installmentId, payload)
      toast.success('Echeance encaissee.')
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      payingInstallmentId.value = null
    }
  }

  return {
    plan,
    isLoading,
    error,
    isCreating,
    createError,
    payingInstallmentId,
    load,
    createPlan,
    payInstallment
  }
}
