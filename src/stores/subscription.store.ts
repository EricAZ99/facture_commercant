import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { subscriptionService } from '@/services'
import type { ApiError, AsyncStatus, ID, Subscription, SubscriptionPlan } from '@/types'

/**
 * Etat de l'abonnement SaaS du commerce courant et du catalogue de plans.
 * Les mutations (changement de plan, annulation) se contentent d'appeler le
 * service puis de remplacer `current` par la reponse du backend : c'est
 * toujours le backend qui fait foi sur l'etat resultant (statut, periode,
 * usage), jamais un calcul optimiste local.
 */
export const useSubscriptionStore = defineStore('subscription', () => {
  const current = ref<Subscription | null>(null)
  const plans = ref<SubscriptionPlan[]>([])
  const status = ref<AsyncStatus>('idle')
  const error = ref<ApiError | null>(null)

  const isLoading = computed(() => status.value === 'loading')

  async function fetchCurrent(): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      current.value = await subscriptionService.getCurrent()
      status.value = 'success'
    } catch (err) {
      error.value = err as ApiError
      status.value = 'error'
    }
  }

  async function fetchPlans(): Promise<void> {
    try {
      plans.value = await subscriptionService.listPlans()
    } catch {
      // Le catalogue de plans est secondaire (comparatif) : une erreur ici
      // n'empeche pas d'afficher l'abonnement courant deja charge.
      plans.value = []
    }
  }

  async function changePlan(planId: ID): Promise<Subscription> {
    const updated = await subscriptionService.changePlan({ planId })
    current.value = updated
    return updated
  }

  async function cancel(): Promise<Subscription> {
    const updated = await subscriptionService.cancel()
    current.value = updated
    return updated
  }

  return {
    current,
    plans,
    status,
    error,
    isLoading,
    fetchCurrent,
    fetchPlans,
    changePlan,
    cancel
  }
})
