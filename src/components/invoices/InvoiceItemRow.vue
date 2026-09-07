<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

import type { InvoiceBuilderLine } from '@/composables'
import { formatCurrency } from '@/utils/formatters'
import { computeLineTotal } from '@/utils/invoiceCalculations'

interface Props {
  line: InvoiceBuilderLine
  currency?: string
}

const props = withDefaults(defineProps<Props>(), { currency: 'XOF' })

const emit = defineEmits<{
  update: [patch: Partial<Omit<InvoiceBuilderLine, 'key'>>]
  remove: []
}>()

// Le total de ligne est toujours derive via l'utilitaire centralise, jamais
// recalcule dans le template.
const lineTotal = computed(() => computeLineTotal(props.line))

function onNumberInput(field: 'quantity' | 'unitPrice' | 'taxRate', value: string): void {
  const parsed = Number(value)
  emit('update', { [field]: Number.isFinite(parsed) ? parsed : 0 })
}
</script>

<template>
  <div class="grid grid-cols-12 items-start gap-2 py-2">
    <input
      :value="line.description"
      type="text"
      :placeholder="$t('invoices.form.descriptionPlaceholder')"
      class="focus-ring col-span-5 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
      @input="emit('update', { description: ($event.target as HTMLInputElement).value })"
    />
    <input
      :value="line.quantity"
      type="number"
      min="0"
      step="1"
      class="focus-ring col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-right text-sm text-gray-900"
      @input="onNumberInput('quantity', ($event.target as HTMLInputElement).value)"
    />
    <input
      :value="line.unitPrice"
      type="number"
      min="0"
      step="1"
      class="focus-ring col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-right text-sm text-gray-900"
      @input="onNumberInput('unitPrice', ($event.target as HTMLInputElement).value)"
    />
    <input
      :value="line.taxRate"
      type="number"
      min="0"
      max="100"
      step="1"
      class="focus-ring col-span-1 rounded-lg border border-gray-300 px-2 py-1.5 text-right text-sm text-gray-900"
      @input="onNumberInput('taxRate', ($event.target as HTMLInputElement).value)"
    />
    <p class="col-span-1 pt-1.5 text-right text-sm font-medium text-gray-900">
      {{ formatCurrency(lineTotal, currency) }}
    </p>
    <button
      type="button"
      class="focus-ring col-span-1 justify-self-end rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
      :aria-label="$t('invoices.form.removeLine')"
      @click="emit('remove')"
    >
      <Trash2 class="size-4" />
    </button>
  </div>
</template>
