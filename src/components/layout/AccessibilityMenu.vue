<script setup lang="ts">
import { Eye } from 'lucide-vue-next'

import DropdownMenu from '@/components/base/DropdownMenu.vue'
import { useAccessibility, type FontScale } from '@/composables'

const { prefs, setFontScale, toggleHighContrast } = useAccessibility()

const FONT_SCALE_OPTIONS: Array<{ value: FontScale; label: string }> = [
  { value: 'normal', label: 'Normale' },
  { value: 'large', label: 'Grande' },
  { value: 'xlarge', label: 'Tres grande' }
]
</script>

<template>
  <DropdownMenu>
    <template #trigger="{ toggle }">
      <button
        type="button"
        class="focus-ring rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        aria-label="Accessibilite"
        title="Accessibilite"
        @click="toggle"
      >
        <Eye class="size-5" aria-hidden="true" />
      </button>
    </template>

    <div class="px-3 py-2">
      <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Taille de police
      </p>
      <div class="flex flex-col gap-1">
        <button
          v-for="option in FONT_SCALE_OPTIONS"
          :key="option.value"
          type="button"
          class="focus-ring rounded px-2 py-1 text-left text-sm"
          :class="
            prefs.fontScale === option.value
              ? 'bg-primary-50 font-medium text-primary-700'
              : 'text-gray-700 hover:bg-gray-50'
          "
          @click="setFontScale(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
    <div class="border-t border-gray-100 px-3 py-2">
      <label class="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          :checked="prefs.highContrast"
          class="focus-ring size-4 rounded border-gray-300"
          @change="toggleHighContrast"
        />
        Contraste eleve
      </label>
    </div>
  </DropdownMenu>
</template>
