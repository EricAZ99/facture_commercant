<script setup lang="ts">
import BaseBadge from '@/components/base/BaseBadge.vue'
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_BADGE_VARIANT,
  PAYMENT_STATUS_LABELS
} from '@/constants'
import type { Payment } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Props {
  payments: Payment[]
  currency?: string
}

withDefaults(defineProps<Props>(), { currency: 'XOF' })
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-4 font-medium">Date</th>
          <th class="py-2 pr-4 font-medium">Moyen</th>
          <th class="py-2 pr-4 font-medium">Reference</th>
          <th class="py-2 pr-4 font-medium">Statut</th>
          <th class="py-2 pl-4 text-right font-medium">Montant</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="payment in payments" :key="payment.id">
          <td class="py-2 pr-4 text-gray-600">{{ formatDate(payment.paidAt) }}</td>
          <td class="py-2 pr-4 text-gray-600">{{ PAYMENT_METHOD_LABELS[payment.method] }}</td>
          <td class="py-2 pr-4 text-gray-400">{{ payment.reference || '-' }}</td>
          <td class="py-2 pr-4">
            <BaseBadge :variant="PAYMENT_STATUS_BADGE_VARIANT[payment.status]">
              {{ PAYMENT_STATUS_LABELS[payment.status] }}
            </BaseBadge>
          </td>
          <td class="py-2 pl-4 text-right font-medium text-gray-900">
            {{ formatCurrency(payment.amount, currency) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
