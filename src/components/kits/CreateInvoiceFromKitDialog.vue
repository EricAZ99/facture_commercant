<script setup lang="ts">
import { ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import SearchableSelect from '@/components/base/SearchableSelect.vue'
import { clientService } from '@/services'
import type { Client } from '@/types'

interface Props {
  submitting?: boolean
}

withDefaults(defineProps<Props>(), { submitting: false })

const emit = defineEmits<{
  submit: [clientId: string]
  cancel: []
}>()

const selectedClient = ref<Client | null>(null)

function clientLabel(c: Client): string {
  return `${c.firstName} ${c.lastName}${c.phone ? ` — ${c.phone}` : ''}`
}

async function searchClients(query: string): Promise<Client[]> {
  const response = await clientService.list({ search: query, perPage: 8 })
  return response.data
}

function onSubmit(): void {
  if (!selectedClient.value) return
  emit('submit', selectedClient.value.id)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-gray-600">
      Choisissez un client : une facture brouillon sera creee avec une ligne par produit du kit.
    </p>
    <SearchableSelect
      :search="searchClients"
      :get-label="clientLabel"
      :get-key="(c: Client) => c.id"
      :selected="selectedClient"
      placeholder="Rechercher un client par nom, email ou telephone..."
      @select="selectedClient = $event"
      @clear="selectedClient = null"
    />
    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        Annuler
      </BaseButton>
      <BaseButton type="button" :loading="submitting" :disabled="!selectedClient" @click="onSubmit">
        Creer la facture
      </BaseButton>
    </div>
  </div>
</template>
