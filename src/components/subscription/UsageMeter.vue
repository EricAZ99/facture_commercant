<script setup lang="ts">
import type { LimitUsage } from '@/utils/subscriptionUsage'

interface Props {
  usage: LimitUsage
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-center justify-between text-sm">
      <span class="text-gray-700">{{ usage.label }}</span>
      <span class="font-medium" :class="usage.isLimitReached ? 'text-red-600' : 'text-gray-900'">
        {{ usage.current }} / {{ usage.limit === null ? 'Illimite' : usage.limit }}
      </span>
    </div>
    <div
      v-if="usage.ratio !== null"
      class="h-2 w-full overflow-hidden rounded-full bg-gray-100"
      role="progressbar"
      :aria-valuenow="usage.current"
      :aria-valuemax="usage.limit ?? undefined"
      :aria-label="usage.label"
    >
      <div
        class="h-full rounded-full transition-all"
        :class="[
          usage.isLimitReached
            ? 'bg-red-500'
            : usage.isApproachingLimit
              ? 'bg-amber-500'
              : 'bg-primary-500'
        ]"
        :style="{ width: `${usage.ratio * 100}%` }"
      />
    </div>
  </div>
</template>
