<script setup lang="ts">
import { X } from 'lucide-vue-next'

import BaseButton from './BaseButton.vue'

interface BulkAction {
  label: string
  icon?: object
  variant?: 'outline' | 'ghost' | 'danger'
  loading?: boolean
  emit: string
}

interface Props {
  count: number
  actions: BulkAction[]
}

defineProps<Props>()

const emit = defineEmits<{
  clear: []
  action: [emit: string]
}>()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="count > 0"
      class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-xl"
    >
      <span class="text-sm font-medium text-gray-700">
        {{ count }} sélectionné{{ count > 1 ? 's' : '' }}
      </span>

      <div class="h-4 w-px bg-gray-200" />

      <div class="flex items-center gap-2">
        <BaseButton
          v-for="action in actions"
          :key="action.emit"
          :variant="action.variant ?? 'outline'"
          size="sm"
          :loading="action.loading"
          @click="emit('action', action.emit)"
        >
          <component :is="action.icon" v-if="action.icon" class="size-4" aria-hidden="true" />
          {{ action.label }}
        </BaseButton>
      </div>

      <button
        type="button"
        class="focus-ring ml-1 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="Désélectionner tout"
        @click="emit('clear')"
      >
        <X class="size-4" />
      </button>
    </div>
  </Transition>
</template>
