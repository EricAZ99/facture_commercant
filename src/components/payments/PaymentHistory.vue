<script setup lang="ts">
import { Undo2 } from 'lucide-vue-next'

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
  /** Autorise l'action "Rembourser" sur chaque ligne (masquee en lecture seule). */
  allowRefund?: boolean
}

withDefaults(defineProps<Props>(), { currency: 'XOF', allowRefund: false })

const emit = defineEmits<{
  refund: [payment: Payment]
}>()

function isRefundable(payment: Payment): boolean {
  return payment.status !== 'failed' && (payment.refundedAmount ?? 0) < payment.amount - 0.01
}
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
          <th class="py-2 pr-4 text-right font-medium">Montant</th>
          <th v-if="allowRefund" class="py-2 pl-4 text-right font-medium">Actions</th>
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
          <td class="py-2 pr-4 text-right">
            <p class="font-medium text-gray-900">{{ formatCurrency(payment.amount, currency) }}</p>
            <p v-if="(payment.refundedAmount ?? 0) > 0" class="text-xs text-amber-600">
              Rembourse : {{ formatCurrency(payment.refundedAmount ?? 0, currency) }}
            </p>
          </td>
          <td v-if="allowRefund" class="py-2 pl-4 text-right">
            <button
              v-if="isRefundable(payment)"
              type="button"
              class="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              @click="emit('refund', payment)"
            >
              <Undo2 class="size-3.5" aria-hidden="true" />
              Rembourser
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
