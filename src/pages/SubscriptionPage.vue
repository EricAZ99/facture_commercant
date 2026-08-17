<script setup lang="ts">
import { TriangleAlert } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import PlanCard from '@/components/subscription/PlanCard.vue'
import UsageMeter from '@/components/subscription/UsageMeter.vue'
import { SUBSCRIPTION_STATUS_BADGE_VARIANT, SUBSCRIPTION_STATUS_LABELS } from '@/constants'
import { useSubscription, usePermissions } from '@/composables'
import { useAuthStore } from '@/stores'
import type { ID } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

const authStore = useAuthStore()
const { can } = usePermissions()
const {
  store,
  isChangingPlan,
  isCancelling,
  load,
  selectPlan,
  cancelSubscription,
  limitUsages,
  limitAlerts
} = useSubscription()

onMounted(() => load())

const currency = computed(() => authStore.business?.currency ?? 'XOF')
const subscription = computed(() => store.current)

const renewalLabel = computed(() => {
  if (!subscription.value) return ''
  if (subscription.value.status === 'trial') return "Fin de la periode d'essai"
  if (subscription.value.cancelAtPeriodEnd) return "Acces jusqu'au"
  return 'Prochain renouvellement'
})

function onSelectPlan(planId: ID): void {
  void selectPlan(planId)
}

const isCancelDialogOpen = ref(false)
const canCancel = computed(
  () => subscription.value !== null && subscription.value.status !== 'canceled'
)

async function onConfirmCancel(): Promise<void> {
  const success = await cancelSubscription()
  if (success) isCancelDialogOpen.value = false
}
</script>

<template>
  <div>
    <PageHeader title="Abonnement" subtitle="Gerez le plan et la facturation de votre compte." />

    <LoadingState v-if="store.isLoading && !subscription" message="Chargement de l'abonnement..." />
    <ErrorState
      v-else-if="store.status === 'error' && !subscription"
      :message="store.error?.message"
      @retry="load"
    />

    <div v-else-if="subscription" class="flex flex-col gap-4">
      <!-- Alerte de rapprochement/atteinte de limite -->
      <div
        v-if="limitAlerts.length > 0"
        class="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4"
      >
        <div class="flex items-center gap-2">
          <TriangleAlert class="size-5 shrink-0 text-amber-600" aria-hidden="true" />
          <p class="text-sm font-semibold text-amber-900">
            Vous approchez des limites de votre plan
          </p>
        </div>
        <ul class="ml-7 list-disc text-sm text-amber-800">
          <li v-for="alert in limitAlerts" :key="alert.key">
            {{ alert.label }} : {{ alert.current }} / {{ alert.limit }}
            {{ alert.isLimitReached ? '(limite atteinte)' : '(bientot atteinte)' }}
          </li>
        </ul>
        <p class="ml-7 text-sm text-amber-800">
          Passez a un plan superieur pour lever ces limites.
        </p>
      </div>

      <!-- Plan actuel -->
      <BaseCard title="Plan actuel">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <p class="text-base font-semibold text-gray-900">{{ subscription.plan.name }}</p>
              <BaseBadge :variant="SUBSCRIPTION_STATUS_BADGE_VARIANT[subscription.status]">
                {{ SUBSCRIPTION_STATUS_LABELS[subscription.status] }}
              </BaseBadge>
            </div>
            <p class="mt-1 text-sm text-gray-500">
              {{
                subscription.plan.price === 0
                  ? 'Gratuit'
                  : formatCurrency(subscription.plan.price, currency)
              }}
              <template v-if="subscription.plan.price > 0">
                / {{ subscription.plan.billingCycle === 'monthly' ? 'mois' : 'an' }}
              </template>
            </p>
            <p class="mt-1 text-sm text-gray-500">
              {{ renewalLabel }} : {{ formatDate(subscription.currentPeriodEnd) }}
            </p>
          </div>

          <BaseButton
            v-if="can('subscription:manage') && canCancel"
            variant="outline"
            size="sm"
            @click="isCancelDialogOpen = true"
          >
            Resilier l'abonnement
          </BaseButton>
        </div>

        <ul class="mt-4 flex flex-col gap-1.5 border-t border-gray-100 pt-4 text-sm text-gray-600">
          <li v-for="feature in subscription.plan.features" :key="feature">• {{ feature }}</li>
        </ul>
      </BaseCard>

      <!-- Utilisation -->
      <BaseCard title="Utilisation" subtitle="Par rapport aux limites de votre plan actuel.">
        <div class="flex flex-col gap-4">
          <UsageMeter v-for="usage in limitUsages" :key="usage.key" :usage="usage" />
        </div>
      </BaseCard>

      <!-- Plans disponibles -->
      <div>
        <h2 class="mb-3 text-base font-semibold text-gray-900">Plans disponibles</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PlanCard
            v-for="plan in store.plans"
            :key="plan.id"
            :plan="plan"
            :current-plan-id="subscription.plan.id"
            :currency="currency"
            :can-select="can('subscription:manage')"
            :submitting="isChangingPlan"
            @select="onSelectPlan"
          />
        </div>
      </div>
    </div>

    <ConfirmDialog
      :open="isCancelDialogOpen"
      title="Resilier l'abonnement"
      message="Voulez-vous vraiment resilier votre abonnement ? Vous perdrez l'acces aux fonctionnalites de votre plan actuel."
      confirm-label="Resilier"
      :loading="isCancelling"
      @confirm="onConfirmCancel"
      @cancel="isCancelDialogOpen = false"
    />
  </div>
</template>
