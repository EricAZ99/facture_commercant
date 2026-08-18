<script setup lang="ts">
import { ChevronDown, LogOut, Menu, Search } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'

import AccessibilityMenu from '@/components/layout/AccessibilityMenu.vue'
import NotificationBell from '@/components/layout/NotificationBell.vue'
import { useAuth } from '@/composables'
import { useAuthStore, useUiStore } from '@/stores'
import { getInitials } from '@/utils/formatters'

const authStore = useAuthStore()
const uiStore = useUiStore()
const { logoutAndRedirect } = useAuth()

const isMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function onClickOutside(event: MouseEvent): void {
  if (isMenuOpen.value && menuRef.value && !menuRef.value.contains(event.target as Node)) {
    isMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

async function onLogout(): Promise<void> {
  isMenuOpen.value = false
  await logoutAndRedirect()
}

function openCommandPalette(): void {
  window.dispatchEvent(new CustomEvent('facture-ia:open-command-palette'))
}
</script>

<template>
  <header
    class="flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-6"
  >
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        class="focus-ring shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="Ouvrir le menu"
        @click="uiStore.openMobileSidebar()"
      >
        <Menu class="size-5" aria-hidden="true" />
      </button>
      <p class="truncate text-sm font-medium text-gray-900">{{ authStore.business?.name }}</p>
    </div>

    <div class="flex items-center gap-1">
      <button
        type="button"
        class="focus-ring hidden items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-50 sm:flex"
        @click="openCommandPalette"
      >
        <Search class="size-4" aria-hidden="true" />
        Rechercher
        <kbd class="rounded border border-gray-300 bg-gray-50 px-1 text-xs text-gray-400">
          Ctrl+K
        </kbd>
      </button>
      <AccessibilityMenu />
      <NotificationBell />

      <div ref="menuRef" class="relative">
        <button
          type="button"
          class="focus-ring flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100"
          aria-label="Menu utilisateur"
          :aria-expanded="isMenuOpen"
          @click="isMenuOpen = !isMenuOpen"
        >
          <span
            class="flex size-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700"
          >
            {{
              getInitials(`${authStore.user?.firstName ?? ''} ${authStore.user?.lastName ?? ''}`)
            }}
          </span>
          <span class="hidden text-sm font-medium text-gray-700 sm:inline">
            {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
          </span>
          <ChevronDown class="size-4 text-gray-400" aria-hidden="true" />
        </button>

        <div
          v-if="isMenuOpen"
          class="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            @click="onLogout"
          >
            <LogOut class="size-4" aria-hidden="true" />
            Se deconnecter
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
