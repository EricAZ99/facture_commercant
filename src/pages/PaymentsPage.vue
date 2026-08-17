<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'
import { onMounted } from 'vue'

import BaseCard from '@/components/base/BaseCard.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useApi } from '@/composables'
import { paymentService } from '@/services'

const { data, isLoading, isError, error, execute } = useApi(paymentService.list)

onMounted(() => execute())
</script>

<template>
  <div>
    <PageHeader title="Paiements" subtitle="Suivez les encaissements de vos factures." />

    <BaseCard>
      <LoadingState v-if="isLoading" message="Chargement des paiements..." />
      <ErrorState v-else-if="isError" :message="error?.message" @retry="execute" />
      <EmptyState
        v-else-if="data && data.data.length === 0"
        :icon="Wallet"
        title="Aucun paiement"
        message="Les paiements enregistres apparaitront ici."
      />
      <p v-else-if="data" class="text-sm text-gray-600">
        {{ data.meta.total }} paiement(s) enregistre(s).
      </p>
    </BaseCard>
  </div>
</template>
