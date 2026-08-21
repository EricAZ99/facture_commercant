<script setup lang="ts">
import { Layers, Plus, Search } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import KitForm from '@/components/kits/KitForm.vue'
import KitList from '@/components/kits/KitList.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useKits, usePermissions } from '@/composables'
import { ROUTE_NAMES } from '@/constants'
import { useAuthStore } from '@/stores'
import type { ApiError, CreateKitPayload, ProductKit } from '@/types'

const { can } = usePermissions()

const router = useRouter()
const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

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
  removeKit
} = useKits()

onMounted(() => load())

// --- Creation / modification ---------------------------------------------

const isFormOpen = ref(false)
const editingKit = ref<ProductKit | null>(null)
const formServerErrors = ref<Record<string, string[]> | null>(null)

function openCreateForm(): void {
  editingKit.value = null
  formServerErrors.value = null
  isFormOpen.value = true
}

function openEditForm(kit: ProductKit): void {
  editingKit.value = kit
  formServerErrors.value = null
  isFormOpen.value = true
}

function closeForm(): void {
  isFormOpen.value = false
  editingKit.value = null
  formServerErrors.value = null
}

async function onFormSubmit(payload: CreateKitPayload): Promise<void> {
  formServerErrors.value = null
  const error: ApiError | null = editingKit.value
    ? await submitUpdate(editingKit.value.id, payload)
    : await submitCreate(payload)

  if (error) {
    formServerErrors.value = error.details ?? null
    return
  }
  closeForm()
}

// --- Suppression ------------------------------------------------------

const kitPendingDelete = ref<ProductKit | null>(null)

async function confirmDelete(): Promise<void> {
  if (!kitPendingDelete.value) return
  const success = await removeKit(kitPendingDelete.value)
  if (success) kitPendingDelete.value = null
}

// --- Consultation -------------------------------------------------------

function viewKit(kit: ProductKit): void {
  router.push({ name: ROUTE_NAMES.kitDetail, params: { id: kit.id } })
}
</script>

<template>
  <div>
    <PageHeader title="Kits" subtitle="Groupez plusieurs produits pour les vendre ensemble.">
      <template #actions>
        <BaseButton v-if="can('product:create')" @click="openCreateForm">
          <Plus class="size-4" aria-hidden="true" />
          Nouveau kit
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
            placeholder="Rechercher un kit..."
            class="focus-ring w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      <LoadingState
        v-if="store.isLoading && store.items.length === 0"
        message="Chargement des kits..."
      />
      <ErrorState
        v-else-if="store.status === 'error' && store.items.length === 0"
        :message="store.error?.message"
        @retry="load"
      />
      <EmptyState
        v-else-if="store.items.length === 0"
        :icon="Layers"
        title="Aucun kit"
        :message="
          search
            ? 'Aucun resultat pour cette recherche.'
            : 'Creez votre premier kit pour vendre plusieurs produits ensemble.'
        "
      />

      <template v-else>
        <KitList
          :kits="store.items"
          :currency="currency"
          @view="viewKit"
          @edit="openEditForm"
          @delete="(kit) => (kitPendingDelete = kit)"
        />

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ store.meta.total }} kit(s)</p>
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
      :title="editingKit ? 'Modifier le kit' : 'Nouveau kit'"
      @close="closeForm"
    >
      <KitForm
        :kit="editingKit"
        :submitting="isSubmitting"
        :server-errors="formServerErrors"
        :currency="currency"
        @submit="onFormSubmit"
        @cancel="closeForm"
      />
    </BaseModal>

    <ConfirmDialog
      :open="kitPendingDelete !== null"
      title="Supprimer le kit"
      :message="
        kitPendingDelete
          ? `Voulez-vous vraiment supprimer ${kitPendingDelete.name} ? Cette action est irreversible.`
          : ''
      "
      confirm-label="Supprimer"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="kitPendingDelete = null"
    />
  </div>
</template>
