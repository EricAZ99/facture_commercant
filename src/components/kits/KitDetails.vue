<script setup lang="ts">
import { Boxes, FileText, Layers, Wallet } from 'lucide-vue-next'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import type { ProductKit } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  kit: ProductKit
  currency?: string
}

withDefaults(defineProps<Props>(), { currency: 'XOF' })

const emit = defineEmits<{
  edit: []
  delete: []
  invoice: []
}>()
</script>

<template>
  <BaseCard>
    <template #actions>
      <BaseButton variant="outline" size="sm" @click="emit('invoice')">
        <FileText class="size-4" aria-hidden="true" />
        Facturer ce kit
      </BaseButton>
      <BaseButton variant="outline" size="sm" @click="emit('edit')">Modifier</BaseButton>
      <BaseButton variant="danger" size="sm" @click="emit('delete')">Supprimer</BaseButton>
    </template>

    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div
          class="flex size-14 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50"
        >
          <Layers class="size-6 text-gray-300" aria-hidden="true" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{{ kit.name }}</h2>
          <p v-if="kit.sku" class="mt-1 text-sm text-gray-500">{{ kit.sku }}</p>
        </div>
      </div>
      <BaseBadge :variant="kit.isActive ? 'success' : 'default'">
        {{ kit.isActive ? 'Actif' : 'Inactif' }}
      </BaseBadge>
    </div>

    <p v-if="kit.description" class="mt-4 text-sm text-gray-600">{{ kit.description }}</p>

    <dl class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="flex items-start gap-2">
        <Wallet class="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <dt class="text-xs text-gray-500">Prix de vente</dt>
          <dd class="text-sm text-gray-900">
            {{ formatCurrency(kit.effectivePrice, currency) }}
            <span v-if="kit.customPrice === undefined" class="text-xs text-gray-400">
              (somme des composants)
            </span>
          </dd>
        </div>
      </div>
      <div class="flex items-start gap-2">
        <Wallet class="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <dt class="text-xs text-gray-500">Prix des composants</dt>
          <dd class="text-sm text-gray-900">{{ formatCurrency(kit.computedPrice, currency) }}</dd>
        </div>
      </div>
      <div class="flex items-start gap-2">
        <Boxes class="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <dt class="text-xs text-gray-500">Stock assemblable</dt>
          <dd class="text-sm text-gray-900">
            {{ kit.availableStock !== null ? kit.availableStock : 'Non suivi (services)' }}
          </dd>
        </div>
      </div>
    </dl>

    <div class="mt-6 border-t border-gray-100 pt-4">
      <p class="mb-2 text-xs text-gray-500">Composition</p>
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-xs uppercase tracking-wide text-gray-400">
            <th class="py-1 pr-4 font-medium">Produit</th>
            <th class="py-1 pr-4 text-right font-medium">Quantite</th>
            <th class="py-1 pl-4 text-right font-medium">Prix unitaire</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="item in kit.items" :key="item.productId">
            <td class="py-2 pr-4 text-gray-900">{{ item.productName }}</td>
            <td class="py-2 pr-4 text-right text-gray-600">{{ item.quantity }}</td>
            <td class="py-2 pl-4 text-right text-gray-600">
              {{ formatCurrency(item.unitPrice, currency) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BaseCard>
</template>
