<script setup lang="ts">
import { Plus, Shield } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useAdminAdmins } from '@/composables'
import { useAdminAuthStore } from '@/stores'
import type { ApiError, InviteAdminPayload, PlatformAdmin, PlatformAdminRole } from '@/types'
import { formatDateTime } from '@/utils/formatters'

const {
  items,
  isLoading,
  isSubmitting,
  loginHistory,
  isLoadingHistory,
  load,
  loadLoginHistory,
  invite,
  update
} = useAdminAdmins()

const adminAuthStore = useAdminAuthStore()
const isSuperAdmin = adminAuthStore.admin?.role === 'super_admin'

onMounted(() => {
  void load()
  void loadLoginHistory()
})

// --- Invitation -------------------------------------------------------

const isInviteOpen = ref(false)
const inviteServerErrors = ref<Record<string, string[]> | null>(null)
const form = ref<InviteAdminPayload>({ firstName: '', lastName: '', email: '', role: 'support' })

function openInvite(): void {
  form.value = { firstName: '', lastName: '', email: '', role: 'support' }
  inviteServerErrors.value = null
  isInviteOpen.value = true
}

async function onInviteSubmit(): Promise<void> {
  inviteServerErrors.value = null
  const error: ApiError | null = await invite(form.value)
  if (error) {
    inviteServerErrors.value = error.details ?? null
    return
  }
  isInviteOpen.value = false
}

async function onRoleChange(admin: PlatformAdmin, event: Event): Promise<void> {
  const role = (event.target as HTMLSelectElement).value as PlatformAdminRole
  if (role !== admin.role) await update(admin.id, { role })
}

async function toggleActive(admin: PlatformAdmin): Promise<void> {
  await update(admin.id, { isActive: !admin.isActive })
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">Administrateurs</h1>
        <p class="mt-1 text-sm text-gray-500">Comptes ayant acces a l'espace admin plateforme.</p>
      </div>
      <BaseButton v-if="isSuperAdmin" @click="openInvite">
        <Plus class="size-4" aria-hidden="true" />
        Inviter un administrateur
      </BaseButton>
    </div>

    <BaseCard title="Comptes">
      <LoadingState v-if="isLoading && items.length === 0" message="Chargement..." />
      <EmptyState v-else-if="items.length === 0" :icon="Shield" title="Aucun administrateur" />
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th class="py-2 pr-4 font-medium">Administrateur</th>
              <th class="py-2 pr-4 font-medium">Role</th>
              <th class="py-2 pr-4 font-medium">Statut</th>
              <th class="py-2 pl-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="admin in items" :key="admin.id" class="hover:bg-gray-50">
              <td class="py-3 pr-4">
                <p class="font-medium text-gray-900">{{ admin.firstName }} {{ admin.lastName }}</p>
                <p class="text-xs text-gray-400">{{ admin.email }}</p>
              </td>
              <td class="py-3 pr-4">
                <select
                  v-if="isSuperAdmin && admin.id !== adminAuthStore.admin?.id"
                  class="focus-ring rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900"
                  :value="admin.role"
                  @change="onRoleChange(admin, $event)"
                >
                  <option value="super_admin">Super-admin</option>
                  <option value="support">Support (lecture seule)</option>
                </select>
                <BaseBadge v-else :variant="admin.role === 'super_admin' ? 'info' : 'default'">
                  {{ admin.role === 'super_admin' ? 'Super-admin' : 'Support' }}
                </BaseBadge>
              </td>
              <td class="py-3 pr-4">
                <BaseBadge :variant="admin.isActive ? 'success' : 'default'">
                  {{ admin.isActive ? 'Actif' : 'Desactive' }}
                </BaseBadge>
              </td>
              <td class="py-3 pl-4 text-right">
                <button
                  v-if="isSuperAdmin && admin.id !== adminAuthStore.admin?.id"
                  type="button"
                  class="text-sm font-medium text-primary-600 hover:underline"
                  @click="toggleActive(admin)"
                >
                  {{ admin.isActive ? 'Desactiver' : 'Reactiver' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <BaseCard title="Historique de connexion" class="mt-4">
      <LoadingState v-if="isLoadingHistory && loginHistory.length === 0" message="Chargement..." />
      <EmptyState
        v-else-if="loginHistory.length === 0"
        :icon="Shield"
        title="Aucune connexion enregistree"
      />
      <ul v-else class="flex flex-col gap-2 text-sm">
        <li v-for="entry in loginHistory" :key="entry.id" class="flex justify-between gap-4">
          <span class="text-gray-700">{{ entry.adminName }}</span>
          <span class="text-xs text-gray-400">{{ formatDateTime(entry.createdAt) }}</span>
        </li>
      </ul>
    </BaseCard>

    <BaseModal :open="isInviteOpen" title="Inviter un administrateur" @close="isInviteOpen = false">
      <form class="flex flex-col gap-4" @submit.prevent="onInviteSubmit">
        <div class="grid grid-cols-2 gap-4">
          <BaseInput
            v-model="form.firstName"
            label="Prenom"
            :error="inviteServerErrors?.firstName?.[0]"
            required
          />
          <BaseInput
            v-model="form.lastName"
            label="Nom"
            :error="inviteServerErrors?.lastName?.[0]"
            required
          />
        </div>
        <BaseInput
          v-model="form.email"
          type="email"
          label="Email"
          :error="inviteServerErrors?.email?.[0]"
          required
        />
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700" for="admin-role">Role</label>
          <select
            id="admin-role"
            v-model="form.role"
            class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            <option value="support">Support (lecture seule)</option>
            <option value="super_admin">Super-admin</option>
          </select>
        </div>
        <div class="mt-2 flex justify-end gap-2">
          <BaseButton
            type="button"
            variant="outline"
            :disabled="isSubmitting"
            @click="isInviteOpen = false"
          >
            Annuler
          </BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">Inviter</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
