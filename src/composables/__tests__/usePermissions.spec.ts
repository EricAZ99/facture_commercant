import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { usePermissions } from '../usePermissions'
import { useAuthStore } from '@/stores'
import { ROLE_PERMISSIONS } from '@/constants'
import type { Permission, User, UserRole } from '@/types'

/** Construit un utilisateur factice avec le role/les permissions donnes, pour les tests. */
function fakeUser(role: UserRole, permissions: Permission[]): User {
  return {
    id: 'user-1',
    businessId: 'business-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role,
    permissions,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
}

describe('usePermissions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("can() renvoie false quand aucun utilisateur n'est connecte", () => {
    const { can } = usePermissions()
    expect(can('invoice:create')).toBe(false)
  })

  it('can() reflete exactement les permissions du role connecte (source de verite backend)', () => {
    const authStore = useAuthStore()
    authStore.user = fakeUser('cashier', ROLE_PERMISSIONS.cashier)

    const { can } = usePermissions()
    // Le caissier peut lire les factures et encaisser...
    expect(can('invoice:read')).toBe(true)
    expect(can('payment:create')).toBe(true)
    // ... mais ne peut pas creer de facture ni gerer l'equipe.
    expect(can('invoice:create')).toBe(false)
    expect(can('user:manage')).toBe(false)
  })

  it("canAny() est vrai des qu'une seule des permissions demandees est accordee", () => {
    const authStore = useAuthStore()
    authStore.user = fakeUser('cashier', ROLE_PERMISSIONS.cashier)

    const { canAny } = usePermissions()
    expect(canAny(['invoice:create', 'invoice:read'])).toBe(true)
    expect(canAny(['invoice:create', 'user:manage'])).toBe(false)
  })

  it("canAll() n'est vrai que si toutes les permissions demandees sont accordees", () => {
    const authStore = useAuthStore()
    authStore.user = fakeUser('manager', ROLE_PERMISSIONS.manager)

    const { canAll } = usePermissions()
    expect(canAll(['invoice:create', 'invoice:read'])).toBe(true)
    // Le manager n'a pas le droit de suppression.
    expect(canAll(['invoice:create', 'invoice:delete'])).toBe(false)
  })

  it('le proprietaire (owner) dispose de toutes les permissions', () => {
    const authStore = useAuthStore()
    authStore.user = fakeUser('owner', ROLE_PERMISSIONS.owner)

    const { can, role } = usePermissions()
    const allPermissions: Permission[] = [
      'client:create',
      'invoice:delete',
      'user:manage',
      'settings:manage',
      'subscription:manage'
    ]
    allPermissions.forEach((permission) => expect(can(permission)).toBe(true))
    expect(role.value).toBe('owner')
  })
})
