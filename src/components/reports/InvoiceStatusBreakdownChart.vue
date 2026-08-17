<script setup lang="ts">
import { computed } from 'vue'

import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from '@/constants'
import type { InvoiceStatusReportItem } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/formatters'

interface Props {
  data: InvoiceStatusReportItem[]
  currency?: string
}

const props = withDefaults(defineProps<Props>(), { currency: 'XOF' })

const total = computed(() => props.data.reduce((sum, item) => sum + item.count, 0))

const segments = computed(() =>
  props.data
    .filter((item) => item.count > 0)
    .map((item) => ({
      ...item,
      percentage: total.value > 0 ? (item.count / total.value) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        v-for="segment in segments"
        :key="segment.status"
        :class="INVOICE_STATUS_COLORS[segment.status]"
        :style="{ width: `${segment.percentage}%` }"
        :title="`${INVOICE_STATUS_LABELS[segment.status]}: ${segment.count}`"
      />
    </div>

    <ul class="flex flex-col gap-2">
      <li
        v-for="segment in segments"
        :key="segment.status"
        class="flex items-center justify-between text-sm"
      >
        <span class="flex items-center gap-2 text-gray-600">
          <span class="size-2.5 rounded-full" :class="INVOICE_STATUS_COLORS[segment.status]" />
          {{ INVOICE_STATUS_LABELS[segment.status] }}
        </span>
        <span class="font-medium text-gray-900">
          {{ formatNumber(segment.count) }}
          <span class="text-gray-400">({{ formatCurrency(segment.amount, currency) }})</span>
        </span>
      </li>
    </ul>
  </div>
</template>
