import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  AuthResponse,
  ChangeEmailPayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload,
  SessionResponse,
  User
} from '@/types'

import { apiClient } from './api'

/** Service d'authentification: connexion, inscription, session, mots de passe. */
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.auth.login,
      credentials
    )
    return data.data
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.auth.register,
      payload
    )
    return data.data
  },

  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.auth.logout)
  },

  async getCurrentUser(): Promise<SessionResponse> {
    const { data } = await apiClient.get<ApiResponse<SessionResponse>>(API_ENDPOINTS.auth.me)
    return data.data
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await apiClient.post(API_ENDPOINTS.auth.forgotPassword, payload)
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await apiClient.post(API_ENDPOINTS.auth.resetPassword, payload)
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiClient.post(API_ENDPOINTS.auth.changePassword, payload)
  },

  /** Echange un ticket d'apercu (emis par l'espace admin) contre une vraie session commercant. */
  async exchangeImpersonationTicket(ticket: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.auth.impersonateExchange,
      { ticket }
    )
    return data.data
  },

  /** Change l'email, applique immediatement apres verification du mot de passe. */
  async changeEmail(payload: ChangeEmailPayload): Promise<User> {
    const { data } = await apiClient.post<ApiResponse<User>>(
      API_ENDPOINTS.auth.changeEmail,
      payload
    )
    return data.data
  }
}
