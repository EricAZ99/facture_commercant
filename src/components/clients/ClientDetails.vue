<script setup lang="ts">
import { Mail, MapPin, Phone, Receipt } from 'lucide-vue-next'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import type { Client } from '@/types'
import { formatCurrency, formatDate, getInitials } from '@/utils/formatters'

interface Props {
  client: Client
  currency?: string
}

withDefaults(defineProps<Props>(), {
  currency: 'XOF'
})

const emit = defineEmits<{
  edit: []
  delete: []
}>()
</script>

<template>
  <BaseCard>
    <template #actions>
      <BaseButton variant="outline" size="sm" @click="emit('edit')">Modifier</BaseButton>
      <BaseButton variant="danger" size="sm" @click="emit('delete')">Supprimer</BaseButton>
    </template>

    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <span
          class="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700"
        >
          {{ getInitials(`${client.firstName} ${client.lastName}`) }}
        </span>
        <div>
          <h2 class="text-lg font-semibold text-gray-900">
            {{ client.firstName }} {{ client.lastName }}
          </h2>
          <p class="text-sm text-gray-500">Client depuis le {{ formatDate(client.createdAt) }}</p>
          <div v-if="client.tags?.length" class="mt-1.5 flex flex-wrap gap-1">
            <BaseBadge v-for="tag in client.tags" :key="tag" variant="info">{{ tag }}</BaseBadge>
          </div>
        </div>
      </div>

      <div v-if="client.outstandingBalance !== undefined" class="text-right">
        <p class="text-xs text-gray-500">Solde du</p>
        <p
          class="text-lg font-semibold"
          :class="client.outstandingBalance > 0 ? 'text-red-600' : 'text-gray-900'"
        >
          {{ formatCurrency(client.outstandingBalance, currency) }}
        </p>
      </div>
    </div>

    <dl class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="flex items-start gap-2">
        <Mail class="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <dt class="text-xs text-gray-500">Email</dt>
          <dd class="text-sm text-gray-900">{{ client.email || '-' }}</dd>
        </div>
      </div>
      <div class="flex items-start gap-2">
        <Phone class="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <dt class="text-xs text-gray-500">Telephone</dt>
          <dd class="text-sm text-gray-900">{{ client.phone || '-' }}</dd>
        </div>
      </div>
      <div class="flex items-start gap-2 sm:col-span-2">
        <MapPin class="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <dt class="text-xs text-gray-500">Adresse</dt>
          <dd class="text-sm text-gray-900">
            {{ [client.address, client.city, client.country].filter(Boolean).join(', ') || '-' }}
          </dd>
        </div>
      </div>
      <div class="flex items-start gap-2">
        <Receipt class="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <dt class="text-xs text-gray-500">Identifiant fiscal</dt>
          <dd class="text-sm text-gray-900">{{ client.taxId || '-' }}</dd>
        </div>
      </div>
    </dl>

    <div v-if="client.notes" class="mt-4 border-t border-gray-100 pt-4">
      <p class="text-xs text-gray-500">Notes</p>
      <p class="mt-1 whitespace-pre-line text-sm text-gray-700">{{ client.notes }}</p>
    </div>
  </BaseCard>
</template>
