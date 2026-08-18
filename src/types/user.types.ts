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
  /** Departement/equipe interne (texte libre, ex: "Ventes", "Comptabilite"). */
  department?: string
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
  department?: string
}

/**
 * Payload de mise a jour partielle d'un utilisateur. `permissions` permet
 * d'affiner la matrice de permissions d'un utilisateur au-dela du jeu par
 * defaut de son role (voir `UserPermissionsDialog.vue`) ; independant du
 * champ `role` qui reste la source des permissions par defaut.
 */
export type UpdateUserPayload = Partial<
  Omit<CreateUserPayload, 'email'> & { isActive: boolean; permissions: Permission[] }
>
