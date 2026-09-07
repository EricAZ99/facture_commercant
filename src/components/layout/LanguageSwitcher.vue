<script setup lang="ts">
import { Check, Languages } from 'lucide-vue-next'

import DropdownMenu from '@/components/base/DropdownMenu.vue'
import { useLocale } from '@/composables'

const { locale, setLocale, options } = useLocale()
</script>

<template>
  <DropdownMenu>
    <template #trigger="{ toggle }">
      <button
        type="button"
        class="focus-ring rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        :aria-label="$t('language.switchLabel')"
        :title="$t('language.switchLabel')"
        @click="toggle"
      >
        <Languages class="size-5" aria-hidden="true" />
      </button>
    </template>
    <button
      v-for="option in options"
      :key="option.code"
      type="button"
      class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
      @click="setLocale(option.code)"
    >
      {{ option.nativeName }}
      <Check v-if="option.code === locale" class="size-4 text-primary-600" aria-hidden="true" />
    </button>
  </DropdownMenu>
</template>
