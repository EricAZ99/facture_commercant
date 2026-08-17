import { ref } from 'vue'

import { useAdminPlansStore } from '@/stores'
import type { ApiError, CreatePlanPayload, ID, UpdatePlanPayload } from '@/types'

import { useToast } from './useToast'

/** Orchestre le catalogue de plans d'abonnement depuis l'espace admin. */
export function useAdminPlans() {
  const store = useAdminPlansStore()
  const toast = useToast()

  const isSubmitting = ref(false)

  async function load(): Promise<void> {
    await store.fetchPlans()
  }

  async function submitCreate(payload: CreatePlanPayload): Promise<ApiError | null> {
    isSubmitting.value = true
    try {
      await store.createPlan(payload)
      toast.success('Plan cree avec succes.')
      await load()
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isSubmitting.value = false
    }
  }

  async function submitUpdate(id: ID, payload: UpdatePlanPayload): Promise<ApiError | null> {
    isSubmitting.value = true
    try {
      await store.updatePlan(id, payload)
      toast.success('Plan modifie avec succes.')
      await load()
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isSubmitting.value = false
    }
  }

  return { store, isSubmitting, load, submitCreate, submitUpdate }
}
