<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import BusinessForm from '@/components/business/BusinessForm.vue'
import DangerZoneCard from '@/components/business/DangerZoneCard.vue'
import DeleteAccountDialog from '@/components/business/DeleteAccountDialog.vue'
import DeveloperSettingsCard from '@/components/business/DeveloperSettingsCard.vue'
import LogoUploader from '@/components/business/LogoUploader.vue'
import MyAccountCard from '@/components/business/MyAccountCard.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { ROUTE_NAMES } from '@/constants'
import { useBusiness, useMyAccount, usePermissions } from '@/composables'
import { useAuthStore } from '@/stores'
import type { ApiError, UpdateBusinessPayload } from '@/types'

const authStore = useAuthStore()
const router = useRouter()
const { can } = usePermissions()
const {
  business,
  isSaving,
  isUploadingLogo,
  isUploadingStamp,
  isRegeneratingApiKey,
  isExporting,
  isDeletingAccount,
  submitUpdate,
  submitLogo,
  submitStamp,
  regenerateApiKey,
  exportData,
  deleteAccount
} = useBusiness()

const isOwner = authStore.role === 'owner'

// --- Suppression du compte individuel (non-proprietaire) ------------------

const { isDeleting: isDeletingMyAccount, removeMyAccount } = useMyAccount()
const isDeleteMyAccountDialogOpen = ref(false)

async function onConfirmDeleteMyAccount(): Promise<void> {
  const error = await removeMyAccount()
  if (!error) {
    isDeleteMyAccountDialogOpen.value = false
    await router.push({ name: ROUTE_NAMES.login })
  }
}

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

async function onStampUpload(file: File): Promise<void> {
  await submitStamp(file)
}

async function onSubmitWebhook(payload: {
  webhookUrl?: string
  webhookEvents: string[]
}): Promise<void> {
  await submitUpdate(payload)
}

// --- Suppression du compte ------------------------------------------------

const isDeleteDialogOpen = ref(false)
const deleteServerErrors = ref<Record<string, string[]> | null>(null)

function openDeleteDialog(): void {
  deleteServerErrors.value = null
  isDeleteDialogOpen.value = true
}

async function onConfirmDelete(confirmName: string): Promise<void> {
  deleteServerErrors.value = null
  const error = await deleteAccount(confirmName)
  if (error) {
    deleteServerErrors.value = error.details ?? null
    return
  }
  isDeleteDialogOpen.value = false
  await router.push({ name: ROUTE_NAMES.login })
}
</script>

<template>
  <div>
    <PageHeader :title="$t('settings.title')" :subtitle="$t('settings.subtitle')" />

    <div class="flex flex-col gap-4">
      <BaseCard :title="$t('settings.myAccount')">
        <MyAccountCard />
      </BaseCard>

      <div v-if="!isOwner" class="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6">
        <h2 class="text-sm font-semibold text-red-900">
          {{ $t('settings.deleteMyAccountTitle') }}
        </h2>
        <p class="mt-1 text-sm text-red-700">
          {{ $t('settings.deleteMyAccountText') }}
        </p>
        <BaseButton
          variant="danger"
          size="sm"
          class="mt-3"
          @click="isDeleteMyAccountDialogOpen = true"
        >
          {{ $t('settings.deleteMyAccountTitle') }}
        </BaseButton>
      </div>

      <BaseCard :title="$t('settings.logo')">
        <LogoUploader
          :logo-url="business?.logoUrl"
          :business-name="business?.name"
          :uploading="isUploadingLogo"
          @upload="onLogoUpload"
        />
      </BaseCard>

      <BaseCard v-if="can('settings:manage')" :title="$t('settings.stamp')">
        <LogoUploader
          :logo-url="business?.stampUrl"
          :business-name="business?.name"
          :uploading="isUploadingStamp"
          item-label="tampon"
          @upload="onStampUpload"
        />
      </BaseCard>

      <BaseCard v-if="can('settings:manage')" :title="$t('settings.businessSettings')">
        <BusinessForm
          :business="business"
          :submitting="isSaving"
          :server-errors="formServerErrors"
          @submit="onBusinessSubmit"
        />
      </BaseCard>

      <BaseCard v-else :title="$t('settings.business')">
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-500">{{ $t('settings.name') }}</dt>
            <dd class="font-medium text-gray-900">{{ business?.name }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">{{ $t('settings.email') }}</dt>
            <dd class="font-medium text-gray-900">{{ business?.email }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">{{ $t('settings.currency') }}</dt>
            <dd class="font-medium text-gray-900">{{ business?.currency }}</dd>
          </div>
        </dl>
        <p class="mt-4 text-sm text-gray-500">
          {{ $t('settings.adminOnly') }}
        </p>
      </BaseCard>

      <BaseCard v-if="can('settings:manage')" :title="$t('settings.developer')">
        <DeveloperSettingsCard
          :business="business"
          :regenerating-key="isRegeneratingApiKey"
          :saving-webhook="isSaving"
          @regenerate-key="regenerateApiKey"
          @submit-webhook="onSubmitWebhook"
        />
      </BaseCard>

      <BaseCard v-if="can('settings:manage')" :title="$t('settings.dataBackup')">
        <p class="mb-3 text-sm text-gray-500">
          {{ $t('settings.dataBackupText') }}
        </p>
        <BaseButton variant="outline" :loading="isExporting" @click="exportData">
          <Download class="size-4" aria-hidden="true" />
          {{ $t('settings.exportData') }}
        </BaseButton>
      </BaseCard>

      <DangerZoneCard v-if="isOwner" @delete-account="openDeleteDialog" />
    </div>

    <BaseModal
      :open="isDeleteDialogOpen"
      :title="$t('settings.deleteBusinessTitle')"
      @close="isDeleteDialogOpen = false"
    >
      <DeleteAccountDialog
        :business-name="business?.name ?? ''"
        :submitting="isDeletingAccount"
        :server-errors="deleteServerErrors"
        @confirm="onConfirmDelete"
        @cancel="isDeleteDialogOpen = false"
      />
    </BaseModal>

    <ConfirmDialog
      :open="isDeleteMyAccountDialogOpen"
      :title="$t('settings.deleteMyAccountTitle')"
      :message="$t('settings.confirmDeleteMyAccountMessage')"
      :confirm-label="$t('settings.deleteMyAccountTitle')"
      variant="danger"
      :loading="isDeletingMyAccount"
      @confirm="onConfirmDeleteMyAccount"
      @cancel="isDeleteMyAccountDialogOpen = false"
    />
  </div>
</template>
