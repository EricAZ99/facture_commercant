import { API_ENDPOINTS } from '@/constants'
import type {
  AdjustStockPayload,
  ApiResponse,
  CreateProductPayload,
  ID,
  ListQueryParams,
  PaginatedResponse,
  Product,
  ProductImportPayload,
  ProductImportResult,
  ProductStockMovement,
  UpdateProductPayload
} from '@/types'

import { apiClient } from './api'

/** Parametres de liste des produits, avec filtre optionnel par categorie (inclut ses sous-categories). */
export interface ProductListParams extends ListQueryParams {
  categoryId?: ID
}

/** Service de gestion du catalogue produits/services. */
export const productService = {
  async list(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
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
  },

  async uploadImage(id: ID, file: File): Promise<Product> {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await apiClient.post<ApiResponse<Product>>(
      API_ENDPOINTS.products.image(id),
      formData,
      // Voir `business.service.ts` : retire le Content-Type par defaut pour
      // laisser le navigateur poser lui-meme le boundary multipart.
      { headers: { 'Content-Type': undefined } }
    )
    return data.data
  },

  async getStockMovements(
    id: ID,
    params?: ListQueryParams
  ): Promise<PaginatedResponse<ProductStockMovement>> {
    const { data } = await apiClient.get<PaginatedResponse<ProductStockMovement>>(
      API_ENDPOINTS.products.stockMovements(id),
      { params }
    )
    return data
  },

  async adjustStock(id: ID, payload: AdjustStockPayload): Promise<Product> {
    const { data } = await apiClient.post<ApiResponse<Product>>(
      API_ENDPOINTS.products.stockAdjust(id),
      payload
    )
    return data.data
  },

  async importMany(products: ProductImportPayload[]): Promise<ProductImportResult> {
    const { data } = await apiClient.post<ApiResponse<ProductImportResult>>(
      API_ENDPOINTS.products.import,
      { products }
    )
    return data.data
  }
}
