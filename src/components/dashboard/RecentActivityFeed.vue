<script setup lang="ts">
import {
  ArrowRightLeft,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileMinus,
  FilePlus,
  PackagePlus,
  Send,
  Undo2,
  UserPlus,
  Wallet,
  XCircle,
  type LucideIcon
} from 'lucide-vue-next'

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
  payment_refunded: Undo2,
  client_created: UserPlus,
  product_created: PackagePlus,
  quote_created: ClipboardList,
  quote_sent: Send,
  quote_converted: ArrowRightLeft,
  credit_note_created: FileMinus,
  installment_plan_created: CalendarClock,
  user_invited: UserPlus,
  subscription_changed: CreditCard,
  subscription_canceled: XCircle
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
