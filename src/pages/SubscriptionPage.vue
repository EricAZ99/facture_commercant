<script setup lang="ts">
import { Check, Copy, Download, TriangleAlert, Users } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import PlanCard from '@/components/subscription/PlanCard.vue'
import UsageMeter from '@/components/subscription/UsageMeter.vue'
import { SUBSCRIPTION_STATUS_BADGE_VARIANT, SUBSCRIPTION_STATUS_LABELS } from '@/constants'
import { useSubscription, usePermissions } from '@/composables'
import { useAuthStore } from '@/stores'
import type { BillingCycle, ID, SubscriptionInvoice } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

const authStore = useAuthStore()
const { can } = usePermissions()
const {
  store,
  isChangingPlan,
  isCancelling,
  invoices,
  isLoadingInvoices,
  downloadingReceiptId,
  load,
  selectPlan,
  cancelSubscription,
  downloadReceipt,
  limitUsages,
  limitAlerts
} = useSubscription()

onMounted(() => load())

const currency = computed(() => authStore.business?.currency ?? 'XOF')
const subscription = computed(() => store.current)
const business = computed(() => authStore.business)

const renewalLabel = computed(() => {
  if (!subscription.value) return ''
  if (subscription.value.status === 'trial') return "Fin de la periode d'essai"
  if (subscription.value.cancelAtPeriodEnd) return "Acces jusqu'au"
  return 'Prochain renouvellement'
})

// --- Plans : bascule mensuel/annuel + code promo -------------------------

const billingCycle = ref<BillingCycle>('monthly')
const visiblePlans = computed(() =>
  store.plans.filter((plan) => plan.price === 0 || plan.billingCycle === billingCycle.value)
)

const promoCode = ref('')

function onSelectPlan(planId: ID): void {
  void selectPlan(planId, promoCode.value.trim() || undefined)
}

// --- Code de parrainage ----------------------------------------------------

const isReferralCopied = ref(false)

async function copyReferralCode(): Promise<void> {
  if (!business.value?.referralCode) return
  await navigator.clipboard.writeText(business.value.referralCode)
  isReferralCopied.value = true
  setTimeout(() => (isReferralCopied.value = false), 2000)
}

// --- Historique de facturation ---------------------------------------------

function onDownloadReceipt(invoice: SubscriptionInvoice): void {
  void downloadReceipt(invoice)
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
              <span v-if="subscription.discountPercent" class="text-green-600">
                (code {{ subscription.promoCode }} : -{{ subscription.discountPercent }}%)
              </span>
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
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-base font-semibold text-gray-900">Plans disponibles</h2>
          <div class="flex items-center gap-2 rounded-lg border border-gray-200 p-1 text-sm">
            <button
              type="button"
              class="focus-ring rounded-md px-3 py-1"
              :class="billingCycle === 'monthly' ? 'bg-primary-600 text-white' : 'text-gray-600'"
              @click="billingCycle = 'monthly'"
            >
              Mensuel
            </button>
            <button
              type="button"
              class="focus-ring rounded-md px-3 py-1"
              :class="billingCycle === 'yearly' ? 'bg-primary-600 text-white' : 'text-gray-600'"
              @click="billingCycle = 'yearly'"
            >
              Annuel <span class="text-green-500">-20%</span>
            </button>
          </div>
        </div>

        <div v-if="can('subscription:manage')" class="mb-4 max-w-sm">
          <label class="mb-1 block text-sm font-medium text-gray-700" for="promo-code">
            Code promo ou de parrainage
          </label>
          <input
            id="promo-code"
            v-model="promoCode"
            type="text"
            placeholder="Ex : BIENVENUE10"
            class="focus-ring w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          />
          <p class="mt-1 text-xs text-gray-500">
            Applique automatiquement au prochain changement de plan.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PlanCard
            v-for="plan in visiblePlans"
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

      <!-- Parrainage -->
      <BaseCard v-if="business?.referralCode" title="Programme de parrainage">
        <p class="text-sm text-gray-500">
          Partagez votre code : chaque commerce qui l'utilise a son premier changement de plan
          obtient une remise de 15%.
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <code class="rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-sm text-gray-800">
            {{ business.referralCode }}
          </code>
          <button
            type="button"
            class="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            @click="copyReferralCode"
          >
            <Check v-if="isReferralCopied" class="size-4 text-green-600" aria-hidden="true" />
            <Copy v-else class="size-4" aria-hidden="true" />
            {{ isReferralCopied ? 'Copie !' : 'Copier' }}
          </button>
          <span class="flex items-center gap-1.5 text-sm text-gray-500">
            <Users class="size-4" aria-hidden="true" />
            {{ business.referralRedemptions }} filleul(s)
          </span>
        </div>
      </BaseCard>

      <!-- Historique de facturation -->
      <BaseCard title="Historique de facturation">
        <LoadingState v-if="isLoadingInvoices && invoices.length === 0" message="Chargement..." />
        <EmptyState
          v-else-if="invoices.length === 0"
          :icon="Download"
          title="Aucun recu"
          message="Vos recus d'abonnement apparaitront ici (plan gratuit : aucun recu genere)."
        />
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th class="py-2 pr-4 font-medium">Date</th>
                <th class="py-2 pr-4 font-medium">Plan</th>
                <th class="py-2 pr-4 text-right font-medium">Montant</th>
                <th class="py-2 pl-4 text-right font-medium">Recu</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="invoice in invoices" :key="invoice.id">
                <td class="py-2 pr-4 text-gray-600">{{ formatDate(invoice.issuedAt) }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ invoice.planName }}</td>
                <td class="py-2 pr-4 text-right font-medium text-gray-900">
                  {{ formatCurrency(invoice.amount, invoice.currency) }}
                </td>
                <td class="py-2 pl-4 text-right">
                  <button
                    type="button"
                    class="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                    :disabled="downloadingReceiptId === invoice.id"
                    @click="onDownloadReceipt(invoice)"
                  >
                    <Download class="size-3.5" aria-hidden="true" />
                    Telecharger
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
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
