import type { Permission, UserRole } from '@/types'

/**
 * Table de correspondance role -> permissions par defaut, utilisee
 * uniquement comme repli local (ex: affichage optimiste avant reponse
 * serveur). La source de verite reste toujours `user.permissions`
 * renvoyee par le backend.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'client:create',
    'client:read',
    'client:update',
    'client:delete',
    'product:create',
    'product:read',
    'product:update',
    'product:delete',
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'invoice:delete',
    'payment:create',
    'payment:read',
    'dashboard:read',
    'report:read',
    'user:manage',
    'subscription:read',
    'subscription:manage',
    'settings:manage'
  ],
  admin: [
    'client:create',
    'client:read',
    'client:update',
    'client:delete',
    'product:create',
    'product:read',
    'product:update',
    'product:delete',
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'invoice:delete',
    'payment:create',
    'payment:read',
    'dashboard:read',
    'report:read',
    'user:manage',
    'settings:manage'
  ],
  manager: [
    'client:create',
    'client:read',
    'client:update',
    'product:create',
    'product:read',
    'product:update',
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'payment:create',
    'payment:read',
    'dashboard:read',
    'report:read'
  ],
  accountant: [
    'client:read',
    'product:read',
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'payment:create',
    'payment:read',
    'dashboard:read',
    'report:read'
  ],
  cashier: ['client:read', 'product:read', 'invoice:read', 'payment:create', 'payment:read']
}

/** Libelles affichables des roles. */
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Proprietaire',
  admin: 'Administrateur',
  manager: 'Manager',
  accountant: 'Comptable',
  cashier: 'Caissier'
}

/**
 * Roles proposables lors de l'invitation d'un utilisateur ou du changement
 * de role. `owner` est exclu : il n'existe qu'une fois par commerce et
 * n'est jamais attribuable via l'equipe.
 */
export const INVITABLE_ROLES: UserRole[] = ['admin', 'manager', 'accountant', 'cashier']
