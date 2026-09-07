<script setup lang="ts">
import {
  AlertTriangle,
  BarChart3,
  Download,
  FileText,
  Package,
  Receipt,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import DropdownMenu from '@/components/base/DropdownMenu.vue'
import DashboardWidgetCard from '@/components/dashboard/DashboardWidgetCard.vue'
import PaymentBreakdownChart from '@/components/dashboard/PaymentBreakdownChart.vue'
import RevenueChart from '@/components/dashboard/RevenueChart.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import InvoiceStatusBreakdownChart from '@/components/reports/InvoiceStatusBreakdownChart.vue'
import RankedList from '@/components/reports/RankedList.vue'
import ReportFilters from '@/components/reports/ReportFilters.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useReportExport, useReports } from '@/composables'
import { useAuthStore } from '@/stores'
import { downloadCsv } from '@/utils/csv'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { reportsToCsv } from '@/utils/reportCsv'

const { t } = useI18n()
const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const {
  filters,
  selectedProduct,
  selectedClient,
  periodOptions,
  summary,
  revenue,
  previousRevenue,
  invoiceStatus,
  paymentMethods,
  topProducts,
  topClients,
  vat,
  monthlyProjection,
  isInitialLoading,
  isRefreshing,
  hasFatalError,
  isEmpty,
  setPeriod,
  setProductFilter,
  setClientFilter,
  setStatusFilter,
  toggleComparePrevious,
  resetFilters,
  refresh
} = useReports()

onMounted(() => refresh())

const { isExporting, exportAsPng, exportAsPdf } = useReportExport()
const reportContentRef = ref<HTMLElement | null>(null)

function exportCsv(): void {
  const csv = reportsToCsv({
    topProducts: topProducts.data.value ?? [],
    topClients: topClients.data.value ?? [],
    vat: vat.data.value
  })
  downloadCsv(`rapport-${new Date().toISOString().slice(0, 10)}.csv`, csv)
}

const topProductItems = computed(
  () =>
    topProducts.data.value?.map((product) => ({
      id: product.productId,
      label: product.name,
      value: product.revenue,
      secondaryLabel: t('reports.unitsSold', { count: formatNumber(product.quantitySold) })
    })) ?? []
)

const topClientItems = computed(
  () =>
    topClients.data.value?.map((client) => ({
      id: client.clientId,
      label: client.name,
      value: client.totalSpent,
      secondaryLabel: t('invoices.count', { count: formatNumber(client.invoicesCount) })
    })) ?? []
)
</script>

<template>
  <div>
    <PageHeader :title="$t('reports.title')" :subtitle="$t('reports.subtitle')">
      <template #actions>
        <DropdownMenu v-if="!isEmpty">
          <template #trigger="{ toggle }">
            <BaseButton variant="outline" size="sm" :loading="isExporting" @click="toggle">
              <Download v-if="!isExporting" class="size-4" aria-hidden="true" />
              {{ $t('common.export') }}
            </BaseButton>
          </template>
          <button
            type="button"
            class="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            @click="exportAsPng(reportContentRef)"
          >
            {{ $t('dashboard.exportPng') }}
          </button>
          <button
            type="button"
            class="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            @click="exportAsPdf(reportContentRef)"
          >
            {{ $t('dashboard.exportPdf') }}
          </button>
          <button
            type="button"
            class="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            @click="exportCsv"
          >
            {{ $t('reports.exportCsv') }}
          </button>
        </DropdownMenu>
      </template>
    </PageHeader>

    <BaseCard class="mb-6">
      <ReportFilters
        :period="filters.period"
        :period-options="periodOptions"
        :selected-product="selectedProduct"
        :selected-client="selectedClient"
        :status="filters.status"
        @update:period="setPeriod"
        @select-product="setProductFilter"
        @clear-product="setProductFilter(null)"
        @select-client="setClientFilter"
        @clear-client="setClientFilter(null)"
        @update:status="setStatusFilter"
        @reset="resetFilters"
      />
      <label
        class="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 text-sm text-gray-600"
      >
        <input
          type="checkbox"
          :checked="filters.comparePrevious"
          class="focus-ring size-4 rounded border-gray-300"
          @change="toggleComparePrevious"
        />
        {{ $t('reports.comparePrevious') }}
      </label>
    </BaseCard>

    <LoadingState v-if="isInitialLoading" :message="$t('reports.loading')" />
    <ErrorState
      v-else-if="hasFatalError"
      :message="summary.error.value?.message"
      @retry="refresh"
    />
    <EmptyState
      v-else-if="isEmpty"
      :icon="BarChart3"
      :title="$t('dashboard.emptyData')"
      :message="$t('reports.emptyMessage')"
    />

    <div v-else ref="reportContentRef" class="flex flex-col gap-6">
      <div v-if="isRefreshing" class="text-xs text-gray-400">{{ $t('reports.refreshing') }}</div>

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          :label="$t('dashboard.kpi.revenue')"
          :value="formatCurrency(summary.data.value?.revenueTotal ?? 0, currency)"
          :icon="Wallet"
        />
        <StatCard
          :label="$t('reports.kpi.sales')"
          :value="formatNumber(summary.data.value?.salesCount ?? 0)"
          :icon="FileText"
        />
        <StatCard
          :label="$t('dashboard.kpi.invoices')"
          :value="formatNumber(summary.data.value?.invoicesCount ?? 0)"
          :icon="Package"
        />
        <StatCard
          :label="$t('reports.kpi.unpaid')"
          :value="formatCurrency(summary.data.value?.unpaidTotal ?? 0, currency)"
          :icon="AlertTriangle"
          tone="warning"
        />
        <StatCard
          v-if="monthlyProjection !== null"
          :label="$t('reports.kpi.projection')"
          :value="formatCurrency(monthlyProjection, currency)"
          :icon="TrendingUp"
        />
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardWidgetCard
          :title="$t('dashboard.widgets.revenueChart')"
          :loading="revenue.isLoading.value"
          :has-data="revenue.data.value !== null"
          :error="revenue.error.value?.message ?? null"
          :is-empty="revenue.data.value?.length === 0"
          :empty-icon="Wallet"
          :empty-title="$t('dashboard.emptyData')"
          :empty-message="$t('dashboard.noRevenueThisPeriod')"
          @retry="refresh"
        >
          <RevenueChart
            :data="revenue.data.value ?? []"
            :previous-data="previousRevenue.data.value"
            :currency="currency"
          />
        </DashboardWidgetCard>

        <DashboardWidgetCard
          :title="$t('reports.widgets.invoiceBreakdown')"
          :loading="invoiceStatus.isLoading.value"
          :has-data="invoiceStatus.data.value !== null"
          :error="invoiceStatus.error.value?.message ?? null"
          :is-empty="invoiceStatus.data.value?.every((item) => item.count === 0) ?? false"
          :empty-icon="FileText"
          :empty-title="$t('dashboard.emptyData')"
          :empty-message="$t('reports.noInvoicesFiltered')"
          @retry="refresh"
        >
          <InvoiceStatusBreakdownChart
            :data="invoiceStatus.data.value ?? []"
            :currency="currency"
          />
        </DashboardWidgetCard>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardWidgetCard
          :title="$t('dashboard.widgets.paymentBreakdown')"
          :loading="paymentMethods.isLoading.value"
          :has-data="paymentMethods.data.value !== null"
          :error="paymentMethods.error.value?.message ?? null"
          :is-empty="paymentMethods.data.value?.every((item) => item.amount === 0) ?? false"
          :empty-icon="Wallet"
          :empty-title="$t('dashboard.emptyData')"
          :empty-message="$t('dashboard.noPaymentThisPeriod')"
          @retry="refresh"
        >
          <PaymentBreakdownChart :data="paymentMethods.data.value ?? []" :currency="currency" />
        </DashboardWidgetCard>

        <DashboardWidgetCard
          :title="$t('reports.widgets.topProducts')"
          :loading="topProducts.isLoading.value"
          :has-data="topProducts.data.value !== null"
          :error="topProducts.error.value?.message ?? null"
          :is-empty="topProductItems.length === 0"
          :empty-icon="Package"
          :empty-title="$t('dashboard.emptyData')"
          :empty-message="$t('reports.noProductSales')"
          @retry="refresh"
        >
          <RankedList :items="topProductItems" :format-value="(v) => formatCurrency(v, currency)" />
        </DashboardWidgetCard>
      </div>

      <DashboardWidgetCard
        :title="$t('reports.widgets.topClients')"
        :loading="topClients.isLoading.value"
        :has-data="topClients.data.value !== null"
        :error="topClients.error.value?.message ?? null"
        :is-empty="topClientItems.length === 0"
        :empty-icon="Users"
        :empty-title="$t('dashboard.emptyData')"
        :empty-message="$t('reports.noClientInvoiced')"
        @retry="refresh"
      >
        <RankedList :items="topClientItems" :format-value="(v) => formatCurrency(v, currency)" />
      </DashboardWidgetCard>

      <DashboardWidgetCard
        :title="$t('reports.widgets.vat')"
        :loading="vat.isLoading.value"
        :has-data="vat.data.value !== null"
        :error="vat.error.value?.message ?? null"
        :is-empty="(vat.data.value?.items.length ?? 0) === 0"
        :empty-icon="Receipt"
        :empty-title="$t('dashboard.emptyData')"
        :empty-message="$t('reports.noVatCollected')"
        @retry="refresh"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th class="py-2 pr-4 font-medium">{{ $t('reports.vatTable.columnRate') }}</th>
                <th class="py-2 pr-4 text-right font-medium">
                  {{ $t('reports.vatTable.columnTaxableBase') }}
                </th>
                <th class="py-2 pl-4 text-right font-medium">
                  {{ $t('reports.vatTable.columnVatCollected') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in vat.data.value?.items ?? []" :key="item.taxRate">
                <td class="py-2 pr-4 text-gray-600">{{ item.taxRate }}%</td>
                <td class="py-2 pr-4 text-right text-gray-600">
                  {{ formatCurrency(item.taxableAmount, currency) }}
                </td>
                <td class="py-2 pl-4 text-right font-medium text-gray-900">
                  {{ formatCurrency(item.taxAmount, currency) }}
                </td>
              </tr>
            </tbody>
            <tfoot v-if="vat.data.value">
              <tr class="border-t border-gray-200 font-semibold">
                <td class="py-2 pr-4 text-gray-900">{{ $t('invoices.summary.total') }}</td>
                <td class="py-2 pr-4 text-right text-gray-900">
                  {{ formatCurrency(vat.data.value.totalTaxableAmount, currency) }}
                </td>
                <td class="py-2 pl-4 text-right text-gray-900">
                  {{ formatCurrency(vat.data.value.totalTaxAmount, currency) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </DashboardWidgetCard>
    </div>
  </div>
</template>
