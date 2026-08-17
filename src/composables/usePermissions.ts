import { computed } from 'vue'

import { useAuthStore } from '@/stores'
import type { Permission } from '@/types'

/**
 * Verifications de permissions/roles pour l'UI (affichage conditionnel de
 * boutons, menus, routes). Ne remplace jamais le controle d'acces effectue
 * cote backend, qui reste la source de verite en cas de conflit.
 */
export function usePermissions() {
  const authStore = useAuthStore()

  function can(permission: Permission): boolean {
    return authStore.hasPermission(permission)
  }

  function canAny(permissions: Permission[]): boolean {
    return authStore.hasAnyPermission(permissions)
  }

  function canAll(permissions: Permission[]): boolean {
    return permissions.every((permission) => authStore.hasPermission(permission))
  }

  const role = computed(() => authStore.role)

  return { can, canAny, canAll, role }
}
