import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  ChangePlanPayload,
  ID,
  Subscription,
  SubscriptionInvoice,
  SubscriptionPlan
} from '@/types'

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
  },

  async listInvoices(): Promise<SubscriptionInvoice[]> {
    const { data } = await apiClient.get<ApiResponse<SubscriptionInvoice[]>>(
      API_ENDPOINTS.subscription.invoices
    )
    return data.data
  },

  /** Telecharge le recu PDF d'un cycle de facturation passe. */
  async downloadReceipt(id: ID): Promise<Blob> {
    const { data } = await apiClient.get(API_ENDPOINTS.subscription.receipt(id), {
      responseType: 'blob'
    })
    return data
  }
}
