<script setup lang="ts">
import type { DashboardPeriod } from '@/types'

interface Props {
  modelValue: DashboardPeriod
  options: Array<{ value: DashboardPeriod; label: string }>
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: DashboardPeriod]
}>()
</script>

<template>
  <div
    class="inline-flex rounded-lg border border-gray-200 bg-white p-0.5"
    role="group"
    aria-label="Filtre de periode"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="focus-ring rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
      :class="
        option.value === modelValue
          ? 'bg-primary-600 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      "
      :aria-pressed="option.value === modelValue"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
