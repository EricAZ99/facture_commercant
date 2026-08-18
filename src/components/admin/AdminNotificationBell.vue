<script setup lang="ts">
import { Bell } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import DropdownMenu from '@/components/base/DropdownMenu.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import { STORAGE_KEYS } from '@/constants'
import { useAdminNotifications } from '@/composables'
import { storage } from '@/utils/storage'
import { formatRelativeTime } from '@/utils/formatters'

const { items, isLoading, load } = useAdminNotifications()

onMounted(() => load())

const lastSeenAt = ref(storage.get(STORAGE_KEYS.notificationsLastSeenAt))
const unreadCount = computed(() =>
  lastSeenAt.value
    ? items.value.filter((item) => item.createdAt > (lastSeenAt.value as string)).length
    : items.value.length
)

function markAllAsRead(): void {
  const latest = items.value[0]?.createdAt ?? new Date().toISOString()
  lastSeenAt.value = latest
  storage.set(STORAGE_KEYS.notificationsLastSeenAt, latest)
}
</script>

<template>
  <DropdownMenu>
    <template #trigger="{ toggle }">
      <button
        type="button"
        class="focus-ring relative rounded-lg p-1.5 text-gray-300 hover:bg-gray-800 hover:text-white"
        aria-label="Notifications plateforme"
        title="Notifications plateforme"
        @click="toggle"
      >
        <Bell class="size-5" aria-hidden="true" />
        <span
          v-if="unreadCount > 0"
          class="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </button>
    </template>

    <div class="flex w-80 flex-col">
      <div class="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <p class="text-sm font-semibold text-gray-900">Notifications plateforme</p>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="focus-ring rounded text-xs font-medium text-primary-600 hover:text-primary-700"
          @click="markAllAsRead"
        >
          Tout marquer comme lu
        </button>
      </div>

      <p v-if="isLoading && items.length === 0" class="px-3 py-6 text-center text-sm text-gray-400">
        Chargement...
      </p>
      <EmptyState
        v-else-if="items.length === 0"
        :icon="Bell"
        title="Aucune notification"
        message="Les evenements plateforme (nouveaux commerces, tickets...) apparaitront ici."
      />
      <ul v-else class="max-h-80 divide-y divide-gray-50 overflow-y-auto">
        <li v-for="item in items" :key="item.id" class="px-3 py-2.5">
          <p class="text-sm text-gray-700">{{ item.message }}</p>
          <p class="text-xs text-gray-400">{{ formatRelativeTime(item.createdAt) }}</p>
        </li>
      </ul>
    </div>
  </DropdownMenu>
</template>
