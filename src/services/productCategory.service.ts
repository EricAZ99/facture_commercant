import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreateProductCategoryPayload,
  ID,
  ProductCategory,
  UpdateProductCategoryPayload
} from '@/types'

import { apiClient } from './api'

/** Service de gestion des categories de produits (arborescence). */
export const productCategoryService = {
  async list(): Promise<ProductCategory[]> {
    const { data } = await apiClient.get<ApiResponse<ProductCategory[]>>(
      API_ENDPOINTS.productCategories.base
    )
    return data.data
  },

  async create(payload: CreateProductCategoryPayload): Promise<ProductCategory> {
    const { data } = await apiClient.post<ApiResponse<ProductCategory>>(
      API_ENDPOINTS.productCategories.base,
      payload
    )
    return data.data
  },

  async update(id: ID, payload: UpdateProductCategoryPayload): Promise<ProductCategory> {
    const { data } = await apiClient.patch<ApiResponse<ProductCategory>>(
      API_ENDPOINTS.productCategories.byId(id),
      payload
    )
    return data.data
  },

  async remove(id: ID): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.productCategories.byId(id))
  }
}
