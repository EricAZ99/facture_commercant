<script setup lang="ts">
import { AlertTriangle, BarChart3, FileText, Package, Users, Wallet } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'

import BaseCard from '@/components/base/BaseCard.vue'
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
import { useReports } from '@/composables'
import { useAuthStore } from '@/stores'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const {
  filters,
  selectedProduct,
  selectedClient,
  periodOptions,
  summary,
  revenue,
  invoiceStatus,
  paymentMethods,
  topProducts,
  topClients,
  isInitialLoading,
  isRefreshing,
  hasFatalError,
  isEmpty,
  setPeriod,
  setProductFilter,
  setClientFilter,
  setStatusFilter,
  resetFilters,
  refresh
} = useReports()

onMounted(() => refresh())

const topProductItems = computed(
  () =>
    topProducts.data.value?.map((product) => ({
      id: product.productId,
      label: product.name,
      value: product.revenue,
      secondaryLabel: `${formatNumber(product.quantitySold)} vendu(s)`
    })) ?? []
)

const topClientItems = computed(
  () =>
    topClients.data.value?.map((client) => ({
      id: client.clientId,
      label: client.name,
      value: client.totalSpent,
      secondaryLabel: `${formatNumber(client.invoicesCount)} facture(s)`
    })) ?? []
)
</script>

<template>
  <div>
    <PageHeader title="Rapports" subtitle="Analysez la performance de votre commerce." />

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
    </BaseCard>

    <LoadingState v-if="isInitialLoading" message="Chargement des rapports..." />
    <ErrorState
      v-else-if="hasFatalError"
      :message="summary.error.value?.message"
      @retry="refresh"
    />
    <EmptyState
      v-else-if="isEmpty"
      :icon="BarChart3"
      title="Aucune donnee"
      message="Aucune vente ou facture sur cette periode/ces filtres."
    />

    <div v-else class="flex flex-col gap-6">
      <div v-if="isRefreshing" class="text-xs text-gray-400">Actualisation...</div>

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires"
          :value="formatCurrency(summary.data.value?.revenueTotal ?? 0, currency)"
          :icon="Wallet"
        />
        <StatCard
          label="Ventes"
          :value="formatNumber(summary.data.value?.salesCount ?? 0)"
          :icon="FileText"
        />
        <StatCard
          label="Factures"
          :value="formatNumber(summary.data.value?.invoicesCount ?? 0)"
          :icon="Package"
        />
        <StatCard
          label="Impayes"
          :value="formatCurrency(summary.data.value?.unpaidTotal ?? 0, currency)"
          :icon="AlertTriangle"
          tone="warning"
        />
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardWidgetCard
          title="Evolution du chiffre d'affaires"
          :loading="revenue.isLoading.value"
          :has-data="revenue.data.value !== null"
          :error="revenue.error.value?.message ?? null"
          :is-empty="revenue.data.value?.length === 0"
          :empty-icon="Wallet"
          empty-title="Aucune donnee"
          empty-message="Aucun encaissement sur cette periode."
          @retry="refresh"
        >
          <RevenueChart :data="revenue.data.value ?? []" :currency="currency" />
        </DashboardWidgetCard>

        <DashboardWidgetCard
          title="Repartition des factures"
          :loading="invoiceStatus.isLoading.value"
          :has-data="invoiceStatus.data.value !== null"
          :error="invoiceStatus.error.value?.message ?? null"
          :is-empty="invoiceStatus.data.value?.every((item) => item.count === 0) ?? false"
          :empty-icon="FileText"
          empty-title="Aucune donnee"
          empty-message="Aucune facture sur cette periode/ces filtres."
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
          title="Repartition des paiements"
          :loading="paymentMethods.isLoading.value"
          :has-data="paymentMethods.data.value !== null"
          :error="paymentMethods.error.value?.message ?? null"
          :is-empty="paymentMethods.data.value?.every((item) => item.amount === 0) ?? false"
          :empty-icon="Wallet"
          empty-title="Aucune donnee"
          empty-message="Aucun paiement encaisse sur cette periode."
          @retry="refresh"
        >
          <PaymentBreakdownChart :data="paymentMethods.data.value ?? []" :currency="currency" />
        </DashboardWidgetCard>

        <DashboardWidgetCard
          title="Produits les plus vendus"
          :loading="topProducts.isLoading.value"
          :has-data="topProducts.data.value !== null"
          :error="topProducts.error.value?.message ?? null"
          :is-empty="topProductItems.length === 0"
          :empty-icon="Package"
          empty-title="Aucune donnee"
          empty-message="Aucune vente de produit sur cette periode/ces filtres."
          @retry="refresh"
        >
          <RankedList :items="topProductItems" :format-value="(v) => formatCurrency(v, currency)" />
        </DashboardWidgetCard>
      </div>

      <DashboardWidgetCard
        title="Meilleurs clients"
        :loading="topClients.isLoading.value"
        :has-data="topClients.data.value !== null"
        :error="topClients.error.value?.message ?? null"
        :is-empty="topClientItems.length === 0"
        :empty-icon="Users"
        empty-title="Aucune donnee"
        empty-message="Aucun client facture sur cette periode/ces filtres."
        @retry="refresh"
      >
        <RankedList :items="topClientItems" :format-value="(v) => formatCurrency(v, currency)" />
      </DashboardWidgetCard>
    </div>
  </div>
</template>
