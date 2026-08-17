<script setup lang="ts">
import { Search, Store } from 'lucide-vue-next'
import { onMounted } from 'vue'
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
import type { SubscriptionStatus } from '@/types'
import { formatDate } from '@/utils/formatters'

const { store, search, subscriptionStatus, pagination, load, nextPage, prevPage, setStatusFilter } =
  useAdminBusinesses()

onMounted(() => load())

function onStatusFilterChange(event: Event): void {
  setStatusFilter((event.target as HTMLSelectElement).value as SubscriptionStatus | '')
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-gray-900">Commercants</h1>
      <p class="mt-1 text-sm text-gray-500">Tous les commerces inscrits sur la plateforme.</p>
    </div>

    <BaseCard>
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative max-w-sm flex-1">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            type="search"
            placeholder="Rechercher par nom de commerce ou email du proprietaire..."
            class="focus-ring w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <select
          :value="subscriptionStatus"
          aria-label="Filtrer par statut d'abonnement"
          class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          @change="onStatusFilterChange"
        >
          <option value="">Tous les statuts</option>
          <option v-for="(label, value) in SUBSCRIPTION_STATUS_LABELS" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
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
                <th class="py-2 pr-4 font-medium">Commerce</th>
                <th class="py-2 pr-4 font-medium">Proprietaire</th>
                <th class="py-2 pr-4 font-medium">Plan</th>
                <th class="py-2 pr-4 font-medium">Statut</th>
                <th class="py-2 pr-4 font-medium">Inscrit le</th>
                <th class="py-2 pl-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="business in store.items" :key="business.id" class="hover:bg-gray-50">
                <td class="py-3 pr-4">
                  <p class="font-medium text-gray-900">{{ business.name }}</p>
                  <BaseBadge v-if="business.isSuspended" variant="danger">Suspendu</BaseBadge>
                </td>
                <td class="py-3 pr-4 text-gray-600">
                  <p>{{ business.ownerName }}</p>
                  <p class="text-xs text-gray-400">{{ business.ownerEmail }}</p>
                </td>
                <td class="py-3 pr-4 text-gray-600">{{ business.planName }}</td>
                <td class="py-3 pr-4">
                  <BaseBadge
                    :variant="SUBSCRIPTION_STATUS_BADGE_VARIANT[business.subscriptionStatus]"
                  >
                    {{ SUBSCRIPTION_STATUS_LABELS[business.subscriptionStatus] }}
                  </BaseBadge>
                </td>
                <td class="py-3 pr-4 text-gray-500">{{ formatDate(business.createdAt) }}</td>
                <td class="py-3 pl-4 text-right">
                  <RouterLink
                    :to="{ name: ROUTE_NAMES.adminBusinessDetail, params: { id: business.id } }"
                    class="text-sm font-medium text-primary-600 hover:underline"
                  >
                    Voir le detail
                  </RouterLink>
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
