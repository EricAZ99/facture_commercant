<script setup lang="ts">
import BaseSpinner from '@/components/base/BaseSpinner.vue'

interface Props {
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: 'Chargement en cours...'
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <BaseSpinner size="lg" />
    <p class="text-sm text-gray-500">{{ message }}</p>
  </div>
</template>
