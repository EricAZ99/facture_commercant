import { onUnmounted, ref, watch } from 'vue'

import { useUsersStore } from '@/stores'
import type { ApiError, CreateUserPayload, InvitedUser, Permission, User, UserRole } from '@/types'

import { usePagination } from './usePagination'
import { useToast } from './useToast'

const SEARCH_DEBOUNCE_MS = 350

/**
 * Orchestre l'equipe (utilisateurs du commerce) : recherche debouncee,
 * pagination serveur, et actions CRUD (invitation, changement de role,
 * activation/desactivation, suppression) avec notifications. S'appuie sur
 * `users.store.ts` pour l'etat/les appels API.
 */
export function useUsers() {
  const store = useUsersStore()
  const toast = useToast()
  const pagination = usePagination(10)

  const search = ref('')
  const departmentFilter = ref('')
  const isSubmitting = ref(false)
  const isDeleting = ref(false)
  const isUpdatingPermissions = ref(false)
  const isResettingPassword = ref(false)
  const isTogglingActive = ref(false)
  /**
   * Utilisateur invite (ou dont le mot de passe vient d'etre regenere) avec
   * son mot de passe temporaire, le temps de l'afficher a l'appelant — voir
   * `UserCredentialsDialog.vue`. Jamais persiste au-dela de cette session.
   */
  const credentialsToShow = ref<InvitedUser | null>(null)

  async function load(): Promise<void> {
    await store.fetchUsers({
      page: pagination.page.value,
      perPage: pagination.perPage.value,
      search: search.value.trim() || undefined,
      department: departmentFilter.value.trim() || undefined
    })
    if (store.status === 'success') {
      pagination.applyMeta(store.meta)
    }
  }

  function goToPage(target: number): void {
    if (target === pagination.page.value) return
    pagination.goToPage(target)
    void load()
  }

  function nextPage(): void {
    if (!pagination.hasNextPage.value) return
    pagination.nextPage()
    void load()
  }

  function prevPage(): void {
    if (!pagination.hasPrevPage.value) return
    pagination.prevPage()
    void load()
  }

  // Debounce de la recherche/du filtre departement : evite une requete a chaque frappe.
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch([search, departmentFilter], () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      pagination.goToPage(1)
      void load()
    }, SEARCH_DEBOUNCE_MS)
  })
  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  async function submitInvite(payload: CreateUserPayload): Promise<ApiError | null> {
    isSubmitting.value = true
    try {
      const user = await store.inviteUser(payload)
      credentialsToShow.value = user
      toast.success(`${user.firstName} ${user.lastName} a ete invite(e) avec succes.`)
      await load()
      return null
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message)
      return apiError
    } finally {
      isSubmitting.value = false
    }
  }

  /** Regenere le mot de passe temporaire d'un utilisateur (compte perdu/mot de passe egare). */
  async function resetPassword(user: User): Promise<boolean> {
    isResettingPassword.value = true
    try {
      const updated = await store.resetPassword(user.id)
      credentialsToShow.value = updated
      toast.success(`Nouveau mot de passe genere pour ${updated.firstName} ${updated.lastName}.`)
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isResettingPassword.value = false
    }
  }

  async function changeRole(user: User, role: UserRole): Promise<boolean> {
    try {
      await store.updateUser(user.id, { role })
      toast.success(`Role de ${user.firstName} ${user.lastName} mis a jour.`)
      await load()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    }
  }

  async function toggleActive(user: User): Promise<boolean> {
    isTogglingActive.value = true
    try {
      await store.updateUser(user.id, { isActive: !user.isActive })
      toast.success(
        user.isActive
          ? `${user.firstName} ${user.lastName} a ete desactive(e).`
          : `${user.firstName} ${user.lastName} a ete reactive(e).`
      )
      await load()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isTogglingActive.value = false
    }
  }

  /** Affine la matrice de permissions d'un utilisateur au-dela du jeu par defaut de son role. */
  async function updatePermissions(user: User, permissions: Permission[]): Promise<boolean> {
    isUpdatingPermissions.value = true
    try {
      await store.updateUser(user.id, { permissions })
      toast.success(`Permissions de ${user.firstName} ${user.lastName} mises a jour.`)
      await load()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isUpdatingPermissions.value = false
    }
  }

  async function removeUser(user: User): Promise<boolean> {
    isDeleting.value = true
    try {
      await store.deleteUser(user.id)
      toast.success(`${user.firstName} ${user.lastName} a ete supprime(e).`)

      // Si on vide la derniere entree d'une page > 1, on recule d'une page
      // plutot que d'afficher une page vide.
      if (store.items.length === 1 && pagination.page.value > 1) {
        pagination.goToPage(pagination.page.value - 1)
      }
      await load()
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isDeleting.value = false
    }
  }

  return {
    store,
    search,
    departmentFilter,
    pagination,
    isSubmitting,
    isDeleting,
    isUpdatingPermissions,
    isResettingPassword,
    isTogglingActive,
    credentialsToShow,
    load,
    goToPage,
    nextPage,
    prevPage,
    submitInvite,
    resetPassword,
    changeRole,
    toggleActive,
    updatePermissions,
    removeUser
  }
}
