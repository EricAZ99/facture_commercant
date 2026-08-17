<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
}

defineProps<Props>()
</script>

<template>
  <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <header v-if="title || $slots.actions" class="mb-4 flex items-start justify-between gap-4">
      <div v-if="title">
        <h3 class="text-base font-semibold text-gray-900">{{ title }}</h3>
        <p v-if="subtitle" class="mt-0.5 text-sm text-gray-500">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>
