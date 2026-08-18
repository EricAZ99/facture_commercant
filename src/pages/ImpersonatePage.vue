<script setup lang="ts">
import { Receipt } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { ROUTE_NAMES, STORAGE_KEYS } from '@/constants'
import { useAuthStore } from '@/stores'
import type { ApiError } from '@/types'

interface Props {
  ticket: string
}

const props = defineProps<Props>()

const router = useRouter()
const authStore = useAuthStore()
const error = ref<ApiError | null>(null)
const fallbackMessage = "Ce lien d'apercu est invalide ou a expire."

async function exchange(): Promise<void> {
  error.value = null
  try {
    await authStore.loginWithImpersonationTicket(props.ticket)
    // Sessionstorage : propre a cet onglet, ne "contamine" jamais une
    // session commercant normale ouverte dans un autre onglet.
    window.sessionStorage.setItem(STORAGE_KEYS.impersonationSessionFlag, '1')
    await router.push({ name: ROUTE_NAMES.dashboard })
  } catch (err) {
    error.value = err as ApiError
  }
}

onMounted(() => exchange())
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md">
      <div class="mb-8 flex items-center justify-center gap-2">
        <Receipt class="size-7 text-primary-600" aria-hidden="true" />
        <span class="text-lg font-semibold text-gray-900">Facture IA</span>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <LoadingState v-if="!error" message="Ouverture de l'apercu..." />
        <ErrorState v-else :message="error.message || fallbackMessage" @retry="exchange" />
      </div>
    </div>
  </div>
</template>
