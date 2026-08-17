<script setup lang="ts">
import { Inbox, type LucideIcon } from 'lucide-vue-next'

interface Props {
  icon?: LucideIcon
  title?: string
  message?: string
}

withDefaults(defineProps<Props>(), {
  icon: () => Inbox,
  title: 'Aucune donnee',
  message: "Il n'y a rien a afficher pour le moment."
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <component :is="icon" class="size-10 text-gray-300" aria-hidden="true" />
    <div>
      <p class="text-sm font-medium text-gray-900">{{ title }}</p>
      <p class="mt-1 text-sm text-gray-500">{{ message }}</p>
    </div>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>
