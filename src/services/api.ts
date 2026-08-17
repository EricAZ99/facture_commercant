import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

import { STORAGE_KEYS } from '@/constants'
import type { ApiError } from '@/types'
import { storage } from '@/utils/storage'

/**
 * Client Axios central de l'application.
 *
 * Regle d'architecture: AUCUN appel Axios direct ne doit etre effectue
 * depuis une page ou un composant. Toute requete HTTP passe par un
 * service dedie (`services/*.service.ts`) qui utilise `apiClient`.
 */

const baseURL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const timeout = Number(import.meta.env.VITE_API_TIMEOUT || 15000)

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Callback enregistre par le store d'authentification, declenche quand la
 * session ne peut plus etre maintenue (401 persistant). Le decouplage
 * evite une dependance circulaire entre la couche services et Pinia.
 */
type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler
}

/**
 * Fournisseur du commerce (tenant) courant, utilise pour propager l'en-tete
 * multi-tenant sur chaque requete. Enregistre par le store de session.
 */
type BusinessIdProvider = () => string | null
let businessIdProvider: BusinessIdProvider | null = null
export function setBusinessIdProvider(provider: BusinessIdProvider): void {
  businessIdProvider = provider
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.get(STORAGE_KEYS.accessToken)
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  const businessId = businessIdProvider?.()
  if (businessId) {
    config.headers.set('X-Business-Id', businessId)
  }

  return config
})

// --- Rafraichissement automatique du token d'acces ------------------------

let isRefreshing = false
let pendingRequests: Array<(token: string | null) => void> = []

function resolvePendingRequests(token: string | null): void {
  pendingRequests.forEach((callback) => callback(token))
  pendingRequests = []
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = storage.get(STORAGE_KEYS.refreshToken)
  if (!refreshToken) return null

  try {
    const response = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
      `${baseURL}/auth/refresh`,
      { refreshToken }
    )
    const tokens = response.data.data
    storage.set(STORAGE_KEYS.accessToken, tokens.accessToken)
    storage.set(STORAGE_KEYS.refreshToken, tokens.refreshToken)
    return tokens.accessToken
  } catch {
    return null
  }
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const status = error.response?.status
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/') ?? false

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
            resolve(apiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true
      const newToken = await refreshAccessToken()
      isRefreshing = false
      resolvePendingRequests(newToken)

      if (newToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`)
        return apiClient(originalRequest)
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

/** Normalise toute erreur Axios/reseau en `ApiError` exploitable par l'UI. */
function normalizeError(error: AxiosError): ApiError {
  // Requete annulee volontairement (ex: AbortController sur un changement de
  // filtre) : code dedie, distinct d'une vraie erreur reseau/serveur.
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

export default apiClient
