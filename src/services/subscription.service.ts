import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse, ChangePlanPayload, Subscription, SubscriptionPlan } from '@/types'

import { apiClient } from './api'

/** Service de gestion de l'abonnement SaaS du commerce. */
export const subscriptionService = {
  async getCurrent(): Promise<Subscription> {
    const { data } = await apiClient.get<ApiResponse<Subscription>>(
      API_ENDPOINTS.subscription.current
    )
    return data.data
  },

  async listPlans(): Promise<SubscriptionPlan[]> {
    const { data } = await apiClient.get<ApiResponse<SubscriptionPlan[]>>(
      API_ENDPOINTS.subscription.plans
    )
    return data.data
  },

  async changePlan(payload: ChangePlanPayload): Promise<Subscription> {
    const { data } = await apiClient.post<ApiResponse<Subscription>>(
      API_ENDPOINTS.subscription.changePlan,
      payload
    )
    return data.data
  },

  async cancel(): Promise<Subscription> {
    const { data } = await apiClient.post<ApiResponse<Subscription>>(
      API_ENDPOINTS.subscription.cancel
    )
    return data.data
  }
}
