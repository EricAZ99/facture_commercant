<script setup lang="ts">
import {
  Ban,
  Copy,
  Download,
  Eye,
  ExternalLink,
  Mail,
  MessageCircle,
  Pencil,
  Printer,
  Share2
} from 'lucide-vue-next'
import { computed } from 'vue'

import BaseBadge from '@/components/base/BaseBadge.vue'
import DropdownMenu from '@/components/base/DropdownMenu.vue'
import {
  canCancelInvoice,
  canEditInvoice,
  INVOICE_STATUS_BADGE_VARIANT,
  INVOICE_STATUS_LABELS
} from '@/constants'
import type { ID, Invoice } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Props {
  invoices: Invoice[]
  currency?: string
  selection?: ID[]
}

const props = withDefaults(defineProps<Props>(), { currency: 'XOF', selection: () => [] })

const emit = defineEmits<{
  view: [invoice: Invoice]
  edit: [invoice: Invoice]
  duplicate: [invoice: Invoice]
  download: [invoice: Invoice]
  openPdf: [invoice: Invoice]
  print: [invoice: Invoice]
  share: [invoice: Invoice]
  sendEmail: [invoice: Invoice]
  sendWhatsApp: [invoice: Invoice]
  cancel: [invoice: Invoice]
  'update:selection': [ids: ID[]]
}>()

const allSelected = computed(
  () => props.invoices.length > 0 && props.invoices.every((i) => props.selection.includes(i.id))
)

function toggleAll(): void {
  emit('update:selection', allSelected.value ? [] : props.invoices.map((i) => i.id))
}

function toggleOne(id: ID): void {
  emit(
    'update:selection',
    props.selection.includes(id)
      ? props.selection.filter((s) => s !== id)
      : [...props.selection, id]
  )
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-2 font-medium">
            <input
              type="checkbox"
              :checked="allSelected"
              class="focus-ring size-4 cursor-pointer rounded border-gray-300 text-primary-600"
              :aria-label="$t('invoices.list.selectAll')"
              @change="toggleAll"
            />
          </th>
          <th class="py-2 pr-4 font-medium">{{ $t('invoices.list.columnNumber') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('invoices.list.columnClient') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('invoices.list.columnDate') }}</th>
          <th class="py-2 pr-4 text-right font-medium">{{ $t('invoices.list.columnAmount') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('invoices.list.columnStatus') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('invoices.list.columnPayment') }}</th>
          <th class="py-2 pl-4 text-right font-medium">{{ $t('invoices.list.columnActions') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr
          v-for="invoice in invoices"
          :key="invoice.id"
          :class="['hover:bg-gray-50', selection.includes(invoice.id) && 'bg-primary-50']"
        >
          <td class="py-3 pr-2">
            <input
              type="checkbox"
              :checked="selection.includes(invoice.id)"
              class="focus-ring size-4 cursor-pointer rounded border-gray-300 text-primary-600"
              :aria-label="$t('invoices.list.selectOne', { number: invoice.number })"
              @change="toggleOne(invoice.id)"
            />
          </td>
          <td class="py-3 pr-4">
            <button
              type="button"
              class="focus-ring rounded-lg text-left font-medium text-gray-900"
              @click="emit('view', invoice)"
            >
              {{ invoice.number }}
            </button>
          </td>
          <td class="py-3 pr-4 text-gray-600">{{ invoice.clientName || '-' }}</td>
          <td class="py-3 pr-4 text-gray-600">{{ formatDate(invoice.issueDate) }}</td>
          <td class="py-3 pr-4 text-right font-medium text-gray-900">
            {{ formatCurrency(invoice.total, currency) }}
          </td>
          <td class="py-3 pr-4">
            <BaseBadge :variant="INVOICE_STATUS_BADGE_VARIANT[invoice.status]">
              {{ $t(INVOICE_STATUS_LABELS[invoice.status]) }}
            </BaseBadge>
          </td>
          <td class="py-3 pr-4 text-gray-600">
            <span v-if="invoice.amountPaid <= 0" class="text-gray-300">{{
              $t('invoices.list.notPaid')
            }}</span>
            <span v-else-if="invoice.amountPaid >= invoice.total">{{
              $t('invoices.list.fullyPaid')
            }}</span>
            <span v-else>
              {{ formatCurrency(invoice.amountPaid, currency) }} /
              {{ formatCurrency(invoice.total, currency) }}
            </span>
          </td>
          <td class="py-3 pl-4">
            <div class="flex items-center justify-end gap-1">
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                :aria-label="$t('invoices.list.view')"
                @click="emit('view', invoice)"
              >
                <Eye class="size-4" />
              </button>
              <button
                v-if="canEditInvoice(invoice.status)"
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                :aria-label="$t('invoices.list.edit')"
                @click="emit('edit', invoice)"
              >
                <Pencil class="size-4" />
              </button>

              <DropdownMenu>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('duplicate', invoice)"
                >
                  <Copy class="size-4" aria-hidden="true" />
                  {{ $t('invoices.list.duplicate') }}
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('download', invoice)"
                >
                  <Download class="size-4" aria-hidden="true" />
                  {{ $t('invoices.list.download') }}
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('openPdf', invoice)"
                >
                  <ExternalLink class="size-4" aria-hidden="true" />
                  {{ $t('invoices.list.openPdf') }}
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('print', invoice)"
                >
                  <Printer class="size-4" aria-hidden="true" />
                  {{ $t('invoices.list.print') }}
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('share', invoice)"
                >
                  <Share2 class="size-4" aria-hidden="true" />
                  {{ $t('invoices.list.share') }}
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('sendEmail', invoice)"
                >
                  <Mail class="size-4" aria-hidden="true" />
                  {{ $t('invoices.list.sendEmail') }}
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('sendWhatsApp', invoice)"
                >
                  <MessageCircle class="size-4" aria-hidden="true" />
                  {{ $t('invoices.list.sendWhatsApp') }}
                </button>
                <button
                  v-if="canCancelInvoice(invoice.status)"
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  @click="emit('cancel', invoice)"
                >
                  <Ban class="size-4" aria-hidden="true" />
                  {{ $t('invoices.list.cancel') }}
                </button>
              </DropdownMenu>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
