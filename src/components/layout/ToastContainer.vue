<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-vue-next'
import { type Component, watch } from 'vue'

import { useUiStore } from '@/stores'
import type { ToastVariant } from '@/stores/ui.store'

const uiStore = useUiStore()

const icons: Record<ToastVariant, Component> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800'
}

// Programme la disparition automatique de chaque nouveau toast.
watch(
  () => uiStore.toasts.length,
  () => {
    const latest = uiStore.toasts.at(-1)
    if (!latest) return
    setTimeout(() => uiStore.dismissToast(latest.id), latest.timeoutMs)
  }
)
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in uiStore.toasts"
          :key="toast.id"
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-3 shadow-lg"
          :class="variantClasses[toast.variant]"
          role="alert"
        >
          <component :is="icons[toast.variant]" class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p class="flex-1 text-sm">{{ toast.message }}</p>
          <button
            type="button"
            class="shrink-0 rounded p-0.5 hover:opacity-70"
            aria-label="Fermer la notification"
            @click="uiStore.dismissToast(toast.id)"
          >
            <X class="size-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
