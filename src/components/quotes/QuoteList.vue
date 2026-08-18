<script setup lang="ts">
import { ArrowRightLeft, Eye, Pencil, Trash2 } from 'lucide-vue-next'

import BaseBadge from '@/components/base/BaseBadge.vue'
import {
  canConvertQuote,
  canDeleteQuote,
  canEditQuote,
  QUOTE_STATUS_BADGE_VARIANT,
  QUOTE_STATUS_LABELS
} from '@/constants'
import type { Quote } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Props {
  quotes: Quote[]
  currency?: string
}

withDefaults(defineProps<Props>(), { currency: 'XOF' })

const emit = defineEmits<{
  view: [quote: Quote]
  edit: [quote: Quote]
  convert: [quote: Quote]
  remove: [quote: Quote]
}>()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-4 font-medium">Numero</th>
          <th class="py-2 pr-4 font-medium">Client</th>
          <th class="py-2 pr-4 font-medium">Date</th>
          <th class="py-2 pr-4 font-medium">Validite</th>
          <th class="py-2 pr-4 text-right font-medium">Montant</th>
          <th class="py-2 pr-4 font-medium">Statut</th>
          <th class="py-2 pl-4 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="quote in quotes" :key="quote.id" class="hover:bg-gray-50">
          <td class="py-3 pr-4">
            <button
              type="button"
              class="focus-ring rounded-lg text-left font-medium text-gray-900"
              @click="emit('view', quote)"
            >
              {{ quote.number }}
            </button>
          </td>
          <td class="py-3 pr-4 text-gray-600">{{ quote.clientName || '-' }}</td>
          <td class="py-3 pr-4 text-gray-600">{{ formatDate(quote.issueDate) }}</td>
          <td class="py-3 pr-4 text-gray-600">{{ formatDate(quote.expiryDate) }}</td>
          <td class="py-3 pr-4 text-right font-medium text-gray-900">
            {{ formatCurrency(quote.total, currency) }}
          </td>
          <td class="py-3 pr-4">
            <BaseBadge :variant="QUOTE_STATUS_BADGE_VARIANT[quote.status]">
              {{ QUOTE_STATUS_LABELS[quote.status] }}
            </BaseBadge>
          </td>
          <td class="py-3 pl-4">
            <div class="flex items-center justify-end gap-1">
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Consulter le devis"
                @click="emit('view', quote)"
              >
                <Eye class="size-4" />
              </button>
              <button
                v-if="canEditQuote(quote.status)"
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Modifier le devis"
                @click="emit('edit', quote)"
              >
                <Pencil class="size-4" />
              </button>
              <button
                v-if="canConvertQuote(quote.status)"
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                aria-label="Convertir en facture"
                title="Convertir en facture"
                @click="emit('convert', quote)"
              >
                <ArrowRightLeft class="size-4" />
              </button>
              <button
                v-if="canDeleteQuote(quote.status)"
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Supprimer le devis"
                @click="emit('remove', quote)"
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
