import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { userService } from '@/services'
import type {
  ApiError,
  AsyncStatus,
  CreateUserPayload,
  ID,
  InvitedUser,
  ListQueryParams,
  PaginationMeta,
  UpdateUserPayload,
  User
} from '@/types'

const EMPTY_META: PaginationMeta = { page: 1, perPage: 10, total: 0, totalPages: 1 }

/**
 * Etat global de l'equipe (page courante, pagination, statut). Les
 * mutations (invite/update/delete) se contentent d'appeler le service et
 * de renvoyer le resultat : c'est a l'appelant (voir `useUsers`) de
 * decider quand rafraichir la liste.
 */
export const useUsersStore = defineStore('users', () => {
  const items = ref<User[]>([])
  const meta = ref<PaginationMeta>(EMPTY_META)
  const status = ref<AsyncStatus>('idle')
  const error = ref<ApiError | null>(null)

  const isLoading = computed(() => status.value === 'loading')

  async function fetchUsers(params?: ListQueryParams & { department?: string }): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      const response = await userService.list(params)
      items.value = response.data
      meta.value = response.meta
      status.value = 'success'
    } catch (err) {
      error.value = err as ApiError
      status.value = 'error'
    }
  }

  /**
   * Invite un nouvel utilisateur (creation directe dans ce mock, pas de flux
   * d'acceptation par email) : le mot de passe temporaire genere est renvoye
   * une seule fois, a charge de l'appelant de l'afficher pour transmission.
   */
  function inviteUser(payload: CreateUserPayload): Promise<InvitedUser> {
    return userService.create(payload)
  }

  function updateUser(id: ID, payload: UpdateUserPayload): Promise<User> {
    return userService.update(id, payload)
  }

  function deleteUser(id: ID): Promise<void> {
    return userService.remove(id)
  }

  /** Regenere le mot de passe temporaire d'un utilisateur existant. */
  function resetPassword(id: ID): Promise<InvitedUser> {
    return userService.resetPassword(id)
  }

  return {
    items,
    meta,
    status,
    error,
    isLoading,
    fetchUsers,
    inviteUser,
    updateUser,
    deleteUser,
    resetPassword
  }
})
