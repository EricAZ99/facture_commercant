<script setup lang="ts">
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-vue-next'
import { computed } from 'vue'

interface Props {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'default' | 'success' | 'warning'
  /**
   * Variation (%) par rapport a la periode precedente. `undefined` = pas de
   * comparaison a afficher pour cet indicateur ; `null` = comparaison
   * demandee mais sans base valable (affiche "Nouveau").
   */
  changePercent?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'default',
  changePercent: undefined
})

const toneClasses: Record<NonNullable<Props['tone']>, string> = {
  default: 'bg-primary-50 text-primary-600',
  success: 'bg-green-50 text-green-600',
  warning: 'bg-amber-50 text-amber-600'
}

const showChange = computed(() => props.changePercent !== undefined)
const isNewComparison = computed(() => props.changePercent === null)
const isPositive = computed(() => (props.changePercent ?? 0) > 0)
const isFlat = computed(() => props.changePercent === 0)
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
      <p
        v-if="showChange"
        class="mt-0.5 flex items-center gap-1 text-xs font-medium"
        :class="
          isNewComparison
            ? 'text-gray-400'
            : isFlat
              ? 'text-gray-500'
              : isPositive
                ? 'text-green-600'
                : 'text-red-600'
        "
      >
        <template v-if="isNewComparison">Nouveau</template>
        <template v-else>
          <TrendingUp v-if="isPositive" class="size-3" aria-hidden="true" />
          <TrendingDown v-else-if="!isFlat" class="size-3" aria-hidden="true" />
          <Minus v-else class="size-3" aria-hidden="true" />
          {{ isPositive ? '+' : '' }}{{ changePercent }}% vs periode precedente
        </template>
      </p>
    </div>
  </div>
</template>
