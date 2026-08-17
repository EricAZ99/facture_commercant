import { computed, ref } from 'vue'

import { useSubscriptionStore } from '@/stores'
import type { ApiError, ID } from '@/types'
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

  async function load(): Promise<void> {
    await Promise.all([store.fetchCurrent(), store.fetchPlans()])
  }

  async function selectPlan(planId: ID): Promise<boolean> {
    if (store.current?.plan.id === planId) return false

    isChangingPlan.value = true
    try {
      await store.changePlan(planId)
      toast.success('Votre plan a ete mis a jour avec succes.')
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
    load,
    selectPlan,
    cancelSubscription,
    limitUsages,
    limitAlerts
  }
}
