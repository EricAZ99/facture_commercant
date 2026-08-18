<script setup lang="ts">
import { AlertTriangle, Store, TrendingUp, UserPlus, Users } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import RevenueChart from '@/components/dashboard/RevenueChart.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import RankedList from '@/components/reports/RankedList.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { ROUTE_NAMES, SUBSCRIPTION_STATUS_LABELS } from '@/constants'
import { useAdminAnalytics, useAdminBusinesses } from '@/composables'
import { formatCurrency } from '@/utils/formatters'

const { store, loadStats } = useAdminBusinesses()
const { mrrTrend, revenueByPlan, churn, ltv, load: loadAnalytics } = useAdminAnalytics()

onMounted(() => {
  void loadStats()
  void loadAnalytics()
})

/** Reutilise `RevenueChart.vue` (attend `{date, amount}`) pour la tendance MRR (`{month, mrr}`). */
const mrrChartData = computed(
  () =>
    mrrTrend.data.value?.map((point) => ({ date: `${point.month}-01`, amount: point.mrr })) ?? []
)

const revenueByPlanItems = computed(
  () =>
    revenueByPlan.data.value?.map((item) => ({
      id: item.planId,
      label: item.planName,
      value: item.amount,
      secondaryLabel: `${item.count} commerce(s)`
    })) ?? []
)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-gray-900">Tableau de bord plateforme</h1>
      <p class="mt-1 text-sm text-gray-500">
        Vue d'ensemble des commerces inscrits sur Facture IA.
      </p>
    </div>

    <LoadingState v-if="store.statsStatus === 'loading' && !store.stats" message="Chargement..." />
    <ErrorState v-else-if="store.statsStatus === 'error' && !store.stats" @retry="loadStats" />

    <div v-else-if="store.stats" class="flex flex-col gap-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Commerces inscrits"
          :value="String(store.stats.totalBusinesses)"
          :icon="Store"
        />
        <StatCard
          label="Revenu recurrent mensuel"
          :value="formatCurrency(store.stats.monthlyRecurringRevenue)"
          :icon="TrendingUp"
          tone="success"
        />
        <StatCard
          label="Nouveaux (30 jours)"
          :value="String(store.stats.newBusinessesLast30Days)"
          :icon="UserPlus"
        />
        <StatCard
          label="Paiement en retard"
          :value="String(store.stats.businessesByStatus.past_due ?? 0)"
          :icon="AlertTriangle"
          tone="warning"
        />
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold text-gray-900">
          Repartition par statut d'abonnement
        </h2>
        <dl class="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div v-for="(count, status) in store.stats.businessesByStatus" :key="status">
            <dt class="text-xs text-gray-500">{{ SUBSCRIPTION_STATUS_LABELS[status] }}</dt>
            <dd class="text-lg font-semibold text-gray-900">{{ count }}</dd>
          </div>
        </dl>
      </div>

      <!-- Finance & analytics plateforme -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Taux de retention"
          :value="churn.data.value ? `${churn.data.value.retentionRatePercent}%` : '—'"
          :icon="Users"
          tone="success"
        />
        <StatCard
          label="Valeur vie client moyenne (LTV)"
          :value="ltv.data.value ? formatCurrency(ltv.data.value.averageLtv) : '—'"
          :icon="TrendingUp"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold text-gray-900">
            Tendance du revenu recurrent (MRR, 6 derniers mois)
          </h2>
          <LoadingState v-if="mrrTrend.isLoading.value" message="Chargement..." />
          <RevenueChart v-else :data="mrrChartData" />
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold text-gray-900">Revenu recurrent par plan</h2>
          <LoadingState v-if="revenueByPlan.isLoading.value" message="Chargement..." />
          <RankedList v-else :items="revenueByPlanItems" :format-value="(v) => formatCurrency(v)" />
        </div>
      </div>

      <div>
        <RouterLink :to="{ name: ROUTE_NAMES.adminBusinesses }">
          <BaseButton variant="outline">Voir tous les commerces</BaseButton>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
