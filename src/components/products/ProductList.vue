<script setup lang="ts">
import { Eye, Pencil, Trash2 } from 'lucide-vue-next'

import BaseBadge from '@/components/base/BaseBadge.vue'
import { PRODUCT_TYPE_LABELS } from '@/constants'
import type { Product } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/formatters'

interface Props {
  products: Product[]
  currency?: string
}

withDefaults(defineProps<Props>(), { currency: 'XOF' })

const emit = defineEmits<{
  view: [product: Product]
  edit: [product: Product]
  delete: [product: Product]
}>()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-4 font-medium">Produit</th>
          <th class="py-2 pr-4 font-medium">Categorie</th>
          <th class="py-2 pr-4 font-medium">Type</th>
          <th class="py-2 pr-4 text-right font-medium">Prix</th>
          <th class="py-2 pr-4 text-right font-medium">TVA</th>
          <th class="py-2 pr-4 text-right font-medium">Stock</th>
          <th class="py-2 pl-4 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="product in products" :key="product.id" class="hover:bg-gray-50">
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
          <td class="py-3 pr-4 text-gray-600">{{ product.category }}</td>
          <td class="py-3 pr-4">
            <BaseBadge :variant="product.type === 'service' ? 'info' : 'default'">
              {{ PRODUCT_TYPE_LABELS[product.type] }}
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
                aria-label="Voir le produit"
                @click="emit('view', product)"
              >
                <Eye class="size-4" />
              </button>
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Modifier le produit"
                @click="emit('edit', product)"
              >
                <Pencil class="size-4" />
              </button>
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Supprimer le produit"
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
