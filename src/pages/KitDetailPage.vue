<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import CreateInvoiceFromKitDialog from '@/components/kits/CreateInvoiceFromKitDialog.vue'
import KitDetails from '@/components/kits/KitDetails.vue'
import KitForm from '@/components/kits/KitForm.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useApi, useKitInvoicing, useKits } from '@/composables'
import { ROUTE_NAMES } from '@/constants'
import { kitService } from '@/services'
import { useAuthStore } from '@/stores'
import type { ApiError, CreateKitPayload } from '@/types'

interface Props {
  id: string
}

const props = defineProps<Props>()

const router = useRouter()
const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')
const { isSubmitting, isDeleting, submitUpdate, removeKit } = useKits()
const { isCreating: isCreatingInvoice, createInvoiceFromKit } = useKitInvoicing()

const { data: kit, isLoading, isError, error, execute } = useApi(kitService.getById)

onMounted(() => execute(props.id))

// --- Modification ---------------------------------------------------------

const isFormOpen = ref(false)
const formServerErrors = ref<Record<string, string[]> | null>(null)

function openEditForm(): void {
  formServerErrors.value = null
  isFormOpen.value = true
}

async function onFormSubmit(payload: CreateKitPayload): Promise<void> {
  const err: ApiError | null = await submitUpdate(props.id, payload)
  if (err) {
    formServerErrors.value = err.details ?? null
    return
  }
  isFormOpen.value = false
  await execute(props.id)
}

// --- Suppression ------------------------------------------------------

const isDeleteDialogOpen = ref(false)

async function confirmDelete(): Promise<void> {
  if (!kit.value) return
  const success = await removeKit(kit.value)
  if (success) {
    await router.push({ name: ROUTE_NAMES.kits })
  }
}

// --- Facturation --------------------------------------------------------

const isInvoiceDialogOpen = ref(false)

async function onCreateInvoice(clientId: string): Promise<void> {
  if (!kit.value) return
  const invoice = await createInvoiceFromKit(kit.value, clientId)
  if (invoice) {
    isInvoiceDialogOpen.value = false
    await router.push({ name: ROUTE_NAMES.invoiceDetail, params: { id: invoice.id } })
  }
}
</script>

<template>
  <div>
    <RouterLink
      :to="{ name: ROUTE_NAMES.kits }"
      class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Retour aux kits
    </RouterLink>

    <PageHeader :title="kit?.name ?? 'Kit'" subtitle="Details du kit." />

    <LoadingState v-if="isLoading" message="Chargement du kit..." />
    <ErrorState v-else-if="isError" :message="error?.message" @retry="() => execute(props.id)" />

    <KitDetails
      v-else-if="kit"
      :kit="kit"
      :currency="currency"
      @edit="openEditForm"
      @delete="isDeleteDialogOpen = true"
      @invoice="isInvoiceDialogOpen = true"
    />

    <BaseModal :open="isFormOpen" title="Modifier le kit" @close="isFormOpen = false">
      <KitForm
        :kit="kit"
        :submitting="isSubmitting"
        :server-errors="formServerErrors"
        :currency="currency"
        @submit="onFormSubmit"
        @cancel="isFormOpen = false"
      />
    </BaseModal>

    <BaseModal
      :open="isInvoiceDialogOpen"
      title="Facturer ce kit"
      @close="isInvoiceDialogOpen = false"
    >
      <CreateInvoiceFromKitDialog
        :submitting="isCreatingInvoice"
        @submit="onCreateInvoice"
        @cancel="isInvoiceDialogOpen = false"
      />
    </BaseModal>

    <ConfirmDialog
      :open="isDeleteDialogOpen"
      title="Supprimer le kit"
      :message="
        kit ? `Voulez-vous vraiment supprimer ${kit.name} ? Cette action est irreversible.` : ''
      "
      confirm-label="Supprimer"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="isDeleteDialogOpen = false"
    />
  </div>
</template>
