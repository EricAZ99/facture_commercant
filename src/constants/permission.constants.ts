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

/** Libelles affichables de chaque permission granulaire. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  'client:create': 'Creer des clients',
  'client:read': 'Consulter les clients',
  'client:update': 'Modifier les clients',
  'client:delete': 'Supprimer des clients',
  'product:create': 'Creer des produits',
  'product:read': 'Consulter les produits',
  'product:update': 'Modifier les produits',
  'product:delete': 'Supprimer des produits',
  'invoice:create': 'Creer des factures/devis',
  'invoice:read': 'Consulter les factures/devis',
  'invoice:update': 'Modifier les factures/devis',
  'invoice:delete': 'Supprimer des factures/devis',
  'payment:create': 'Enregistrer des paiements',
  'payment:read': 'Consulter les paiements',
  'dashboard:read': 'Consulter le tableau de bord',
  'report:read': 'Consulter les rapports',
  'user:manage': "Gerer l'equipe",
  'subscription:read': "Consulter l'abonnement",
  'subscription:manage': "Gerer l'abonnement",
  'settings:manage': 'Gerer les parametres du commerce'
}

/** Regroupement des permissions par ressource, pour l'affichage en matrice editable. */
export const PERMISSION_GROUPS: Array<{ label: string; permissions: Permission[] }> = [
  {
    label: 'Clients',
    permissions: ['client:create', 'client:read', 'client:update', 'client:delete']
  },
  {
    label: 'Produits',
    permissions: ['product:create', 'product:read', 'product:update', 'product:delete']
  },
  {
    label: 'Factures & devis',
    permissions: ['invoice:create', 'invoice:read', 'invoice:update', 'invoice:delete']
  },
  { label: 'Paiements', permissions: ['payment:create', 'payment:read'] },
  { label: 'Tableau de bord & rapports', permissions: ['dashboard:read', 'report:read'] },
  { label: 'Equipe', permissions: ['user:manage'] },
  { label: 'Abonnement', permissions: ['subscription:read', 'subscription:manage'] },
  { label: 'Parametres', permissions: ['settings:manage'] }
]
