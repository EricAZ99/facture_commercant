<script setup lang="ts">
import { Boxes, Percent, Tag, Wallet } from 'lucide-vue-next'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { PRODUCT_TYPE_LABELS } from '@/constants'
import type { Product } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/formatters'

interface Props {
  product: Product
  currency?: string
}

withDefaults(defineProps<Props>(), { currency: 'XOF' })

const emit = defineEmits<{
  edit: []
  delete: []
}>()
</script>

<template>
  <BaseCard>
    <template #actions>
      <BaseButton variant="outline" size="sm" @click="emit('edit')">Modifier</BaseButton>
      <BaseButton variant="danger" size="sm" @click="emit('delete')">Supprimer</BaseButton>
    </template>

    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ product.name }}</h2>
        <p class="mt-1 text-sm text-gray-500">{{ product.category }}</p>
      </div>
      <BaseBadge :variant="product.type === 'service' ? 'info' : 'default'">
        {{ PRODUCT_TYPE_LABELS[product.type] }}
      </BaseBadge>
    </div>

    <p v-if="product.description" class="mt-4 text-sm text-gray-600">{{ product.description }}</p>

    <dl class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="flex items-start gap-2">
        <Wallet class="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <dt class="text-xs text-gray-500">Prix</dt>
          <dd class="text-sm text-gray-900">{{ formatCurrency(product.price, currency) }}</dd>
        </div>
      </div>
      <div class="flex items-start gap-2">
        <Percent class="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <dt class="text-xs text-gray-500">TVA</dt>
          <dd class="text-sm text-gray-900">{{ product.taxRate }}%</dd>
        </div>
      </div>
      <div class="flex items-start gap-2">
        <Tag class="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <dt class="text-xs text-gray-500">SKU</dt>
          <dd class="text-sm text-gray-900">{{ product.sku || '-' }}</dd>
        </div>
      </div>
      <div v-if="product.type === 'product'" class="flex items-start gap-2">
        <Boxes class="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <dt class="text-xs text-gray-500">Stock</dt>
          <dd class="text-sm text-gray-900">
            {{ product.stock !== undefined ? formatNumber(product.stock) : '-' }}
          </dd>
        </div>
      </div>
    </dl>
  </BaseCard>
</template>
