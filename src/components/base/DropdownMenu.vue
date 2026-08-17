<script setup lang="ts">
import { MoreVertical } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

function toggle(): void {
  isOpen.value = !isOpen.value
}

function close(): void {
  isOpen.value = false
}

function onClickOutside(event: MouseEvent): void {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

defineExpose({ close })
</script>

<template>
  <div ref="rootRef" class="relative inline-block text-left">
    <slot name="trigger" :toggle="toggle">
      <button
        type="button"
        class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="Ouvrir le menu d'actions"
        @click="toggle"
      >
        <MoreVertical class="size-4" />
      </button>
    </slot>

    <div
      v-if="isOpen"
      class="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
      @click="close"
    >
      <slot />
    </div>
  </div>
</template>
