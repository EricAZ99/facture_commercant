<script setup lang="ts">
import { LifeBuoy } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { ROUTE_NAMES } from '@/constants'
import { useAdminSupport } from '@/composables'
import type { SupportTicketStatus } from '@/types'
import { formatDateTime } from '@/utils/formatters'

const { items, meta, isLoading, page, statusFilter, load, setStatusFilter, goToPage } =
  useAdminSupport()

onMounted(() => load())

function onStatusFilterChange(event: Event): void {
  setStatusFilter((event.target as HTMLSelectElement).value as SupportTicketStatus | '')
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-gray-900">Support</h1>
      <p class="mt-1 text-sm text-gray-500">Tickets envoyes par les commercants.</p>
    </div>

    <BaseCard>
      <div class="mb-4">
        <select
          :value="statusFilter"
          aria-label="Filtrer par statut"
          class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          @change="onStatusFilterChange"
        >
          <option value="">Tous les statuts</option>
          <option value="open">Ouverts</option>
          <option value="closed">Fermes</option>
        </select>
      </div>

      <LoadingState v-if="isLoading && items.length === 0" message="Chargement..." />
      <EmptyState v-else-if="items.length === 0" :icon="LifeBuoy" title="Aucun ticket" />

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th class="py-2 pr-4 font-medium">Commerce</th>
                <th class="py-2 pr-4 font-medium">Sujet</th>
                <th class="py-2 pr-4 font-medium">Statut</th>
                <th class="py-2 pr-4 font-medium">Mis a jour</th>
                <th class="py-2 pl-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="ticket in items" :key="ticket.id" class="hover:bg-gray-50">
                <td class="py-3 pr-4 text-gray-900">{{ ticket.businessName }}</td>
                <td class="py-3 pr-4 text-gray-600">{{ ticket.subject }}</td>
                <td class="py-3 pr-4">
                  <BaseBadge :variant="ticket.status === 'open' ? 'warning' : 'default'">
                    {{ ticket.status === 'open' ? 'Ouvert' : 'Ferme' }}
                  </BaseBadge>
                </td>
                <td class="py-3 pr-4 text-gray-500">{{ formatDateTime(ticket.updatedAt) }}</td>
                <td class="py-3 pl-4 text-right">
                  <RouterLink
                    :to="{ name: ROUTE_NAMES.adminSupportDetail, params: { id: ticket.id } }"
                    class="text-sm font-medium text-primary-600 hover:underline"
                  >
                    Repondre
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ meta.total }} ticket(s)</p>
          <div class="flex items-center gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="page <= 1"
              @click="goToPage(page - 1)"
            >
              Precedent
            </BaseButton>
            <span>Page {{ meta.page }} / {{ meta.totalPages }}</span>
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="page >= meta.totalPages"
              @click="goToPage(page + 1)"
            >
              Suivant
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseCard>
  </div>
</template>
