<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

import { useTheme } from '@/composables'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    class="focus-ring rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
    :aria-label="theme === 'dark' ? $t('theme.enableLight') : $t('theme.enableDark')"
    :title="theme === 'dark' ? $t('theme.lightLabel') : $t('theme.darkLabel')"
    @click="toggleTheme"
  >
    <Sun v-if="theme === 'dark'" class="size-5" aria-hidden="true" />
    <Moon v-else class="size-5" aria-hidden="true" />
  </button>
</template>
