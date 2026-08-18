import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse, ChurnStats, LtvStats, MrrTrendPoint, RevenueByPlanItem } from '@/types'

import { adminApiClient } from './adminApi'

/** Service des indicateurs finance/analytics plateforme (espace admin). */
export const adminAnalyticsService = {
  async getMrrTrend(): Promise<MrrTrendPoint[]> {
    const { data } = await adminApiClient.get<ApiResponse<MrrTrendPoint[]>>(
      API_ENDPOINTS.admin.analyticsMrrTrend
    )
    return data.data
  },

  async getRevenueByPlan(): Promise<RevenueByPlanItem[]> {
    const { data } = await adminApiClient.get<ApiResponse<RevenueByPlanItem[]>>(
      API_ENDPOINTS.admin.analyticsRevenueByPlan
    )
    return data.data
  },

  async getChurn(): Promise<ChurnStats> {
    const { data } = await adminApiClient.get<ApiResponse<ChurnStats>>(
      API_ENDPOINTS.admin.analyticsChurn
    )
    return data.data
  },

  async getLtv(): Promise<LtvStats> {
    const { data } = await adminApiClient.get<ApiResponse<LtvStats>>(
      API_ENDPOINTS.admin.analyticsLtv
    )
    return data.data
  }
}
