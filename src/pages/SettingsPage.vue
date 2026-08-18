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
    <PageHeader title="Parametres" subtitle="Informations de votre commerce et de votre compte." />

    <div class="flex flex-col gap-4">
      <BaseCard title="Mon compte">
        <MyAccountCard />
      </BaseCard>

      <div v-if="!isOwner" class="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6">
        <h2 class="text-sm font-semibold text-red-900">Supprimer mon compte</h2>
        <p class="mt-1 text-sm text-red-700">
          Supprime definitivement votre compte individuel (vous perdez l'acces a ce commerce). Cette
          action ne peut pas etre annulee.
        </p>
        <BaseButton
          variant="danger"
          size="sm"
          class="mt-3"
          @click="isDeleteMyAccountDialogOpen = true"
        >
          Supprimer mon compte
        </BaseButton>
      </div>

      <BaseCard title="Logo du commerce">
        <LogoUploader
          :logo-url="business?.logoUrl"
          :business-name="business?.name"
          :uploading="isUploadingLogo"
          @upload="onLogoUpload"
        />
      </BaseCard>

      <BaseCard v-if="can('settings:manage')" title="Tampon / signature numerique">
        <LogoUploader
          :logo-url="business?.stampUrl"
          :business-name="business?.name"
          :uploading="isUploadingStamp"
          item-label="tampon"
          @upload="onStampUpload"
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

      <BaseCard v-if="can('settings:manage')" title="Developpeur">
        <DeveloperSettingsCard
          :business="business"
          :regenerating-key="isRegeneratingApiKey"
          :saving-webhook="isSaving"
          @regenerate-key="regenerateApiKey"
          @submit-webhook="onSubmitWebhook"
        />
      </BaseCard>

      <BaseCard v-if="can('settings:manage')" title="Sauvegarde des donnees">
        <p class="mb-3 text-sm text-gray-500">
          Telechargez une copie complete des donnees de votre commerce (clients, produits, factures,
          devis, avoirs, paiements, equipe) au format JSON.
        </p>
        <BaseButton variant="outline" :loading="isExporting" @click="exportData">
          <Download class="size-4" aria-hidden="true" />
          Exporter mes donnees
        </BaseButton>
      </BaseCard>

      <DangerZoneCard v-if="isOwner" @delete-account="openDeleteDialog" />
    </div>

    <BaseModal
      :open="isDeleteDialogOpen"
      title="Supprimer le compte commerce"
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
      title="Supprimer mon compte"
      message="Voulez-vous vraiment supprimer votre compte individuel ? Vous perdrez immediatement l'acces a ce commerce. Cette action est irreversible."
      confirm-label="Supprimer mon compte"
      variant="danger"
      :loading="isDeletingMyAccount"
      @confirm="onConfirmDeleteMyAccount"
      @cancel="isDeleteMyAccountDialogOpen = false"
    />
  </div>
</template>
