<script setup lang="ts">
import { FileText, Plus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BulkActionBar from '@/components/base/BulkActionBar.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import InvoiceFilters from '@/components/invoices/InvoiceFilters.vue'
import InvoiceList from '@/components/invoices/InvoiceList.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useInvoices, usePermissions } from '@/composables'
import { ROUTE_NAMES } from '@/constants'
import { useAuthStore } from '@/stores'
import type { Invoice } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const { can } = usePermissions()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const {
  store,
  filters,
  selectedClient,
  pagination,
  load,
  nextPage,
  prevPage,
  setClientFilter,
  resetFilters,
  isCancelling,
  isBulkDownloading,
  isBulkCancelling,
  duplicateInvoice,
  downloadInvoice,
  openInvoicePdf,
  printInvoice,
  shareInvoice,
  sendInvoiceByEmail,
  sendInvoiceByWhatsApp,
  cancelInvoice,
  bulkDownloadInvoices,
  bulkCancelInvoices
} = useInvoices()

// --- Sélection multiple --------------------------------------------------

const selection = ref<string[]>([])

function clearSelection(): void {
  selection.value = []
}

async function onBulkAction(action: string): Promise<void> {
  const selected = store.items.filter((i) => selection.value.includes(i.id))
  if (action === 'download') {
    await bulkDownloadInvoices(selected)
  } else if (action === 'cancel') {
    const count = await bulkCancelInvoices(selected)
    if (count > 0) {
      clearSelection()
      await load()
    }
  }
}

function viewInvoice(invoice: Invoice): void {
  router.push({ name: ROUTE_NAMES.invoiceDetail, params: { id: invoice.id } })
}

function editInvoice(invoice: Invoice): void {
  router.push({
    name: ROUTE_NAMES.invoiceDetail,
    params: { id: invoice.id },
    query: { edit: '1' }
  })
}

async function onDuplicate(invoice: Invoice): Promise<void> {
  const created = await duplicateInvoice(invoice)
  if (created) {
    await router.push({ name: ROUTE_NAMES.invoiceDetail, params: { id: created.id } })
  }
}

const hasActiveFilters = computed(
  () =>
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.clientId) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.amountMin) ||
    Boolean(filters.amountMax)
)

// --- Annulation ---------------------------------------------------------

const invoicePendingCancel = ref<Invoice | null>(null)

function askCancel(invoice: Invoice): void {
  invoicePendingCancel.value = invoice
}

async function confirmCancel(): Promise<void> {
  if (!invoicePendingCancel.value) return
  const success = await cancelInvoice(invoicePendingCancel.value)
  if (success) {
    invoicePendingCancel.value = null
    await load()
  }
}
</script>

<template>
  <div>
    <PageHeader :title="$t('invoices.title')" :subtitle="$t('invoices.subtitle')">
      <template #actions>
        <RouterLink v-if="can('invoice:create')" :to="{ name: ROUTE_NAMES.invoiceCreate }">
          <BaseButton>
            <Plus class="size-4" aria-hidden="true" />
            {{ $t('invoices.newInvoice') }}
          </BaseButton>
        </RouterLink>
      </template>
    </PageHeader>

    <BaseCard>
      <div class="mb-4 border-b border-gray-100 pb-4">
        <InvoiceFilters
          :search="filters.search"
          :status="filters.status"
          :date-from="filters.dateFrom"
          :date-to="filters.dateTo"
          :amount-min="filters.amountMin"
          :amount-max="filters.amountMax"
          :selected-client="selectedClient"
          @update:search="filters.search = $event"
          @update:status="filters.status = $event"
          @update:date-from="filters.dateFrom = $event"
          @update:date-to="filters.dateTo = $event"
          @update:amount-min="filters.amountMin = $event"
          @update:amount-max="filters.amountMax = $event"
          @select-client="setClientFilter"
          @clear-client="setClientFilter(null)"
          @reset="resetFilters"
        />
      </div>

      <LoadingState
        v-if="store.isLoading && store.items.length === 0"
        :message="$t('invoices.loading')"
      />
      <ErrorState
        v-else-if="store.status === 'error' && store.items.length === 0"
        :message="store.error?.message"
        @retry="load"
      />
      <EmptyState
        v-else-if="store.items.length === 0"
        :icon="FileText"
        :title="$t('invoices.emptyTitle')"
        :message="
          hasActiveFilters
            ? $t('invoices.emptyMessageFiltered')
            : $t('invoices.emptyMessageDefault')
        "
      >
        <template #action>
          <RouterLink :to="{ name: ROUTE_NAMES.invoiceCreate }">
            <BaseButton size="sm">{{ $t('invoices.createInvoice') }}</BaseButton>
          </RouterLink>
        </template>
      </EmptyState>

      <template v-else>
        <InvoiceList
          :invoices="store.items"
          :currency="currency"
          :selection="selection"
          @view="viewInvoice"
          @edit="editInvoice"
          @duplicate="onDuplicate"
          @download="downloadInvoice"
          @open-pdf="openInvoicePdf"
          @print="printInvoice"
          @share="shareInvoice"
          @send-email="sendInvoiceByEmail"
          @send-whats-app="sendInvoiceByWhatsApp"
          @cancel="askCancel"
          @update:selection="selection = $event"
        />

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ $t('invoices.count', { count: store.meta.total }) }}</p>
          <div class="flex items-center gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="!pagination.hasPrevPage.value"
              @click="prevPage"
            >
              {{ $t('common.previous') }}
            </BaseButton>
            <span>Page {{ pagination.page.value }} / {{ pagination.totalPages.value }}</span>
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="!pagination.hasNextPage.value"
              @click="nextPage"
            >
              {{ $t('common.next') }}
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseCard>

    <ConfirmDialog
      :open="invoicePendingCancel !== null"
      :title="$t('invoices.confirmCancelTitle')"
      :message="
        invoicePendingCancel
          ? $t('invoices.confirmCancelMessage', { number: invoicePendingCancel.number })
          : ''
      "
      :confirm-label="$t('invoices.confirmCancelTitle')"
      :loading="isCancelling"
      @confirm="confirmCancel"
      @cancel="invoicePendingCancel = null"
    />

    <BulkActionBar
      :count="selection.length"
      :actions="[
        {
          label: $t('invoices.bulkDownload'),
          emit: 'download',
          variant: 'outline',
          loading: isBulkDownloading
        },
        ...(can('invoice:update')
          ? [
              {
                label: $t('invoices.bulkCancel'),
                emit: 'cancel',
                variant: 'danger' as const,
                loading: isBulkCancelling
              }
            ]
          : [])
      ]"
      @action="onBulkAction"
      @clear="clearSelection"
    />
  </div>
</template>
