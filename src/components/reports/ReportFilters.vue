<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'

import PeriodFilter from '@/components/dashboard/PeriodFilter.vue'
import SearchableSelect from '@/components/base/SearchableSelect.vue'
import { INVOICE_STATUS_LABELS } from '@/constants'
import { clientService, productService } from '@/services'
import type { Client, InvoiceStatus, Product, ReportPeriod } from '@/types'

interface Props {
  period: ReportPeriod
  periodOptions: Array<{ value: ReportPeriod; label: string }>
  selectedProduct: Product | null
  selectedClient: Client | null
  status: InvoiceStatus | ''
}

defineProps<Props>()

const emit = defineEmits<{
  'update:period': [value: ReportPeriod]
  selectProduct: [product: Product]
  clearProduct: []
  selectClient: [client: Client]
  clearClient: []
  'update:status': [value: InvoiceStatus | '']
  reset: []
}>()

function productLabel(p: Product): string {
  return p.name
}

async function searchProducts(query: string): Promise<Product[]> {
  const response = await productService.list({ search: query, perPage: 8 })
  return response.data
}

function clientLabel(c: Client): string {
  return `${c.firstName} ${c.lastName}`
}

async function searchClients(query: string): Promise<Client[]> {
  const response = await clientService.list({ search: query, perPage: 8 })
  return response.data
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <PeriodFilter
      :model-value="period"
      :options="periodOptions"
      @update:model-value="emit('update:period', $event)"
    />

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SearchableSelect
        :search="searchProducts"
        :get-label="productLabel"
        :get-key="(p: Product) => p.id"
        :selected="selectedProduct"
        :placeholder="$t('reports.filters.productPlaceholder')"
        @select="(p: Product) => emit('selectProduct', p)"
        @clear="emit('clearProduct')"
      />
      <SearchableSelect
        :search="searchClients"
        :get-label="clientLabel"
        :get-key="(c: Client) => c.id"
        :selected="selectedClient"
        :placeholder="$t('reports.filters.clientPlaceholder')"
        @select="(c: Client) => emit('selectClient', c)"
        @clear="emit('clearClient')"
      />
      <select
        :value="status"
        class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
        @change="
          emit('update:status', ($event.target as HTMLSelectElement).value as InvoiceStatus | '')
        "
      >
        <option value="">{{ $t('invoices.filters.allStatuses') }}</option>
        <option v-for="(label, value) in INVOICE_STATUS_LABELS" :key="value" :value="value">
          {{ $t(label) }}
        </option>
      </select>
      <button
        type="button"
        class="focus-ring flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
        @click="emit('reset')"
      >
        <RotateCcw class="size-4" aria-hidden="true" />
        {{ $t('quotes.filters.resetLabel') }}
      </button>
    </div>
  </div>
</template>
