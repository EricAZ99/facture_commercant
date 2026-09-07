<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { reactive, ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import LogoUploader from '@/components/business/LogoUploader.vue'
import { useMyAccount } from '@/composables'
import { useAuthStore } from '@/stores'
import type { ApiError } from '@/types'
import { formatDateTime } from '@/utils/formatters'

const authStore = useAuthStore()
const {
  isUploadingAvatar,
  isChangingEmail,
  isChangingPassword,
  isExporting,
  loginHistory,
  isLoadingHistory,
  loadLoginHistory,
  submitAvatar,
  submitChangeEmail,
  submitChangePassword,
  exportMyData
} = useMyAccount()

void loadLoginHistory()

async function onAvatarUpload(file: File): Promise<void> {
  await submitAvatar(file)
}

// --- Changement d'email ------------------------------------------------

const isEmailFormOpen = ref(false)
const emailForm = reactive({ newEmail: '', password: '' })
const emailServerErrors = ref<Record<string, string[]> | null>(null)

function openEmailForm(): void {
  emailForm.newEmail = ''
  emailForm.password = ''
  emailServerErrors.value = null
  isEmailFormOpen.value = true
}

async function onEmailSubmit(): Promise<void> {
  emailServerErrors.value = null
  const error: ApiError | null = await submitChangeEmail(emailForm)
  if (error) {
    emailServerErrors.value = error.details ?? null
    return
  }
  isEmailFormOpen.value = false
}

// --- Changement de mot de passe ------------------------------------------

const isPasswordFormOpen = ref(false)
const passwordForm = reactive({ currentPassword: '', newPassword: '' })
const passwordServerErrors = ref<Record<string, string[]> | null>(null)

function openPasswordForm(): void {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordServerErrors.value = null
  isPasswordFormOpen.value = true
}

async function onPasswordSubmit(): Promise<void> {
  passwordServerErrors.value = null
  const error: ApiError | null = await submitChangePassword(passwordForm)
  if (error) {
    passwordServerErrors.value = error.details ?? null
    return
  }
  isPasswordFormOpen.value = false
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start gap-4">
      <LogoUploader
        :logo-url="authStore.user?.avatarUrl"
        :business-name="`${authStore.user?.firstName ?? ''} ${authStore.user?.lastName ?? ''}`"
        :uploading="isUploadingAvatar"
        item-label="photo"
        @upload="onAvatarUpload"
      />
    </div>

    <dl class="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
      <div>
        <dt class="text-gray-500">{{ $t('settings.name') }}</dt>
        <dd class="font-medium text-gray-900">
          {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500">{{ $t('clients.form.emailLabel') }}</dt>
        <dd class="flex items-center gap-2 font-medium text-gray-900">
          {{ authStore.user?.email }}
          <button
            type="button"
            class="focus-ring rounded text-xs font-medium text-primary-600 hover:underline"
            @click="openEmailForm"
          >
            {{ $t('invoices.detail.edit') }}
          </button>
        </dd>
      </div>
      <div>
        <dt class="text-gray-500">{{ $t('users.list.columnRole') }}</dt>
        <dd class="font-medium text-gray-900">
          {{ authStore.role ? $t(`roles.${authStore.role}`) : '-' }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500">{{ $t('auth.passwordLabel') }}</dt>
        <dd class="flex items-center gap-2 font-medium text-gray-900">
          ••••••••
          <button
            type="button"
            class="focus-ring rounded text-xs font-medium text-primary-600 hover:underline"
            @click="openPasswordForm"
          >
            {{ $t('invoices.detail.edit') }}
          </button>
        </dd>
      </div>
    </dl>

    <form
      v-if="isEmailFormOpen"
      class="flex flex-col gap-3 rounded-lg border border-gray-200 p-3"
      @submit.prevent="onEmailSubmit"
    >
      <BaseInput
        v-model="emailForm.newEmail"
        type="email"
        :label="$t('settingsMyAccountForm.newEmailLabel')"
        :error="emailServerErrors?.newEmail?.[0]"
        required
      />
      <BaseInput
        v-model="emailForm.password"
        type="password"
        :label="$t('settingsMyAccountForm.currentPasswordLabel')"
        :hint="$t('settingsMyAccountForm.currentPasswordHint')"
        :error="emailServerErrors?.password?.[0]"
        required
      />
      <div class="flex justify-end gap-2">
        <BaseButton type="button" variant="outline" @click="isEmailFormOpen = false">
          {{ $t('common.cancel') }}
        </BaseButton>
        <BaseButton type="submit" :loading="isChangingEmail">{{ $t('common.save') }}</BaseButton>
      </div>
    </form>

    <form
      v-if="isPasswordFormOpen"
      class="flex flex-col gap-3 rounded-lg border border-gray-200 p-3"
      @submit.prevent="onPasswordSubmit"
    >
      <BaseInput
        v-model="passwordForm.currentPassword"
        type="password"
        :label="$t('settingsMyAccountForm.currentPasswordLabel')"
        :error="passwordServerErrors?.currentPassword?.[0]"
        required
      />
      <BaseInput
        v-model="passwordForm.newPassword"
        type="password"
        :label="$t('auth.resetPassword.newPasswordLabel')"
        :error="passwordServerErrors?.newPassword?.[0]"
        required
      />
      <div class="flex justify-end gap-2">
        <BaseButton type="button" variant="outline" @click="isPasswordFormOpen = false">
          {{ $t('common.cancel') }}
        </BaseButton>
        <BaseButton type="submit" :loading="isChangingPassword">{{ $t('common.save') }}</BaseButton>
      </div>
    </form>

    <div class="border-t border-gray-100 pt-4">
      <p class="mb-2 text-sm font-medium text-gray-700">
        {{ $t('settingsMyAccountForm.loginHistoryTitle') }}
      </p>
      <p v-if="isLoadingHistory && loginHistory.length === 0" class="text-sm text-gray-400">
        {{ $t('notifications.loading') }}
      </p>
      <p v-else-if="loginHistory.length === 0" class="text-sm text-gray-400">
        {{ $t('settingsMyAccountForm.noLoginHistory') }}
      </p>
      <ul v-else class="flex flex-col gap-1 text-sm">
        <li
          v-for="entry in loginHistory.slice(0, 5)"
          :key="entry.id"
          class="flex justify-between text-gray-600"
        >
          <span>{{ formatDateTime(entry.createdAt) }}</span>
          <span class="truncate text-xs text-gray-400">{{ entry.ipAddress }}</span>
        </li>
      </ul>
    </div>

    <div class="border-t border-gray-100 pt-4">
      <BaseButton variant="outline" size="sm" :loading="isExporting" @click="exportMyData">
        <Download class="size-4" aria-hidden="true" />
        {{ $t('settingsMyAccountForm.exportData') }}
      </BaseButton>
    </div>
  </div>
</template>
