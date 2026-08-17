<script setup lang="ts">
import { Plus, Search, Users } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import ClientForm from '@/components/clients/ClientForm.vue'
import ClientList from '@/components/clients/ClientList.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useClients, usePermissions } from '@/composables'
import { ROUTE_NAMES } from '@/constants'
import type { ApiError, Client, CreateClientPayload } from '@/types'

const router = useRouter()
const { can } = usePermissions()
const {
  store,
  search,
  pagination,
  isSubmitting,
  isDeleting,
  load,
  nextPage,
  prevPage,
  submitCreate,
  submitUpdate,
  removeClient
} = useClients()

onMounted(() => load())

// --- Creation / modification ---------------------------------------------

const isFormOpen = ref(false)
const editingClient = ref<Client | null>(null)
const formServerErrors = ref<Record<string, string[]> | null>(null)

function openCreateForm(): void {
  editingClient.value = null
  formServerErrors.value = null
  isFormOpen.value = true
}

function openEditForm(client: Client): void {
  editingClient.value = client
  formServerErrors.value = null
  isFormOpen.value = true
}

function closeForm(): void {
  isFormOpen.value = false
  editingClient.value = null
  formServerErrors.value = null
}

async function onFormSubmit(payload: CreateClientPayload): Promise<void> {
  formServerErrors.value = null
  const error: ApiError | null = editingClient.value
    ? await submitUpdate(editingClient.value.id, payload)
    : await submitCreate(payload)

  if (error) {
    formServerErrors.value = error.details ?? null
    return
  }
  closeForm()
}

// --- Suppression ------------------------------------------------------

const clientPendingDelete = ref<Client | null>(null)

function askDelete(client: Client): void {
  clientPendingDelete.value = client
}

function cancelDelete(): void {
  clientPendingDelete.value = null
}

async function confirmDelete(): Promise<void> {
  if (!clientPendingDelete.value) return
  const success = await removeClient(clientPendingDelete.value)
  if (success) clientPendingDelete.value = null
}

// --- Consultation -------------------------------------------------------

function viewClient(client: Client): void {
  router.push({ name: ROUTE_NAMES.clientDetail, params: { id: client.id } })
}
</script>

<template>
  <div>
    <PageHeader title="Clients" subtitle="Gerez les clients de votre commerce.">
      <template #actions>
        <BaseButton v-if="can('client:create')" @click="openCreateForm">
          <Plus class="size-4" aria-hidden="true" />
          Nouveau client
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
            placeholder="Rechercher un client..."
            class="focus-ring w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      <LoadingState
        v-if="store.isLoading && store.items.length === 0"
        message="Chargement des clients..."
      />
      <ErrorState
        v-else-if="store.status === 'error' && store.items.length === 0"
        :message="store.error?.message"
        @retry="load"
      />
      <EmptyState
        v-else-if="store.items.length === 0"
        :icon="Users"
        title="Aucun client"
        :message="
          search
            ? 'Aucun resultat pour cette recherche.'
            : 'Ajoutez votre premier client pour commencer.'
        "
      />

      <template v-else>
        <ClientList
          :clients="store.items"
          @view="viewClient"
          @edit="openEditForm"
          @delete="askDelete"
        />

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ store.meta.total }} client(s)</p>
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

    <BaseModal
      :open="isFormOpen"
      :title="editingClient ? 'Modifier le client' : 'Nouveau client'"
      @close="closeForm"
    >
      <ClientForm
        :client="editingClient"
        :submitting="isSubmitting"
        :server-errors="formServerErrors"
        @submit="onFormSubmit"
        @cancel="closeForm"
      />
    </BaseModal>

    <ConfirmDialog
      :open="clientPendingDelete !== null"
      title="Supprimer le client"
      :message="
        clientPendingDelete
          ? `Voulez-vous vraiment supprimer ${clientPendingDelete.firstName} ${clientPendingDelete.lastName} ? Cette action est irreversible.`
          : ''
      "
      confirm-label="Supprimer"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
