<script setup lang="ts">
import { Download, Package, Plus, Search, Settings2, Upload } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
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
  load,
  nextPage,
  prevPage,
  submitCreate,
  submitUpdate,
  removeProduct,
  exportProducts,
  importProductsFromCsv
} = useProducts()

const { options: categoryOptions, ensureLoaded: ensureCategoriesLoaded } = useProductCategories()

onMounted(() => {
  void load()
  void ensureCategoriesLoaded()
})

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
    <PageHeader title="Produits" subtitle="Gerez le catalogue de produits et services.">
      <template #actions>
        <BaseButton variant="outline" :loading="isExporting" @click="exportProducts">
          <Download v-if="!isExporting" class="size-4" aria-hidden="true" />
          Exporter
        </BaseButton>
        <BaseButton
          v-if="can('product:create')"
          variant="outline"
          @click="isImportDialogOpen = true"
        >
          <Upload class="size-4" aria-hidden="true" />
          Importer
        </BaseButton>
        <BaseButton
          v-if="can('product:create')"
          variant="outline"
          @click="isCategoryManagerOpen = true"
        >
          <Settings2 class="size-4" aria-hidden="true" />
          Categories
        </BaseButton>
        <BaseButton v-if="can('product:create')" @click="openCreateForm">
          <Plus class="size-4" aria-hidden="true" />
          Nouveau produit
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
            placeholder="Rechercher un produit..."
            class="focus-ring w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <select
          v-model="categoryFilter"
          class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option value="">Toutes les categories</option>
          <option v-for="option in categoryOptions" :key="option.id" :value="option.id">
            {{ '—'.repeat(option.depth) }} {{ option.label }}
          </option>
        </select>
      </div>

      <LoadingState
        v-if="store.isLoading && store.items.length === 0"
        message="Chargement des produits..."
      />
      <ErrorState
        v-else-if="store.status === 'error' && store.items.length === 0"
        :message="store.error?.message"
        @retry="load"
      />
      <EmptyState
        v-else-if="store.items.length === 0"
        :icon="Package"
        title="Aucun produit"
        :message="
          search || categoryFilter
            ? 'Aucun resultat pour cette recherche.'
            : 'Ajoutez votre premier produit ou service pour commencer.'
        "
      />

      <template v-else>
        <ProductList
          :products="store.items"
          :currency="currency"
          @view="viewProduct"
          @edit="openEditForm"
          @delete="askDelete"
        />

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ store.meta.total }} produit(s)</p>
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
      :title="editingProduct ? 'Modifier le produit' : 'Nouveau produit'"
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
      title="Supprimer le produit"
      :message="
        productPendingDelete
          ? `Voulez-vous vraiment supprimer ${productPendingDelete.name} ? Cette action est irreversible.`
          : ''
      "
      confirm-label="Supprimer"
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
  </div>
</template>
