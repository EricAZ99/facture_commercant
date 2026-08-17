import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { adminPlanService } from '@/services'
import type {
  ApiError,
  AsyncStatus,
  CreatePlanPayload,
  ID,
  SubscriptionPlan,
  UpdatePlanPayload
} from '@/types'

/** Etat du catalogue de plans d'abonnement, geree depuis l'espace admin. */
export const useAdminPlansStore = defineStore('adminPlans', () => {
  const items = ref<SubscriptionPlan[]>([])
  const status = ref<AsyncStatus>('idle')
  const error = ref<ApiError | null>(null)

  const isLoading = computed(() => status.value === 'loading')

  async function fetchPlans(): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      items.value = await adminPlanService.list()
      status.value = 'success'
    } catch (err) {
      error.value = err as ApiError
      status.value = 'error'
    }
  }

  function createPlan(payload: CreatePlanPayload): Promise<SubscriptionPlan> {
    return adminPlanService.create(payload)
  }

  function updatePlan(id: ID, payload: UpdatePlanPayload): Promise<SubscriptionPlan> {
    return adminPlanService.update(id, payload)
  }

  return { items, status, error, isLoading, fetchPlans, createPlan, updatePlan }
})
