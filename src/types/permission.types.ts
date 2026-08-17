/**
 * Modele de permissions/roles.
 *
 * IMPORTANT : ce modele ne sert qu'a l'experience utilisateur cote
 * frontend (afficher/masquer un bouton, un menu, une route). Il ne
 * constitue jamais un controle de securite reel : celui-ci est
 * obligatoirement applique par le backend sur chaque requete. Le role et
 * la liste de permissions d'un utilisateur sont renvoyes a
 * l'authentification et ne doivent jamais etre deduits cote client.
 */

/**
 * Roles metier disponibles au sein d'un commerce (tenant). `owner` est
 * reserve au createur du commerce (attribue a l'inscription, jamais
 * assignable via l'invitation d'equipe) ; les quatre autres sont les roles
 * proposes lors de l'invitation d'un utilisateur (voir `INVITABLE_ROLES`).
 */
export type UserRole = 'owner' | 'admin' | 'manager' | 'accountant' | 'cashier'

/**
 * Permissions granulaires, au format `ressource:action`. Les ressources
 * suivant un cycle de vie CRUD utilisent `create/read/update/delete` ;
 * les ressources administratives (utilisateurs, abonnement, parametres)
 * utilisent `manage`, plus adapte qu'un decoupage CRUD artificiel.
 */
export type Permission =
  | 'client:create'
  | 'client:read'
  | 'client:update'
  | 'client:delete'
  | 'product:create'
  | 'product:read'
  | 'product:update'
  | 'product:delete'
  | 'invoice:create'
  | 'invoice:read'
  | 'invoice:update'
  | 'invoice:delete'
  | 'payment:create'
  | 'payment:read'
  | 'dashboard:read'
  | 'report:read'
  | 'user:manage'
  | 'subscription:read'
  | 'subscription:manage'
  | 'settings:manage'
