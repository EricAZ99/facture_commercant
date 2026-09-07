<script setup lang="ts">
import { ClipboardList, Plus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import QuoteFilters from '@/components/quotes/QuoteFilters.vue'
import QuoteList from '@/components/quotes/QuoteList.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useQuotes, usePermissions } from '@/composables'
import { ROUTE_NAMES } from '@/constants'
import { useAuthStore } from '@/stores'
import type { Quote } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const { can } = usePermissions()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const {
  store,
  filters,
  selectedClient,
  pagination,
  load,
  nextPage,
  prevPage,
  setClientFilter,
  resetFilters,
  isRemoving,
  removeQuote,
  convertQuote
} = useQuotes()

function viewQuote(quote: Quote): void {
  router.push({ name: ROUTE_NAMES.quoteDetail, params: { id: quote.id } })
}

function editQuote(quote: Quote): void {
  router.push({ name: ROUTE_NAMES.quoteDetail, params: { id: quote.id }, query: { edit: '1' } })
}

const hasActiveFilters = computed(
  () => Boolean(filters.search) || Boolean(filters.status) || Boolean(filters.clientId)
)

// --- Conversion en facture ------------------------------------------------

async function onConvert(quote: Quote): Promise<void> {
  const invoice = await convertQuote(quote)
  if (invoice) {
    await router.push({ name: ROUTE_NAMES.invoiceDetail, params: { id: invoice.id } })
  }
}

// --- Suppression ------------------------------------------------------

const quotePendingRemove = ref<Quote | null>(null)

function askRemove(quote: Quote): void {
  quotePendingRemove.value = quote
}

async function confirmRemove(): Promise<void> {
  if (!quotePendingRemove.value) return
  const success = await removeQuote(quotePendingRemove.value)
  if (success) {
    quotePendingRemove.value = null
    await load()
  }
}
</script>

<template>
  <div>
    <PageHeader :title="$t('quotes.title')" :subtitle="$t('quotes.subtitle')">
      <template #actions>
        <RouterLink v-if="can('invoice:create')" :to="{ name: ROUTE_NAMES.quoteCreate }">
          <BaseButton>
            <Plus class="size-4" aria-hidden="true" />
            {{ $t('quotes.newQuote') }}
          </BaseButton>
        </RouterLink>
      </template>
    </PageHeader>

    <BaseCard>
      <div class="mb-4 border-b border-gray-100 pb-4">
        <QuoteFilters
          :search="filters.search"
          :status="filters.status"
          :selected-client="selectedClient"
          @update:search="filters.search = $event"
          @update:status="filters.status = $event"
          @select-client="setClientFilter"
          @clear-client="setClientFilter(null)"
          @reset="resetFilters"
        />
      </div>

      <LoadingState
        v-if="store.isLoading && store.items.length === 0"
        :message="$t('quotes.loading')"
      />
      <ErrorState
        v-else-if="store.status === 'error' && store.items.length === 0"
        :message="store.error?.message"
        @retry="load"
      />
      <EmptyState
        v-else-if="store.items.length === 0"
        :icon="ClipboardList"
        :title="$t('quotes.emptyTitle')"
        :message="
          hasActiveFilters ? $t('quotes.emptyMessageFiltered') : $t('quotes.emptyMessageDefault')
        "
      >
        <template #action>
          <RouterLink :to="{ name: ROUTE_NAMES.quoteCreate }">
            <BaseButton size="sm">{{ $t('quotes.createQuote') }}</BaseButton>
          </RouterLink>
        </template>
      </EmptyState>

      <template v-else>
        <QuoteList
          :quotes="store.items"
          :currency="currency"
          @view="viewQuote"
          @edit="editQuote"
          @convert="onConvert"
          @remove="askRemove"
        />

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ $t('quotes.count', { count: store.meta.total }) }}</p>
          <div class="flex items-center gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="!pagination.hasPrevPage.value"
              @click="prevPage"
            >
              {{ $t('common.previous') }}
            </BaseButton>
            <span>Page {{ pagination.page.value }} / {{ pagination.totalPages.value }}</span>
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="!pagination.hasNextPage.value"
              @click="nextPage"
            >
              {{ $t('common.next') }}
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseCard>

    <ConfirmDialog
      :open="quotePendingRemove !== null"
      :title="$t('quotes.confirmDeleteTitle')"
      :message="
        quotePendingRemove
          ? $t('quotes.confirmDeleteMessage', { number: quotePendingRemove.number })
          : ''
      "
      :confirm-label="$t('common.delete')"
      :loading="isRemoving"
      @confirm="confirmRemove"
      @cancel="quotePendingRemove = null"
    />
  </div>
</template>
