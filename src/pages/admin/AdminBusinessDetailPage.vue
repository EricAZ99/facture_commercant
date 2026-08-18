<script setup lang="ts">
import { AlertTriangle, ArrowLeft, Eye } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import {
  ROUTE_NAMES,
  SUBSCRIPTION_STATUS_BADGE_VARIANT,
  SUBSCRIPTION_STATUS_LABELS
} from '@/constants'
import { useAdminBusinessDetail, useAdminPlans } from '@/composables'
import type { ApiError, ID } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

interface Props {
  id: ID
}

const props = defineProps<Props>()
const router = useRouter()

const {
  business,
  isLoading,
  loadError,
  isMutating,
  isDeleting,
  isImpersonating,
  auditLog,
  isLoadingAuditLog,
  load,
  loadAuditLog,
  toggleSuspension,
  changePlan,
  applyDiscount,
  removeBusiness,
  openPreview
} = useAdminBusinessDetail(props.id)

const discountInput = ref('')
async function onApplyDiscount(): Promise<void> {
  const value = Number(discountInput.value)
  if (!Number.isFinite(value) || value < 0 || value > 100) return
  const success = await applyDiscount(value)
  if (success) discountInput.value = ''
}

const { store: plansStore, load: loadPlans } = useAdminPlans()

onMounted(() => {
  void load()
  void loadAuditLog()
  void loadPlans()
})

const isSuspendDialogOpen = ref(false)

async function onConfirmSuspendToggle(): Promise<void> {
  const success = await toggleSuspension()
  if (success) isSuspendDialogOpen.value = false
}

const selectedPlanId = computed({
  get: () => business.value?.subscription.plan.id ?? '',
  set: (planId: string) => {
    if (planId && planId !== business.value?.subscription.plan.id) void changePlan(planId)
  }
})

// --- Suppression definitive -------------------------------------------

const isDeleteDialogOpen = ref(false)
const deleteConfirmInput = ref('')
const deleteError = ref<ApiError | null>(null)
const isDeleteConfirmMatching = computed(() => deleteConfirmInput.value === business.value?.name)

function openDeleteDialog(): void {
  deleteConfirmInput.value = ''
  deleteError.value = null
  isDeleteDialogOpen.value = true
}

async function onConfirmDelete(): Promise<void> {
  if (!isDeleteConfirmMatching.value) return
  const error = await removeBusiness(deleteConfirmInput.value)
  if (error) {
    deleteError.value = error
    return
  }
  await router.push({ name: ROUTE_NAMES.adminBusinesses })
}
</script>

<template>
  <div>
    <RouterLink
      :to="{ name: ROUTE_NAMES.adminBusinesses }"
      class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Retour aux commerces
    </RouterLink>

    <LoadingState v-if="isLoading && !business" message="Chargement du commerce..." />
    <ErrorState v-else-if="loadError && !business" :message="loadError.message" @retry="load" />

    <div v-else-if="business" class="flex flex-col gap-4">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-gray-900">{{ business.name }}</h1>
            <BaseBadge v-if="business.isSuspended" variant="danger">Suspendu</BaseBadge>
          </div>
          <p class="mt-1 text-sm text-gray-500">{{ business.email }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <BaseButton variant="outline" :loading="isImpersonating" @click="openPreview">
            <Eye class="size-4" aria-hidden="true" />
            Apercu
          </BaseButton>
          <BaseButton
            :variant="business.isSuspended ? 'primary' : 'danger'"
            :loading="isMutating"
            @click="isSuspendDialogOpen = true"
          >
            {{ business.isSuspended ? 'Reactiver le commerce' : 'Suspendre le commerce' }}
          </BaseButton>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BaseCard title="Informations">
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">Proprietaire</dt>
              <dd class="font-medium text-gray-900">{{ business.ownerName }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Email proprietaire</dt>
              <dd class="font-medium text-gray-900">{{ business.ownerEmail }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Telephone</dt>
              <dd class="font-medium text-gray-900">{{ business.phone || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Inscrit le</dt>
              <dd class="font-medium text-gray-900">{{ formatDateTime(business.createdAt) }}</dd>
            </div>
          </dl>
          <dl class="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-sm">
            <div>
              <dt class="text-gray-500">Utilisateurs</dt>
              <dd class="font-medium text-gray-900">{{ business.usersCount }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Clients</dt>
              <dd class="font-medium text-gray-900">{{ business.clientsCount }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Factures</dt>
              <dd class="font-medium text-gray-900">{{ business.invoicesCount }}</dd>
            </div>
          </dl>
          <dl class="mt-4 border-t border-gray-100 pt-4 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">Chiffre d'affaires facture</dt>
              <dd class="font-medium text-gray-900">
                {{ formatCurrency(business.revenueTotal, business.currency) }}
              </dd>
            </div>
          </dl>
        </BaseCard>

        <BaseCard title="Abonnement">
          <div class="flex items-center gap-2">
            <BaseBadge :variant="SUBSCRIPTION_STATUS_BADGE_VARIANT[business.subscriptionStatus]">
              {{ SUBSCRIPTION_STATUS_LABELS[business.subscriptionStatus] }}
            </BaseBadge>
            <span class="text-sm text-gray-500">
              Renouvellement : {{ formatDateTime(business.subscription.currentPeriodEnd) }}
            </span>
          </div>

          <div class="mt-4 flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700" for="admin-plan-select">
              Changer de plan (action administrative)
            </label>
            <select
              id="admin-plan-select"
              v-model="selectedPlanId"
              :disabled="isMutating"
              class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option v-for="plan in plansStore.items" :key="plan.id" :value="plan.id">
                {{ plan.name }} — {{ formatCurrency(plan.price, business.currency) }}
              </option>
            </select>
          </div>

          <div class="mt-4 border-t border-gray-100 pt-4">
            <p class="mb-1.5 text-sm font-medium text-gray-700">Remise administrative</p>
            <p v-if="business.subscription.discountPercent" class="mb-2 text-sm text-green-600">
              Remise active : {{ business.subscription.discountPercent }}% ({{
                business.subscription.promoCode
              }})
            </p>
            <div class="flex items-center gap-2">
              <input
                v-model="discountInput"
                type="number"
                min="0"
                max="100"
                placeholder="% de remise"
                class="focus-ring w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
              <BaseButton
                variant="outline"
                size="sm"
                :loading="isMutating"
                :disabled="!discountInput"
                @click="onApplyDiscount"
              >
                Appliquer
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>

      <BaseCard
        title="Journal d'activite admin"
        subtitle="Actions realisees sur ce commerce depuis l'espace admin."
      >
        <LoadingState v-if="isLoadingAuditLog && auditLog.length === 0" message="Chargement..." />
        <p v-else-if="auditLog.length === 0" class="text-sm text-gray-400">
          Aucune action administrative enregistree pour ce commerce.
        </p>
        <ul v-else class="flex flex-col gap-3 text-sm">
          <li v-for="entry in auditLog" :key="entry.id" class="flex justify-between gap-4">
            <span class="text-gray-700">{{ entry.message }}</span>
            <span class="shrink-0 text-xs text-gray-400">
              {{ entry.adminName }} · {{ formatDateTime(entry.createdAt) }}
            </span>
          </li>
        </ul>
      </BaseCard>

      <div class="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6">
        <div class="flex items-start gap-3">
          <AlertTriangle class="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
          <div class="flex-1">
            <h2 class="text-sm font-semibold text-red-900">Zone dangereuse</h2>
            <p class="mt-1 text-sm text-red-700">
              Supprimer definitivement ce commerce et toutes ses donnees, au-dela de la suspension.
              Cette action ne peut pas etre annulee.
            </p>
            <BaseButton variant="danger" size="sm" class="mt-3" @click="openDeleteDialog">
              Supprimer definitivement
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :open="isSuspendDialogOpen"
      :title="business?.isSuspended ? 'Reactiver le commerce' : 'Suspendre le commerce'"
      :message="
        business?.isSuspended
          ? `Voulez-vous vraiment reactiver l'acces de ${business?.name} a la plateforme ?`
          : `Voulez-vous vraiment suspendre ${business?.name} ? Le commerce perdra immediatement l'acces a son espace.`
      "
      :confirm-label="business?.isSuspended ? 'Reactiver' : 'Suspendre'"
      :variant="business?.isSuspended ? 'primary' : 'danger'"
      :loading="isMutating"
      @confirm="onConfirmSuspendToggle"
      @cancel="isSuspendDialogOpen = false"
    />

    <BaseModal
      :open="isDeleteDialogOpen"
      title="Supprimer definitivement le commerce"
      @close="isDeleteDialogOpen = false"
    >
      <div class="flex flex-col gap-4">
        <div class="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Toutes les donnees de {{ business?.name }} (clients, produits, factures, devis, avoirs,
            paiements, equipe) seront definitivement supprimees.
          </p>
        </div>
        <BaseInput
          v-model="deleteConfirmInput"
          :label="`Saisissez « ${business?.name} » pour confirmer`"
          :error="deleteError?.details?.confirmName?.[0]"
          autocomplete="off"
        />
        <div class="mt-2 flex justify-end gap-2">
          <BaseButton
            type="button"
            variant="outline"
            :disabled="isDeleting"
            @click="isDeleteDialogOpen = false"
          >
            Annuler
          </BaseButton>
          <BaseButton
            variant="danger"
            :disabled="!isDeleteConfirmMatching"
            :loading="isDeleting"
            @click="onConfirmDelete"
          >
            Supprimer definitivement
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
