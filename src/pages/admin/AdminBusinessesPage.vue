<script setup lang="ts">
import { Download, Eye, PowerOff, RotateCcw, Search, Store } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import {
  ROUTE_NAMES,
  SUBSCRIPTION_STATUS_BADGE_VARIANT,
  SUBSCRIPTION_STATUS_LABELS
} from '@/constants'
import { useAdminBusinesses } from '@/composables'
import { adminBusinessService } from '@/services'
import { useAdminPlansStore } from '@/stores'
import type { AdminBusinessSummary, SubscriptionStatus } from '@/types'
import { adminBusinessesToCsv } from '@/utils/adminBusinessCsv'
import { downloadCsv } from '@/utils/csv'
import { formatCurrency, formatDate } from '@/utils/formatters'

const {
  store,
  filters,
  pagination,
  selectedIds,
  selectedBusinesses,
  isBulkActing,
  load,
  nextPage,
  prevPage,
  setStatusFilter,
  setPlanFilter,
  applyDateAndRevenueFilters,
  resetFilters,
  toggleSelection,
  toggleSelectAll,
  clearSelection,
  bulkSetSuspended
} = useAdminBusinesses()

const plansStore = useAdminPlansStore()

onMounted(() => {
  void load()
  void plansStore.fetchPlans()
})

function onStatusFilterChange(event: Event): void {
  setStatusFilter((event.target as HTMLSelectElement).value as SubscriptionStatus | '')
}

function onPlanFilterChange(event: Event): void {
  setPlanFilter((event.target as HTMLSelectElement).value)
}

const isAllSelected = computed(
  () => store.items.length > 0 && selectedIds.value.size === store.items.length
)

function exportCsv(businesses: AdminBusinessSummary[], filename: string): void {
  downloadCsv(filename, adminBusinessesToCsv(businesses))
}

async function exportAll(): Promise<void> {
  const response = await adminBusinessService.list({
    perPage: 1000,
    search: filters.search.trim() || undefined,
    subscriptionStatus: filters.subscriptionStatus || undefined,
    planId: filters.planId || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    minRevenue: filters.minRevenue ? Number(filters.minRevenue) : undefined,
    maxRevenue: filters.maxRevenue ? Number(filters.maxRevenue) : undefined
  })
  exportCsv(response.data, `commerces-${new Date().toISOString().slice(0, 10)}.csv`)
}

function exportSelection(): void {
  exportCsv(
    selectedBusinesses.value,
    `commerces-selection-${new Date().toISOString().slice(0, 10)}.csv`
  )
}

async function previewBusiness(business: AdminBusinessSummary): Promise<void> {
  const { ticket } = await adminBusinessService.impersonate(business.id)
  window.open(`/apercu/${ticket}`, '_blank', 'noopener')
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-gray-900">Commercants</h1>
      <p class="mt-1 text-sm text-gray-500">Tous les commerces inscrits sur la plateforme.</p>
    </div>

    <BaseCard>
      <div class="mb-4 flex flex-col gap-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative max-w-sm flex-1">
            <Search
              class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="filters.search"
              type="search"
              placeholder="Rechercher par nom de commerce ou email du proprietaire..."
              class="focus-ring w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <select
            :value="filters.subscriptionStatus"
            aria-label="Filtrer par statut d'abonnement"
            class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            @change="onStatusFilterChange"
          >
            <option value="">Tous les statuts</option>
            <option
              v-for="(label, value) in SUBSCRIPTION_STATUS_LABELS"
              :key="value"
              :value="value"
            >
              {{ label }}
            </option>
          </select>
          <select
            :value="filters.planId"
            aria-label="Filtrer par plan"
            class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            @change="onPlanFilterChange"
          >
            <option value="">Tous les plans</option>
            <option v-for="plan in plansStore.items" :key="plan.id" :value="plan.id">
              {{ plan.name }} ({{ plan.billingCycle === 'monthly' ? 'mensuel' : 'annuel' }})
            </option>
          </select>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <label class="text-xs text-gray-500" for="date-from">Inscrit depuis</label>
          <input
            id="date-from"
            v-model="filters.dateFrom"
            type="date"
            class="focus-ring rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
            @change="applyDateAndRevenueFilters"
          />
          <label class="text-xs text-gray-500" for="date-to">jusqu'au</label>
          <input
            id="date-to"
            v-model="filters.dateTo"
            type="date"
            class="focus-ring rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
            @change="applyDateAndRevenueFilters"
          />
          <label class="ml-2 text-xs text-gray-500" for="min-revenue">CA min</label>
          <input
            id="min-revenue"
            v-model="filters.minRevenue"
            type="number"
            min="0"
            class="focus-ring w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
            @change="applyDateAndRevenueFilters"
          />
          <label class="text-xs text-gray-500" for="max-revenue">CA max</label>
          <input
            id="max-revenue"
            v-model="filters.maxRevenue"
            type="number"
            min="0"
            class="focus-ring w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
            @change="applyDateAndRevenueFilters"
          />
          <button
            type="button"
            class="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
            @click="resetFilters"
          >
            <RotateCcw class="size-4" />
            Reinitialiser
          </button>
          <BaseButton variant="outline" size="sm" class="ml-auto" @click="exportAll">
            <Download class="size-4" aria-hidden="true" />
            Exporter (CSV)
          </BaseButton>
        </div>
      </div>

      <div
        v-if="selectedIds.size > 0"
        class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800"
      >
        <span>{{ selectedIds.size }} commerce(s) selectionne(s)</span>
        <div class="flex flex-wrap gap-2">
          <BaseButton
            variant="outline"
            size="sm"
            :loading="isBulkActing"
            @click="bulkSetSuspended(true)"
          >
            <PowerOff class="size-4" aria-hidden="true" />
            Suspendre
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            :loading="isBulkActing"
            @click="bulkSetSuspended(false)"
          >
            Reactiver
          </BaseButton>
          <BaseButton variant="outline" size="sm" @click="exportSelection">
            <Download class="size-4" aria-hidden="true" />
            Exporter la selection
          </BaseButton>
          <button
            type="button"
            class="focus-ring rounded px-2 text-sm text-primary-700 hover:underline"
            @click="clearSelection"
          >
            Deselectionner
          </button>
        </div>
      </div>

      <LoadingState v-if="store.isLoading && store.items.length === 0" message="Chargement..." />
      <ErrorState
        v-else-if="store.status === 'error' && store.items.length === 0"
        :message="store.error?.message"
        @retry="load"
      />
      <EmptyState
        v-else-if="store.items.length === 0"
        :icon="Store"
        title="Aucun commerce trouve"
      />

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th class="py-2 pr-2">
                  <input
                    type="checkbox"
                    aria-label="Tout selectionner"
                    :checked="isAllSelected"
                    class="focus-ring size-4 rounded border-gray-300"
                    @change="toggleSelectAll"
                  />
                </th>
                <th class="py-2 pr-4 font-medium">Commerce</th>
                <th class="py-2 pr-4 font-medium">Proprietaire</th>
                <th class="py-2 pr-4 font-medium">Plan</th>
                <th class="py-2 pr-4 text-right font-medium">CA facture</th>
                <th class="py-2 pr-4 font-medium">Statut</th>
                <th class="py-2 pr-4 font-medium">Inscrit le</th>
                <th class="py-2 pl-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="business in store.items" :key="business.id" class="hover:bg-gray-50">
                <td class="py-3 pr-2">
                  <input
                    type="checkbox"
                    :aria-label="`Selectionner ${business.name}`"
                    :checked="selectedIds.has(business.id)"
                    class="focus-ring size-4 rounded border-gray-300"
                    @change="toggleSelection(business.id)"
                  />
                </td>
                <td class="py-3 pr-4">
                  <p class="font-medium text-gray-900">{{ business.name }}</p>
                  <BaseBadge v-if="business.isSuspended" variant="danger">Suspendu</BaseBadge>
                </td>
                <td class="py-3 pr-4 text-gray-600">
                  <p>{{ business.ownerName }}</p>
                  <p class="text-xs text-gray-400">{{ business.ownerEmail }}</p>
                </td>
                <td class="py-3 pr-4 text-gray-600">{{ business.planName }}</td>
                <td class="py-3 pr-4 text-right text-gray-600">
                  {{ formatCurrency(business.revenueTotal, 'XOF') }}
                </td>
                <td class="py-3 pr-4">
                  <BaseBadge
                    :variant="SUBSCRIPTION_STATUS_BADGE_VARIANT[business.subscriptionStatus]"
                  >
                    {{ SUBSCRIPTION_STATUS_LABELS[business.subscriptionStatus] }}
                  </BaseBadge>
                </td>
                <td class="py-3 pr-4 text-gray-500">{{ formatDate(business.createdAt) }}</td>
                <td class="py-3 pl-4">
                  <div class="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      aria-label="Apercu du commerce"
                      title="Apercu"
                      @click="previewBusiness(business)"
                    >
                      <Eye class="size-4" />
                    </button>
                    <RouterLink
                      :to="{ name: ROUTE_NAMES.adminBusinessDetail, params: { id: business.id } }"
                      class="text-sm font-medium text-primary-600 hover:underline"
                    >
                      Detail
                    </RouterLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ store.meta.total }} commerce(s)</p>
          <div class="flex items-center gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="!pagination.hasPrevPage.value"
              @click="prevPage"
            >
              Precedent
            </BaseButton>
            <span>Page {{ pagination.page.value }} / {{ pagination.totalPages.value }}</span>
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="!pagination.hasNextPage.value"
              @click="nextPage"
            >
              Suivant
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseCard>
  </div>
</template>
