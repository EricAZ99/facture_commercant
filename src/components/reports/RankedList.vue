<script setup lang="ts">
import { computed } from 'vue'

/**
 * Liste classee generique (produits les plus vendus, meilleurs clients...).
 * Purement presentationnel : recoit ses donnees via des props, ne connait
 * ni l'API ni le service qui les a produites.
 */
export interface RankedListItem {
  id: string
  label: string
  value: number
  secondaryLabel?: string
}

interface Props {
  items: RankedListItem[]
  formatValue?: (value: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  formatValue: (value: number) => String(value)
})

const maxValue = computed(() => Math.max(1, ...props.items.map((item) => item.value)))
</script>

<template>
  <ol class="flex flex-col gap-4">
    <li v-for="(item, index) in items" :key="item.id" class="flex items-center gap-3">
      <span
        class="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600"
      >
        {{ index + 1 }}
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-2">
          <p class="truncate text-sm font-medium text-gray-900">{{ item.label }}</p>
          <p class="shrink-0 text-sm font-semibold text-gray-900">{{ formatValue(item.value) }}</p>
        </div>
        <p v-if="item.secondaryLabel" class="text-xs text-gray-500">{{ item.secondaryLabel }}</p>
        <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            class="h-full rounded-full bg-primary-500"
            :style="{ width: `${(item.value / maxValue) * 100}%` }"
          />
        </div>
      </div>
    </li>
  </ol>
</template>
