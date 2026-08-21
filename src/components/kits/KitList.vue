<script setup lang="ts">
import { Eye, Pencil, Trash2 } from 'lucide-vue-next'

import BaseBadge from '@/components/base/BaseBadge.vue'
import type { ProductKit } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  kits: ProductKit[]
  currency?: string
}

withDefaults(defineProps<Props>(), { currency: 'XOF' })

const emit = defineEmits<{
  view: [kit: ProductKit]
  edit: [kit: ProductKit]
  delete: [kit: ProductKit]
}>()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-4 font-medium">Kit</th>
          <th class="py-2 pr-4 font-medium">Composition</th>
          <th class="py-2 pr-4 text-right font-medium">Prix</th>
          <th class="py-2 pr-4 text-right font-medium">Stock assemblable</th>
          <th class="py-2 pr-4 font-medium">Statut</th>
          <th class="py-2 pl-4 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="kit in kits" :key="kit.id" class="hover:bg-gray-50">
          <td class="py-3 pr-4">
            <button
              type="button"
              class="focus-ring rounded-lg text-left font-medium text-gray-900"
              @click="emit('view', kit)"
            >
              {{ kit.name }}
            </button>
            <p v-if="kit.sku" class="text-xs text-gray-400">{{ kit.sku }}</p>
          </td>
          <td class="py-3 pr-4 text-gray-600">
            {{ kit.items.length }} article{{ kit.items.length > 1 ? 's' : '' }}
          </td>
          <td class="py-3 pr-4 text-right text-gray-900">
            {{ formatCurrency(kit.effectivePrice, currency) }}
          </td>
          <td class="py-3 pr-4 text-right text-gray-600">
            {{ kit.availableStock !== null ? kit.availableStock : '-' }}
          </td>
          <td class="py-3 pr-4">
            <BaseBadge :variant="kit.isActive ? 'success' : 'default'">
              {{ kit.isActive ? 'Actif' : 'Inactif' }}
            </BaseBadge>
          </td>
          <td class="py-3 pl-4">
            <div class="flex justify-end gap-1">
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Voir le kit"
                @click="emit('view', kit)"
              >
                <Eye class="size-4" />
              </button>
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Modifier le kit"
                @click="emit('edit', kit)"
              >
                <Pencil class="size-4" />
              </button>
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Supprimer le kit"
                @click="emit('delete', kit)"
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
