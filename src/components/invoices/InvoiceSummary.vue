<script setup lang="ts">
import { DISCOUNT_TYPE_LABELS } from '@/constants'
import type { InvoiceTotals } from '@/utils/invoiceCalculations'
import { formatCurrency } from '@/utils/formatters'
import type { DiscountType } from '@/types'

interface Props {
  totals: InvoiceTotals
  discountType: DiscountType
  discountValue: number
  currency?: string
}

withDefaults(defineProps<Props>(), { currency: 'XOF' })
</script>

<template>
  <dl class="flex flex-col gap-2 text-sm">
    <div class="flex justify-between">
      <dt class="text-gray-500">{{ $t('invoices.summary.subtotal') }}</dt>
      <dd class="text-gray-900">{{ formatCurrency(totals.subtotal, currency) }}</dd>
    </div>

    <div v-if="totals.discountAmount > 0" class="flex justify-between">
      <dt class="text-gray-500">
        {{ $t('invoices.summary.discount') }}
        <span class="text-gray-400">
          ({{ $t(DISCOUNT_TYPE_LABELS[discountType])
          }}{{ discountType === 'percentage' ? ` ${discountValue}%` : '' }})
        </span>
      </dt>
      <dd class="text-gray-900">-{{ formatCurrency(totals.discountAmount, currency) }}</dd>
    </div>

    <div class="flex justify-between">
      <dt class="text-gray-500">{{ $t('invoices.summary.tax') }}</dt>
      <dd class="text-gray-900">{{ formatCurrency(totals.taxTotal, currency) }}</dd>
    </div>

    <div class="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
      <dt class="text-gray-900">{{ $t('invoices.summary.total') }}</dt>
      <dd class="text-gray-900">{{ formatCurrency(totals.total, currency) }}</dd>
    </div>
  </dl>
</template>
