<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { ROUTE_NAMES } from '@/constants'
import { useAdminSupportTicket } from '@/composables'
import type { ID } from '@/types'
import { formatDateTime } from '@/utils/formatters'

interface Props {
  id: ID
}

const props = defineProps<Props>()

const { ticket, isLoading, isReplying, isUpdatingStatus, load, reply, setStatus } =
  useAdminSupportTicket(props.id)

onMounted(() => load())

const message = ref('')

async function onReply(): Promise<void> {
  if (!message.value.trim()) return
  const success = await reply(message.value.trim())
  if (success) message.value = ''
}

async function onToggleStatus(): Promise<void> {
  if (!ticket.value) return
  await setStatus(ticket.value.status === 'open' ? 'closed' : 'open')
}
</script>

<template>
  <div>
    <RouterLink
      :to="{ name: ROUTE_NAMES.adminSupport }"
      class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Retour au support
    </RouterLink>

    <LoadingState v-if="isLoading && !ticket" message="Chargement du ticket..." />

    <div v-else-if="ticket" class="flex flex-col gap-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-gray-900">{{ ticket.subject }}</h1>
            <BaseBadge :variant="ticket.status === 'open' ? 'warning' : 'default'">
              {{ ticket.status === 'open' ? 'Ouvert' : 'Ferme' }}
            </BaseBadge>
          </div>
          <p class="mt-1 text-sm text-gray-500">{{ ticket.businessName }}</p>
        </div>
        <BaseButton variant="outline" :loading="isUpdatingStatus" @click="onToggleStatus">
          {{ ticket.status === 'open' ? 'Fermer le ticket' : 'Rouvrir le ticket' }}
        </BaseButton>
      </div>

      <BaseCard title="Conversation">
        <ul class="flex flex-col gap-4">
          <li
            v-for="msg in ticket.messages"
            :key="msg.id"
            class="rounded-lg p-3"
            :class="msg.author === 'admin' ? 'bg-primary-50' : 'bg-gray-50'"
          >
            <div class="mb-1 flex items-center justify-between gap-2 text-xs text-gray-500">
              <span class="font-medium text-gray-700">{{ msg.authorName }}</span>
              <span>{{ formatDateTime(msg.createdAt) }}</span>
            </div>
            <p class="text-sm text-gray-800">{{ msg.body }}</p>
          </li>
        </ul>

        <form
          class="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4"
          @submit.prevent="onReply"
        >
          <BaseTextarea v-model="message" label="Repondre" :rows="3" />
          <div class="flex justify-end">
            <BaseButton type="submit" :loading="isReplying" :disabled="!message.trim()">
              Envoyer
            </BaseButton>
          </div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
