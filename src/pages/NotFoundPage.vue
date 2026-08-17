<script setup lang="ts">
import { FileQuestion } from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'
import { ROUTE_NAMES } from '@/constants'
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center"
  >
    <FileQuestion class="size-12 text-gray-400" aria-hidden="true" />
    <div>
      <h1 class="text-lg font-semibold text-gray-900">Page introuvable</h1>
      <p class="mt-1 text-sm text-gray-500">La page que vous recherchez n'existe pas.</p>
    </div>
    <RouterLink :to="{ name: ROUTE_NAMES.dashboard }">
      <BaseButton variant="primary">Retour au tableau de bord</BaseButton>
    </RouterLink>
  </div>
</template>
