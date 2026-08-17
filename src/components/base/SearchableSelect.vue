<script setup lang="ts" generic="T">
import { Loader2, Search, X } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref, shallowRef } from 'vue'

const SEARCH_DEBOUNCE_MS = 300

// Le type des props est defini en ligne (plutot que via une interface
// `Props` nommee) : avec un composant generique (`generic="T"`), une
// interface locale nommee provoque une erreur vue-tsc ("private name")
// sur le type de l'export par defaut du composant.
//
// `selected` (typee generiquement `T | null`) est volontairement exclue de
// `withDefaults` : la synthese de valeur par defaut pour un prop generique
// derègle l'inference de `T` par vue-tsc. `undefined` se comporte comme
// `null` partout ou `selected` est utilise (verifications de veracite).
const props = withDefaults(
  defineProps<{
    /** Fonction de recherche asynchrone (typiquement un appel service). */
    search: (query: string) => Promise<T[]>
    getLabel: (item: T) => string
    getKey: (item: T) => string
    placeholder?: string
    /** Selection courante affichee (mode "selection persistante", ex: client). */
    selected?: T | null
    /**
     * Si vrai, ne conserve pas d'affichage de selection apres un choix : le
     * champ se vide pour permettre d'enchainer les recherches (ex: ajout
     * successif de plusieurs produits a une facture).
     */
    clearOnSelect?: boolean
    disabled?: boolean
  }>(),
  {
    placeholder: 'Rechercher...',
    clearOnSelect: false,
    disabled: false
  }
)

const emit = defineEmits<{
  select: [item: T]
  clear: []
}>()

const query = ref('')
// `shallowRef` (plutot que `ref`) : evite le deballage conditionnel
// `UnwrapRefSimple<T>` qui perd la relation avec le type generique `T`.
const results = shallowRef<T[]>([])
const isOpen = ref(false)
const isSearching = ref(false)
const rootRef = ref<HTMLElement | null>(null)

async function runSearch(value: string): Promise<void> {
  isSearching.value = true
  try {
    results.value = await props.search(value)
  } finally {
    isSearching.value = false
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined
function onInput(): void {
  isOpen.value = true
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void runSearch(query.value), SEARCH_DEBOUNCE_MS)
}

function onFocus(): void {
  isOpen.value = true
  if (results.value.length === 0 && !isSearching.value) void runSearch(query.value)
}

function pick(item: T): void {
  emit('select', item)
  isOpen.value = false
  if (props.clearOnSelect) {
    query.value = ''
    results.value = []
  }
}

function clearSelection(): void {
  emit('clear')
  query.value = ''
  results.value = []
}

function onClickOutside(event: MouseEvent): void {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div ref="rootRef" class="relative">
    <div
      v-if="selected && !clearOnSelect"
      class="flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-sm"
    >
      <span class="text-gray-900">{{ getLabel(selected) }}</span>
      <button
        type="button"
        class="focus-ring rounded p-0.5 text-gray-400 hover:text-gray-600"
        aria-label="Effacer la selection"
        :disabled="disabled"
        @click="clearSelection"
      >
        <X class="size-4" />
      </button>
    </div>

    <div v-else class="relative">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
      />
      <input
        v-model="query"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        class="focus-ring w-full rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm text-gray-900 placeholder:text-gray-400"
        @input="onInput"
        @focus="onFocus"
      />
      <Loader2
        v-if="isSearching"
        class="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-gray-300"
      />
    </div>

    <div
      v-if="isOpen && (!selected || clearOnSelect)"
      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      <button
        v-for="item in results"
        :key="getKey(item)"
        type="button"
        class="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
        @click="pick(item)"
      >
        {{ getLabel(item) }}
      </button>
      <p v-if="!isSearching && results.length === 0" class="px-3 py-2 text-sm text-gray-400">
        Aucun resultat.
      </p>
    </div>
  </div>
</template>
