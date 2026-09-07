<script setup lang="ts">
import { Download, Wallet } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import PaymentHistory from '@/components/payments/PaymentHistory.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useApi } from '@/composables'
import { paymentService } from '@/services'
import { useAuthStore } from '@/stores'
import { downloadCsv } from '@/utils/csv'
import { paymentsToAccountingCsv } from '@/utils/paymentCsv'

const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const page = ref(1)
const PER_PAGE = 20

const { data, isLoading, isError, error, execute } = useApi(paymentService.list)

function load(): Promise<unknown> {
  return execute({ page: page.value, perPage: PER_PAGE, sortBy: 'paidAt', sortOrder: 'desc' })
}

onMounted(() => load())

function goToPage(target: number): void {
  if (target === page.value || target < 1) return
  page.value = target
  void load()
}

const isExporting = ref(false)

/** Exporte l'ensemble des paiements (pas seulement la page courante) au format CSV comptable. */
async function exportAccountingCsv(): Promise<void> {
  isExporting.value = true
  try {
    const all = await paymentService.list({ perPage: 1000, sortBy: 'paidAt', sortOrder: 'desc' })
    downloadCsv(
      `paiements-${new Date().toISOString().slice(0, 10)}.csv`,
      paymentsToAccountingCsv(all.data)
    )
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader :title="$t('payments.title')" :subtitle="$t('payments.subtitle')">
      <template #actions>
        <BaseButton
          v-if="data && data.data.length > 0"
          variant="outline"
          :loading="isExporting"
          @click="exportAccountingCsv"
        >
          <Download class="size-4" aria-hidden="true" />
          {{ $t('payments.exportCsv') }}
        </BaseButton>
      </template>
    </PageHeader>

    <BaseCard>
      <LoadingState v-if="isLoading && !data" :message="$t('payments.loading')" />
      <ErrorState v-else-if="isError && !data" :message="error?.message" @retry="load" />
      <EmptyState
        v-else-if="data && data.data.length === 0"
        :icon="Wallet"
        :title="$t('payments.emptyTitle')"
        :message="$t('payments.emptyMessage')"
      />

      <template v-else-if="data">
        <PaymentHistory :payments="data.data" :currency="currency" />

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ $t('payments.count', { count: data.meta.total }) }}</p>
          <div class="flex items-center gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="page <= 1"
              @click="goToPage(page - 1)"
            >
              {{ $t('common.previous') }}
            </BaseButton>
            <span>Page {{ data.meta.page }} / {{ data.meta.totalPages }}</span>
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="page >= data.meta.totalPages"
              @click="goToPage(page + 1)"
            >
              {{ $t('common.next') }}
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseCard>
  </div>
</template>
