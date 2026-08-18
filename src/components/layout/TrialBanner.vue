<script setup lang="ts">
import { Rocket, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import { ROUTE_NAMES, STORAGE_KEYS } from '@/constants'
import { usePermissions } from '@/composables'
import { useSubscriptionStore } from '@/stores'
import { storage } from '@/utils/storage'

const { can } = usePermissions()
const store = useSubscriptionStore()

onMounted(() => {
  // Seuls les roles ayant `subscription:read` peuvent lire l'abonnement cote
  // backend (voir mock-server) : les autres ne verront jamais cette banniere.
  // Reutilise l'abonnement deja charge (ex: page Abonnement visitee dans la
  // session) plutot que de le recharger inutilement a chaque changement de page.
  if (!store.current && can('subscription:read')) void store.fetchCurrent()
})

const daysRemaining = computed(() => {
  const subscription = store.current
  if (!subscription || subscription.status !== 'trial') return null
  const ms = new Date(subscription.currentPeriodEnd).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
})

const isDismissed = ref(false)

/** La banniere reapparait si un nouvel essai commence (fin de periode differente de celle fermee). */
function checkDismissed(): void {
  const subscription = store.current
  if (!subscription) return
  isDismissed.value =
    storage.get(STORAGE_KEYS.trialBannerDismissedUntil) === subscription.currentPeriodEnd
}

function dismiss(): void {
  const subscription = store.current
  if (!subscription) return
  storage.set(STORAGE_KEYS.trialBannerDismissedUntil, subscription.currentPeriodEnd)
  isDismissed.value = true
}

const visible = computed(() => {
  checkDismissed()
  return daysRemaining.value !== null && !isDismissed.value
})
</script>

<template>
  <div
    v-if="visible"
    class="flex flex-wrap items-center justify-between gap-3 border-b border-primary-200 bg-primary-50 px-4 py-2.5 text-sm text-primary-800 sm:px-6 print:hidden"
  >
    <div class="flex items-center gap-2">
      <Rocket class="size-4 shrink-0" aria-hidden="true" />
      <span>
        Periode d'essai : <strong>{{ daysRemaining }} jour(s)</strong> restant(s).
        <template v-if="daysRemaining === 0">Elle se termine aujourd'hui.</template>
      </span>
    </div>
    <div class="flex items-center gap-3">
      <RouterLink
        v-if="can('subscription:manage')"
        :to="{ name: ROUTE_NAMES.subscription }"
        class="focus-ring rounded font-semibold text-primary-700 underline hover:text-primary-900"
      >
        Choisir un plan
      </RouterLink>
      <button
        type="button"
        class="focus-ring rounded p-0.5 text-primary-600 hover:text-primary-900"
        aria-label="Fermer"
        @click="dismiss"
      >
        <X class="size-4" />
      </button>
    </div>
  </div>
</template>
