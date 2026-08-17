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

import BaseBadge from '@/components/base/BaseBadge.vue'
import DropdownMenu from '@/components/base/DropdownMenu.vue'
import {
  canCancelInvoice,
  canEditInvoice,
  INVOICE_STATUS_BADGE_VARIANT,
  INVOICE_STATUS_LABELS
} from '@/constants'
import type { Invoice } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Props {
  invoices: Invoice[]
  currency?: string
}

withDefaults(defineProps<Props>(), { currency: 'XOF' })

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
}>()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-4 font-medium">Numero</th>
          <th class="py-2 pr-4 font-medium">Client</th>
          <th class="py-2 pr-4 font-medium">Date</th>
          <th class="py-2 pr-4 text-right font-medium">Montant</th>
          <th class="py-2 pr-4 font-medium">Statut</th>
          <th class="py-2 pr-4 font-medium">Paiement</th>
          <th class="py-2 pl-4 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="invoice in invoices" :key="invoice.id" class="hover:bg-gray-50">
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
              {{ INVOICE_STATUS_LABELS[invoice.status] }}
            </BaseBadge>
          </td>
          <td class="py-3 pr-4 text-gray-600">
            <span v-if="invoice.amountPaid <= 0" class="text-gray-300">Non payee</span>
            <span v-else-if="invoice.amountPaid >= invoice.total">Payee en totalite</span>
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
                aria-label="Consulter la facture"
                @click="emit('view', invoice)"
              >
                <Eye class="size-4" />
              </button>
              <button
                v-if="canEditInvoice(invoice.status)"
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Modifier la facture"
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
                  Dupliquer
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('download', invoice)"
                >
                  <Download class="size-4" aria-hidden="true" />
                  Telecharger
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('openPdf', invoice)"
                >
                  <ExternalLink class="size-4" aria-hidden="true" />
                  Ouvrir le PDF
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('print', invoice)"
                >
                  <Printer class="size-4" aria-hidden="true" />
                  Imprimer
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('share', invoice)"
                >
                  <Share2 class="size-4" aria-hidden="true" />
                  Partager
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('sendEmail', invoice)"
                >
                  <Mail class="size-4" aria-hidden="true" />
                  Envoyer par email
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  @click="emit('sendWhatsApp', invoice)"
                >
                  <MessageCircle class="size-4" aria-hidden="true" />
                  Envoyer par WhatsApp
                </button>
                <button
                  v-if="canCancelInvoice(invoice.status)"
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  @click="emit('cancel', invoice)"
                >
                  <Ban class="size-4" aria-hidden="true" />
                  Annuler
                </button>
              </DropdownMenu>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
