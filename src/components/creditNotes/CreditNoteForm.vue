<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import type { CreateCreditNotePayload, Invoice } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  invoice: Invoice
  submitting?: boolean
  serverErrors?: Record<string, string[]> | null
  currency?: string
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
  serverErrors: null,
  currency: 'XOF'
})

const emit = defineEmits<{
  submit: [payload: CreateCreditNotePayload]
  cancel: []
}>()

/** Quantite a crediter par ligne de la facture, saisie par l'utilisateur (0 = ligne exclue). */
interface CreditRow {
  itemId: string
  description: string
  maxQuantity: number
  quantity: number
  unitPrice: number
  taxRate: number
}

function emptyRows(): CreditRow[] {
  return props.invoice.items.map((item) => ({
    itemId: item.id,
    description: item.description,
    maxQuantity: item.quantity,
    quantity: 0,
    unitPrice: item.unitPrice,
    taxRate: item.taxRate
  }))
}

const rows = reactive<CreditRow[]>(emptyRows())
const reason = reactive({ value: '' })
const localError = reactive<{ items?: string; reason?: string }>({})

watch(
  () => props.invoice.id,
  () => {
    rows.splice(0, rows.length, ...emptyRows())
    reason.value = ''
  }
)

function lineTotal(row: CreditRow): number {
  const amount = row.quantity * row.unitPrice
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

const total = computed(() =>
  rows.reduce((sum, row) => {
    const base = lineTotal(row)
    return sum + base + base * (row.taxRate / 100)
  }, 0)
)

function onQuantityInput(row: CreditRow, value: string): void {
  const parsed = Number(value)
  row.quantity = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), row.maxQuantity) : 0
}

function fieldError(field: 'items' | 'reason'): string | undefined {
  return localError[field] ?? props.serverErrors?.[field]?.[0]
}

function validate(): boolean {
  const activeRows = rows.filter((row) => row.quantity > 0)
  localError.items =
    activeRows.length === 0 ? 'Selectionnez au moins une ligne a crediter.' : undefined
  localError.reason = reason.value.trim() ? undefined : 'Le motif est requis.'
  return !localError.items && !localError.reason
}

function onSubmit(): void {
  if (!validate()) return

  emit('submit', {
    invoiceId: props.invoice.id,
    reason: reason.value.trim(),
    items: rows
      .filter((row) => row.quantity > 0)
      .map((row) => ({
        description: row.description,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        taxRate: row.taxRate
      }))
  })
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <p class="text-sm text-gray-500">
      Choisissez les quantites a crediter pour chaque ligne de la facture
      {{ invoice.number }}.
    </p>

    <div class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="w-full text-left text-sm">
        <thead>
          <tr
            class="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500"
          >
            <th class="py-2 pl-3 pr-2 font-medium">Ligne</th>
            <th class="py-2 pr-2 text-right font-medium">Qte facturee</th>
            <th class="py-2 pr-2 text-right font-medium">Qte a crediter</th>
            <th class="py-2 pr-3 text-right font-medium">Montant</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="row in rows" :key="row.itemId">
            <td class="py-2 pl-3 pr-2 text-gray-900">{{ row.description }}</td>
            <td class="py-2 pr-2 text-right text-gray-500">{{ row.maxQuantity }}</td>
            <td class="py-2 pr-2 text-right">
              <input
                :value="row.quantity"
                type="number"
                min="0"
                :max="row.maxQuantity"
                class="focus-ring w-20 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm text-gray-900"
                @input="onQuantityInput(row, ($event.target as HTMLInputElement).value)"
              />
            </td>
            <td class="py-2 pr-3 text-right font-medium text-gray-900">
              {{ formatCurrency(lineTotal(row) * (1 + row.taxRate / 100), currency) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="fieldError('items')" class="-mt-2 text-sm text-red-600">{{ fieldError('items') }}</p>

    <p class="text-right text-sm">
      Total de l'avoir :
      <span class="font-semibold text-gray-900">{{ formatCurrency(total, currency) }}</span>
    </p>

    <BaseTextarea
      v-model="reason.value"
      label="Motif de l'avoir"
      :rows="2"
      :error="fieldError('reason')"
      required
    />

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        Annuler
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">Emettre l'avoir</BaseButton>
    </div>
  </form>
</template>
