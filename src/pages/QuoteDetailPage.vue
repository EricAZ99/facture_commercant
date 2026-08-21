<script setup lang="ts">
import { ArrowLeft, ArrowRightLeft, CheckCircle2, Copy, Pencil, Trash2, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import InvoiceSummary from '@/components/invoices/InvoiceSummary.vue'
import QuoteForm from '@/components/quotes/QuoteForm.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useApi, useQuoteActions } from '@/composables'
import {
  canConvertQuote,
  canDeleteQuote,
  canEditQuote,
  QUOTE_STATUS_BADGE_VARIANT,
  QUOTE_STATUS_LABELS,
  ROUTE_NAMES
} from '@/constants'
import { clientService, quoteService } from '@/services'
import { useAuthStore } from '@/stores'
import type { Client, Quote } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { InvoiceTotals } from '@/utils/invoiceCalculations'

interface Props {
  id: string
}

const props = defineProps<Props>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const showCreatedBanner = ref(route.query.created === '1')

const { data: quote, isLoading, isError, error, execute } = useApi(quoteService.getById)
const { isRemoving, isConverting, isDuplicating, removeQuote, convertQuote, duplicateQuote } =
  useQuoteActions()

async function load(): Promise<void> {
  await execute(props.id)
}

const isEditing = ref(false)
const editingClient = ref<Client | null>(null)

async function openEdit(): Promise<void> {
  if (!quote.value) return
  if (!editingClient.value || editingClient.value.id !== quote.value.clientId) {
    editingClient.value = await clientService.getById(quote.value.clientId)
  }
  isEditing.value = true
}

function onEditSuccess(updated: Quote): void {
  quote.value = updated
  isEditing.value = false
}

onMounted(async () => {
  await load()
  if (route.query.edit === '1' && quote.value && canEditQuote(quote.value.status)) {
    await openEdit()
  }
})

const totals = computed<InvoiceTotals | null>(() => {
  if (!quote.value) return null
  return {
    subtotal: quote.value.subtotal,
    discountAmount: quote.value.discountAmount,
    taxableAmount: quote.value.subtotal - quote.value.discountAmount,
    taxTotal: quote.value.taxTotal,
    total: quote.value.total
  }
})

// --- Conversion en facture ------------------------------------------------

const isConvertDialogOpen = ref(false)

async function confirmConvert(): Promise<void> {
  if (!quote.value) return
  const invoice = await convertQuote(quote.value)
  if (invoice) {
    isConvertDialogOpen.value = false
    await router.push({ name: ROUTE_NAMES.invoiceDetail, params: { id: invoice.id } })
  }
}

// --- Duplication --------------------------------------------------------

async function onDuplicate(): Promise<void> {
  if (!quote.value) return
  const created = await duplicateQuote(quote.value)
  if (created) {
    await router.push({ name: ROUTE_NAMES.quoteDetail, params: { id: created.id } })
  }
}

// --- Suppression ------------------------------------------------------

const isRemoveDialogOpen = ref(false)

async function confirmRemove(): Promise<void> {
  if (!quote.value) return
  const success = await removeQuote(quote.value)
  if (success) {
    await router.push({ name: ROUTE_NAMES.quotes })
  }
}
</script>

<template>
  <div>
    <RouterLink
      :to="{ name: ROUTE_NAMES.quotes }"
      class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 print:hidden"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Retour aux devis
    </RouterLink>

    <div
      v-if="showCreatedBanner"
      class="mb-4 flex items-center justify-between gap-3 rounded-lg bg-green-50 p-3 text-sm text-green-700 print:hidden"
    >
      <span class="flex items-center gap-2">
        <CheckCircle2 class="size-4 shrink-0" aria-hidden="true" />
        Devis cree avec succes.
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

    <PageHeader :title="quote ? `Devis ${quote.number}` : 'Devis'" subtitle="Details du devis.">
      <template v-if="quote && !isEditing" #actions>
        <div class="flex flex-wrap items-center gap-2 print:hidden">
          <BaseButton
            v-if="canEditQuote(quote.status)"
            variant="outline"
            size="sm"
            @click="openEdit"
          >
            <Pencil class="size-4" aria-hidden="true" />
            Modifier
          </BaseButton>
          <BaseButton
            v-if="canConvertQuote(quote.status)"
            variant="outline"
            size="sm"
            @click="isConvertDialogOpen = true"
          >
            <ArrowRightLeft class="size-4" aria-hidden="true" />
            Convertir en facture
          </BaseButton>
          <BaseButton variant="outline" size="sm" :loading="isDuplicating" @click="onDuplicate">
            <Copy v-if="!isDuplicating" class="size-4" aria-hidden="true" />
            Dupliquer
          </BaseButton>
          <BaseButton
            v-if="canDeleteQuote(quote.status)"
            variant="outline"
            size="sm"
            @click="isRemoveDialogOpen = true"
          >
            <Trash2 class="size-4" aria-hidden="true" />
            Supprimer
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" message="Chargement du devis..." />
    <ErrorState v-else-if="isError" :message="error?.message" @retry="() => execute(props.id)" />

    <QuoteForm
      v-else-if="quote && isEditing"
      :quote="quote"
      :client="editingClient"
      @success="onEditSuccess"
      @cancel="isEditing = false"
    />

    <div v-else-if="quote" class="flex flex-col gap-6">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BaseCard title="Informations">
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">Statut</dt>
              <dd>
                <BaseBadge :variant="QUOTE_STATUS_BADGE_VARIANT[quote.status]">
                  {{ QUOTE_STATUS_LABELS[quote.status] }}
                </BaseBadge>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Client</dt>
              <dd class="font-medium text-gray-900">{{ quote.clientName || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Date d'emission</dt>
              <dd class="text-gray-900">{{ formatDate(quote.issueDate) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Valide jusqu'au</dt>
              <dd class="text-gray-900">{{ formatDate(quote.expiryDate) }}</dd>
            </div>
          </dl>
          <p v-if="quote.notes" class="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
            {{ quote.notes }}
          </p>
        </BaseCard>

        <BaseCard title="Recapitulatif">
          <InvoiceSummary
            v-if="totals"
            :totals="totals"
            :discount-type="quote.discountType"
            :discount-value="quote.discountValue"
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
              <tr v-for="item in quote.items" :key="item.id">
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
    </div>

    <ConfirmDialog
      :open="isConvertDialogOpen"
      title="Convertir en facture"
      :message="
        quote
          ? `Le devis ${quote.number} sera converti en facture envoyee. Cette action est irreversible.`
          : ''
      "
      confirm-label="Convertir"
      :loading="isConverting"
      @confirm="confirmConvert"
      @cancel="isConvertDialogOpen = false"
    />

    <ConfirmDialog
      :open="isRemoveDialogOpen"
      title="Supprimer le devis"
      :message="
        quote
          ? `Voulez-vous vraiment supprimer le devis ${quote.number} ? Cette action est irreversible.`
          : ''
      "
      confirm-label="Supprimer"
      :loading="isRemoving"
      @confirm="confirmRemove"
      @cancel="isRemoveDialogOpen = false"
    />
  </div>
</template>
