<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'

interface Props {
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: 'Une erreur est survenue lors du chargement des donnees.'
})

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <AlertTriangle class="size-10 text-red-500" aria-hidden="true" />
    <p class="max-w-sm text-sm text-gray-600">{{ message }}</p>
    <BaseButton variant="outline" size="sm" @click="emit('retry')"> Reessayer </BaseButton>
  </div>
</template>
