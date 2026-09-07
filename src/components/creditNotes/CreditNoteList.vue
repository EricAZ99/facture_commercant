<script setup lang="ts">
import type { CreditNote } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Props {
  creditNotes: CreditNote[]
  currency?: string
  /** Masque la colonne facture (redondant sur la page de detail d'une facture). */
  hideInvoiceColumn?: boolean
}

withDefaults(defineProps<Props>(), { currency: 'XOF', hideInvoiceColumn: false })
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-4 font-medium">
            {{ $t('invoices.detail.creditNoteList.columnNumber') }}
          </th>
          <th v-if="!hideInvoiceColumn" class="py-2 pr-4 font-medium">
            {{ $t('invoices.detail.creditNoteList.columnInvoice') }}
          </th>
          <th class="py-2 pr-4 font-medium">
            {{ $t('invoices.detail.creditNoteList.columnClient') }}
          </th>
          <th class="py-2 pr-4 font-medium">
            {{ $t('invoices.detail.creditNoteList.columnDate') }}
          </th>
          <th class="py-2 pr-4 font-medium">
            {{ $t('invoices.detail.creditNoteList.columnReason') }}
          </th>
          <th class="py-2 pl-4 text-right font-medium">
            {{ $t('invoices.detail.creditNoteList.columnAmount') }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="creditNote in creditNotes" :key="creditNote.id" class="hover:bg-gray-50">
          <td class="py-3 pr-4 font-medium text-gray-900">{{ creditNote.number }}</td>
          <td v-if="!hideInvoiceColumn" class="py-3 pr-4 text-gray-600">
            {{ creditNote.invoiceNumber || '-' }}
          </td>
          <td class="py-3 pr-4 text-gray-600">{{ creditNote.clientName || '-' }}</td>
          <td class="py-3 pr-4 text-gray-600">{{ formatDate(creditNote.issueDate) }}</td>
          <td class="py-3 pr-4 text-gray-600">{{ creditNote.reason }}</td>
          <td class="py-3 pl-4 text-right font-medium text-gray-900">
            {{ formatCurrency(creditNote.total, currency) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
