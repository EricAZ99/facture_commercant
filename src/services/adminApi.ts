import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

import { STORAGE_KEYS } from '@/constants'
import type { ApiError } from '@/types'
import { storage } from '@/utils/storage'

/**
 * Client Axios de l'espace admin plateforme — entierement separe de
 * `services/api.ts` (jetons distincts, pas d'en-tete `X-Business-Id`, pas
 * de dependance au store commercant). Une session admin et une session
 * commercant peuvent coexister dans le meme navigateur sans jamais se
 * marcher dessus ni permettre a l'une d'agir avec les jetons de l'autre.
 */

const baseURL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const timeout = Number(import.meta.env.VITE_API_TIMEOUT || 15000)

export const adminApiClient: AxiosInstance = axios.create({
  baseURL,
  timeout,
  headers: {
    'Content-Type': 'application/json'
  }
})

type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null
export function setAdminUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler
}

adminApiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.get(STORAGE_KEYS.adminAccessToken)
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

let isRefreshing = false
let pendingRequests: Array<(token: string | null) => void> = []

function resolvePendingRequests(token: string | null): void {
  pendingRequests.forEach((callback) => callback(token))
  pendingRequests = []
}

async function refreshAdminAccessToken(): Promise<string | null> {
  const refreshToken = storage.get(STORAGE_KEYS.adminRefreshToken)
  if (!refreshToken) return null

  try {
    const response = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
      `${baseURL}/admin/auth/refresh`,
      { refreshToken }
    )
    const tokens = response.data.data
    storage.set(STORAGE_KEYS.adminAccessToken, tokens.accessToken)
    storage.set(STORAGE_KEYS.adminRefreshToken, tokens.refreshToken)
    return tokens.accessToken
  } catch {
    return null
  }
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

adminApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const status = error.response?.status
    const isAuthEndpoint = originalRequest?.url?.includes('/admin/auth/') ?? false

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((token) => {
            if (!token) {
              reject(normalizeError(error))
              return
            }
            originalRequest._retry = true
            originalRequest.headers.set('Authorization', `Bearer ${token}`)
            resolve(adminApiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true
      const newToken = await refreshAdminAccessToken()
      isRefreshing = false
      resolvePendingRequests(newToken)

      if (newToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`)
        return adminApiClient(originalRequest)
      }

      unauthorizedHandler?.()
      return Promise.reject(normalizeError(error))
    }

    if (status === 401 && isAuthEndpoint) {
      unauthorizedHandler?.()
    }

    return Promise.reject(normalizeError(error))
  }
)

interface ApiErrorPayload {
  message?: string
  code?: string
  errors?: Record<string, string[]>
}

function normalizeError(error: AxiosError): ApiError {
  if (axios.isCancel(error)) {
    return { status: 0, code: 'REQUEST_CANCELED', message: 'Requete annulee.' }
  }

  if (error.response) {
    const { status, data } = error.response as { status: number; data: ApiErrorPayload }
    return {
      status,
      code: data?.code ?? 'API_ERROR',
      message: data?.message ?? "Une erreur est survenue lors de l'appel a l'API.",
      details: data?.errors
    }
  }

  if (error.request) {
    return {
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Impossible de contacter le serveur. Verifiez votre connexion.'
    }
  }

  return {
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: error.message || 'Une erreur inattendue est survenue.'
  }
}

export default adminApiClient
