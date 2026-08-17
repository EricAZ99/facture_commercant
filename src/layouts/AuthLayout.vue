<script setup lang="ts">
import { Receipt } from 'lucide-vue-next'
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md">
      <div class="mb-8 flex items-center justify-center gap-2">
        <Receipt class="size-7 text-primary-600" aria-hidden="true" />
        <span class="text-lg font-semibold text-gray-900">Facture IA</span>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <RouterView />
      </div>
    </div>
  </div>
</template>
