<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import CategoryManagerDialog from '@/components/products/CategoryManagerDialog.vue'
import ProductDetails from '@/components/products/ProductDetails.vue'
import ProductForm from '@/components/products/ProductForm.vue'
import ProductImageUploader from '@/components/products/ProductImageUploader.vue'
import ProductStockPanel from '@/components/products/ProductStockPanel.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useApi, useProductCategories, useProducts, useProductStock } from '@/composables'
import { ROUTE_NAMES } from '@/constants'
import { productService } from '@/services'
import { useAuthStore } from '@/stores'
import type { ApiError, CreateProductPayload } from '@/types'

interface Props {
  id: string
}

const props = defineProps<Props>()

const router = useRouter()
const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')
const { isSubmitting, isDeleting, submitUpdate, removeProduct } = useProducts()
const { options: categoryOptions, ensureLoaded: ensureCategoriesLoaded } = useProductCategories()
void ensureCategoriesLoaded()

const { data: product, isLoading, isError, error, execute } = useApi(productService.getById)

const {
  isUploadingImage,
  isAdjustingStock,
  movements,
  isLoadingMovements,
  uploadImage,
  loadMovements,
  adjustStock
} = useProductStock(props.id)

onMounted(async () => {
  await execute(props.id)
  if (product.value?.type === 'product') void loadMovements()
})

// --- Photo ------------------------------------------------------------

async function onImageUpload(file: File): Promise<void> {
  const updated = await uploadImage(file)
  if (updated) product.value = updated
}

// --- Stock --------------------------------------------------------------

async function onStockAdjust(delta: number, reason: string): Promise<void> {
  const updated = await adjustStock(delta, reason)
  if (updated) product.value = updated
}

// --- Modification ---------------------------------------------------------

const isFormOpen = ref(false)
const formServerErrors = ref<Record<string, string[]> | null>(null)
const isCategoryManagerOpen = ref(false)

function openEditForm(): void {
  formServerErrors.value = null
  isFormOpen.value = true
}

async function onFormSubmit(payload: CreateProductPayload): Promise<void> {
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
  if (!product.value) return
  const success = await removeProduct(product.value)
  if (success) {
    await router.push({ name: ROUTE_NAMES.products })
  }
}
</script>

<template>
  <div>
    <RouterLink
      :to="{ name: ROUTE_NAMES.products }"
      class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Retour aux produits
    </RouterLink>

    <PageHeader :title="product?.name ?? 'Produit'" subtitle="Details du produit." />

    <LoadingState v-if="isLoading" message="Chargement du produit..." />
    <ErrorState v-else-if="isError" :message="error?.message" @retry="() => execute(props.id)" />

    <div v-else-if="product" class="flex flex-col gap-4">
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p class="mb-3 text-sm font-semibold text-gray-900">Photo</p>
        <ProductImageUploader
          :image-url="product.imageUrl"
          :uploading="isUploadingImage"
          @upload="onImageUpload"
        />
      </div>

      <ProductDetails
        :product="product"
        :currency="currency"
        @edit="openEditForm"
        @delete="isDeleteDialogOpen = true"
      />

      <ProductStockPanel
        v-if="product.type === 'product'"
        :current-stock="product.stock ?? 0"
        :movements="movements"
        :is-loading-movements="isLoadingMovements"
        :is-adjusting="isAdjustingStock"
        @adjust="onStockAdjust"
      />
    </div>

    <BaseModal :open="isFormOpen" title="Modifier le produit" @close="isFormOpen = false">
      <ProductForm
        :product="product"
        :submitting="isSubmitting"
        :server-errors="formServerErrors"
        :category-options="categoryOptions"
        @submit="onFormSubmit"
        @cancel="isFormOpen = false"
        @manage-categories="isCategoryManagerOpen = true"
      />
    </BaseModal>

    <CategoryManagerDialog :open="isCategoryManagerOpen" @close="isCategoryManagerOpen = false" />

    <ConfirmDialog
      :open="isDeleteDialogOpen"
      title="Supprimer le produit"
      :message="
        product
          ? `Voulez-vous vraiment supprimer ${product.name} ? Cette action est irreversible.`
          : ''
      "
      confirm-label="Supprimer"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="isDeleteDialogOpen = false"
    />
  </div>
</template>
