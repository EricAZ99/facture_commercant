<script setup lang="ts">
import { Download, GitMerge, Plus, Search, Upload, Users } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BulkActionBar from '@/components/base/BulkActionBar.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import ClientForm from '@/components/clients/ClientForm.vue'
import ClientImportDialog from '@/components/clients/ClientImportDialog.vue'
import ClientList from '@/components/clients/ClientList.vue'
import MergeClientsDialog from '@/components/clients/MergeClientsDialog.vue'
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
  isExporting,
  isImporting,
  isMerging,
  isBulkDeleting,
  load,
  nextPage,
  prevPage,
  submitCreate,
  submitUpdate,
  removeClient,
  exportClients,
  exportSelectedClients,
  bulkDeleteClients,
  importClientsFromCsv,
  mergeClients
} = useClients()

onMounted(() => load())

// --- Sélection multiple --------------------------------------------------

const selection = ref<string[]>([])

function clearSelection(): void {
  selection.value = []
}

async function onBulkAction(action: string): Promise<void> {
  if (action === 'export') {
    await exportSelectedClients(selection.value)
  } else if (action === 'delete') {
    const ok = await bulkDeleteClients(selection.value)
    if (ok) clearSelection()
  }
}

// --- Import / export / fusion --------------------------------------------

const isImportDialogOpen = ref(false)
const importDialogRef = ref<InstanceType<typeof ClientImportDialog> | null>(null)

async function onImport(fileText: string): Promise<void> {
  const result = await importClientsFromCsv(fileText)
  if (result && result.createdCount > 0 && result.errors.length === 0) {
    isImportDialogOpen.value = false
  }
  importDialogRef.value?.reset()
}

const isMergeDialogOpen = ref(false)

async function onMerge(primary: Client, duplicate: Client): Promise<void> {
  const success = await mergeClients(primary, duplicate)
  if (success) isMergeDialogOpen.value = false
}

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
    <PageHeader :title="$t('clients.title')" :subtitle="$t('clients.subtitle')">
      <template #actions>
        <BaseButton variant="outline" :loading="isExporting" @click="exportClients">
          <Download v-if="!isExporting" class="size-4" aria-hidden="true" />
          {{ $t('common.export') }}
        </BaseButton>
        <BaseButton
          v-if="can('client:create')"
          variant="outline"
          @click="isImportDialogOpen = true"
        >
          <Upload class="size-4" aria-hidden="true" />
          {{ $t('clients.import') }}
        </BaseButton>
        <BaseButton v-if="can('client:update')" variant="outline" @click="isMergeDialogOpen = true">
          <GitMerge class="size-4" aria-hidden="true" />
          {{ $t('clients.merge') }}
        </BaseButton>
        <BaseButton v-if="can('client:create')" @click="openCreateForm">
          <Plus class="size-4" aria-hidden="true" />
          {{ $t('clients.newClient') }}
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
            :placeholder="$t('clients.searchPlaceholder')"
            class="focus-ring w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      <LoadingState
        v-if="store.isLoading && store.items.length === 0"
        :message="$t('clients.loading')"
      />
      <ErrorState
        v-else-if="store.status === 'error' && store.items.length === 0"
        :message="store.error?.message"
        @retry="load"
      />
      <EmptyState
        v-else-if="store.items.length === 0"
        :icon="Users"
        :title="$t('clients.emptyTitle')"
        :message="search ? $t('clients.emptyMessageSearch') : $t('clients.emptyMessageDefault')"
      />

      <template v-else>
        <ClientList
          :clients="store.items"
          :selection="selection"
          @view="viewClient"
          @edit="openEditForm"
          @delete="askDelete"
          @update:selection="selection = $event"
        />

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ $t('clients.count', { count: store.meta.total }) }}</p>
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

    <BaseModal
      :open="isFormOpen"
      :title="editingClient ? $t('clients.editTitle') : $t('clients.newClient')"
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
      :title="$t('clients.confirmDeleteTitle')"
      :message="
        clientPendingDelete
          ? $t('clients.confirmDeleteMessage', {
              name: `${clientPendingDelete.firstName} ${clientPendingDelete.lastName}`
            })
          : ''
      "
      :confirm-label="$t('common.delete')"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <ClientImportDialog
      ref="importDialogRef"
      :open="isImportDialogOpen"
      :submitting="isImporting"
      @import="onImport"
      @close="isImportDialogOpen = false"
    />

    <MergeClientsDialog
      :open="isMergeDialogOpen"
      :submitting="isMerging"
      @merge="onMerge"
      @close="isMergeDialogOpen = false"
    />

    <BulkActionBar
      :count="selection.length"
      :actions="[
        { label: $t('common.export'), emit: 'export', variant: 'outline', loading: isExporting },
        ...(can('client:delete')
          ? [
              {
                label: $t('common.delete'),
                emit: 'delete',
                variant: 'danger' as const,
                loading: isBulkDeleting
              }
            ]
          : [])
      ]"
      @action="onBulkAction"
      @clear="clearSelection"
    />
  </div>
</template>
