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
import { useI18n } from 'vue-i18n'

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

const { t } = useI18n()
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

const widgetLabels = computed<Record<DashboardWidgetId, string>>(() => ({
  kpis: t('dashboard.widgets.kpis'),
  alerts: t('dashboard.widgets.alerts'),
  salesTarget: t('dashboard.widgets.salesTarget'),
  revenueChart: t('dashboard.widgets.revenueChart'),
  paymentBreakdown: t('dashboard.widgets.paymentBreakdown'),
  recentInvoices: t('dashboard.widgets.recentInvoices'),
  recentActivity: t('dashboard.widgets.recentActivity')
}))

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

    <PageHeader :title="$t('dashboard.title')" :subtitle="$t('dashboard.subtitle')">
      <template #actions>
        <PeriodFilter
          :model-value="period"
          :options="periodOptions"
          @update:model-value="setPeriod"
        />
        <BaseButton variant="outline" size="sm" :loading="isRefreshing" @click="refresh">
          <RefreshCw v-if="!isRefreshing" class="size-4" aria-hidden="true" />
          {{ $t('dashboard.refresh') }}
        </BaseButton>
        <BaseButton
          :variant="layout.isEditing.value ? 'primary' : 'outline'"
          size="sm"
          @click="layout.toggleEditing()"
        >
          <LayoutGrid class="size-4" aria-hidden="true" />
          {{ layout.isEditing.value ? $t('dashboard.finish') : $t('dashboard.customize') }}
        </BaseButton>
        <BaseButton
          v-if="layout.isEditing.value"
          variant="ghost"
          size="sm"
          @click="layout.resetLayout()"
        >
          <RotateCcw class="size-4" aria-hidden="true" />
          {{ $t('dashboard.reset') }}
        </BaseButton>
        <DropdownMenu v-if="!layout.isEditing.value">
          <template #trigger="{ toggle }">
            <BaseButton variant="outline" size="sm" :loading="isExporting" @click="toggle">
              <Download v-if="!isExporting" class="size-4" aria-hidden="true" />
              {{ $t('dashboard.export') }}
            </BaseButton>
          </template>
          <button
            type="button"
            class="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            @click="exportAsPng(dashboardContentRef)"
          >
            {{ $t('dashboard.exportPng') }}
          </button>
          <button
            type="button"
            class="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            @click="exportAsPdf(dashboardContentRef)"
          >
            {{ $t('dashboard.exportPdf') }}
          </button>
        </DropdownMenu>
      </template>
    </PageHeader>

    <LoadingState v-if="isInitialLoading" :message="$t('dashboard.loading')" />
    <ErrorState v-else-if="hasFatalError" :message="stats.error.value?.message" @retry="refresh" />
    <EmptyState
      v-else-if="isEmpty"
      :title="$t('dashboard.emptyTitle')"
      :message="$t('dashboard.emptyMessage')"
    />

    <div v-else ref="dashboardContentRef" class="flex flex-col gap-6">
      <p v-if="layout.isEditing.value" class="text-sm text-gray-500">
        {{ $t('dashboard.editingHint') }}
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
                :label="$t('dashboard.kpi.revenue')"
                :value="formatCurrency(stats.data.value?.revenueTotal ?? 0, currency)"
                :icon="Wallet"
                :change-percent="stats.data.value?.comparison.revenueChangePercent"
              />
              <StatCard
                :label="$t('dashboard.kpi.invoices')"
                :value="formatNumber(stats.data.value?.invoicesCount ?? 0)"
                :icon="FileText"
                :change-percent="stats.data.value?.comparison.invoicesChangePercent"
              />
              <StatCard
                :label="$t('dashboard.kpi.paidInvoices')"
                :value="formatNumber(stats.data.value?.paidInvoicesCount ?? 0)"
                :icon="CheckCircle2"
                tone="success"
              />
              <StatCard
                :label="$t('dashboard.kpi.unpaidInvoices')"
                :value="formatNumber(stats.data.value?.unpaidInvoicesCount ?? 0)"
                :icon="AlertTriangle"
                tone="warning"
              />
              <StatCard
                :label="$t('dashboard.kpi.clients')"
                :value="formatNumber(stats.data.value?.clientsCount ?? 0)"
                :icon="Users"
                :change-percent="stats.data.value?.comparison.clientsChangePercent"
              />
              <StatCard
                :label="$t('dashboard.kpi.products')"
                :value="formatNumber(stats.data.value?.productsCount ?? 0)"
                :icon="Package"
              />
            </div>

            <DashboardWidgetCard
              v-else-if="widgetId === 'alerts'"
              :title="$t('dashboard.widgets.alerts')"
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
                <h3 class="text-base font-semibold text-gray-900">
                  {{ $t('dashboard.widgets.salesTarget') }}
                </h3>
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
              <RevenueChart :data="revenue.data.value ?? []" :currency="currency" />
            </DashboardWidgetCard>

            <DashboardWidgetCard
              v-else-if="widgetId === 'paymentBreakdown'"
              :title="$t('dashboard.widgets.paymentBreakdown')"
              :loading="paymentBreakdown.isLoading.value"
              :has-data="paymentBreakdown.data.value !== null"
              :error="paymentBreakdown.error.value?.message ?? null"
              :is-empty="paymentBreakdown.data.value?.length === 0"
              :empty-icon="Receipt"
              :empty-title="$t('dashboard.emptyData')"
              :empty-message="$t('dashboard.noPaymentThisPeriod')"
              @retry="refresh"
            >
              <PaymentBreakdownChart
                :data="paymentBreakdown.data.value ?? []"
                :currency="currency"
              />
            </DashboardWidgetCard>

            <DashboardWidgetCard
              v-else-if="widgetId === 'recentInvoices'"
              :title="$t('dashboard.widgets.recentInvoices')"
              :loading="recentInvoices.isLoading.value"
              :has-data="recentInvoices.data.value !== null"
              :error="recentInvoices.error.value?.message ?? null"
              :is-empty="recentInvoices.data.value?.data.length === 0"
              :empty-icon="FileText"
              :empty-title="$t('dashboard.noInvoices')"
              :empty-message="$t('dashboard.noInvoicesMessage')"
              @retry="refresh"
            >
              <RecentInvoicesList
                :invoices="recentInvoices.data.value?.data ?? []"
                :currency="currency"
              />
            </DashboardWidgetCard>

            <DashboardWidgetCard
              v-else-if="widgetId === 'recentActivity'"
              :title="$t('dashboard.widgets.recentActivity')"
              :loading="recentActivity.isLoading.value"
              :has-data="recentActivity.data.value !== null"
              :error="recentActivity.error.value?.message ?? null"
              :is-empty="recentActivity.data.value?.length === 0"
              :empty-icon="Activity"
              :empty-title="$t('dashboard.noActivity')"
              :empty-message="$t('dashboard.noActivityMessage')"
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
