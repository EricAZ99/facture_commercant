<script setup lang="ts">
import { Plus, Search, UserCog } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import UserForm from '@/components/users/UserForm.vue'
import UserList from '@/components/users/UserList.vue'
import { useUsers } from '@/composables'
import { useAuthStore } from '@/stores'
import type { ApiError, CreateUserPayload, User, UserRole } from '@/types'

const authStore = useAuthStore()

const {
  store,
  search,
  pagination,
  isSubmitting,
  isDeleting,
  load,
  nextPage,
  prevPage,
  submitInvite,
  changeRole,
  toggleActive,
  removeUser
} = useUsers()

onMounted(() => load())

// --- Invitation -----------------------------------------------------------

const isFormOpen = ref(false)
const formServerErrors = ref<Record<string, string[]> | null>(null)

function openInviteForm(): void {
  formServerErrors.value = null
  isFormOpen.value = true
}

function closeForm(): void {
  isFormOpen.value = false
  formServerErrors.value = null
}

async function onFormSubmit(payload: CreateUserPayload): Promise<void> {
  formServerErrors.value = null
  const error: ApiError | null = await submitInvite(payload)
  if (error) {
    formServerErrors.value = error.details ?? null
    return
  }
  closeForm()
}

// --- Role -----------------------------------------------------------------

async function onChangeRole(user: User, role: UserRole): Promise<void> {
  await changeRole(user, role)
}

// --- Suppression ------------------------------------------------------

const userPendingDelete = ref<User | null>(null)

function askDelete(user: User): void {
  userPendingDelete.value = user
}

async function confirmDelete(): Promise<void> {
  if (!userPendingDelete.value) return
  const success = await removeUser(userPendingDelete.value)
  if (success) userPendingDelete.value = null
}
</script>

<template>
  <div>
    <PageHeader title="Equipe" subtitle="Gerez les utilisateurs de votre commerce.">
      <template #actions>
        <BaseButton @click="openInviteForm">
          <Plus class="size-4" aria-hidden="true" />
          Inviter un utilisateur
        </BaseButton>
      </template>
    </PageHeader>

    <BaseCard>
      <div class="mb-4">
        <div class="relative max-w-sm">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            type="search"
            placeholder="Rechercher un utilisateur..."
            class="focus-ring w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      <LoadingState
        v-if="store.isLoading && store.items.length === 0"
        message="Chargement de l'equipe..."
      />
      <ErrorState
        v-else-if="store.status === 'error' && store.items.length === 0"
        :message="store.error?.message"
        @retry="load"
      />
      <EmptyState
        v-else-if="store.items.length === 0"
        :icon="UserCog"
        title="Aucun utilisateur"
        :message="
          search
            ? 'Aucun resultat pour cette recherche.'
            : 'Invitez votre premier collaborateur pour commencer.'
        "
      />

      <template v-else>
        <UserList
          :users="store.items"
          :current-user-id="authStore.user?.id ?? ''"
          @change-role="onChangeRole"
          @toggle-active="toggleActive"
          @delete="askDelete"
        />

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ store.meta.total }} utilisateur(s)</p>
          <div class="flex items-center gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="!pagination.hasPrevPage.value"
              @click="prevPage"
            >
              Precedent
            </BaseButton>
            <span>Page {{ pagination.page.value }} / {{ pagination.totalPages.value }}</span>
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="!pagination.hasNextPage.value"
              @click="nextPage"
            >
              Suivant
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseCard>

    <BaseModal :open="isFormOpen" title="Inviter un utilisateur" @close="closeForm">
      <UserForm
        :submitting="isSubmitting"
        :server-errors="formServerErrors"
        @submit="onFormSubmit"
        @cancel="closeForm"
      />
    </BaseModal>

    <ConfirmDialog
      :open="userPendingDelete !== null"
      title="Supprimer l'utilisateur"
      :message="
        userPendingDelete
          ? `Voulez-vous vraiment supprimer ${userPendingDelete.firstName} ${userPendingDelete.lastName} ? Cette action est irreversible.`
          : ''
      "
      confirm-label="Supprimer"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="userPendingDelete = null"
    />
  </div>
</template>
