<script setup lang="ts">
import {
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Receipt,
  Settings,
  Shield,
  Store,
  Wallet
} from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import AdminNotificationBell from '@/components/admin/AdminNotificationBell.vue'
import { useAdminAuth } from '@/composables'
import { ROUTE_NAMES } from '@/constants'
import { useAdminAuthStore } from '@/stores'
import { getInitials } from '@/utils/formatters'

const adminAuthStore = useAdminAuthStore()
const { logoutAndRedirect } = useAdminAuth()

const navItems = [
  { label: 'Tableau de bord', routeName: ROUTE_NAMES.adminDashboard, icon: LayoutDashboard },
  { label: 'Commercants', routeName: ROUTE_NAMES.adminBusinesses, icon: Store },
  { label: 'Plans', routeName: ROUTE_NAMES.adminPlans, icon: Wallet },
  { label: 'Support', routeName: ROUTE_NAMES.adminSupport, icon: LifeBuoy },
  { label: 'Administrateurs', routeName: ROUTE_NAMES.adminAdmins, icon: Shield },
  { label: 'Parametres', routeName: ROUTE_NAMES.adminSettings, icon: Settings }
]

const isMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function onClickOutside(event: MouseEvent): void {
  if (isMenuOpen.value && menuRef.value && !menuRef.value.contains(event.target as Node)) {
    isMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))

async function onLogout(): Promise<void> {
  isMenuOpen.value = false
  await logoutAndRedirect()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="border-b border-gray-200 bg-gray-900">
      <div
        class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6"
      >
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 text-white">
            <Receipt class="size-5 text-primary-400" aria-hidden="true" />
            <span class="text-sm font-semibold">Facture IA — Admin</span>
          </div>
          <nav class="flex items-center gap-1">
            <RouterLink
              v-for="item in navItems"
              :key="item.routeName"
              :to="{ name: item.routeName }"
              class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              active-class="!bg-gray-800 !text-white"
            >
              <component :is="item.icon" class="size-4" aria-hidden="true" />
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>

        <div class="flex items-center gap-2">
          <AdminNotificationBell />

          <div ref="menuRef" class="relative">
            <button
              type="button"
              class="focus-ring flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-200 hover:bg-gray-800"
              aria-label="Menu administrateur"
              :aria-expanded="isMenuOpen"
              @click="isMenuOpen = !isMenuOpen"
            >
              <span
                class="flex size-7 items-center justify-center rounded-full bg-primary-500/20 text-xs font-semibold text-primary-300"
              >
                {{
                  getInitials(
                    `${adminAuthStore.admin?.firstName ?? ''} ${adminAuthStore.admin?.lastName ?? ''}`
                  )
                }}
              </span>
            </button>

            <div
              v-if="isMenuOpen"
              class="absolute right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            >
              <p class="truncate px-3 py-2 text-sm text-gray-500">
                {{ adminAuthStore.admin?.email }}
              </p>
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
      </div>
    </header>

    <main class="mx-auto max-w-6xl p-4 sm:p-6">
      <RouterView />
    </main>
  </div>
</template>
