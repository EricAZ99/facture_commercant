<script setup lang="ts">
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Package,
  RefreshCw,
  Receipt,
  Users,
  Wallet
} from 'lucide-vue-next'
import { computed, onMounted } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import DashboardWidgetCard from '@/components/dashboard/DashboardWidgetCard.vue'
import PaymentBreakdownChart from '@/components/dashboard/PaymentBreakdownChart.vue'
import PeriodFilter from '@/components/dashboard/PeriodFilter.vue'
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed.vue'
import RecentInvoicesList from '@/components/dashboard/RecentInvoicesList.vue'
import RevenueChart from '@/components/dashboard/RevenueChart.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useDashboard } from '@/composables'
import { useAuthStore } from '@/stores'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const {
  period,
  periodOptions,
  setPeriod,
  refresh,
  stats,
  revenue,
  paymentBreakdown,
  recentInvoices,
  recentActivity,
  isInitialLoading,
  isRefreshing,
  hasFatalError,
  isEmpty
} = useDashboard()

onMounted(() => refresh())
</script>

<template>
  <div>
    <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de l'activite de votre commerce.">
      <template #actions>
        <PeriodFilter
          :model-value="period"
          :options="periodOptions"
          @update:model-value="setPeriod"
        />
        <BaseButton variant="outline" size="sm" :loading="isRefreshing" @click="refresh">
          <RefreshCw v-if="!isRefreshing" class="size-4" aria-hidden="true" />
          Actualiser
        </BaseButton>
      </template>
    </PageHeader>

    <LoadingState v-if="isInitialLoading" message="Chargement du tableau de bord..." />
    <ErrorState v-else-if="hasFatalError" :message="stats.error.value?.message" @retry="refresh" />
    <EmptyState
      v-else-if="isEmpty"
      title="Bienvenue !"
      message="Ajoutez vos premiers clients, produits et factures pour voir vos indicateurs ici."
    />

    <div v-else class="flex flex-col gap-6">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Chiffre d'affaires"
          :value="formatCurrency(stats.data.value?.revenueTotal ?? 0, currency)"
          :icon="Wallet"
        />
        <StatCard
          label="Factures"
          :value="formatNumber(stats.data.value?.invoicesCount ?? 0)"
          :icon="FileText"
        />
        <StatCard
          label="Factures payees"
          :value="formatNumber(stats.data.value?.paidInvoicesCount ?? 0)"
          :icon="CheckCircle2"
          tone="success"
        />
        <StatCard
          label="Factures impayees"
          :value="formatNumber(stats.data.value?.unpaidInvoicesCount ?? 0)"
          :icon="AlertTriangle"
          tone="warning"
        />
        <StatCard
          label="Clients"
          :value="formatNumber(stats.data.value?.clientsCount ?? 0)"
          :icon="Users"
        />
        <StatCard
          label="Produits"
          :value="formatNumber(stats.data.value?.productsCount ?? 0)"
          :icon="Package"
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
          title="Repartition des paiements"
          :loading="paymentBreakdown.isLoading.value"
          :has-data="paymentBreakdown.data.value !== null"
          :error="paymentBreakdown.error.value?.message ?? null"
          :is-empty="paymentBreakdown.data.value?.length === 0"
          :empty-icon="Receipt"
          empty-title="Aucune donnee"
          empty-message="Aucun paiement encaisse sur cette periode."
          @retry="refresh"
        >
          <PaymentBreakdownChart :data="paymentBreakdown.data.value ?? []" :currency="currency" />
        </DashboardWidgetCard>

        <DashboardWidgetCard
          title="Dernieres factures"
          :loading="recentInvoices.isLoading.value"
          :has-data="recentInvoices.data.value !== null"
          :error="recentInvoices.error.value?.message ?? null"
          :is-empty="recentInvoices.data.value?.data.length === 0"
          :empty-icon="FileText"
          empty-title="Aucune facture"
          empty-message="Vos dernieres factures apparaitront ici."
          @retry="refresh"
        >
          <RecentInvoicesList
            :invoices="recentInvoices.data.value?.data ?? []"
            :currency="currency"
          />
        </DashboardWidgetCard>

        <DashboardWidgetCard
          title="Activite recente"
          :loading="recentActivity.isLoading.value"
          :has-data="recentActivity.data.value !== null"
          :error="recentActivity.error.value?.message ?? null"
          :is-empty="recentActivity.data.value?.length === 0"
          :empty-icon="Activity"
          empty-title="Aucune activite"
          empty-message="Les dernieres actions sur votre commerce apparaitront ici."
          @retry="refresh"
        >
          <RecentActivityFeed :activities="recentActivity.data.value ?? []" />
        </DashboardWidgetCard>
      </div>
    </div>
  </div>
</template>
