<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'
import { ROUTE_NAMES } from '@/constants'
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center"
  >
    <ShieldAlert class="size-12 text-amber-500" aria-hidden="true" />
    <div>
      <h1 class="text-lg font-semibold text-gray-900">Acces refuse</h1>
      <p class="mt-1 text-sm text-gray-500">
        Vous n'avez pas les permissions necessaires pour acceder a cette page.
      </p>
    </div>
    <RouterLink :to="{ name: ROUTE_NAMES.dashboard }">
      <BaseButton variant="primary">Retour au tableau de bord</BaseButton>
    </RouterLink>
  </div>
</template>
