<script setup lang="ts">
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Share2,
  Wallet,
  X
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import DropdownMenu from '@/components/base/DropdownMenu.vue'
import InvoiceForm from '@/components/invoices/InvoiceForm.vue'
import InvoiceSummary from '@/components/invoices/InvoiceSummary.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import PaymentForm from '@/components/payments/PaymentForm.vue'
import PaymentHistory from '@/components/payments/PaymentHistory.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useApi, useInvoiceActions, usePayments } from '@/composables'
import {
  canCancelInvoice,
  canEditInvoice,
  INVOICE_PAYMENT_STATUS_BADGE_VARIANT,
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_STATUS_BADGE_VARIANT,
  INVOICE_STATUS_LABELS,
  ROUTE_NAMES
} from '@/constants'
import { clientService, invoiceService } from '@/services'
import { useAuthStore } from '@/stores'
import type { Client, CreatePaymentPayload, Invoice } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { InvoiceTotals } from '@/utils/invoiceCalculations'
import { getInvoiceBalance, getInvoicePaymentStatus } from '@/utils/paymentStatus'

interface Props {
  id: string
}

const props = defineProps<Props>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const showCreatedBanner = ref(route.query.created === '1')

const { data: invoice, isLoading, isError, error, execute } = useApi(invoiceService.getById)

const {
  payments,
  isLoading: isLoadingPayments,
  error: paymentsError,
  isSubmitting: isSubmittingPayment,
  submitError: paymentSubmitError,
  load: loadPayments,
  registerPayment
} = usePayments(props.id)

const {
  isCancelling,
  isDuplicating,
  isDownloading,
  isOpeningPdf,
  isPrinting,
  isSharing,
  isSendingEmail,
  isSendingWhatsApp,
  cancelInvoice,
  duplicateInvoice,
  downloadInvoice,
  openInvoicePdf,
  printInvoice,
  shareInvoice,
  sendInvoiceByEmail,
  sendInvoiceByWhatsApp
} = useInvoiceActions()

// Regroupe les actions "document" secondaires (menu deroulant) : le menu se
// referme des le clic, ce spinner sur le declencheur reste donc le seul
// retour visuel pendant la requete, en plus du toast de resultat.
const isProcessingDocumentAction = computed(
  () =>
    isOpeningPdf.value ||
    isDuplicating.value ||
    isSharing.value ||
    isSendingEmail.value ||
    isSendingWhatsApp.value
)

async function load(): Promise<void> {
  await Promise.all([execute(props.id), loadPayments()])
}

// --- Edition inline (brouillons uniquement) --------------------------

const isEditing = ref(false)
const editingClient = ref<Client | null>(null)

async function openEdit(): Promise<void> {
  if (!invoice.value) return
  if (!editingClient.value || editingClient.value.id !== invoice.value.clientId) {
    editingClient.value = await clientService.getById(invoice.value.clientId)
  }
  isEditing.value = true
}

function onEditSuccess(updated: Invoice): void {
  invoice.value = updated
  isEditing.value = false
}

onMounted(async () => {
  await load()
  if (route.query.edit === '1' && invoice.value && canEditInvoice(invoice.value.status)) {
    await openEdit()
  }
})

const totals = computed<InvoiceTotals | null>(() => {
  if (!invoice.value) return null
  return {
    subtotal: invoice.value.subtotal,
    discountAmount: invoice.value.discountAmount,
    taxableAmount: invoice.value.subtotal - invoice.value.discountAmount,
    taxTotal: invoice.value.taxTotal,
    total: invoice.value.total
  }
})

const balance = computed(() =>
  invoice.value ? getInvoiceBalance(invoice.value.amountPaid, invoice.value.total) : 0
)
const paymentStatus = computed(() =>
  invoice.value ? getInvoicePaymentStatus(invoice.value.amountPaid, invoice.value.total) : 'unpaid'
)
const canRegisterPayment = computed(
  () =>
    invoice.value !== null &&
    !['draft', 'cancelled'].includes(invoice.value.status) &&
    balance.value > 0
)

// --- Paiements ------------------------------------------------------------

const isPaymentFormOpen = ref(false)
const paymentServerErrors = ref<Record<string, string[]> | null>(null)

function openPaymentForm(): void {
  paymentServerErrors.value = null
  isPaymentFormOpen.value = true
}

async function onPaymentSubmit(payload: Omit<CreatePaymentPayload, 'invoiceId'>): Promise<void> {
  paymentServerErrors.value = null
  const payment = await registerPayment(payload)
  if (!payment) {
    paymentServerErrors.value = paymentSubmitError.value?.details ?? null
    return
  }
  isPaymentFormOpen.value = false
  // Le paiement met a jour le solde/statut de la facture cote backend : on
  // rafraichit la facture pour refleter la nouvelle valeur.
  await execute(props.id)
}

// --- Actions facture ------------------------------------------------------

async function onDuplicate(): Promise<void> {
  if (!invoice.value) return
  const created = await duplicateInvoice(invoice.value)
  if (created) {
    await router.push({ name: ROUTE_NAMES.invoiceDetail, params: { id: created.id } })
  }
}

async function onDownload(): Promise<void> {
  if (invoice.value) await downloadInvoice(invoice.value)
}

async function onOpenPdf(): Promise<void> {
  if (invoice.value) await openInvoicePdf(invoice.value)
}

async function onPrint(): Promise<void> {
  if (invoice.value) await printInvoice(invoice.value)
}

async function onShare(): Promise<void> {
  if (invoice.value) await shareInvoice(invoice.value)
}

async function onSendEmail(): Promise<void> {
  if (invoice.value) await sendInvoiceByEmail(invoice.value)
}

async function onSendWhatsApp(): Promise<void> {
  if (invoice.value) await sendInvoiceByWhatsApp(invoice.value)
}

const isCancelDialogOpen = ref(false)

async function confirmCancel(): Promise<void> {
  if (!invoice.value) return
  const success = await cancelInvoice(invoice.value)
  if (success) {
    isCancelDialogOpen.value = false
    await load()
  }
}
</script>

<template>
  <div>
    <RouterLink
      :to="{ name: ROUTE_NAMES.invoices }"
      class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 print:hidden"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Retour aux factures
    </RouterLink>

    <div
      v-if="showCreatedBanner"
      class="mb-4 flex items-center justify-between gap-3 rounded-lg bg-green-50 p-3 text-sm text-green-700 print:hidden"
    >
      <span class="flex items-center gap-2">
        <CheckCircle2 class="size-4 shrink-0" aria-hidden="true" />
        Facture creee avec succes.
      </span>
      <button
        type="button"
        class="rounded p-0.5 text-green-700 hover:text-green-900"
        aria-label="Fermer"
        @click="showCreatedBanner = false"
      >
        <X class="size-4" />
      </button>
    </div>

    <PageHeader
      :title="invoice ? `Facture ${invoice.number}` : 'Facture'"
      subtitle="Details de la facture."
    >
      <template v-if="invoice && !isEditing" #actions>
        <div class="flex flex-wrap items-center gap-2 print:hidden">
          <BaseButton
            v-if="canEditInvoice(invoice.status)"
            variant="outline"
            size="sm"
            @click="openEdit"
          >
            <Pencil class="size-4" aria-hidden="true" />
            Modifier
          </BaseButton>
          <BaseButton variant="outline" size="sm" :loading="isDownloading" @click="onDownload">
            <Download class="size-4" aria-hidden="true" />
            Telecharger
          </BaseButton>
          <BaseButton variant="outline" size="sm" :loading="isPrinting" @click="onPrint">
            <Printer class="size-4" aria-hidden="true" />
            Imprimer
          </BaseButton>

          <DropdownMenu>
            <template #trigger="{ toggle }">
              <BaseButton
                variant="outline"
                size="sm"
                :loading="isProcessingDocumentAction"
                @click="toggle"
              >
                <MoreHorizontal
                  v-if="!isProcessingDocumentAction"
                  class="size-4"
                  aria-hidden="true"
                />
              </BaseButton>
            </template>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              @click="onOpenPdf"
            >
              <ExternalLink class="size-4" aria-hidden="true" />
              Ouvrir le PDF
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              @click="onDuplicate"
            >
              <Copy class="size-4" aria-hidden="true" />
              Dupliquer
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              @click="onShare"
            >
              <Share2 class="size-4" aria-hidden="true" />
              Partager
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              @click="onSendEmail"
            >
              <Mail class="size-4" aria-hidden="true" />
              Envoyer par email
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              @click="onSendWhatsApp"
            >
              <MessageCircle class="size-4" aria-hidden="true" />
              Envoyer par WhatsApp
            </button>
            <button
              v-if="canCancelInvoice(invoice.status)"
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              @click="isCancelDialogOpen = true"
            >
              <Ban class="size-4" aria-hidden="true" />
              Annuler
            </button>
          </DropdownMenu>
        </div>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" message="Chargement de la facture..." />
    <ErrorState v-else-if="isError" :message="error?.message" @retry="() => execute(props.id)" />

    <InvoiceForm
      v-else-if="invoice && isEditing"
      :invoice="invoice"
      :client="editingClient"
      @success="onEditSuccess"
      @cancel="isEditing = false"
    />

    <div v-else-if="invoice" class="flex flex-col gap-6">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BaseCard title="Informations">
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">Statut</dt>
              <dd>
                <BaseBadge :variant="INVOICE_STATUS_BADGE_VARIANT[invoice.status]">
                  {{ INVOICE_STATUS_LABELS[invoice.status] }}
                </BaseBadge>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Client</dt>
              <dd class="font-medium text-gray-900">{{ invoice.clientName || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Date d'emission</dt>
              <dd class="text-gray-900">{{ formatDate(invoice.issueDate) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Date d'echeance</dt>
              <dd class="text-gray-900">{{ formatDate(invoice.dueDate) }}</dd>
            </div>
          </dl>
          <p v-if="invoice.notes" class="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
            {{ invoice.notes }}
          </p>
        </BaseCard>

        <BaseCard title="Recapitulatif">
          <InvoiceSummary
            v-if="totals"
            :totals="totals"
            :discount-type="invoice.discountType"
            :discount-value="invoice.discountValue"
            :currency="currency"
          />
        </BaseCard>
      </div>

      <BaseCard title="Articles">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th class="py-2 pr-4 font-medium">Description</th>
                <th class="py-2 pr-4 text-right font-medium">Qte</th>
                <th class="py-2 pr-4 text-right font-medium">Prix</th>
                <th class="py-2 pr-4 text-right font-medium">TVA</th>
                <th class="py-2 pl-4 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in invoice.items" :key="item.id">
                <td class="py-2 pr-4 text-gray-900">{{ item.description }}</td>
                <td class="py-2 pr-4 text-right text-gray-600">{{ item.quantity }}</td>
                <td class="py-2 pr-4 text-right text-gray-600">
                  {{ formatCurrency(item.unitPrice, currency) }}
                </td>
                <td class="py-2 pr-4 text-right text-gray-600">{{ item.taxRate }}%</td>
                <td class="py-2 pl-4 text-right font-medium text-gray-900">
                  {{ formatCurrency(item.total, currency) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>

      <BaseCard title="Paiement">
        <template v-if="canRegisterPayment" #actions>
          <BaseButton size="sm" class="print:hidden" @click="openPaymentForm">
            <Plus class="size-4" aria-hidden="true" />
            Enregistrer un paiement
          </BaseButton>
        </template>

        <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p class="text-xs text-gray-500">Montant paye</p>
            <p class="text-lg font-semibold text-gray-900">
              {{ formatCurrency(invoice.amountPaid, currency) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Solde restant</p>
            <p
              class="text-lg font-semibold"
              :class="balance > 0 ? 'text-amber-600' : 'text-gray-900'"
            >
              {{ formatCurrency(balance, currency) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Statut de paiement</p>
            <BaseBadge :variant="INVOICE_PAYMENT_STATUS_BADGE_VARIANT[paymentStatus]">
              {{ INVOICE_PAYMENT_STATUS_LABELS[paymentStatus] }}
            </BaseBadge>
          </div>
        </div>

        <LoadingState
          v-if="isLoadingPayments && payments.length === 0"
          message="Chargement des paiements..."
        />
        <ErrorState
          v-else-if="paymentsError && payments.length === 0"
          :message="paymentsError.message"
          @retry="loadPayments"
        />
        <EmptyState
          v-else-if="payments.length === 0"
          :icon="Wallet"
          title="Aucun paiement"
          message="Aucun paiement n'a encore ete enregistre pour cette facture."
        />
        <PaymentHistory v-else :payments="payments" :currency="currency" />
      </BaseCard>
    </div>

    <BaseModal
      :open="isPaymentFormOpen"
      title="Enregistrer un paiement"
      @close="isPaymentFormOpen = false"
    >
      <PaymentForm
        v-if="invoice"
        :invoice="invoice"
        :submitting="isSubmittingPayment"
        :server-errors="paymentServerErrors"
        :currency="currency"
        @submit="onPaymentSubmit"
        @cancel="isPaymentFormOpen = false"
      />
    </BaseModal>

    <ConfirmDialog
      :open="isCancelDialogOpen"
      title="Annuler la facture"
      :message="
        invoice
          ? `Voulez-vous vraiment annuler la facture ${invoice.number} ? Cette action est irreversible.`
          : ''
      "
      confirm-label="Annuler la facture"
      :loading="isCancelling"
      @confirm="confirmCancel"
      @cancel="isCancelDialogOpen = false"
    />
  </div>
</template>
