<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import PlanEditForm from '@/components/admin/PlanEditForm.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useAdminPlans } from '@/composables'
import type { ApiError, CreatePlanPayload, SubscriptionPlan } from '@/types'
import { formatCurrency } from '@/utils/formatters'

const { store, isSubmitting, load, submitCreate, submitUpdate } = useAdminPlans()

onMounted(() => load())

const isFormOpen = ref(false)
const editingPlan = ref<SubscriptionPlan | null>(null)
const formServerErrors = ref<Record<string, string[]> | null>(null)

function openCreateForm(): void {
  editingPlan.value = null
  formServerErrors.value = null
  isFormOpen.value = true
}

function openEditForm(plan: SubscriptionPlan): void {
  editingPlan.value = plan
  formServerErrors.value = null
  isFormOpen.value = true
}

function closeForm(): void {
  isFormOpen.value = false
  editingPlan.value = null
  formServerErrors.value = null
}

async function onFormSubmit(payload: CreatePlanPayload): Promise<void> {
  formServerErrors.value = null
  const error: ApiError | null = editingPlan.value
    ? await submitUpdate(editingPlan.value.id, payload)
    : await submitCreate(payload)

  if (error) {
    formServerErrors.value = error.details ?? null
    return
  }
  closeForm()
}

function limitLabel(value: number | null, unit: string): string {
  return value === null ? `${unit} illimites` : `${value} ${unit} max`
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">Catalogue de plans</h1>
        <p class="mt-1 text-sm text-gray-500">
          Formules d'abonnement proposees aux commercants (Free, Standard, Premium...).
        </p>
      </div>
      <BaseButton @click="openCreateForm">
        <Plus class="size-4" aria-hidden="true" />
        Nouveau plan
      </BaseButton>
    </div>

    <LoadingState v-if="store.isLoading && store.items.length === 0" message="Chargement..." />
    <ErrorState v-else-if="store.status === 'error' && store.items.length === 0" @retry="load" />

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <BaseCard v-for="plan in store.items" :key="plan.id">
        <div class="flex flex-col gap-3">
          <div>
            <h3 class="text-base font-semibold text-gray-900">{{ plan.name }}</h3>
            <p v-if="plan.description" class="mt-1 text-sm text-gray-500">{{ plan.description }}</p>
          </div>
          <p class="text-xl font-semibold text-gray-900">{{ formatCurrency(plan.price) }} / mois</p>
          <ul class="flex flex-col gap-1 text-sm text-gray-600">
            <li>{{ limitLabel(plan.limits.maxInvoicesPerMonth, 'factures/mois') }}</li>
            <li>{{ limitLabel(plan.limits.maxClients, 'clients') }}</li>
            <li>{{ limitLabel(plan.limits.maxUsers, 'utilisateurs') }}</li>
          </ul>
          <BaseButton variant="outline" size="sm" class="mt-auto" @click="openEditForm(plan)">
            Modifier
          </BaseButton>
        </div>
      </BaseCard>
    </div>

    <BaseModal
      :open="isFormOpen"
      :title="editingPlan ? 'Modifier le plan' : 'Nouveau plan'"
      @close="closeForm"
    >
      <PlanEditForm
        :plan="editingPlan"
        :submitting="isSubmitting"
        :server-errors="formServerErrors"
        @submit="onFormSubmit"
        @cancel="closeForm"
      />
    </BaseModal>
  </div>
</template>
