<script setup lang="ts">
import { FilePlus, PackagePlus, Send, UserPlus, Wallet, type LucideIcon } from 'lucide-vue-next'

import type { ActivityItem, ActivityType } from '@/types'
import { formatRelativeTime } from '@/utils/formatters'

interface Props {
  activities: ActivityItem[]
}

defineProps<Props>()

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  invoice_created: FilePlus,
  invoice_sent: Send,
  payment_received: Wallet,
  client_created: UserPlus,
  product_created: PackagePlus
}
</script>

<template>
  <ul class="flex flex-col gap-4">
    <li v-for="activity in activities" :key="activity.id" class="flex items-start gap-3">
      <span
        class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"
      >
        <component :is="ACTIVITY_ICONS[activity.type]" class="size-4" aria-hidden="true" />
      </span>
      <div class="min-w-0">
        <p class="text-sm text-gray-700">{{ activity.message }}</p>
        <p class="text-xs text-gray-400">{{ formatRelativeTime(activity.createdAt) }}</p>
      </div>
    </li>
  </ul>
</template>
