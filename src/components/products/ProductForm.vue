<script setup lang="ts">
import { Plus, Settings2, Trash2 } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import { PRODUCT_TYPE_LABELS } from '@/constants'
import type { CreateProductPayload, ID, PriceBreak, Product, ProductType } from '@/types'
import { isRequired } from '@/utils/validators'

interface CategoryOption {
  id: ID
  label: string
  depth: number
}

interface Props {
  /** Produit a modifier ; absent/`null` => formulaire de creation. */
  product?: Product | null
  submitting?: boolean
  /** Erreurs de validation renvoyees par le backend, par champ. */
  serverErrors?: Record<string, string[]> | null
  /** Options de categorie (arborescence aplatie), voir `useProductCategories`. */
  categoryOptions?: CategoryOption[]
}

const props = withDefaults(defineProps<Props>(), {
  product: null,
  submitting: false,
  serverErrors: null,
  categoryOptions: () => []
})

const emit = defineEmits<{
  submit: [payload: CreateProductPayload]
  cancel: []
  'manage-categories': []
}>()

const { t } = useI18n()

/**
 * Etat local du formulaire : toujours des chaines (jamais `undefined`/
 * `number`), pour rester compatible avec `v-model` sur `BaseInput`. La
 * conversion en payload type (nombres, champs optionnels) se fait uniquement
 * a l'emission.
 */
interface ProductFormState {
  name: string
  description: string
  categoryId: string
  type: ProductType
  price: string
  taxRate: string
  sku: string
  stock: string
  barcode: string
  lowStockThreshold: string
}

interface PriceBreakRow {
  minQuantity: string
  price: string
}

function emptyForm(): ProductFormState {
  return {
    name: '',
    description: '',
    categoryId: '',
    type: 'product',
    price: '',
    taxRate: '0',
    sku: '',
    stock: '',
    barcode: '',
    lowStockThreshold: ''
  }
}

const form = reactive<ProductFormState>(emptyForm())
const localErrors = reactive<Partial<Record<keyof ProductFormState, string>>>({})
const priceBreakRows = ref<PriceBreakRow[]>([])

watch(
  () => props.product,
  (product) => {
    Object.assign(
      form,
      product
        ? {
            name: product.name,
            description: product.description ?? '',
            categoryId: product.categoryId,
            type: product.type,
            price: String(product.price),
            taxRate: String(product.taxRate),
            sku: product.sku ?? '',
            stock: product.stock !== undefined ? String(product.stock) : '',
            barcode: product.barcode ?? '',
            lowStockThreshold:
              product.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : ''
          }
        : emptyForm()
    )
    priceBreakRows.value = (product?.priceBreaks ?? []).map((tier) => ({
      minQuantity: String(tier.minQuantity),
      price: String(tier.price)
    }))
  },
  { immediate: true }
)

const isService = computed(() => form.type === 'service')

function addPriceBreakRow(): void {
  priceBreakRows.value.push({ minQuantity: '', price: '' })
}

function removePriceBreakRow(index: number): void {
  priceBreakRows.value.splice(index, 1)
}

/** Combine erreur locale (validation immediate) et erreur backend (apres soumission). */
function fieldError(field: keyof ProductFormState): string | undefined {
  return localErrors[field] ?? props.serverErrors?.[field]?.[0]
}

function validate(): boolean {
  localErrors.name = !isRequired(form.name) ? t('products.form.nameRequired') : undefined
  localErrors.categoryId = !isRequired(form.categoryId)
    ? t('products.form.categoryRequired')
    : undefined

  const price = Number(form.price)
  localErrors.price =
    !form.price.trim() || !Number.isFinite(price) || price <= 0
      ? t('products.form.priceInvalid')
      : undefined

  const taxRate = form.taxRate.trim() === '' ? 0 : Number(form.taxRate)
  localErrors.taxRate =
    !Number.isFinite(taxRate) || taxRate < 0 ? t('products.form.taxRateInvalid') : undefined

  if (!isService.value && form.stock.trim() !== '') {
    const stock = Number(form.stock)
    localErrors.stock =
      !Number.isFinite(stock) || stock < 0 ? t('products.form.stockInvalid') : undefined
  } else {
    localErrors.stock = undefined
  }

  if (form.lowStockThreshold.trim() !== '') {
    const threshold = Number(form.lowStockThreshold)
    localErrors.lowStockThreshold =
      !Number.isFinite(threshold) || threshold < 0
        ? t('products.form.lowStockThresholdInvalid')
        : undefined
  } else {
    localErrors.lowStockThreshold = undefined
  }

  return Object.values(localErrors).every((message) => !message)
}

function onSubmit(): void {
  if (!validate()) return

  const priceBreaks: PriceBreak[] = priceBreakRows.value
    .filter((row) => row.minQuantity.trim() !== '' && row.price.trim() !== '')
    .map((row) => ({ minQuantity: Number(row.minQuantity), price: Number(row.price) }))
    .filter((tier) => Number.isFinite(tier.minQuantity) && Number.isFinite(tier.price))
    .sort((a, b) => a.minQuantity - b.minQuantity)

  const payload: CreateProductPayload = {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    categoryId: form.categoryId,
    type: form.type,
    price: Number(form.price),
    taxRate: form.taxRate.trim() === '' ? 0 : Number(form.taxRate),
    sku: form.sku.trim() || undefined,
    stock: !isService.value && form.stock.trim() !== '' ? Number(form.stock) : undefined,
    barcode: form.barcode.trim() || undefined,
    lowStockThreshold:
      !isService.value && form.lowStockThreshold.trim() !== ''
        ? Number(form.lowStockThreshold)
        : undefined,
    priceBreaks: priceBreaks.length > 0 ? priceBreaks : undefined
  }
  emit('submit', payload)
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <div class="grid grid-cols-2 gap-4">
      <BaseInput
        v-model="form.name"
        :label="$t('products.form.nameLabel')"
        :error="fieldError('name')"
        required
      />

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700" for="product-type">{{
          $t('products.form.typeLabel')
        }}</label>
        <select
          id="product-type"
          v-model="form.type"
          class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option v-for="(label, value) in PRODUCT_TYPE_LABELS" :key="value" :value="value">
            {{ $t(label) }}
          </option>
        </select>
      </div>
    </div>

    <BaseTextarea
      v-model="form.description"
      :label="$t('products.form.descriptionLabel')"
      :rows="2"
    />

    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-gray-700" for="product-category">
          {{ $t('products.form.categoryLabel') }}
          <span class="text-red-500">*</span>
        </label>
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-primary-600 hover:text-primary-700"
          @click="emit('manage-categories')"
        >
          <Settings2 class="size-3.5" aria-hidden="true" />
          {{ $t('products.form.manageCategories') }}
        </button>
      </div>
      <select
        id="product-category"
        v-model="form.categoryId"
        class="focus-ring rounded-lg border px-3 py-2 text-sm text-gray-900"
        :class="fieldError('categoryId') ? 'border-red-400' : 'border-gray-300'"
      >
        <option value="" disabled>{{ $t('products.form.selectCategoryPlaceholder') }}</option>
        <option v-for="option in categoryOptions" :key="option.id" :value="option.id">
          {{ '—'.repeat(option.depth) }} {{ option.label }}
        </option>
      </select>
      <p v-if="categoryOptions.length === 0" class="text-sm text-gray-400">
        {{ $t('products.form.noCategoriesHint') }}
      </p>
      <p v-if="fieldError('categoryId')" class="text-sm text-red-600">
        {{ fieldError('categoryId') }}
      </p>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <BaseInput
        v-model="form.price"
        type="number"
        :label="$t('products.form.priceLabel')"
        placeholder="0"
        :error="fieldError('price')"
        required
      />
      <BaseInput
        v-model="form.taxRate"
        type="number"
        :label="$t('products.form.taxRateLabel')"
        placeholder="0"
        :error="fieldError('taxRate')"
      />
      <BaseInput
        v-model="form.sku"
        :label="$t('products.form.skuLabel')"
        :error="fieldError('sku')"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <BaseInput
        v-model="form.barcode"
        :label="$t('products.form.barcodeLabel')"
        :hint="$t('products.form.barcodeHint')"
        :error="fieldError('barcode')"
      />
      <BaseInput
        v-if="!isService"
        v-model="form.stock"
        type="number"
        :label="$t('products.form.stockLabel')"
        placeholder="0"
        :hint="$t('products.form.stockHint')"
        :error="fieldError('stock')"
      />
    </div>

    <BaseInput
      v-if="!isService"
      v-model="form.lowStockThreshold"
      type="number"
      :label="$t('products.form.lowStockThresholdLabel')"
      :hint="$t('products.form.lowStockThresholdHint')"
      :error="fieldError('lowStockThreshold')"
    />

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-gray-700">{{
          $t('products.form.priceBreaksLabel')
        }}</label>
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-1 rounded-lg text-sm font-medium text-primary-600 hover:text-primary-700"
          @click="addPriceBreakRow"
        >
          <Plus class="size-3.5" aria-hidden="true" />
          {{ $t('products.form.addPriceBreak') }}
        </button>
      </div>
      <p class="text-sm text-gray-500">
        {{ $t('products.form.priceBreaksHint') }}
      </p>
      <div v-for="(row, index) in priceBreakRows" :key="index" class="flex items-center gap-2">
        <input
          v-model="row.minQuantity"
          type="number"
          min="1"
          :placeholder="$t('products.form.minQuantityPlaceholder')"
          class="focus-ring w-1/2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
        />
        <input
          v-model="row.price"
          type="number"
          min="0"
          :placeholder="$t('products.form.unitPricePlaceholder')"
          class="focus-ring w-1/2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
        />
        <button
          type="button"
          class="focus-ring shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          :aria-label="$t('products.form.removePriceBreak')"
          @click="removePriceBreakRow(index)"
        >
          <Trash2 class="size-4" />
        </button>
      </div>
    </div>

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">
        {{ product ? $t('common.save') : $t('products.form.submitCreate') }}
      </BaseButton>
    </div>
  </form>
</template>
