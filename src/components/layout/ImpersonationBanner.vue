<script setup lang="ts">
import { Eye } from 'lucide-vue-next'
import { computed } from 'vue'

import { STORAGE_KEYS } from '@/constants'
import { useAuth } from '@/composables'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
const { logoutAndRedirect } = useAuth()

// `sessionStorage` : propre a cet onglet (voir `ImpersonatePage.vue`), donc
// une session commercant normale dans un autre onglet n'affiche jamais cette
// banniere par erreur.
const isImpersonating = computed(
  () => window.sessionStorage.getItem(STORAGE_KEYS.impersonationSessionFlag) === '1'
)

async function exitPreview(): Promise<void> {
  window.sessionStorage.removeItem(STORAGE_KEYS.impersonationSessionFlag)
  await logoutAndRedirect()
}
</script>

<template>
  <div
    v-if="isImpersonating"
    class="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-sm text-amber-900 sm:px-6 print:hidden"
  >
    <span class="flex items-center gap-2">
      <Eye class="size-4 shrink-0" aria-hidden="true" />
      Mode apercu : vous consultez le compte de
      <strong>{{ authStore.business?.name }}</strong>
      en tant qu'administrateur.
    </span>
    <button
      type="button"
      class="focus-ring rounded font-semibold text-amber-900 underline hover:text-amber-950"
      @click="exitPreview"
    >
      Quitter l'apercu
    </button>
  </div>
</template>
