<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { onMounted, onUnmounted } from 'vue'

interface Props {
  open: boolean
  title?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.open) {
    emit('close')
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <header class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
          <button
            type="button"
            class="focus-ring rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fermer"
            @click="emit('close')"
          >
            <X class="size-5" />
          </button>
        </header>

        <slot />

        <footer v-if="$slots.footer" class="mt-6 flex justify-end gap-2">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>
