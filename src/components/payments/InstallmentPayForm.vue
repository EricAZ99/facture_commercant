<script setup lang="ts">
import { reactive } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { PAYMENT_METHOD_LABELS } from '@/constants'
import { defaultIssueDate } from '@/composables/useInvoiceBuilder'
import type { PayInstallmentPayload, PaymentInstallment } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  installment: PaymentInstallment
  submitting?: boolean
  currency?: string
}

withDefaults(defineProps<Props>(), { submitting: false, currency: 'XOF' })

const emit = defineEmits<{
  submit: [payload: PayInstallmentPayload]
  cancel: []
}>()

const form = reactive({
  method: 'cash' as PayInstallmentPayload['method'],
  paidAt: defaultIssueDate(),
  reference: ''
})

function onSubmit(): void {
  emit('submit', {
    method: form.method,
    paidAt: form.paidAt,
    reference: form.reference.trim() || undefined
  })
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <p class="text-sm text-gray-500">
      Montant de l'echeance :
      <span class="font-medium text-gray-900">
        {{ formatCurrency(installment.amount, currency) }}
      </span>
    </p>

    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-gray-700" for="installment-payment-method">
        Mode de paiement
      </label>
      <select
        id="installment-payment-method"
        v-model="form.method"
        class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
      >
        <option v-for="(label, value) in PAYMENT_METHOD_LABELS" :key="value" :value="value">
          {{ label }}
        </option>
      </select>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <BaseInput v-model="form.paidAt" type="date" label="Date d'encaissement" />
      <BaseInput v-model="form.reference" label="Reference" hint="Optionnel." />
    </div>

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        Annuler
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">Encaisser l'echeance</BaseButton>
    </div>
  </form>
</template>
