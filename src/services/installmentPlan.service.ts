import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreateInstallmentPlanPayload,
  ID,
  InstallmentPlan,
  PayInstallmentPayload
} from '@/types'

import { apiClient } from './api'

/** Service de gestion des echeanciers de paiement en plusieurs fois, rattaches a une facture. */
export const installmentPlanService = {
  /** Retourne l'echeancier de la facture, ou `null` si aucun n'a ete cree. */
  async getByInvoice(invoiceId: ID): Promise<InstallmentPlan | null> {
    const { data } = await apiClient.get<ApiResponse<InstallmentPlan | null>>(
      API_ENDPOINTS.installmentPlans.byInvoice(invoiceId)
    )
    return data.data
  },

  async create(invoiceId: ID, payload: CreateInstallmentPlanPayload): Promise<InstallmentPlan> {
    const { data } = await apiClient.post<ApiResponse<InstallmentPlan>>(
      API_ENDPOINTS.installmentPlans.byInvoice(invoiceId),
      payload
    )
    return data.data
  },

  async payInstallment(
    invoiceId: ID,
    installmentId: ID,
    payload: PayInstallmentPayload
  ): Promise<InstallmentPlan> {
    const { data } = await apiClient.post<ApiResponse<InstallmentPlan>>(
      API_ENDPOINTS.installmentPlans.payInstallment(invoiceId, installmentId),
      payload
    )
    return data.data
  }
}
