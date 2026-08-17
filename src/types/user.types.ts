import type { ID, ISODateString } from './common.types'
import type { Permission, UserRole } from './permission.types'

/** Utilisateur authentifie, rattache a un commerce (architecture multi-tenant). */
export interface User {
  id: ID
  businessId: ID
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: UserRole
  permissions: Permission[]
  avatarUrl?: string
  isActive: boolean
  lastLoginAt?: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** Payload de creation/invitation d'un utilisateur au sein d'un commerce. */
export interface CreateUserPayload {
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: UserRole
}

/** Payload de mise a jour partielle d'un utilisateur. */
export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'email'> & { isActive: boolean }>
