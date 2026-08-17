<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
</script>

<template>
  <div
    class="flex h-screen overflow-hidden bg-gray-50 print:h-auto print:overflow-visible print:bg-white"
  >
    <AppSidebar class="print:hidden" />

    <div class="flex flex-1 flex-col overflow-hidden print:overflow-visible">
      <AppTopbar class="print:hidden" />

      <main class="flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible print:p-0">
        <RouterView />
      </main>
    </div>
  </div>
</template>
