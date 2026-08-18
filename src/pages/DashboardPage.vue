<script setup lang="ts">
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Download,
  FileText,
  LayoutGrid,
  Package,
  RefreshCw,
  Receipt,
  RotateCcw,
  Target,
  Users,
  Wallet
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import DropdownMenu from '@/components/base/DropdownMenu.vue'
import AlertsCenter from '@/components/dashboard/AlertsCenter.vue'
import DashboardWidgetCard from '@/components/dashboard/DashboardWidgetCard.vue'
import DraggableWidget from '@/components/dashboard/DraggableWidget.vue'
import OnboardingTour from '@/components/dashboard/OnboardingTour.vue'
import PaymentBreakdownChart from '@/components/dashboard/PaymentBreakdownChart.vue'
import PeriodFilter from '@/components/dashboard/PeriodFilter.vue'
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed.vue'
import RecentInvoicesList from '@/components/dashboard/RecentInvoicesList.vue'
import RevenueChart from '@/components/dashboard/RevenueChart.vue'
import SalesTargetWidget from '@/components/dashboard/SalesTargetWidget.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useBusiness, useDashboard, useDashboardExport, useDashboardLayout } from '@/composables'
import { useAuthStore } from '@/stores'
import type { DashboardWidgetId } from '@/composables'
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
  alerts,
  isInitialLoading,
  isRefreshing,
  hasFatalError,
  isEmpty
} = useDashboard()

onMounted(() => refresh())

const layout = useDashboardLayout()
const displayedOrder = computed(() =>
  layout.isEditing.value ? layout.order.value : layout.visibleOrder.value
)

const widgetLabels: Record<DashboardWidgetId, string> = {
  kpis: 'Indicateurs cles',
  alerts: 'Alertes',
  salesTarget: 'Objectif du mois',
  revenueChart: "Evolution du chiffre d'affaires",
  paymentBreakdown: 'Repartition des paiements',
  recentInvoices: 'Dernieres factures',
  recentActivity: 'Activite recente'
}

const dashboardContentRef = ref<HTMLElement | null>(null)
const { isExporting, exportAsPng, exportAsPdf } = useDashboardExport()

const { isSaving: isSavingTarget, submitUpdate: submitBusinessUpdate } = useBusiness()

async function onSalesTargetSubmit(target: number | null): Promise<void> {
  await submitBusinessUpdate({ monthlyRevenueTarget: target })
}
</script>

<template>
  <div>
    <OnboardingTour v-if="authStore.business" :business-id="authStore.business.id" />

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
        <BaseButton
          :variant="layout.isEditing.value ? 'primary' : 'outline'"
          size="sm"
          @click="layout.toggleEditing()"
        >
          <LayoutGrid class="size-4" aria-hidden="true" />
          {{ layout.isEditing.value ? 'Terminer' : 'Personnaliser' }}
        </BaseButton>
        <BaseButton
          v-if="layout.isEditing.value"
          variant="ghost"
          size="sm"
          @click="layout.resetLayout()"
        >
          <RotateCcw class="size-4" aria-hidden="true" />
          Reinitialiser
        </BaseButton>
        <DropdownMenu v-if="!layout.isEditing.value">
          <template #trigger="{ toggle }">
            <BaseButton variant="outline" size="sm" :loading="isExporting" @click="toggle">
              <Download v-if="!isExporting" class="size-4" aria-hidden="true" />
              Exporter
            </BaseButton>
          </template>
          <button
            type="button"
            class="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            @click="exportAsPng(dashboardContentRef)"
          >
            Image (PNG)
          </button>
          <button
            type="button"
            class="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            @click="exportAsPdf(dashboardContentRef)"
          >
            PDF
          </button>
        </DropdownMenu>
      </template>
    </PageHeader>

    <LoadingState v-if="isInitialLoading" message="Chargement du tableau de bord..." />
    <ErrorState v-else-if="hasFatalError" :message="stats.error.value?.message" @retry="refresh" />
    <EmptyState
      v-else-if="isEmpty"
      title="Bienvenue !"
      message="Ajoutez vos premiers clients, produits et factures pour voir vos indicateurs ici."
    />

    <div v-else ref="dashboardContentRef" class="flex flex-col gap-6">
      <p v-if="layout.isEditing.value" class="text-sm text-gray-500">
        Glissez-deposez un widget pour le reorganiser, ou utilisez l'icone d'oeil pour le masquer.
      </p>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <template v-for="widgetId in displayedOrder" :key="widgetId">
          <DraggableWidget
            :id="widgetId"
            :label="widgetLabels[widgetId]"
            :editing="layout.isEditing.value"
            :hidden="layout.isHidden(widgetId)"
            :class="widgetId === 'kpis' ? 'lg:col-span-2' : ''"
            @move="layout.moveWidget"
            @toggle-visibility="layout.toggleVisibility"
          >
            <div
              v-if="widgetId === 'kpis'"
              class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            >
              <StatCard
                label="Chiffre d'affaires"
                :value="formatCurrency(stats.data.value?.revenueTotal ?? 0, currency)"
                :icon="Wallet"
                :change-percent="stats.data.value?.comparison.revenueChangePercent"
              />
              <StatCard
                label="Factures"
                :value="formatNumber(stats.data.value?.invoicesCount ?? 0)"
                :icon="FileText"
                :change-percent="stats.data.value?.comparison.invoicesChangePercent"
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
                :change-percent="stats.data.value?.comparison.clientsChangePercent"
              />
              <StatCard
                label="Produits"
                :value="formatNumber(stats.data.value?.productsCount ?? 0)"
                :icon="Package"
              />
            </div>

            <DashboardWidgetCard
              v-else-if="widgetId === 'alerts'"
              title="Alertes"
              :loading="alerts.isLoading.value"
              :has-data="alerts.data.value !== null"
              :error="alerts.error.value?.message ?? null"
              @retry="refresh"
            >
              <template #actions>
                <Bell class="size-4 text-gray-400" aria-hidden="true" />
              </template>
              <AlertsCenter
                v-if="alerts.data.value"
                :alerts="alerts.data.value"
                :currency="currency"
              />
            </DashboardWidgetCard>

            <div
              v-else-if="widgetId === 'salesTarget'"
              class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div class="mb-4 flex items-center gap-2">
                <Target class="size-4 text-gray-400" aria-hidden="true" />
                <h3 class="text-base font-semibold text-gray-900">Objectif du mois</h3>
              </div>
              <SalesTargetWidget
                :revenue-this-month="stats.data.value?.revenueThisMonth ?? 0"
                :target="authStore.business?.monthlyRevenueTarget"
                :currency="currency"
                :submitting="isSavingTarget"
                @submit="onSalesTargetSubmit"
              />
            </div>

            <DashboardWidgetCard
              v-else-if="widgetId === 'revenueChart'"
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
              v-else-if="widgetId === 'paymentBreakdown'"
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
              <PaymentBreakdownChart
                :data="paymentBreakdown.data.value ?? []"
                :currency="currency"
              />
            </DashboardWidgetCard>

            <DashboardWidgetCard
              v-else-if="widgetId === 'recentInvoices'"
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
              v-else-if="widgetId === 'recentActivity'"
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
          </DraggableWidget>
        </template>
      </div>
    </div>
  </div>
</template>
