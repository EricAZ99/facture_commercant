<script setup lang="ts">
import { RotateCcw, Search } from 'lucide-vue-next'

import SearchableSelect from '@/components/base/SearchableSelect.vue'
import { QUOTE_STATUS_LABELS } from '@/constants'
import { clientService } from '@/services'
import type { Client, QuoteStatus } from '@/types'

interface Props {
  search: string
  status: QuoteStatus | ''
  selectedClient: Client | null
}

defineProps<Props>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:status': [value: QuoteStatus | '']
  selectClient: [client: Client]
  clearClient: []
  reset: []
}>()

function clientLabel(c: Client): string {
  return `${c.firstName} ${c.lastName}`
}

async function searchClients(query: string): Promise<Client[]> {
  const response = await clientService.list({ search: query, perPage: 8 })
  return response.data
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="relative">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
      />
      <input
        :value="search"
        type="search"
        placeholder="Rechercher par numero ou client..."
        class="focus-ring w-full max-w-sm rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <select
        :value="status"
        aria-label="Filtrer par statut"
        class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
        @change="
          emit('update:status', ($event.target as HTMLSelectElement).value as QuoteStatus | '')
        "
      >
        <option value="">Tous les statuts</option>
        <option v-for="(label, value) in QUOTE_STATUS_LABELS" :key="value" :value="value">
          {{ label }}
        </option>
      </select>

      <div class="col-span-1">
        <SearchableSelect
          :search="searchClients"
          :get-label="clientLabel"
          :get-key="(c: Client) => c.id"
          :selected="selectedClient"
          placeholder="Client..."
          @select="(c: Client) => emit('selectClient', c)"
          @clear="emit('clearClient')"
        />
      </div>

      <button
        type="button"
        class="focus-ring flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
        @click="emit('reset')"
      >
        <RotateCcw class="size-4" />
        Reinitialiser
      </button>
    </div>
  </div>
</template>
