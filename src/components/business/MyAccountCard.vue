<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { reactive, ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import LogoUploader from '@/components/business/LogoUploader.vue'
import { ROLE_LABELS } from '@/constants'
import { useMyAccount } from '@/composables'
import { useAuthStore } from '@/stores'
import type { ApiError } from '@/types'
import { formatDateTime } from '@/utils/formatters'

const authStore = useAuthStore()
const {
  isUploadingAvatar,
  isChangingEmail,
  isExporting,
  loginHistory,
  isLoadingHistory,
  loadLoginHistory,
  submitAvatar,
  submitChangeEmail,
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
        <dt class="text-gray-500">Nom</dt>
        <dd class="font-medium text-gray-900">
          {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500">Email</dt>
        <dd class="flex items-center gap-2 font-medium text-gray-900">
          {{ authStore.user?.email }}
          <button
            type="button"
            class="focus-ring rounded text-xs font-medium text-primary-600 hover:underline"
            @click="openEmailForm"
          >
            Modifier
          </button>
        </dd>
      </div>
      <div>
        <dt class="text-gray-500">Role</dt>
        <dd class="font-medium text-gray-900">
          {{ authStore.role ? ROLE_LABELS[authStore.role] : '-' }}
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
        label="Nouvel email"
        :error="emailServerErrors?.newEmail?.[0]"
        required
      />
      <BaseInput
        v-model="emailForm.password"
        type="password"
        label="Mot de passe actuel"
        hint="Requis pour confirmer le changement."
        :error="emailServerErrors?.password?.[0]"
        required
      />
      <div class="flex justify-end gap-2">
        <BaseButton type="button" variant="outline" @click="isEmailFormOpen = false">
          Annuler
        </BaseButton>
        <BaseButton type="submit" :loading="isChangingEmail">Enregistrer</BaseButton>
      </div>
    </form>

    <div class="border-t border-gray-100 pt-4">
      <p class="mb-2 text-sm font-medium text-gray-700">Historique de connexion</p>
      <p v-if="isLoadingHistory && loginHistory.length === 0" class="text-sm text-gray-400">
        Chargement...
      </p>
      <p v-else-if="loginHistory.length === 0" class="text-sm text-gray-400">
        Aucune connexion enregistree.
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
        Exporter mes donnees personnelles
      </BaseButton>
    </div>
  </div>
</template>
