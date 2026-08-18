<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import SearchableSelect from '@/components/base/SearchableSelect.vue'
import { clientService } from '@/services'
import type { Client } from '@/types'

interface Props {
  open: boolean
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false
})

const emit = defineEmits<{
  merge: [primary: Client, duplicate: Client]
  close: []
}>()

const primary = ref<Client | null>(null)
const duplicate = ref<Client | null>(null)

watch(
  () => props.open,
  (open) => {
    if (!open) {
      primary.value = null
      duplicate.value = null
    }
  }
)

function clientLabel(c: Client): string {
  return `${c.firstName} ${c.lastName}${c.email ? ` — ${c.email}` : ''}`
}

async function searchClients(query: string): Promise<Client[]> {
  const response = await clientService.list({ search: query, perPage: 8 })
  return response.data
}

const isSameClient = computed(
  () =>
    primary.value !== null && duplicate.value !== null && primary.value.id === duplicate.value.id
)
const canConfirm = computed(
  () => primary.value !== null && duplicate.value !== null && !isSameClient.value
)

function onConfirm(): void {
  if (!primary.value || !duplicate.value || isSameClient.value) return
  emit('merge', primary.value, duplicate.value)
}
</script>

<template>
  <BaseModal :open="open" title="Fusionner deux fiches en doublon" @close="emit('close')">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-gray-500">
        Toutes les factures du doublon seront rattachees a la fiche conservee, puis le doublon sera
        supprime. Cette action est irreversible.
      </p>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700">Fiche a conserver</label>
        <SearchableSelect
          :search="searchClients"
          :get-label="clientLabel"
          :get-key="(c: Client) => c.id"
          :selected="primary"
          placeholder="Rechercher le client a conserver..."
          @select="(c: Client) => (primary = c)"
          @clear="primary = null"
        />
      </div>

      <div class="flex justify-center text-gray-400">
        <ArrowRight class="size-5 rotate-90" aria-hidden="true" />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700">Doublon a fusionner et supprimer</label>
        <SearchableSelect
          :search="searchClients"
          :get-label="clientLabel"
          :get-key="(c: Client) => c.id"
          :selected="duplicate"
          placeholder="Rechercher le doublon..."
          @select="(c: Client) => (duplicate = c)"
          @clear="duplicate = null"
        />
        <p v-if="isSameClient" class="text-sm text-red-600">Choisissez deux fiches differentes.</p>
      </div>

      <div class="mt-2 flex justify-end gap-2">
        <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('close')">
          Annuler
        </BaseButton>
        <BaseButton
          type="button"
          variant="danger"
          :loading="submitting"
          :disabled="!canConfirm"
          @click="onConfirm"
        >
          Fusionner
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
