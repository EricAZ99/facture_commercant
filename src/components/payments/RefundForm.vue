<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import type { CreateRefundPayload, Payment } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  payment: Payment
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
  submit: [payload: CreateRefundPayload]
  cancel: []
}>()

const { t } = useI18n()

function refundable(): number {
  return Math.round((props.payment.amount - (props.payment.refundedAmount ?? 0)) * 100) / 100
}

const form = reactive({ amount: String(refundable()), reason: '' })
const localErrors = reactive<{ amount?: string; reason?: string }>({})

function fieldError(field: 'amount' | 'reason'): string | undefined {
  return localErrors[field] ?? props.serverErrors?.[field]?.[0]
}

function validate(): boolean {
  const amount = Number(form.amount)
  const max = refundable()

  if (!form.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
    localErrors.amount = t('invoices.detail.amountInvalid')
  } else if (amount > max) {
    localErrors.amount = t('invoices.detail.refundForm.amountExceedsRefundable', {
      amount: formatCurrency(max, props.currency)
    })
  } else {
    localErrors.amount = undefined
  }

  localErrors.reason = form.reason.trim()
    ? undefined
    : t('invoices.detail.refundForm.reasonRequired')

  return !localErrors.amount && !localErrors.reason
}

function onSubmit(): void {
  if (!validate()) return
  emit('submit', { amount: Number(form.amount), reason: form.reason.trim() })
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <p class="text-sm text-gray-500">
      {{ $t('invoices.detail.refundForm.refundableBalance') }}
      <span class="font-medium text-gray-900">{{ formatCurrency(refundable(), currency) }}</span>
    </p>

    <BaseInput
      v-model="form.amount"
      type="number"
      min="0"
      :label="$t('invoices.detail.refundForm.amountLabel', { currency })"
      :error="fieldError('amount')"
      required
    />

    <BaseTextarea
      v-model="form.reason"
      :label="$t('invoices.detail.refundForm.reasonLabel')"
      :rows="2"
      :error="fieldError('reason')"
      required
    />

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">{{
        $t('invoices.detail.refundForm.submit')
      }}</BaseButton>
    </div>
  </form>
</template>
