<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import SearchableSelect from '@/components/base/SearchableSelect.vue'
import { productService } from '@/services'
import type { CreateKitPayload, Product, ProductKit } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { isRequired } from '@/utils/validators'

interface Props {
  /** Kit a modifier ; absent/`null` => formulaire de creation. */
  kit?: ProductKit | null
  submitting?: boolean
  serverErrors?: Record<string, string[]> | null
  currency?: string
}

const props = withDefaults(defineProps<Props>(), {
  kit: null,
  submitting: false,
  serverErrors: null,
  currency: 'XOF'
})

const emit = defineEmits<{
  submit: [payload: CreateKitPayload]
  cancel: []
}>()

interface KitFormState {
  name: string
  description: string
  sku: string
  customPrice: string
  isActive: boolean
}

interface ItemRow {
  productId: string
  productName: string
  unitPrice: number
  quantity: string
}

function emptyForm(): KitFormState {
  return { name: '', description: '', sku: '', customPrice: '', isActive: true }
}

const form = reactive<KitFormState>(emptyForm())
const localErrors = reactive<{ name?: string; items?: string; customPrice?: string }>({})
const itemRows = ref<ItemRow[]>([])

watch(
  () => props.kit,
  (kit) => {
    Object.assign(
      form,
      kit
        ? {
            name: kit.name,
            description: kit.description ?? '',
            sku: kit.sku ?? '',
            customPrice: kit.customPrice !== undefined ? String(kit.customPrice) : '',
            isActive: kit.isActive
          }
        : emptyForm()
    )
    itemRows.value = (kit?.items ?? []).map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: String(item.quantity)
    }))
  },
  { immediate: true }
)

async function searchProducts(query: string): Promise<Product[]> {
  const response = await productService.list({ search: query, perPage: 8 })
  return response.data
}

function productLabel(p: Product): string {
  return `${p.name} — ${formatCurrency(p.price, props.currency)}`
}

function addProduct(product: Product): void {
  if (itemRows.value.some((row) => row.productId === product.id)) return
  itemRows.value.push({
    productId: product.id,
    productName: product.name,
    unitPrice: product.price,
    quantity: '1'
  })
}

function removeRow(index: number): void {
  itemRows.value.splice(index, 1)
}

const computedPrice = computed(() =>
  itemRows.value.reduce((sum, row) => sum + row.unitPrice * (Number(row.quantity) || 0), 0)
)

function fieldError(field: 'name' | 'items' | 'customPrice'): string | undefined {
  return localErrors[field] ?? props.serverErrors?.[field]?.[0]
}

function validate(): boolean {
  localErrors.name = !isRequired(form.name) ? 'Le nom est requis.' : undefined
  localErrors.items =
    itemRows.value.length === 0 || itemRows.value.some((row) => !(Number(row.quantity) > 0))
      ? 'Ajoutez au moins un produit avec une quantite positive.'
      : undefined

  if (form.customPrice.trim() !== '') {
    const price = Number(form.customPrice)
    localErrors.customPrice =
      !Number.isFinite(price) || price < 0
        ? 'Le prix doit etre un nombre positif ou nul.'
        : undefined
  } else {
    localErrors.customPrice = undefined
  }

  return Object.values(localErrors).every((message) => !message)
}

function onSubmit(): void {
  if (!validate()) return

  const payload: CreateKitPayload = {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    sku: form.sku.trim() || undefined,
    items: itemRows.value.map((row) => ({
      productId: row.productId,
      quantity: Number(row.quantity)
    })),
    customPrice: form.customPrice.trim() !== '' ? Number(form.customPrice) : undefined,
    isActive: form.isActive
  }
  emit('submit', payload)
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <div class="grid grid-cols-2 gap-4">
      <BaseInput v-model="form.name" label="Nom du kit" :error="fieldError('name')" required />
      <BaseInput v-model="form.sku" label="SKU" />
    </div>

    <BaseTextarea v-model="form.description" label="Description" :rows="2" />

    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-gray-700">
        Composition
        <span class="text-red-500">*</span>
      </label>
      <SearchableSelect
        :search="searchProducts"
        :get-label="productLabel"
        :get-key="(p: Product) => p.id"
        clear-on-select
        placeholder="Rechercher un produit a ajouter au kit..."
        @select="addProduct"
      />

      <div v-if="itemRows.length > 0" class="mt-2 flex flex-col gap-2">
        <div
          v-for="(row, index) in itemRows"
          :key="row.productId"
          class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2"
        >
          <span class="flex-1 text-sm text-gray-900">{{ row.productName }}</span>
          <span class="text-xs text-gray-500">{{ formatCurrency(row.unitPrice, currency) }}</span>
          <input
            v-model="row.quantity"
            type="number"
            min="1"
            class="focus-ring w-20 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
          />
          <button
            type="button"
            class="focus-ring shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Retirer ce produit"
            @click="removeRow(index)"
          >
            <Trash2 class="size-4" />
          </button>
        </div>
      </div>
      <p v-if="fieldError('items')" class="text-sm text-red-600">{{ fieldError('items') }}</p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <BaseInput
        v-model="form.customPrice"
        type="number"
        label="Prix de vente force"
        :hint="`Vide = somme des composants (${formatCurrency(computedPrice, currency)}).`"
        :error="fieldError('customPrice')"
      />
      <label class="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
        <input v-model="form.isActive" type="checkbox" class="focus-ring rounded border-gray-300" />
        Kit actif (propose a la vente)
      </label>
    </div>

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        Annuler
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">
        {{ kit ? 'Enregistrer' : 'Creer le kit' }}
      </BaseButton>
    </div>
  </form>
</template>
