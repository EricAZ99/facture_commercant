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

/**
 * Roles proposables lors de l'invitation d'un utilisateur ou du changement
 * de role. `owner` est exclu : il n'existe qu'une fois par commerce et
 * n'est jamais attribuable via l'equipe.
 */
export const INVITABLE_ROLES: UserRole[] = ['admin', 'manager', 'accountant', 'cashier']

/** Libelles affichables de chaque permission granulaire. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  'client:create': 'permissions.client:create',
  'client:read': 'permissions.client:read',
  'client:update': 'permissions.client:update',
  'client:delete': 'permissions.client:delete',
  'product:create': 'permissions.product:create',
  'product:read': 'permissions.product:read',
  'product:update': 'permissions.product:update',
  'product:delete': 'permissions.product:delete',
  'invoice:create': 'permissions.invoice:create',
  'invoice:read': 'permissions.invoice:read',
  'invoice:update': 'permissions.invoice:update',
  'invoice:delete': 'permissions.invoice:delete',
  'payment:create': 'permissions.payment:create',
  'payment:read': 'permissions.payment:read',
  'dashboard:read': 'permissions.dashboard:read',
  'report:read': 'permissions.report:read',
  'user:manage': 'permissions.user:manage',
  'subscription:read': 'permissions.subscription:read',
  'subscription:manage': 'permissions.subscription:manage',
  'settings:manage': 'permissions.settings:manage'
}

/** Regroupement des permissions par ressource, pour l'affichage en matrice editable. */
export const PERMISSION_GROUPS: Array<{ label: string; permissions: Permission[] }> = [
  {
    label: 'permissionGroups.clients',
    permissions: ['client:create', 'client:read', 'client:update', 'client:delete']
  },
  {
    label: 'permissionGroups.products',
    permissions: ['product:create', 'product:read', 'product:update', 'product:delete']
  },
  {
    label: 'permissionGroups.invoicesQuotes',
    permissions: ['invoice:create', 'invoice:read', 'invoice:update', 'invoice:delete']
  },
  { label: 'permissionGroups.payments', permissions: ['payment:create', 'payment:read'] },
  {
    label: 'permissionGroups.dashboardReports',
    permissions: ['dashboard:read', 'report:read']
  },
  { label: 'permissionGroups.team', permissions: ['user:manage'] },
  {
    label: 'permissionGroups.subscription',
    permissions: ['subscription:read', 'subscription:manage']
  },
  { label: 'permissionGroups.settings', permissions: ['settings:manage'] }
]
