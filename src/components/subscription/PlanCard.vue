<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { computed } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import type { ID, SubscriptionPlan } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  plan: SubscriptionPlan
  currentPlanId?: ID
  currency?: string
  /** Le commercant peut-il changer de plan (permission `subscription:manage`) ? */
  canSelect?: boolean
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentPlanId: undefined,
  currency: 'XOF',
  canSelect: false,
  submitting: false
})

const emit = defineEmits<{
  select: [planId: ID]
}>()

const isCurrent = computed(() => props.plan.id === props.currentPlanId)

function limitLabel(value: number | null, unit: string): string {
  return value === null ? `${unit} illimites` : `${value} ${unit} max`
}
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-xl border p-5"
    :class="isCurrent ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'"
  >
    <div>
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-base font-semibold text-gray-900">{{ plan.name }}</h3>
        <span
          v-if="isCurrent"
          class="shrink-0 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700"
        >
          Plan actuel
        </span>
      </div>
      <p v-if="plan.description" class="mt-1 text-sm text-gray-500">{{ plan.description }}</p>
    </div>

    <p class="text-2xl font-semibold text-gray-900">
      {{ formatCurrency(plan.price, currency) }}
      <span class="text-sm font-normal text-gray-500">
        / {{ plan.billingCycle === 'monthly' ? 'mois' : 'an' }}
      </span>
    </p>

    <ul class="flex flex-col gap-2 text-sm text-gray-600">
      <li class="flex items-start gap-2">
        <Check class="mt-0.5 size-4 shrink-0 text-primary-600" aria-hidden="true" />
        {{ limitLabel(plan.limits.maxInvoicesPerMonth, 'factures/mois') }}
      </li>
      <li class="flex items-start gap-2">
        <Check class="mt-0.5 size-4 shrink-0 text-primary-600" aria-hidden="true" />
        {{ limitLabel(plan.limits.maxClients, 'clients') }}
      </li>
      <li class="flex items-start gap-2">
        <Check class="mt-0.5 size-4 shrink-0 text-primary-600" aria-hidden="true" />
        {{ limitLabel(plan.limits.maxUsers, 'utilisateurs') }}
      </li>
      <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2">
        <Check class="mt-0.5 size-4 shrink-0 text-primary-600" aria-hidden="true" />
        {{ feature }}
      </li>
    </ul>

    <BaseButton
      v-if="canSelect"
      class="mt-auto"
      :variant="isCurrent ? 'outline' : 'primary'"
      :disabled="isCurrent"
      :loading="submitting"
      @click="emit('select', plan.id)"
    >
      {{ isCurrent ? 'Plan actuel' : 'Choisir ce plan' }}
    </BaseButton>
  </div>
</template>
