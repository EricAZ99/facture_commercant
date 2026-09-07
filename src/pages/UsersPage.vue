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
import UserCredentialsDialog from '@/components/users/UserCredentialsDialog.vue'
import UserForm from '@/components/users/UserForm.vue'
import UserList from '@/components/users/UserList.vue'
import UserPermissionsDialog from '@/components/users/UserPermissionsDialog.vue'
import { useUsers } from '@/composables'
import { useAuthStore } from '@/stores'
import type { ApiError, CreateUserPayload, Permission, User, UserRole } from '@/types'

const authStore = useAuthStore()

const {
  store,
  search,
  departmentFilter,
  pagination,
  isSubmitting,
  isDeleting,
  isUpdatingPermissions,
  isTogglingActive,
  isResettingPassword,
  credentialsToShow,
  load,
  nextPage,
  prevPage,
  submitInvite,
  resetPassword,
  changeRole,
  toggleActive,
  updatePermissions,
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

// --- Mot de passe (regeneration) ------------------------------------------

const userPendingPasswordReset = ref<User | null>(null)

function onResetPassword(user: User): void {
  userPendingPasswordReset.value = user
}

async function confirmResetPassword(): Promise<void> {
  if (!userPendingPasswordReset.value) return
  const success = await resetPassword(userPendingPasswordReset.value)
  if (success) userPendingPasswordReset.value = null
}

// --- Activation / desactivation ---------------------------------------

const userPendingDeactivation = ref<User | null>(null)

function onToggleActive(user: User): void {
  // Desactiver coupe immediatement l'acces de l'utilisateur (voir mock-server) :
  // demande confirmation. Reactiver est sans risque, pas besoin de confirmer.
  if (user.isActive) {
    userPendingDeactivation.value = user
    return
  }
  void toggleActive(user)
}

async function confirmDeactivate(): Promise<void> {
  if (!userPendingDeactivation.value) return
  const success = await toggleActive(userPendingDeactivation.value)
  if (success) userPendingDeactivation.value = null
}

// --- Role -----------------------------------------------------------------

const userPendingRoleChange = ref<{ user: User; role: UserRole } | null>(null)
const isChangingRole = ref(false)

function onChangeRole(user: User, role: UserRole): void {
  userPendingRoleChange.value = { user, role }
}

async function confirmRoleChange(): Promise<void> {
  if (!userPendingRoleChange.value) return
  isChangingRole.value = true
  try {
    const { user, role } = userPendingRoleChange.value
    const success = await changeRole(user, role)
    if (success) userPendingRoleChange.value = null
  } finally {
    isChangingRole.value = false
  }
}

function cancelRoleChange(): void {
  userPendingRoleChange.value = null
}

// --- Permissions ------------------------------------------------------

const userEditingPermissions = ref<User | null>(null)

function openPermissionsDialog(user: User): void {
  userEditingPermissions.value = user
}

async function onPermissionsSubmit(permissions: Permission[]): Promise<void> {
  if (!userEditingPermissions.value) return
  const success = await updatePermissions(userEditingPermissions.value, permissions)
  if (success) userEditingPermissions.value = null
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
    <PageHeader :title="$t('users.title')" :subtitle="$t('users.subtitle')">
      <template #actions>
        <BaseButton @click="openInviteForm">
          <Plus class="size-4" aria-hidden="true" />
          {{ $t('users.invite') }}
        </BaseButton>
      </template>
    </PageHeader>

    <BaseCard>
      <div class="mb-4 flex flex-col gap-3 sm:flex-row">
        <div class="relative max-w-sm flex-1">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            type="search"
            :placeholder="$t('users.searchPlaceholder')"
            class="focus-ring w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <input
          v-model="departmentFilter"
          type="search"
          :placeholder="$t('users.departmentFilterPlaceholder')"
          class="focus-ring w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
        />
      </div>

      <LoadingState
        v-if="store.isLoading && store.items.length === 0"
        :message="$t('users.loading')"
      />
      <ErrorState
        v-else-if="store.status === 'error' && store.items.length === 0"
        :message="store.error?.message"
        @retry="load"
      />
      <EmptyState
        v-else-if="store.items.length === 0"
        :icon="UserCog"
        :title="$t('users.emptyTitle')"
        :message="search ? $t('users.emptyMessageSearch') : $t('users.emptyMessageDefault')"
      />

      <template v-else>
        <UserList
          :users="store.items"
          :current-user-id="authStore.user?.id ?? ''"
          :pending-role-change="userPendingRoleChange"
          @change-role="onChangeRole"
          @toggle-active="onToggleActive"
          @edit-permissions="openPermissionsDialog"
          @reset-password="onResetPassword"
          @delete="askDelete"
        />

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ $t('users.count', { count: store.meta.total }) }}</p>
          <div class="flex items-center gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="!pagination.hasPrevPage.value"
              @click="prevPage"
            >
              {{ $t('common.previous') }}
            </BaseButton>
            <span>Page {{ pagination.page.value }} / {{ pagination.totalPages.value }}</span>
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="!pagination.hasNextPage.value"
              @click="nextPage"
            >
              {{ $t('common.next') }}
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseCard>

    <BaseModal :open="isFormOpen" :title="$t('users.invite')" @close="closeForm">
      <UserForm
        :submitting="isSubmitting"
        :server-errors="formServerErrors"
        @submit="onFormSubmit"
        @cancel="closeForm"
      />
    </BaseModal>

    <BaseModal
      :open="credentialsToShow !== null"
      :title="$t('users.credentialsModalTitle')"
      @close="credentialsToShow = null"
    >
      <UserCredentialsDialog
        v-if="credentialsToShow"
        :user="credentialsToShow"
        @close="credentialsToShow = null"
      />
    </BaseModal>

    <BaseModal
      :open="userEditingPermissions !== null"
      :title="$t('users.editPermissions')"
      @close="userEditingPermissions = null"
    >
      <UserPermissionsDialog
        v-if="userEditingPermissions"
        :user="userEditingPermissions"
        :submitting="isUpdatingPermissions"
        @submit="onPermissionsSubmit"
        @cancel="userEditingPermissions = null"
      />
    </BaseModal>

    <ConfirmDialog
      :open="userPendingDelete !== null"
      :title="$t('users.confirmDeleteTitle')"
      :message="
        userPendingDelete
          ? $t('users.confirmDeleteMessage', {
              name: `${userPendingDelete.firstName} ${userPendingDelete.lastName}`
            })
          : ''
      "
      :confirm-label="$t('common.delete')"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="userPendingDelete = null"
    />

    <ConfirmDialog
      :open="userPendingDeactivation !== null"
      :title="$t('users.confirmDeactivateTitle')"
      :message="
        userPendingDeactivation
          ? $t('users.confirmDeactivateMessage', {
              name: `${userPendingDeactivation.firstName} ${userPendingDeactivation.lastName}`
            })
          : ''
      "
      :confirm-label="$t('users.deactivate')"
      :loading="isTogglingActive"
      @confirm="confirmDeactivate"
      @cancel="userPendingDeactivation = null"
    />

    <ConfirmDialog
      :open="userPendingRoleChange !== null"
      :title="$t('users.confirmRoleChangeTitle')"
      variant="primary"
      :message="
        userPendingRoleChange
          ? $t('users.confirmRoleChangeMessage', {
              name: `${userPendingRoleChange.user.firstName} ${userPendingRoleChange.user.lastName}`,
              oldRole: $t(`roles.${userPendingRoleChange.user.role}`),
              newRole: $t(`roles.${userPendingRoleChange.role}`)
            })
          : ''
      "
      :confirm-label="$t('users.confirmRoleChangeConfirmLabel')"
      :loading="isChangingRole"
      @confirm="confirmRoleChange"
      @cancel="cancelRoleChange"
    />

    <ConfirmDialog
      :open="userPendingPasswordReset !== null"
      :title="$t('users.resetPassword')"
      variant="primary"
      :message="
        userPendingPasswordReset
          ? $t('users.confirmResetPasswordMessage', {
              name: `${userPendingPasswordReset.firstName} ${userPendingPasswordReset.lastName}`
            })
          : ''
      "
      :confirm-label="$t('users.confirmResetPasswordConfirmLabel')"
      :loading="isResettingPassword"
      @confirm="confirmResetPassword"
      @cancel="userPendingPasswordReset = null"
    />
  </div>
</template>
