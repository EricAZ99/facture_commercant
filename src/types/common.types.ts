/**
 * Types transverses utilises par l'ensemble des entites et des services.
 */

/** Identifiant unique (UUID cote backend). */
export type ID = string

/** Horodatage ISO 8601 tel que renvoye par l'API. */
export type ISODateString = string

/** Enveloppe standard d'une reponse API pour une ressource unique. */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

/** Metadonnees de pagination renvoyees par le backend. */
export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

/** Enveloppe standard d'une reponse API paginee. */
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginationMeta
}

/** Parametres de pagination envoyes au backend. */
export interface PaginationParams {
  page?: number
  perPage?: number
}

/** Parametres de tri generiques. */
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/** Parametres de recherche/texte libre. */
export interface SearchParams {
  search?: string
}

/** Combinaison usuelle des parametres de requete pour les listes. */
export type ListQueryParams = PaginationParams & SortParams & SearchParams

/** Forme normalisee d'une erreur API, utilisee par la gestion centralisee des erreurs. */
export interface ApiError {
  status: number
  code: string
  message: string
  details?: Record<string, string[]> | undefined
}

/** Represente les etats possibles d'une operation asynchrone (requete API). */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'
