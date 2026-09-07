<script setup lang="ts">
import { KeyRound, Power, PowerOff, ShieldCheck, Trash2 } from 'lucide-vue-next'

import BaseBadge from '@/components/base/BaseBadge.vue'
import { INVITABLE_ROLES } from '@/constants'
import type { ID, User, UserRole } from '@/types'
import { formatDate, getInitials } from '@/utils/formatters'

interface Props {
  users: User[]
  /** Utilisateur actuellement connecte : ses propres actions sensibles sont desactivees. */
  currentUserId: ID
  /**
   * Changement de role en attente de confirmation (voir UsersPage.vue). Tant
   * que la confirmation n'est pas tranchee, la ligne concernee affiche le
   * role vise plutot que le role reel — au clic sur "Annuler", ce prop
   * redevient `null` et force le <select> a revenir au role reel (un
   * changement de prop reel, contrairement au role du user qui n'a pas
   * bouge, garantit que Vue repatch bien la valeur du <select> natif).
   */
  pendingRoleChange?: { user: User; role: UserRole } | null
}

defineProps<Props>()

const emit = defineEmits<{
  changeRole: [user: User, role: UserRole]
  toggleActive: [user: User]
  editPermissions: [user: User]
  resetPassword: [user: User]
  delete: [user: User]
}>()

function onRoleChange(user: User, event: Event): void {
  const role = (event.target as HTMLSelectElement).value as UserRole
  if (role !== user.role) emit('changeRole', user, role)
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-4 font-medium">{{ $t('users.list.columnUser') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('users.list.columnRole') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('users.list.columnDepartment') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('users.list.columnStatus') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('users.list.columnLastLogin') }}</th>
          <th class="py-2 pl-4 text-right font-medium">{{ $t('users.list.columnActions') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
          <td class="py-3 pr-4">
            <div class="flex items-center gap-3">
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700"
              >
                {{ getInitials(`${user.firstName} ${user.lastName}`) }}
              </span>
              <div class="min-w-0">
                <p class="truncate font-medium text-gray-900">
                  {{ user.firstName }} {{ user.lastName }}
                  <span v-if="user.id === currentUserId" class="text-xs text-gray-400">{{
                    $t('users.you')
                  }}</span>
                </p>
                <p class="truncate text-xs text-gray-500">{{ user.email }}</p>
              </div>
            </div>
          </td>
          <td class="py-3 pr-4">
            <BaseBadge v-if="user.role === 'owner'" variant="info">{{
              $t('roles.owner')
            }}</BaseBadge>
            <select
              v-else
              class="focus-ring rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900"
              :value="pendingRoleChange?.user.id === user.id ? pendingRoleChange.role : user.role"
              @change="onRoleChange(user, $event)"
            >
              <option v-for="role in INVITABLE_ROLES" :key="role" :value="role">
                {{ $t(`roles.${role}`) }}
              </option>
            </select>
          </td>
          <td class="py-3 pr-4 text-gray-500">{{ user.department || '-' }}</td>
          <td class="py-3 pr-4">
            <BaseBadge :variant="user.isActive ? 'success' : 'default'">
              {{ user.isActive ? $t('users.active') : $t('users.inactive') }}
            </BaseBadge>
          </td>
          <td class="py-3 pr-4 text-gray-500">
            {{ user.lastLoginAt ? formatDate(user.lastLoginAt) : $t('users.neverLoggedIn') }}
          </td>
          <td class="py-3 pl-4">
            <div class="flex justify-end gap-1">
              <button
                v-if="user.role !== 'owner' && user.id !== currentUserId"
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                :aria-label="$t('users.editPermissions')"
                :title="$t('users.editPermissions')"
                @click="emit('editPermissions', user)"
              >
                <ShieldCheck class="size-4" />
              </button>
              <button
                v-if="user.role !== 'owner' && user.id !== currentUserId"
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                :aria-label="$t('users.resetPassword')"
                :title="$t('users.resetPassword')"
                @click="emit('resetPassword', user)"
              >
                <KeyRound class="size-4" />
              </button>
              <button
                v-if="user.role !== 'owner' && user.id !== currentUserId"
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                :aria-label="user.isActive ? $t('users.deactivate') : $t('users.reactivate')"
                @click="emit('toggleActive', user)"
              >
                <PowerOff v-if="user.isActive" class="size-4" />
                <Power v-else class="size-4" />
              </button>
              <button
                v-if="user.role !== 'owner' && user.id !== currentUserId"
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                :aria-label="$t('common.delete')"
                @click="emit('delete', user)"
              >
                <Trash2 class="size-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
