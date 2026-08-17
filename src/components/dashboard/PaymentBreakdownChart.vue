<script setup lang="ts">
import { computed } from 'vue'

import { PAYMENT_METHOD_COLORS, PAYMENT_METHOD_LABELS } from '@/constants'
import type { PaymentMethodBreakdown } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  data: PaymentMethodBreakdown[]
  currency?: string
}

const props = withDefaults(defineProps<Props>(), { currency: 'XOF' })

const total = computed(() => props.data.reduce((sum, item) => sum + item.amount, 0))

const segments = computed(() =>
  props.data
    .filter((item) => item.amount > 0)
    .map((item) => ({
      ...item,
      percentage: total.value > 0 ? (item.amount / total.value) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        v-for="segment in segments"
        :key="segment.method"
        :class="PAYMENT_METHOD_COLORS[segment.method]"
        :style="{ width: `${segment.percentage}%` }"
        :title="`${PAYMENT_METHOD_LABELS[segment.method]}: ${formatCurrency(segment.amount, currency)}`"
      />
    </div>

    <ul class="flex flex-col gap-2">
      <li
        v-for="segment in segments"
        :key="segment.method"
        class="flex items-center justify-between text-sm"
      >
        <span class="flex items-center gap-2 text-gray-600">
          <span class="size-2.5 rounded-full" :class="PAYMENT_METHOD_COLORS[segment.method]" />
          {{ PAYMENT_METHOD_LABELS[segment.method] }}
        </span>
        <span class="font-medium text-gray-900">
          {{ formatCurrency(segment.amount, currency) }}
          <span class="text-gray-400">({{ Math.round(segment.percentage) }}%)</span>
        </span>
      </li>
    </ul>
  </div>
</template>
