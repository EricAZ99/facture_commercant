<script setup lang="ts">
import { CircleDollarSign } from 'lucide-vue-next'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { INSTALLMENT_STATUS_BADGE_VARIANT, INSTALLMENT_STATUS_LABELS } from '@/constants'
import type { InstallmentPlan, PaymentInstallment } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Props {
  plan: InstallmentPlan
  currency?: string
  payingInstallmentId?: string | null
}

withDefaults(defineProps<Props>(), { currency: 'XOF', payingInstallmentId: null })

const emit = defineEmits<{
  pay: [installment: PaymentInstallment]
}>()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-4 font-medium">Echeance</th>
          <th class="py-2 pr-4 font-medium">Date</th>
          <th class="py-2 pr-4 text-right font-medium">Montant</th>
          <th class="py-2 pr-4 font-medium">Statut</th>
          <th class="py-2 pl-4 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="(installment, index) in plan.installments" :key="installment.id">
          <td class="py-2 pr-4 text-gray-600">{{ index + 1 }} / {{ plan.installments.length }}</td>
          <td class="py-2 pr-4 text-gray-600">{{ formatDate(installment.dueDate) }}</td>
          <td class="py-2 pr-4 text-right font-medium text-gray-900">
            {{ formatCurrency(installment.amount, currency) }}
          </td>
          <td class="py-2 pr-4">
            <BaseBadge :variant="INSTALLMENT_STATUS_BADGE_VARIANT[installment.status]">
              {{ INSTALLMENT_STATUS_LABELS[installment.status] }}
            </BaseBadge>
          </td>
          <td class="py-2 pl-4 text-right">
            <BaseButton
              v-if="installment.status !== 'paid'"
              size="sm"
              variant="outline"
              :loading="payingInstallmentId === installment.id"
              @click="emit('pay', installment)"
            >
              <CircleDollarSign class="size-4" aria-hidden="true" />
              Encaisser
            </BaseButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
