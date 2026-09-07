<script setup lang="ts">
import { Eye, Pencil, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

import BaseBadge from '@/components/base/BaseBadge.vue'
import type { Client, ID } from '@/types'
import { getInitials } from '@/utils/formatters'

interface Props {
  clients: Client[]
  selection?: ID[]
}

const props = withDefaults(defineProps<Props>(), { selection: () => [] })

const emit = defineEmits<{
  view: [client: Client]
  edit: [client: Client]
  delete: [client: Client]
  'update:selection': [ids: ID[]]
}>()

const allSelected = computed(
  () => props.clients.length > 0 && props.clients.every((c) => props.selection.includes(c.id))
)

function toggleAll(): void {
  emit('update:selection', allSelected.value ? [] : props.clients.map((c) => c.id))
}

function toggleOne(id: ID): void {
  emit(
    'update:selection',
    props.selection.includes(id)
      ? props.selection.filter((s) => s !== id)
      : [...props.selection, id]
  )
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-2 font-medium">
            <input
              type="checkbox"
              :checked="allSelected"
              class="focus-ring size-4 cursor-pointer rounded border-gray-300 text-primary-600"
              :aria-label="$t('clients.list.selectAll')"
              @change="toggleAll"
            />
          </th>
          <th class="py-2 pr-4 font-medium">{{ $t('clients.list.columnClient') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('clients.list.columnContact') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('clients.list.columnLocation') }}</th>
          <th class="py-2 pr-4 font-medium">{{ $t('clients.list.columnTaxId') }}</th>
          <th class="py-2 pl-4 text-right font-medium">{{ $t('clients.list.columnActions') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr
          v-for="client in clients"
          :key="client.id"
          :class="['hover:bg-gray-50', selection.includes(client.id) && 'bg-primary-50']"
        >
          <td class="py-3 pr-2">
            <input
              type="checkbox"
              :checked="selection.includes(client.id)"
              class="focus-ring size-4 cursor-pointer rounded border-gray-300 text-primary-600"
              :aria-label="
                $t('clients.list.selectOne', { name: `${client.firstName} ${client.lastName}` })
              "
              @change="toggleOne(client.id)"
            />
          </td>
          <td class="py-3 pr-4">
            <button
              type="button"
              class="focus-ring flex items-center gap-3 rounded-lg text-left"
              @click="emit('view', client)"
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700"
              >
                {{ getInitials(`${client.firstName} ${client.lastName}`) }}
              </span>
              <span class="font-medium text-gray-900">
                {{ client.firstName }} {{ client.lastName }}
              </span>
            </button>
          </td>
          <td class="py-3 pr-4 text-gray-600">
            <p v-if="client.email">{{ client.email }}</p>
            <p v-if="client.phone" class="text-gray-400">{{ client.phone }}</p>
            <p v-if="!client.email && !client.phone" class="text-gray-300">-</p>
          </td>
          <td class="py-3 pr-4 text-gray-600">
            <span v-if="client.city || client.country">
              {{ [client.city, client.country].filter(Boolean).join(', ') }}
            </span>
            <span v-else class="text-gray-300">-</span>
          </td>
          <td class="py-3 pr-4">
            <BaseBadge v-if="client.taxId" variant="info">{{ client.taxId }}</BaseBadge>
            <span v-else class="text-gray-300">-</span>
          </td>
          <td class="py-3 pl-4">
            <div class="flex justify-end gap-1">
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                :aria-label="$t('clients.list.view')"
                @click="emit('view', client)"
              >
                <Eye class="size-4" />
              </button>
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                :aria-label="$t('clients.list.edit')"
                @click="emit('edit', client)"
              >
                <Pencil class="size-4" />
              </button>
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                :aria-label="$t('clients.list.delete')"
                @click="emit('delete', client)"
              >
                <Trash2 class="size-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
