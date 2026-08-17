import type { Business, BusinessType } from './business.types'
import type { User } from './user.types'

/** Identifiants de connexion. */
export interface LoginCredentials {
  email: string
  password: string
}

/** Payload d'inscription d'un nouveau commerce + utilisateur proprietaire. */
export interface RegisterPayload {
  businessName: string
  businessType: BusinessType
  firstName: string
  lastName: string
  email: string
  password: string
}

/** Couple de jetons renvoye par le backend a l'authentification. */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

/** Reponse complete d'authentification (login/register/refresh). */
export interface AuthResponse {
  user: User
  business: Business
  tokens: AuthTokens
}

/** Reponse de la session courante (`GET /auth/me`). */
export interface SessionResponse {
  user: User
  business: Business
}

/** Payload de demande de reinitialisation de mot de passe. */
export interface ForgotPasswordPayload {
  email: string
}

/** Payload de reinitialisation effective du mot de passe. */
export interface ResetPasswordPayload {
  token: string
  password: string
}

/** Payload de changement de mot de passe (utilisateur connecte). */
export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}
