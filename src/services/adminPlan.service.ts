import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreatePlanPayload,
  ID,
  SubscriptionPlan,
  UpdatePlanPayload
} from '@/types'

import { adminApiClient } from './adminApi'

/** Service de gestion du catalogue de plans d'abonnement (espace admin uniquement). */
export const adminPlanService = {
  async list(): Promise<SubscriptionPlan[]> {
    const { data } = await adminApiClient.get<ApiResponse<SubscriptionPlan[]>>(
      API_ENDPOINTS.admin.plans
    )
    return data.data
  },

  async create(payload: CreatePlanPayload): Promise<SubscriptionPlan> {
    const { data } = await adminApiClient.post<ApiResponse<SubscriptionPlan>>(
      API_ENDPOINTS.admin.plans,
      payload
    )
    return data.data
  },

  async update(id: ID, payload: UpdatePlanPayload): Promise<SubscriptionPlan> {
    const { data } = await adminApiClient.patch<ApiResponse<SubscriptionPlan>>(
      API_ENDPOINTS.admin.planById(id),
      payload
    )
    return data.data
  }
}
