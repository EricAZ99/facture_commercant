import { API_ENDPOINTS } from '@/constants'
import type {
  AdminAuditLogEntry,
  AdminBusinessDetail,
  AdminBusinessListParams,
  AdminBusinessSummary,
  AdminChangePlanPayload,
  ApiResponse,
  ApplyDiscountPayload,
  ID,
  ImpersonationTicket,
  ListQueryParams,
  PaginatedResponse,
  PlatformStats,
  UpdateBusinessStatusPayload
} from '@/types'

import { adminApiClient } from './adminApi'

/** Service de gestion des commerces (tenants) depuis l'espace admin plateforme. */
export const adminBusinessService = {
  async getStats(): Promise<PlatformStats> {
    const { data } = await adminApiClient.get<ApiResponse<PlatformStats>>(API_ENDPOINTS.admin.stats)
    return data.data
  },

  async list(params?: AdminBusinessListParams): Promise<PaginatedResponse<AdminBusinessSummary>> {
    const { data } = await adminApiClient.get<PaginatedResponse<AdminBusinessSummary>>(
      API_ENDPOINTS.admin.businesses,
      { params }
    )
    return data
  },

  async getById(id: ID): Promise<AdminBusinessDetail> {
    const { data } = await adminApiClient.get<ApiResponse<AdminBusinessDetail>>(
      API_ENDPOINTS.admin.businessById(id)
    )
    return data.data
  },

  async updateStatus(id: ID, payload: UpdateBusinessStatusPayload): Promise<AdminBusinessDetail> {
    const { data } = await adminApiClient.patch<ApiResponse<AdminBusinessDetail>>(
      API_ENDPOINTS.admin.suspendBusiness(id),
      payload
    )
    return data.data
  },

  async changePlan(id: ID, payload: AdminChangePlanPayload): Promise<AdminBusinessDetail> {
    const { data } = await adminApiClient.post<ApiResponse<AdminBusinessDetail>>(
      API_ENDPOINTS.admin.changeBusinessPlan(id),
      payload
    )
    return data.data
  },

  async getAuditLog(
    businessId: ID,
    params?: ListQueryParams
  ): Promise<PaginatedResponse<AdminAuditLogEntry>> {
    const { data } = await adminApiClient.get<PaginatedResponse<AdminAuditLogEntry>>(
      API_ENDPOINTS.admin.auditLog(businessId),
      { params }
    )
    return data
  },

  /** Suppression definitive (au-dela de la suspension) : exige le nom exact du commerce en confirmation. */
  async remove(id: ID, confirmName: string): Promise<void> {
    await adminApiClient.delete(API_ENDPOINTS.admin.businessById(id), { data: { confirmName } })
  },

  /** Demande un ticket de mode "apercu" pour ce commerce (voir `authService.exchangeImpersonationTicket`). */
  async impersonate(id: ID): Promise<ImpersonationTicket> {
    const { data } = await adminApiClient.post<ApiResponse<ImpersonationTicket>>(
      API_ENDPOINTS.admin.impersonateBusiness(id)
    )
    return data.data
  },

  /** Applique une remise administrative a l'abonnement d'un commerce (distinct du code promo self-service). */
  async applyDiscount(id: ID, payload: ApplyDiscountPayload): Promise<AdminBusinessDetail> {
    const { data } = await adminApiClient.post<ApiResponse<AdminBusinessDetail>>(
      API_ENDPOINTS.admin.applyDiscount(id),
      payload
    )
    return data.data
  },

  /** Journal d'audit global (toutes actions, tous commerces confondus). */
  async getGlobalAuditLog(
    params?: ListQueryParams
  ): Promise<PaginatedResponse<AdminAuditLogEntry>> {
    const { data } = await adminApiClient.get<PaginatedResponse<AdminAuditLogEntry>>(
      API_ENDPOINTS.admin.globalAuditLog,
      { params }
    )
    return data
  }
}
