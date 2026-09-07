<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseButton from '@/components/base/BaseButton.vue'
import type { CreateInstallmentPlanPayload } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  remainingBalance: number
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
  submit: [payload: CreateInstallmentPlanPayload]
  cancel: []
}>()

const { t } = useI18n()

interface Row {
  dueDate: string
  amount: string
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Repartit le solde en `count` echeances egales, espacees d'un mois, la premiere dans 30 jours. */
function splitEqually(count: number): Row[] {
  const base = Math.floor((props.remainingBalance / count) * 100) / 100
  const rows: Row[] = []
  let allocated = 0
  for (let i = 0; i < count; i++) {
    const date = new Date()
    date.setDate(date.getDate() + 30 * (i + 1))
    const isLast = i === count - 1
    const amount = isLast ? Math.round((props.remainingBalance - allocated) * 100) / 100 : base
    allocated += amount
    rows.push({ dueDate: toDateInputValue(date), amount: String(amount) })
  }
  return rows
}

const installmentCount = reactive({ value: 3 })
const rows = reactive<Row[]>(splitEqually(installmentCount.value))
const localError = reactive<{ installments?: string }>({})

watch(
  () => installmentCount.value,
  (count) => rows.splice(0, rows.length, ...splitEqually(count))
)

const total = computed(() => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0))
const totalMatches = computed(() => Math.abs(total.value - props.remainingBalance) < 0.01)

function fieldError(): string | undefined {
  return localError.installments ?? props.serverErrors?.installments?.[0]
}

function onSubmit(): void {
  if (!totalMatches.value) {
    localError.installments = t('invoices.detail.installmentPlanForm.sumMismatch')
    return
  }
  if (rows.some((row) => !row.dueDate || !(Number(row.amount) > 0))) {
    localError.installments = t('invoices.detail.installmentPlanForm.invalidRow')
    return
  }
  localError.installments = undefined

  emit('submit', {
    installments: rows.map((row) => ({ dueDate: row.dueDate, amount: Number(row.amount) }))
  })
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <p class="text-sm text-gray-500">
      {{ $t('invoices.detail.installmentPlanForm.balanceToSplit') }}
      <span class="font-medium text-gray-900">
        {{ formatCurrency(remainingBalance, currency) }}
      </span>
    </p>

    <div class="flex items-center gap-2">
      <label class="text-sm font-medium text-gray-700" for="installment-count">
        {{ $t('invoices.detail.installmentPlanForm.installmentCountLabel') }}
      </label>
      <select
        id="installment-count"
        v-model.number="installmentCount.value"
        class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
      >
        <option v-for="n in [2, 3, 4, 6, 12]" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>

    <div class="flex flex-col gap-2">
      <div v-for="(row, index) in rows" :key="index" class="grid grid-cols-12 items-center gap-2">
        <span class="col-span-1 text-sm text-gray-500">{{ index + 1 }}</span>
        <input
          v-model="row.dueDate"
          type="date"
          class="focus-ring col-span-6 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
        />
        <input
          v-model="row.amount"
          type="number"
          min="0"
          class="focus-ring col-span-5 rounded-lg border border-gray-300 px-2 py-1.5 text-right text-sm text-gray-900"
        />
      </div>
    </div>

    <p class="text-right text-sm" :class="totalMatches ? 'text-gray-500' : 'text-red-600'">
      {{
        $t('invoices.detail.installmentPlanForm.total', { amount: formatCurrency(total, currency) })
      }}
    </p>
    <p v-if="fieldError()" class="text-sm text-red-600">{{ fieldError() }}</p>

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">{{
        $t('invoices.detail.installmentPlanForm.submit')
      }}</BaseButton>
    </div>
  </form>
</template>
