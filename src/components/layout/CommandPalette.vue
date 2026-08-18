<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import { useCommandPalette, type CommandResult } from '@/composables/useCommandPalette'

const { isOpen, query, activeIndex, results, open, close, onQueryChange, moveActive, runActive } =
  useCommandPalette()

const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

function onResultClick(result: CommandResult): void {
  result.action()
  close()
}

function isTypingContext(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return Boolean(
    el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
  )
}

function onGlobalKeydown(event: KeyboardEvent): void {
  const isMeta = event.metaKey || event.ctrlKey
  if (isMeta && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    if (isOpen.value) {
      close()
    } else {
      open()
    }
    return
  }
  if (isOpen.value && event.key === 'Escape') {
    close()
    return
  }
  if (!isOpen.value && event.key === '/' && !isTypingContext(event.target)) {
    event.preventDefault()
    open()
  }
}

function onPaletteKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
    scrollActiveIntoView()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
    scrollActiveIntoView()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    runActive()
  }
}

function scrollActiveIntoView(): void {
  nextTick(() => {
    listRef.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  })
}

watch(isOpen, (open_) => {
  if (open_) nextTick(() => inputRef.value?.focus())
})

// Permet a un declencheur visible (bouton "Rechercher" de la barre du haut)
// d'ouvrir la meme palette sans etat partage explicite entre composants.
onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener('facture-ia:open-command-palette', open)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('facture-ia:open-command-palette', open)
})
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-start justify-center bg-gray-900/40 p-4 pt-[15vh]"
    @click.self="close"
  >
    <div
      class="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
      role="dialog"
      aria-label="Palette de commandes"
      @keydown="onPaletteKeydown"
    >
      <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <Search class="size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <input
          ref="inputRef"
          :value="query"
          type="text"
          placeholder="Rechercher une page, un client, un produit, une facture..."
          class="w-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          @input="onQueryChange(($event.target as HTMLInputElement).value)"
        />
        <kbd class="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-400">Esc</kbd>
      </div>

      <div ref="listRef" class="max-h-96 overflow-y-auto py-2">
        <p v-if="results.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">
          Aucun resultat.
        </p>
        <button
          v-for="(result, index) in results"
          :key="result.id"
          type="button"
          :data-active="index === activeIndex"
          class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm"
          :class="index === activeIndex ? 'bg-primary-50 text-primary-700' : 'text-gray-700'"
          @mouseenter="activeIndex = index"
          @click="onResultClick(result)"
        >
          <component :is="result.icon" class="size-4 shrink-0 text-gray-400" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate">{{ result.label }}</span>
          <span v-if="result.sublabel" class="shrink-0 text-xs text-gray-400">
            {{ result.sublabel }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
