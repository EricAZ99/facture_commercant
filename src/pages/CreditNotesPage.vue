<script setup lang="ts">
import { FileMinus } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import CreditNoteList from '@/components/creditNotes/CreditNoteList.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useCreditNotes } from '@/composables'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const { store, page, goToPage, load } = useCreditNotes()
onMounted(() => load())
</script>

<template>
  <div>
    <PageHeader :title="$t('creditNotes.title')" :subtitle="$t('creditNotes.subtitle')" />

    <BaseCard>
      <LoadingState
        v-if="store.isLoading && store.items.length === 0"
        :message="$t('creditNotes.loading')"
      />
      <ErrorState
        v-else-if="store.status === 'error' && store.items.length === 0"
        :message="store.error?.message"
        @retry="load"
      />
      <EmptyState
        v-else-if="store.items.length === 0"
        :icon="FileMinus"
        :title="$t('creditNotes.emptyTitle')"
        :message="$t('creditNotes.emptyMessage')"
      />

      <template v-else>
        <CreditNoteList :credit-notes="store.items" :currency="currency" />

        <div
          class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
        >
          <p>{{ $t('creditNotes.count', { count: store.meta.total }) }}</p>
          <div class="flex items-center gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="page <= 1"
              @click="goToPage(page - 1)"
            >
              {{ $t('common.previous') }}
            </BaseButton>
            <span>Page {{ store.meta.page }} / {{ store.meta.totalPages }}</span>
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="page >= store.meta.totalPages"
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
