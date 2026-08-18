<script setup lang="ts">
import { computed } from 'vue'

import type { RevenueDataPoint } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Props {
  data: RevenueDataPoint[]
  /** Serie de la periode precedente (meme duree, meme nombre de points) a superposer. */
  previousData?: RevenueDataPoint[] | null
  currency?: string
}

const props = withDefaults(defineProps<Props>(), { currency: 'XOF', previousData: null })

const CHART_WIDTH = 480
const CHART_HEIGHT = 160
const PADDING = 24
const LABEL_ROW_HEIGHT = 20

/** La comparaison ne s'affiche que si les deux series ont le meme nombre de points. */
const showComparison = computed(
  () => Boolean(props.previousData) && props.previousData?.length === props.data.length
)

const maxAmount = computed(() =>
  Math.max(
    1,
    ...props.data.map((point) => point.amount),
    ...(showComparison.value ? (props.previousData ?? []).map((point) => point.amount) : [])
  )
)

const bars = computed(() => {
  const points = props.data
  if (points.length === 0) return []

  const usableWidth = CHART_WIDTH - PADDING * 2
  const gap = 4
  const barWidth = Math.max(2, usableWidth / points.length - gap)

  return points.map((point, index) => {
    const barHeight = (point.amount / maxAmount.value) * (CHART_HEIGHT - PADDING * 2)
    const x = PADDING + index * (barWidth + gap)
    const y = CHART_HEIGHT - PADDING - barHeight
    return { x, y, width: barWidth, height: Math.max(barHeight, 1), point }
  })
})

/** Ligne de la periode precedente, alignee sur le centre de chaque barre courante. */
const previousLine = computed(() => {
  if (!showComparison.value)
    return { points: '', dots: [] as Array<{ x: number; y: number; point: RevenueDataPoint }> }

  const dots = bars.value.map((bar, index) => {
    const previousPoint = (props.previousData ?? [])[index]
    const amount = previousPoint?.amount ?? 0
    const y = CHART_HEIGHT - PADDING - (amount / maxAmount.value) * (CHART_HEIGHT - PADDING * 2)
    return { x: bar.x + bar.width / 2, y, point: previousPoint as RevenueDataPoint }
  })

  return { points: dots.map((d) => `${d.x},${d.y}`).join(' '), dots }
})

/** Affiche seulement les libelles du premier, milieu et dernier point pour eviter le chevauchement. */
const labels = computed(() => {
  const items = bars.value
  if (items.length === 0) return []

  const indexes =
    items.length === 1 ? [0] : [0, Math.floor((items.length - 1) / 2), items.length - 1]

  return [...new Set(indexes)].map((index) => {
    const bar = items[index]!
    return { x: bar.x + bar.width / 2, text: formatDate(bar.point.date) }
  })
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-if="showComparison" class="flex items-center gap-4 text-xs text-gray-500">
      <span class="flex items-center gap-1.5">
        <span class="size-2.5 rounded-sm bg-primary-500"></span>
        Periode courante
      </span>
      <span class="flex items-center gap-1.5">
        <span class="size-2.5 rounded-full border-2 border-gray-400"></span>
        Periode precedente
      </span>
    </div>

    <svg
      :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + LABEL_ROW_HEIGHT}`"
      class="w-full"
      role="img"
      aria-label="Evolution du chiffre d'affaires sur la periode selectionnee"
    >
      <line
        :x1="PADDING"
        :y1="CHART_HEIGHT - PADDING"
        :x2="CHART_WIDTH - PADDING"
        :y2="CHART_HEIGHT - PADDING"
        class="stroke-gray-200"
        stroke-width="1"
      />

      <rect
        v-for="(bar, index) in bars"
        :key="index"
        :x="bar.x"
        :y="bar.y"
        :width="bar.width"
        :height="bar.height"
        rx="2"
        class="fill-primary-500"
      >
        <title>
          {{ formatDate(bar.point.date) }} — {{ formatCurrency(bar.point.amount, currency) }}
        </title>
      </rect>

      <template v-if="showComparison">
        <polyline
          :points="previousLine.points"
          fill="none"
          class="stroke-gray-400"
          stroke-width="1.5"
          stroke-dasharray="3 3"
        />
        <circle
          v-for="(dot, index) in previousLine.dots"
          :key="index"
          :cx="dot.x"
          :cy="dot.y"
          r="2.5"
          class="fill-white stroke-gray-400"
          stroke-width="1.5"
        >
          <title>
            Periode precedente — {{ formatDate(dot.point.date) }} —
            {{ formatCurrency(dot.point.amount, currency) }}
          </title>
        </circle>
      </template>

      <text
        v-for="label in labels"
        :key="label.text"
        :x="label.x"
        :y="CHART_HEIGHT + 14"
        text-anchor="middle"
        class="fill-gray-500"
        font-size="9"
      >
        {{ label.text }}
      </text>
    </svg>
  </div>
</template>
