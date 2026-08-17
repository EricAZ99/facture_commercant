import { API_ENDPOINTS } from '@/constants'
import type {
  ActivityItem,
  ApiResponse,
  DashboardPeriod,
  DashboardStats,
  InvoiceStatusBreakdown,
  PaymentMethodBreakdown,
  RevenueDataPoint
} from '@/types'

import { apiClient } from './api'

/** Parametres communs aux indicateurs sensibles a la periode selectionnee. */
export interface DashboardPeriodParams {
  period?: DashboardPeriod
  /** Permet d'annuler la requete (ex: changement rapide de filtre). */
  signal?: AbortSignal
}

/** Service d'agregation des donnees du tableau de bord. */
export const dashboardService = {
  async getStats(params?: DashboardPeriodParams): Promise<DashboardStats> {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>(
      API_ENDPOINTS.dashboard.stats,
      {
        params: { period: params?.period },
        signal: params?.signal
      }
    )
    return data.data
  },

  async getRevenueEvolution(params?: DashboardPeriodParams): Promise<RevenueDataPoint[]> {
    const { data } = await apiClient.get<ApiResponse<RevenueDataPoint[]>>(
      API_ENDPOINTS.dashboard.revenue,
      { params: { period: params?.period }, signal: params?.signal }
    )
    return data.data
  },

  async getPaymentMethodBreakdown(
    params?: DashboardPeriodParams
  ): Promise<PaymentMethodBreakdown[]> {
    const { data } = await apiClient.get<ApiResponse<PaymentMethodBreakdown[]>>(
      API_ENDPOINTS.dashboard.paymentMethodBreakdown,
      { params: { period: params?.period }, signal: params?.signal }
    )
    return data.data
  },

  async getInvoiceStatusBreakdown(): Promise<InvoiceStatusBreakdown[]> {
    const { data } = await apiClient.get<ApiResponse<InvoiceStatusBreakdown[]>>(
      API_ENDPOINTS.dashboard.invoiceStatusBreakdown
    )
    return data.data
  },

  async getRecentActivity(params?: {
    limit?: number
    signal?: AbortSignal
  }): Promise<ActivityItem[]> {
    const { data } = await apiClient.get<ApiResponse<ActivityItem[]>>(
      API_ENDPOINTS.dashboard.activity,
      {
        params: { limit: params?.limit },
        signal: params?.signal
      }
    )
    return data.data
  }
}
