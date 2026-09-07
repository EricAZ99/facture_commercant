<script setup lang="ts">
import { Download, Package, Plus, Search, Settings2, Upload } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BulkActionBar from '@/components/base/BulkActionBar.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import CategoryManagerDialog from '@/components/products/CategoryManagerDialog.vue'
import ProductForm from '@/components/products/ProductForm.vue'
import ProductImportDialog from '@/components/products/ProductImportDialog.vue'
import ProductList from '@/components/products/ProductList.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useProductCategories, useProducts, usePermissions } from '@/composables'
import { ROUTE_NAMES } from '@/constants'
import { useAuthStore } from '@/stores'
import type { ApiError, CreateProductPayload, Product } from '@/types'

const { can } = usePermissions()

const router = useRouter()
const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const {
  store,
  search,
  categoryFilter,
  pagination,
  isSubmitting,
  isDeleting,
  isExporting,
  isImporting,
  isBulkDeleting,
  load,
  nextPage,
  prevPage,
  submitCreate,
  submitUpdate,
  removeProduct,
  exportProducts,
  exportSelectedProducts,
  bulkDeleteProducts,
  importProductsFromCsv
} = useProducts()

const { options: categoryOptions, ensureLoaded: ensureCategoriesLoaded } = useProductCategories()

onMounted(() => {
  void load()
  void ensureCategoriesLoaded()
})

// --- Sélection multiple --------------------------------------------------

const selection = ref<string[]>([])

function clearSelection(): void {
  selection.value = []
}

async function onBulkAction(action: string): Promise<void> {
  if (action === 'export') {
    await exportSelectedProducts(selection.value)
  } else if (action === 'delete') {
    const ok = await bulkDeleteProducts(selection.value)
    if (ok) clearSelection()
  }
}

// --- Import / export ------------------------------------------------------

const isImportDialogOpen = ref(false)
const importDialogRef = ref<InstanceType<typeof ProductImportDialog> | null>(null)

async function onImport(fileText: string): Promise<void> {
  const result = await importProductsFromCsv(fileText)
  if (result && result.createdCount > 0 && result.errors.length === 0) {
    isImportDialogOpen.value = false
  }
  importDialogRef.value?.reset()
}

// --- Categories -------------------------------------------------------

const isCategoryManagerOpen = ref(false)

// --- Creation / modification ---------------------------------------------

const isFormOpen = ref(false)
const editingProduct = ref<Product | null>(null)
const formServerErrors = ref<Record<string, string[]> | null>(null)

function openCreateForm(): void {
  editingProduct.value = null
  formServerErrors.value = null
  isFormOpen.value = true
}

function openEditForm(product: Product): void {
  editingProduct.value = product
  formServerErrors.value = null
  isFormOpen.value = true
}

function closeForm(): void {
  isFormOpen.value = false
  editingProduct.value = null
  formServerErrors.value = null
}

async function onFormSubmit(payload: CreateProductPayload): Promise<void> {
  formServerErrors.value = null
  const error: ApiError | null = editingProduct.value
    ? await submitUpdate(editingProduct.value.id, payload)
    : await submitCreate(payload)

  if (error) {
    formServerErrors.value = error.details ?? null
    return
  }
  closeForm()
}

// --- Suppression ------------------------------------------------------

const productPendingDelete = ref<Product | null>(null)

function askDelete(product: Product): void {
  productPendingDelete.value = product
}

function cancelDelete(): void {
  productPendingDelete.value = null
}

async function confirmDelete(): Promise<void> {
  if (!productPendingDelete.value) return
  const success = await removeProduct(productPendingDelete.value)
  if (success) productPendingDelete.value = null
}

// --- Consultation -------------------------------------------------------

function viewProduct(product: Product): void {
  router.push({ name: ROUTE_NAMES.productDetail, params: { id: product.id } })
}
</script>

<template>
  <div>
    <PageHeader :title="$t('products.title')" :subtitle="$t('products.subtitle')">
      <template #actions>
        <BaseButton variant="outline" :loading="isExporting" @click="exportProducts">
          <Download v-if="!isExporting" class="size-4" aria-hidden="true" />
          {{ $t('common.export') }}
        </BaseButton>
        <BaseButton
          v-if="can('product:create')"
          variant="outline"
          @click="isImportDialogOpen = true"
        >
          <Upload class="size-4" aria-hidden="true" />
          {{ $t('products.import') }}
        </BaseButton>
        <BaseButton
          v-if="can('product:create')"
          variant="outline"
          @click="isCategoryManagerOpen = true"
        >
          <Settings2 class="size-4" aria-hidden="true" />
          {{ $t('products.categories') }}
        </BaseButton>
        <BaseButton v-if="can('product:create')" @click="openCreateForm">
          <Plus class="size-4" aria-hidden="true" />
          {{ $t('products.newProduct') }}
        </BaseButton>
      </template>
    </PageHeader>

    <BaseCard>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="relative max-w-sm flex-1">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            type="search"
            :placeholder="$t('products.searchPlaceholder')"
            class="focus-ring w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <select
          v-model="categoryFilter"
          class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option value="">{{ $t('products.allCategories') }}</option>
          <option v-for="option in categoryOptions" :key="option.id" :value="option.id">
            {{ '—'.repeat(option.depth) }} {{ option.label }}
          </option>
        </select>
      </div>

      <LoadingState
        v-if="store.isLoading && store.items.length === 0"
        :message="$t('products.loading')"
      />
      <ErrorState
        v-else-if="store.status === 'error' && store.items.length === 0"
        :message="store.error?.message"
        @retry="load"
      />
      <EmptyState
        v-else-if="store.items.length === 0"
        :icon="Package"
        :title="$t('products.emptyTitle')"
        :message="
          search || categoryFilter
            ? $t('products.emptyMessageSearch')
            : $t('products.emptyMessageDefault')
        "
      />

      <template v-else>
        <ProductList
          :products="store.items"
          :currency="currency"
          :selection="selection"
          @view="viewProduct"
          @edit="openEditForm"
          @delete="askDelete"
          @update:selection="selection = $event"
        />

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ $t('products.count', { count: store.meta.total }) }}</p>
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
      :title="editingProduct ? $t('products.editTitle') : $t('products.newProduct')"
      @close="closeForm"
    >
      <ProductForm
        :product="editingProduct"
        :submitting="isSubmitting"
        :server-errors="formServerErrors"
        :category-options="categoryOptions"
        @submit="onFormSubmit"
        @cancel="closeForm"
        @manage-categories="isCategoryManagerOpen = true"
      />
    </BaseModal>

    <CategoryManagerDialog :open="isCategoryManagerOpen" @close="isCategoryManagerOpen = false" />

    <ConfirmDialog
      :open="productPendingDelete !== null"
      :title="$t('products.confirmDeleteTitle')"
      :message="
        productPendingDelete
          ? $t('products.confirmDeleteMessage', { name: productPendingDelete.name })
          : ''
      "
      :confirm-label="$t('common.delete')"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <ProductImportDialog
      ref="importDialogRef"
      :open="isImportDialogOpen"
      :submitting="isImporting"
      @import="onImport"
      @close="isImportDialogOpen = false"
    />

    <BulkActionBar
      :count="selection.length"
      :actions="[
        { label: $t('common.export'), emit: 'export', variant: 'outline', loading: isExporting },
        ...(can('product:delete')
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
