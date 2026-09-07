<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import { PAYMENT_METHOD_LABELS } from '@/constants'
import { defaultIssueDate } from '@/composables/useInvoiceBuilder'
import type { CreatePaymentPayload, Invoice, PaymentMethod } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { getInvoiceBalance } from '@/utils/paymentStatus'

interface Props {
  invoice: Invoice
  submitting?: boolean
  /** Erreurs de validation renvoyees par le backend, par champ. */
  serverErrors?: Record<string, string[]> | null
  currency?: string
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
  serverErrors: null,
  currency: 'XOF'
})

const emit = defineEmits<{
  submit: [payload: Omit<CreatePaymentPayload, 'invoiceId'>]
  cancel: []
}>()

const { t } = useI18n()

interface PaymentFormState {
  amount: string
  method: PaymentMethod
  paidAt: string
  reference: string
  notes: string
}

function balance(): number {
  return getInvoiceBalance(props.invoice.amountPaid, props.invoice.total)
}

function emptyForm(): PaymentFormState {
  return {
    amount: String(balance()),
    method: 'cash',
    paidAt: defaultIssueDate(),
    reference: '',
    notes: ''
  }
}

const form = reactive<PaymentFormState>(emptyForm())
const localErrors = reactive<Partial<Record<keyof PaymentFormState, string>>>({})

// Si la facture change (ou que son solde est mis a jour), on repropose le
// solde restant comme montant par defaut.
watch(
  () => props.invoice.id,
  () => Object.assign(form, emptyForm())
)

function fieldError(field: keyof PaymentFormState): string | undefined {
  return localErrors[field] ?? props.serverErrors?.[field]?.[0]
}

function validate(): boolean {
  const amount = Number(form.amount)
  const remaining = balance()

  if (!form.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
    localErrors.amount = t('invoices.detail.amountInvalid')
  } else if (amount > remaining) {
    // Regle metier explicite : le montant paye ne doit jamais depasser le
    // solde restant de la facture.
    localErrors.amount = t('invoices.detail.paymentForm.amountExceedsBalance', {
      amount: formatCurrency(remaining, props.currency)
    })
  } else {
    localErrors.amount = undefined
  }

  return !localErrors.amount
}

function onSubmit(): void {
  if (!validate()) return

  emit('submit', {
    amount: Number(form.amount),
    method: form.method,
    paidAt: form.paidAt,
    reference: form.reference.trim() || undefined,
    notes: form.notes.trim() || undefined
  })
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <p class="text-sm text-gray-500">
      {{ $t('invoices.detail.paymentForm.remainingBalance') }}
      <span class="font-medium text-gray-900">{{ formatCurrency(balance(), currency) }}</span>
    </p>

    <div class="grid grid-cols-2 gap-4">
      <BaseInput
        v-model="form.amount"
        type="number"
        min="0"
        :label="$t('invoices.detail.paymentForm.amountLabel', { currency })"
        :error="fieldError('amount')"
        required
      />

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700" for="payment-method">
          {{ $t('invoices.form.paymentMethodLabel') }}
        </label>
        <select
          id="payment-method"
          v-model="form.method"
          class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option v-for="(label, value) in PAYMENT_METHOD_LABELS" :key="value" :value="value">
            {{ $t(label) }}
          </option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <BaseInput
        v-model="form.paidAt"
        type="date"
        :label="$t('invoices.detail.paymentForm.dateLabel')"
      />
      <BaseInput
        v-model="form.reference"
        :label="$t('invoices.detail.referenceLabel')"
        :hint="$t('invoices.detail.optionalHint')"
      />
    </div>

    <BaseTextarea v-model="form.notes" :label="$t('invoices.form.notesLabel')" :rows="2" />

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">{{
        $t('invoices.detail.paymentForm.submit')
      }}</BaseButton>
    </div>
  </form>
</template>
