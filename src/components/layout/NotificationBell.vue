<script setup lang="ts">
import { Bell } from 'lucide-vue-next'
import { onMounted } from 'vue'

import DropdownMenu from '@/components/base/DropdownMenu.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import { useNotifications } from '@/composables'
import { formatRelativeTime } from '@/utils/formatters'

const { items, isLoading, unreadCount, load, markAllAsRead } = useNotifications()

onMounted(() => load())
</script>

<template>
  <DropdownMenu>
    <template #trigger="{ toggle }">
      <button
        type="button"
        class="focus-ring relative rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        :aria-label="$t('notifications.title')"
        :title="$t('notifications.title')"
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
        <p class="text-sm font-semibold text-gray-900">{{ $t('notifications.title') }}</p>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="focus-ring rounded text-xs font-medium text-primary-600 hover:text-primary-700"
          @click="markAllAsRead"
        >
          {{ $t('notifications.markAllRead') }}
        </button>
      </div>

      <p v-if="isLoading && items.length === 0" class="px-3 py-6 text-center text-sm text-gray-400">
        {{ $t('notifications.loading') }}
      </p>
      <EmptyState
        v-else-if="items.length === 0"
        :icon="Bell"
        :title="$t('notifications.emptyTitle')"
        :message="$t('notifications.emptyMessage')"
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
