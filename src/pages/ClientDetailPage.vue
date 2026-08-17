<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import ClientDetails from '@/components/clients/ClientDetails.vue'
import ClientForm from '@/components/clients/ClientForm.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useApi, useClients } from '@/composables'
import { ROUTE_NAMES } from '@/constants'
import { clientService } from '@/services'
import type { ApiError, CreateClientPayload } from '@/types'

interface Props {
  id: string
}

const props = defineProps<Props>()

const router = useRouter()
const { isSubmitting, isDeleting, submitUpdate, removeClient } = useClients()

const { data: client, isLoading, isError, error, execute } = useApi(clientService.getById)

onMounted(() => execute(props.id))

// --- Modification ---------------------------------------------------------

const isFormOpen = ref(false)
const formServerErrors = ref<Record<string, string[]> | null>(null)

function openEditForm(): void {
  formServerErrors.value = null
  isFormOpen.value = true
}

async function onFormSubmit(payload: CreateClientPayload): Promise<void> {
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
  if (!client.value) return
  const success = await removeClient(client.value)
  if (success) {
    await router.push({ name: ROUTE_NAMES.clients })
  }
}
</script>

<template>
  <div>
    <RouterLink
      :to="{ name: ROUTE_NAMES.clients }"
      class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Retour aux clients
    </RouterLink>

    <PageHeader
      :title="client ? `${client.firstName} ${client.lastName}` : 'Client'"
      subtitle="Details du client."
    />

    <LoadingState v-if="isLoading" message="Chargement du client..." />
    <ErrorState v-else-if="isError" :message="error?.message" @retry="() => execute(props.id)" />

    <ClientDetails
      v-else-if="client"
      :client="client"
      @edit="openEditForm"
      @delete="isDeleteDialogOpen = true"
    />

    <BaseModal :open="isFormOpen" title="Modifier le client" @close="isFormOpen = false">
      <ClientForm
        :client="client"
        :submitting="isSubmitting"
        :server-errors="formServerErrors"
        @submit="onFormSubmit"
        @cancel="isFormOpen = false"
      />
    </BaseModal>

    <ConfirmDialog
      :open="isDeleteDialogOpen"
      title="Supprimer le client"
      :message="
        client
          ? `Voulez-vous vraiment supprimer ${client.firstName} ${client.lastName} ? Cette action est irreversible.`
          : ''
      "
      confirm-label="Supprimer"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="isDeleteDialogOpen = false"
    />
  </div>
</template>
