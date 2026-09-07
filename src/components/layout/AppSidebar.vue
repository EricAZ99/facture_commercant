<script setup lang="ts">
import { Receipt, X } from 'lucide-vue-next'
import { computed } from 'vue'

import { NAV_ITEMS } from '@/constants'
import { usePermissions } from '@/composables'
import { useUiStore } from '@/stores'

// Composant a deux racines (fond + tiroir) : Vue n'applique alors plus
// automatiquement les attributs/`class` herites (ex: `print:hidden` passe
// par DashboardLayout) au premier element venu. On desactive l'heritage
// implicite et on cible explicitement `<aside>` avec `v-bind="$attrs"`.
defineOptions({ inheritAttrs: false })

const { can } = usePermissions()
const uiStore = useUiStore()

const visibleItems = computed(() =>
  NAV_ITEMS.filter((item) => !item.permission || can(item.permission))
)
</script>

<template>
  <!-- Fond assombri derriere le tiroir, mobile/tablette uniquement. -->
  <div
    v-if="uiStore.isMobileSidebarOpen"
    class="fixed inset-0 z-30 bg-gray-900/40 lg:hidden"
    aria-hidden="true"
    @click="uiStore.closeMobileSidebar()"
  />

  <aside
    v-bind="$attrs"
    class="fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0"
    :class="uiStore.isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex h-16 items-center justify-between gap-2 border-b border-gray-200 px-5">
      <div class="flex items-center gap-2">
        <Receipt class="size-6 text-primary-600" aria-hidden="true" />
        <span class="text-base font-semibold text-gray-900">Facture IA</span>
      </div>
      <button
        type="button"
        class="focus-ring rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
        :aria-label="$t('sidebar.closeMenu')"
        @click="uiStore.closeMobileSidebar()"
      >
        <X class="size-5" aria-hidden="true" />
      </button>
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.routeName"
        :to="{ name: item.routeName }"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        active-class="!bg-primary-50 !text-primary-700 dark:!bg-primary-900 dark:!text-primary-300"
        @click="uiStore.closeMobileSidebar()"
      >
        <component :is="item.icon" class="size-5" aria-hidden="true" />
        {{ $t(item.labelKey) }}
      </RouterLink>
    </nav>
  </aside>
</template>
