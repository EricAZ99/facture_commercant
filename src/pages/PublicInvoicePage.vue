<script setup lang="ts">
import { Download, Receipt } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { INVOICE_STATUS_BADGE_VARIANT, INVOICE_STATUS_LABELS } from '@/constants'
import { publicInvoiceService } from '@/services'
import type { ApiError, PublicInvoiceView } from '@/types'
import { downloadBlob } from '@/utils/download'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Props {
  token: string
}

const props = defineProps<Props>()

const invoice = ref<PublicInvoiceView | null>(null)
const isLoading = ref(true)
const error = ref<ApiError | null>(null)
const isDownloading = ref(false)

async function load(): Promise<void> {
  isLoading.value = true
  error.value = null
  try {
    invoice.value = await publicInvoiceService.getByToken(props.token)
  } catch (err) {
    error.value = err as ApiError
  } finally {
    isLoading.value = false
  }
}

async function onDownload(): Promise<void> {
  if (!invoice.value) return
  isDownloading.value = true
  try {
    const blob = await publicInvoiceService.fetchPdfBlob(props.token)
    downloadBlob(blob, `${invoice.value.number}.pdf`)
  } catch (err) {
    error.value = err as ApiError
  } finally {
    isDownloading.value = false
  }
}

onMounted(() => load())
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 py-10">
    <div class="mx-auto max-w-2xl">
      <LoadingState v-if="isLoading" message="Chargement de la facture..." />
      <ErrorState
        v-else-if="error"
        :message="error.message || 'Ce lien est invalide ou a expire.'"
        @retry="load"
      />

      <div
        v-else-if="invoice"
        class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <span
              class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
            >
              <Receipt class="size-5" aria-hidden="true" />
            </span>
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-400">
                {{ invoice.businessName }}
              </p>
              <h1 class="text-lg font-semibold text-gray-900">Facture {{ invoice.number }}</h1>
            </div>
          </div>
          <BaseBadge :variant="INVOICE_STATUS_BADGE_VARIANT[invoice.status]">
            {{ INVOICE_STATUS_LABELS[invoice.status] }}
          </BaseBadge>
        </div>

        <dl class="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 text-sm">
          <div>
            <dt class="text-gray-500">Client</dt>
            <dd class="font-medium text-gray-900">{{ invoice.clientName || '-' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Date d'emission</dt>
            <dd class="text-gray-900">{{ formatDate(invoice.issueDate) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Date d'echeance</dt>
            <dd class="text-gray-900">{{ formatDate(invoice.dueDate) }}</dd>
          </div>
          <div v-if="invoice.businessEmail">
            <dt class="text-gray-500">Contact</dt>
            <dd class="text-gray-900">{{ invoice.businessEmail }}</dd>
          </div>
        </dl>

        <div class="mt-6 overflow-x-auto border-t border-gray-100 pt-6">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th class="py-2 pr-4 font-medium">Description</th>
                <th class="py-2 pr-4 text-right font-medium">Qte</th>
                <th class="py-2 pr-4 text-right font-medium">Prix</th>
                <th class="py-2 pl-4 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in invoice.items" :key="item.id">
                <td class="py-2 pr-4 text-gray-900">{{ item.description }}</td>
                <td class="py-2 pr-4 text-right text-gray-600">{{ item.quantity }}</td>
                <td class="py-2 pr-4 text-right text-gray-600">
                  {{ formatCurrency(item.unitPrice, invoice.currency) }}
                </td>
                <td class="py-2 pl-4 text-right font-medium text-gray-900">
                  {{ formatCurrency(item.total, invoice.currency) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <dl class="mt-4 flex flex-col gap-1.5 border-t border-gray-100 pt-4 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-500">Sous-total</dt>
            <dd class="text-gray-900">{{ formatCurrency(invoice.subtotal, invoice.currency) }}</dd>
          </div>
          <div v-if="invoice.discountAmount > 0" class="flex justify-between">
            <dt class="text-gray-500">Remise</dt>
            <dd class="text-gray-900">
              -{{ formatCurrency(invoice.discountAmount, invoice.currency) }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">TVA</dt>
            <dd class="text-gray-900">{{ formatCurrency(invoice.taxTotal, invoice.currency) }}</dd>
          </div>
          <div class="flex justify-between text-base font-semibold">
            <dt class="text-gray-900">Total</dt>
            <dd class="text-gray-900">{{ formatCurrency(invoice.total, invoice.currency) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Deja regle</dt>
            <dd class="text-gray-900">
              {{ formatCurrency(invoice.amountPaid, invoice.currency) }}
            </dd>
          </div>
        </dl>

        <div v-if="invoice.customFields?.length" class="mt-4 border-t border-gray-100 pt-4">
          <dl class="flex flex-col gap-1.5 text-sm">
            <div
              v-for="field in invoice.customFields"
              :key="field.label"
              class="flex justify-between"
            >
              <dt class="text-gray-500">{{ field.label }}</dt>
              <dd class="text-gray-900">{{ field.value }}</dd>
            </div>
          </dl>
        </div>

        <p v-if="invoice.notes" class="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
          {{ invoice.notes }}
        </p>

        <div class="mt-6 flex justify-end border-t border-gray-100 pt-6">
          <BaseButton :loading="isDownloading" @click="onDownload">
            <Download v-if="!isDownloading" class="size-4" aria-hidden="true" />
            Telecharger le PDF
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
