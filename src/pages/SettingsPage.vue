<script setup lang="ts">
import { ref } from 'vue'

import BaseCard from '@/components/base/BaseCard.vue'
import BusinessForm from '@/components/business/BusinessForm.vue'
import LogoUploader from '@/components/business/LogoUploader.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { ROLE_LABELS } from '@/constants'
import { useBusiness, usePermissions } from '@/composables'
import { useAuthStore } from '@/stores'
import type { ApiError, UpdateBusinessPayload } from '@/types'

const authStore = useAuthStore()
const { can } = usePermissions()
const { business, isSaving, isUploadingLogo, submitUpdate, submitLogo } = useBusiness()

const formServerErrors = ref<Record<string, string[]> | null>(null)

async function onBusinessSubmit(payload: UpdateBusinessPayload): Promise<void> {
  formServerErrors.value = null
  const error: ApiError | null = await submitUpdate(payload)
  if (error) {
    formServerErrors.value = error.details ?? null
  }
}

async function onLogoUpload(file: File): Promise<void> {
  await submitLogo(file)
}
</script>

<template>
  <div>
    <PageHeader title="Parametres" subtitle="Informations de votre commerce et de votre compte." />

    <div class="flex flex-col gap-4">
      <BaseCard title="Mon compte">
        <dl class="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt class="text-gray-500">Nom</dt>
            <dd class="font-medium text-gray-900">
              {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">Email</dt>
            <dd class="font-medium text-gray-900">{{ authStore.user?.email }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Role</dt>
            <dd class="font-medium text-gray-900">
              {{ authStore.role ? ROLE_LABELS[authStore.role] : '-' }}
            </dd>
          </div>
        </dl>
      </BaseCard>

      <BaseCard title="Logo du commerce">
        <LogoUploader
          :logo-url="business?.logoUrl"
          :business-name="business?.name"
          :uploading="isUploadingLogo"
          @upload="onLogoUpload"
        />
      </BaseCard>

      <BaseCard v-if="can('settings:manage')" title="Parametres du commerce">
        <BusinessForm
          :business="business"
          :submitting="isSaving"
          :server-errors="formServerErrors"
          @submit="onBusinessSubmit"
        />
      </BaseCard>

      <BaseCard v-else title="Commerce">
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-500">Nom</dt>
            <dd class="font-medium text-gray-900">{{ business?.name }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Email</dt>
            <dd class="font-medium text-gray-900">{{ business?.email }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Devise</dt>
            <dd class="font-medium text-gray-900">{{ business?.currency }}</dd>
          </div>
        </dl>
        <p class="mt-4 text-sm text-gray-500">
          Seul un administrateur peut modifier les parametres du commerce.
        </p>
      </BaseCard>
    </div>
  </div>
</template>
