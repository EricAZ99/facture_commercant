<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { ROUTE_NAMES } from '@/constants'
import { useSupportTicket } from '@/composables'
import type { ID } from '@/types'
import { formatDateTime } from '@/utils/formatters'

interface Props {
  id: ID
}

const props = defineProps<Props>()

const { ticket, isLoading, isReplying, load, reply } = useSupportTicket(props.id)

onMounted(() => load())

const message = ref('')

async function onReply(): Promise<void> {
  if (!message.value.trim()) return
  const success = await reply(message.value.trim())
  if (success) message.value = ''
}
</script>

<template>
  <div>
    <RouterLink
      :to="{ name: ROUTE_NAMES.support }"
      class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Retour au support
    </RouterLink>

    <LoadingState v-if="isLoading && !ticket" message="Chargement du ticket..." />

    <div v-else-if="ticket" class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-semibold text-gray-900">{{ ticket.subject }}</h1>
        <BaseBadge :variant="ticket.status === 'open' ? 'warning' : 'default'">
          {{ ticket.status === 'open' ? 'Ouvert' : 'Ferme' }}
        </BaseBadge>
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
              <span class="font-medium text-gray-700">
                {{ msg.author === 'admin' ? 'Support Facture IA' : msg.authorName }}
              </span>
              <span>{{ formatDateTime(msg.createdAt) }}</span>
            </div>
            <p class="text-sm text-gray-800">{{ msg.body }}</p>
          </li>
        </ul>

        <form
          v-if="ticket.status === 'open'"
          class="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4"
          @submit.prevent="onReply"
        >
          <BaseTextarea v-model="message" label="Votre reponse" :rows="3" />
          <div class="flex justify-end">
            <BaseButton type="submit" :loading="isReplying" :disabled="!message.trim()">
              Envoyer
            </BaseButton>
          </div>
        </form>
        <p v-else class="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-400">
          Ce ticket est ferme.
        </p>
      </BaseCard>
    </div>
  </div>
</template>
