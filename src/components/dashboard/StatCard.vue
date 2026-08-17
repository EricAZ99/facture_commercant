<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'

interface Props {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'default' | 'success' | 'warning'
}

withDefaults(defineProps<Props>(), {
  tone: 'default'
})

const toneClasses: Record<NonNullable<Props['tone']>, string> = {
  default: 'bg-primary-50 text-primary-600',
  success: 'bg-green-50 text-green-600',
  warning: 'bg-amber-50 text-amber-600'
}
</script>

<template>
  <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <span
      class="flex size-10 shrink-0 items-center justify-center rounded-lg"
      :class="toneClasses[tone]"
    >
      <component :is="icon" class="size-5" aria-hidden="true" />
    </span>
    <div class="min-w-0">
      <p class="truncate text-xs font-medium text-gray-500">{{ label }}</p>
      <p class="truncate text-lg font-semibold text-gray-900">{{ value }}</p>
    </div>
  </div>
</template>
