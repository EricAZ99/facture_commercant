<script setup lang="ts">
import { Eye, Pencil, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

import BaseBadge from '@/components/base/BaseBadge.vue'
import { PRODUCT_TYPE_LABELS } from '@/constants'
import type { ID, Product } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/formatters'

interface Props {
  products: Product[]
  currency?: string
  selection?: ID[]
}

const props = withDefaults(defineProps<Props>(), { currency: 'XOF', selection: () => [] })

const emit = defineEmits<{
  view: [product: Product]
  edit: [product: Product]
  delete: [product: Product]
  'update:selection': [ids: ID[]]
}>()

const allSelected = computed(
  () => props.products.length > 0 && props.products.every((p) => props.selection.includes(p.id))
)

function toggleAll(): void {
  emit('update:selection', allSelected.value ? [] : props.products.map((p) => p.id))
}

function toggleOne(id: ID): void {
  emit(
    'update:selection',
    props.selection.includes(id)
      ? props.selection.filter((s) => s !== id)
      : [...props.selection, id]
  )
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-2 font-medium">
            <input
              type="checkbox"
              :checked="allSelected"
              class="focus-ring size-4 cursor-pointer rounded border-gray-300 text-primary-600"
              :aria-label="$t('products.list.selectAll')"
              @change="toggleAll"
            />
          </th>
          <th class="py-2 pr-4 font-medium">{{ $t('products.list.columnProduct') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('products.list.columnCategory') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('products.list.columnType') }}</th>
          <th class="py-2 pr-4 text-right font-medium">{{ $t('products.list.columnPrice') }}</th>
          <th class="py-2 pr-4 text-right font-medium">{{ $t('products.list.columnTax') }}</th>
          <th class="py-2 pr-4 text-right font-medium">{{ $t('products.list.columnStock') }}</th>
          <th class="py-2 pl-4 text-right font-medium">{{ $t('products.list.columnActions') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr
          v-for="product in products"
          :key="product.id"
          :class="['hover:bg-gray-50', selection.includes(product.id) && 'bg-primary-50']"
        >
          <td class="py-3 pr-2">
            <input
              type="checkbox"
              :checked="selection.includes(product.id)"
              class="focus-ring size-4 cursor-pointer rounded border-gray-300 text-primary-600"
              :aria-label="$t('products.list.selectOne', { name: product.name })"
              @change="toggleOne(product.id)"
            />
          </td>
          <td class="py-3 pr-4">
            <button
              type="button"
              class="focus-ring rounded-lg text-left font-medium text-gray-900"
              @click="emit('view', product)"
            >
              {{ product.name }}
            </button>
            <p v-if="product.sku" class="text-xs text-gray-400">{{ product.sku }}</p>
          </td>
          <td class="py-3 pr-4 text-gray-600">
            {{ product.categoryPath ?? $t('products.notClassified') }}
          </td>
          <td class="py-3 pr-4">
            <BaseBadge :variant="product.type === 'service' ? 'info' : 'default'">
              {{ $t(PRODUCT_TYPE_LABELS[product.type]) }}
            </BaseBadge>
          </td>
          <td class="py-3 pr-4 text-right text-gray-900">
            {{ formatCurrency(product.price, currency) }}
          </td>
          <td class="py-3 pr-4 text-right text-gray-600">{{ product.taxRate }}%</td>
          <td class="py-3 pr-4 text-right text-gray-600">
            {{
              product.type === 'service' || product.stock === undefined
                ? '-'
                : formatNumber(product.stock)
            }}
          </td>
          <td class="py-3 pl-4">
            <div class="flex justify-end gap-1">
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                :aria-label="$t('products.list.view')"
                @click="emit('view', product)"
              >
                <Eye class="size-4" />
              </button>
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                :aria-label="$t('products.list.edit')"
                @click="emit('edit', product)"
              >
                <Pencil class="size-4" />
              </button>
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                :aria-label="$t('products.list.delete')"
                @click="emit('delete', product)"
              >
                <Trash2 class="size-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
