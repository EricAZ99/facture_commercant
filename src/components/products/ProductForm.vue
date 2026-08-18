<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import { computed, reactive, ref, useId, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import { PRODUCT_TYPE_LABELS } from '@/constants'
import type { CreateProductPayload, PriceBreak, Product, ProductType } from '@/types'
import { isRequired } from '@/utils/validators'

interface Props {
  /** Produit a modifier ; absent/`null` => formulaire de creation. */
  product?: Product | null
  submitting?: boolean
  /** Erreurs de validation renvoyees par le backend, par champ. */
  serverErrors?: Record<string, string[]> | null
  /** Categories deja utilisees, proposees en saisie assistee. */
  categorySuggestions?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  product: null,
  submitting: false,
  serverErrors: null,
  categorySuggestions: () => []
})

const emit = defineEmits<{
  submit: [payload: CreateProductPayload]
  cancel: []
}>()

/**
 * Etat local du formulaire : toujours des chaines (jamais `undefined`/
 * `number`), pour rester compatible avec `v-model` sur `BaseInput`. La
 * conversion en payload type (nombres, champs optionnels) se fait uniquement
 * a l'emission.
 */
interface ProductFormState {
  name: string
  description: string
  category: string
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
    category: '',
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
const categoryListId = useId()
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
            category: product.category,
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
  localErrors.name = !isRequired(form.name) ? 'Le nom est requis.' : undefined
  localErrors.category = !isRequired(form.category) ? 'La categorie est requise.' : undefined

  const price = Number(form.price)
  localErrors.price =
    !form.price.trim() || !Number.isFinite(price) || price <= 0
      ? 'Le prix doit etre un nombre positif.'
      : undefined

  const taxRate = form.taxRate.trim() === '' ? 0 : Number(form.taxRate)
  localErrors.taxRate =
    !Number.isFinite(taxRate) || taxRate < 0
      ? 'La TVA doit etre un nombre positif ou nul.'
      : undefined

  if (!isService.value && form.stock.trim() !== '') {
    const stock = Number(form.stock)
    localErrors.stock =
      !Number.isFinite(stock) || stock < 0
        ? 'Le stock doit etre un nombre positif ou nul.'
        : undefined
  } else {
    localErrors.stock = undefined
  }

  if (form.lowStockThreshold.trim() !== '') {
    const threshold = Number(form.lowStockThreshold)
    localErrors.lowStockThreshold =
      !Number.isFinite(threshold) || threshold < 0
        ? 'Le seuil doit etre un nombre positif ou nul.'
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
    category: form.category.trim(),
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
      <BaseInput v-model="form.name" label="Nom" :error="fieldError('name')" required />

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700" for="product-type">Type</label>
        <select
          id="product-type"
          v-model="form.type"
          class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option v-for="(label, value) in PRODUCT_TYPE_LABELS" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
      </div>
    </div>

    <BaseTextarea v-model="form.description" label="Description" :rows="2" />

    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-gray-700" for="product-category">
        Categorie
        <span class="text-red-500">*</span>
      </label>
      <input
        id="product-category"
        v-model="form.category"
        :list="categoryListId"
        type="text"
        placeholder="Ex : Boissons, Coiffure, Vetements..."
        class="focus-ring rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
        :class="fieldError('category') ? 'border-red-400' : 'border-gray-300'"
      />
      <datalist :id="categoryListId">
        <option v-for="category in categorySuggestions" :key="category" :value="category" />
      </datalist>
      <p v-if="fieldError('category')" class="text-sm text-red-600">{{ fieldError('category') }}</p>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <BaseInput
        v-model="form.price"
        type="number"
        label="Prix"
        placeholder="0"
        :error="fieldError('price')"
        required
      />
      <BaseInput
        v-model="form.taxRate"
        type="number"
        label="TVA (%)"
        placeholder="0"
        :error="fieldError('taxRate')"
      />
      <BaseInput v-model="form.sku" label="SKU" :error="fieldError('sku')" />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <BaseInput
        v-model="form.barcode"
        label="Code-barres"
        hint="EAN/UPC, saisi manuellement."
        :error="fieldError('barcode')"
      />
      <BaseInput
        v-if="!isService"
        v-model="form.stock"
        type="number"
        label="Stock"
        placeholder="0"
        hint="Laisser vide si non suivi."
        :error="fieldError('stock')"
      />
    </div>

    <BaseInput
      v-if="!isService"
      v-model="form.lowStockThreshold"
      type="number"
      label="Seuil d'alerte de stock bas"
      hint="Vide = seuil par defaut de la plateforme (5 unites)."
      :error="fieldError('lowStockThreshold')"
    />

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-gray-700">Tarifs degressifs</label>
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-1 rounded-lg text-sm font-medium text-primary-600 hover:text-primary-700"
          @click="addPriceBreakRow"
        >
          <Plus class="size-3.5" aria-hidden="true" />
          Ajouter un palier
        </button>
      </div>
      <p class="text-sm text-gray-500">
        A partir de N unites, le prix indique remplace le prix de base sur les factures.
      </p>
      <div v-for="(row, index) in priceBreakRows" :key="index" class="flex items-center gap-2">
        <input
          v-model="row.minQuantity"
          type="number"
          min="1"
          placeholder="Quantite min."
          class="focus-ring w-1/2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
        />
        <input
          v-model="row.price"
          type="number"
          min="0"
          placeholder="Prix unitaire"
          class="focus-ring w-1/2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
        />
        <button
          type="button"
          class="focus-ring shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Supprimer ce palier"
          @click="removePriceBreakRow(index)"
        >
          <Trash2 class="size-4" />
        </button>
      </div>
    </div>

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        Annuler
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">
        {{ product ? 'Enregistrer' : 'Creer le produit' }}
      </BaseButton>
    </div>
  </form>
</template>
