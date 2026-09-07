<script setup lang="ts">
import BaseBadge from '@/components/base/BaseBadge.vue'
import { INVOICE_STATUS_BADGE_VARIANT, INVOICE_STATUS_LABELS } from '@/constants'
import type { Invoice } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Props {
  invoices: Invoice[]
  currency?: string
}

withDefaults(defineProps<Props>(), { currency: 'XOF' })
</script>

<template>
  <ul class="divide-y divide-gray-100">
    <li
      v-for="invoice in invoices"
      :key="invoice.id"
      class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
    >
      <div class="min-w-0">
        <p class="truncate text-sm font-medium text-gray-900">{{ invoice.number }}</p>
        <p class="text-xs text-gray-500">{{ formatDate(invoice.issueDate) }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-3">
        <span class="text-sm font-medium text-gray-900">
          {{ formatCurrency(invoice.total, currency) }}
        </span>
        <BaseBadge :variant="INVOICE_STATUS_BADGE_VARIANT[invoice.status]">
          {{ $t(INVOICE_STATUS_LABELS[invoice.status]) }}
        </BaseBadge>
      </div>
    </li>
  </ul>
</template>
