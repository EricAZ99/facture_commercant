<script setup lang="ts">
import { Eye, EyeOff, GripVertical } from 'lucide-vue-next'
import { ref } from 'vue'

import type { DashboardWidgetId } from '@/composables'

interface Props {
  id: DashboardWidgetId
  label: string
  editing: boolean
  hidden: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  move: [draggedId: DashboardWidgetId, targetId: DashboardWidgetId]
  toggleVisibility: [id: DashboardWidgetId]
}>()

const isDragOver = ref(false)

function onDragStart(event: DragEvent): void {
  event.dataTransfer?.setData('text/plain', props.id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = true
}

function onDrop(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = false
  const draggedId = event.dataTransfer?.getData('text/plain') as DashboardWidgetId | ''
  if (draggedId) emit('move', draggedId, props.id)
}
</script>

<template>
  <div
    class="rounded-xl transition-shadow"
    :class="[
      editing ? 'ring-1 ring-gray-200' : '',
      isDragOver ? 'ring-2 ring-primary-400' : '',
      editing && hidden ? 'opacity-50' : ''
    ]"
    :draggable="editing"
    @dragstart="onDragStart"
    @dragover="onDragOver"
    @dragleave="isDragOver = false"
    @drop="onDrop"
  >
    <div
      v-if="editing"
      class="mb-1 flex items-center justify-between rounded-t-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
    >
      <span class="flex cursor-grab items-center gap-1.5 active:cursor-grabbing">
        <GripVertical class="size-3.5" aria-hidden="true" />
        {{ label }}
      </span>
      <button
        type="button"
        class="focus-ring rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
        :aria-label="hidden ? `Afficher ${label}` : `Masquer ${label}`"
        @click="emit('toggleVisibility', id)"
      >
        <EyeOff v-if="!hidden" class="size-3.5" aria-hidden="true" />
        <Eye v-else class="size-3.5" aria-hidden="true" />
      </button>
    </div>

    <div v-if="!editing || !hidden">
      <slot />
    </div>
    <p v-else class="px-1 py-6 text-center text-xs text-gray-400">Widget masque</p>
  </div>
</template>
