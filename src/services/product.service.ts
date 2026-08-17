import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  CreateProductPayload,
  ID,
  ListQueryParams,
  PaginatedResponse,
  Product,
  UpdateProductPayload
} from '@/types'

import { apiClient } from './api'

/** Service de gestion du catalogue produits/services. */
export const productService = {
  async list(params?: ListQueryParams): Promise<PaginatedResponse<Product>> {
    const { data } = await apiClient.get<PaginatedResponse<Product>>(API_ENDPOINTS.products.base, {
      params
    })
    return data
  },

  async getById(id: ID): Promise<Product> {
    const { data } = await apiClient.get<ApiResponse<Product>>(API_ENDPOINTS.products.byId(id))
    return data.data
  },

  async create(payload: CreateProductPayload): Promise<Product> {
    const { data } = await apiClient.post<ApiResponse<Product>>(
      API_ENDPOINTS.products.base,
      payload
    )
    return data.data
  },

  async update(id: ID, payload: UpdateProductPayload): Promise<Product> {
    const { data } = await apiClient.patch<ApiResponse<Product>>(
      API_ENDPOINTS.products.byId(id),
      payload
    )
    return data.data
  },

  async remove(id: ID): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.products.byId(id))
  }
}
