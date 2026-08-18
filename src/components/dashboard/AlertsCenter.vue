<script setup lang="ts">
import { AlertTriangle, CalendarClock, PackageX } from 'lucide-vue-next'
import { computed } from 'vue'

import { ROUTE_NAMES } from '@/constants'
import type { DashboardAlerts } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Props {
  alerts: DashboardAlerts
  currency: string
}

const props = defineProps<Props>()

const hasAnyAlert = computed(
  () =>
    props.alerts.overdueInvoicesCount > 0 ||
    props.alerts.lowStockCount > 0 ||
    props.alerts.subscriptionExpiringSoon
)
</script>

<template>
  <div v-if="!hasAnyAlert" class="py-6 text-center text-sm text-gray-400">
    Aucune alerte pour le moment. Tout est en ordre.
  </div>

  <div v-else class="flex flex-col gap-4">
    <div v-if="alerts.overdueInvoicesCount > 0" class="flex flex-col gap-2">
      <div class="flex items-center gap-2 text-sm font-semibold text-red-700">
        <AlertTriangle class="size-4 shrink-0" aria-hidden="true" />
        {{ alerts.overdueInvoicesCount }} facture(s) en retard de paiement
      </div>
      <ul class="ml-6 flex flex-col gap-1 text-sm text-gray-600">
        <li
          v-for="invoice in alerts.overdueInvoices"
          :key="invoice.id"
          class="flex justify-between gap-3"
        >
          <RouterLink
            :to="{ name: ROUTE_NAMES.invoiceDetail, params: { id: invoice.id } }"
            class="truncate text-primary-600 hover:underline"
          >
            {{ invoice.number }} — {{ invoice.clientName }}
          </RouterLink>
          <span class="shrink-0 text-gray-500">
            {{ formatCurrency(invoice.balance, currency) }} · echue le
            {{ formatDate(invoice.dueDate) }}
          </span>
        </li>
      </ul>
    </div>

    <div v-if="alerts.lowStockCount > 0" class="flex flex-col gap-2">
      <div class="flex items-center gap-2 text-sm font-semibold text-amber-700">
        <PackageX class="size-4 shrink-0" aria-hidden="true" />
        {{ alerts.lowStockCount }} produit(s) en stock bas
      </div>
      <ul class="ml-6 flex flex-col gap-1 text-sm text-gray-600">
        <li
          v-for="product in alerts.lowStockProducts"
          :key="product.id"
          class="flex justify-between gap-3"
        >
          <RouterLink
            :to="{ name: ROUTE_NAMES.productDetail, params: { id: product.id } }"
            class="truncate text-primary-600 hover:underline"
          >
            {{ product.name }}
          </RouterLink>
          <span class="shrink-0 text-gray-500">{{ product.stock }} en stock</span>
        </li>
      </ul>
    </div>

    <div
      v-if="alerts.subscriptionExpiringSoon"
      class="flex items-center gap-2 text-sm font-semibold text-blue-700"
    >
      <CalendarClock class="size-4 shrink-0" aria-hidden="true" />
      <RouterLink :to="{ name: ROUTE_NAMES.subscription }" class="hover:underline">
        Votre abonnement se renouvelle dans {{ alerts.subscriptionDaysRemaining }} jour(s)
      </RouterLink>
    </div>
  </div>
</template>
