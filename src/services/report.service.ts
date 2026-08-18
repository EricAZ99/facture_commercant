import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  InvoiceStatusReportItem,
  PaymentMethodBreakdown,
  ReportFilters,
  ReportSummary,
  RevenueDataPoint,
  TopClientReportItem,
  TopProductReportItem,
  VatReport
} from '@/types'

import { apiClient } from './api'

/** Filtres d'un rapport, plus un `AbortSignal` optionnel (annulation lors d'un changement de filtre). */
export interface ReportRequestParams extends ReportFilters {
  signal?: AbortSignal
}

function toQueryParams(filters?: ReportRequestParams): ReportFilters | undefined {
  if (!filters) return undefined
  const { signal: _signal, ...params } = filters
  return params
}

/**
 * Service d'agregation des rapports. Chaque section (synthese, evolution du
 * CA, repartitions, classements) est une requete independante : cela evite
 * un unique appel monolithique qui chargerait tout meme quand un seul widget
 * est necessaire, et permet a chaque section d'avoir son propre etat
 * loading/erreur (voir `useReports`).
 */
export const reportService = {
  async getSummary(filters?: ReportRequestParams): Promise<ReportSummary> {
    const { data } = await apiClient.get<ApiResponse<ReportSummary>>(
      API_ENDPOINTS.reports.summary,
      {
        params: toQueryParams(filters),
        signal: filters?.signal
      }
    )
    return data.data
  },

  async getRevenueEvolution(filters?: ReportRequestParams): Promise<RevenueDataPoint[]> {
    const { data } = await apiClient.get<ApiResponse<RevenueDataPoint[]>>(
      API_ENDPOINTS.reports.revenue,
      { params: toQueryParams(filters), signal: filters?.signal }
    )
    return data.data
  },

  async getInvoiceStatusBreakdown(
    filters?: ReportRequestParams
  ): Promise<InvoiceStatusReportItem[]> {
    const { data } = await apiClient.get<ApiResponse<InvoiceStatusReportItem[]>>(
      API_ENDPOINTS.reports.invoiceStatus,
      { params: toQueryParams(filters), signal: filters?.signal }
    )
    return data.data
  },

  async getPaymentMethodBreakdown(
    filters?: ReportRequestParams
  ): Promise<PaymentMethodBreakdown[]> {
    const { data } = await apiClient.get<ApiResponse<PaymentMethodBreakdown[]>>(
      API_ENDPOINTS.reports.paymentMethods,
      { params: toQueryParams(filters), signal: filters?.signal }
    )
    return data.data
  },

  async getTopProducts(filters?: ReportRequestParams): Promise<TopProductReportItem[]> {
    const { data } = await apiClient.get<ApiResponse<TopProductReportItem[]>>(
      API_ENDPOINTS.reports.topProducts,
      { params: toQueryParams(filters), signal: filters?.signal }
    )
    return data.data
  },

  async getTopClients(filters?: ReportRequestParams): Promise<TopClientReportItem[]> {
    const { data } = await apiClient.get<ApiResponse<TopClientReportItem[]>>(
      API_ENDPOINTS.reports.topClients,
      { params: toQueryParams(filters), signal: filters?.signal }
    )
    return data.data
  },

  /** Evolution du chiffre d'affaires sur la fenetre de meme duree, immediatement precedente. */
  async getRevenueComparison(filters?: ReportRequestParams): Promise<RevenueDataPoint[]> {
    const { data } = await apiClient.get<ApiResponse<RevenueDataPoint[]>>(
      API_ENDPOINTS.reports.revenueComparison,
      { params: toQueryParams(filters), signal: filters?.signal }
    )
    return data.data
  },

  async getVatBreakdown(filters?: ReportRequestParams): Promise<VatReport> {
    const { data } = await apiClient.get<ApiResponse<VatReport>>(API_ENDPOINTS.reports.vat, {
      params: toQueryParams(filters),
      signal: filters?.signal
    })
    return data.data
  }
}
