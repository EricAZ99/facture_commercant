<script setup lang="ts">
import { LifeBuoy, Plus } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { useSupport } from '@/composables'
import { ROUTE_NAMES } from '@/constants'
import { formatDateTime } from '@/utils/formatters'

const { items, isLoading, isSubmitting, load, createTicket } = useSupport()
const router = useRouter()

onMounted(() => load())

const isFormOpen = ref(false)
const form = reactive({ subject: '', message: '' })

function openForm(): void {
  form.subject = ''
  form.message = ''
  isFormOpen.value = true
}

async function onSubmit(): Promise<void> {
  if (!form.subject.trim() || !form.message.trim()) return
  const ticket = await createTicket({ subject: form.subject.trim(), message: form.message.trim() })
  if (ticket) {
    isFormOpen.value = false
    await router.push({ name: ROUTE_NAMES.supportDetail, params: { id: ticket.id } })
  }
}
</script>

<template>
  <div>
    <PageHeader title="Support" subtitle="Contactez l'assistance Facture IA.">
      <template #actions>
        <BaseButton @click="openForm">
          <Plus class="size-4" aria-hidden="true" />
          Nouvelle demande
        </BaseButton>
      </template>
    </PageHeader>

    <BaseCard>
      <LoadingState v-if="isLoading && items.length === 0" message="Chargement..." />
      <EmptyState
        v-else-if="items.length === 0"
        :icon="LifeBuoy"
        title="Aucune demande de support"
        message="Contactez-nous en cas de question ou de probleme technique."
      >
        <template #action>
          <BaseButton size="sm" @click="openForm">Nouvelle demande</BaseButton>
        </template>
      </EmptyState>

      <ul v-else class="flex flex-col divide-y divide-gray-100">
        <li v-for="ticket in items" :key="ticket.id" class="py-3">
          <RouterLink
            :to="{ name: ROUTE_NAMES.supportDetail, params: { id: ticket.id } }"
            class="flex items-center justify-between gap-4"
          >
            <div>
              <p class="text-sm font-medium text-gray-900">{{ ticket.subject }}</p>
              <p class="text-xs text-gray-400">{{ formatDateTime(ticket.updatedAt) }}</p>
            </div>
            <BaseBadge :variant="ticket.status === 'open' ? 'warning' : 'default'">
              {{ ticket.status === 'open' ? 'Ouvert' : 'Ferme' }}
            </BaseBadge>
          </RouterLink>
        </li>
      </ul>
    </BaseCard>

    <BaseModal :open="isFormOpen" title="Nouvelle demande de support" @close="isFormOpen = false">
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <BaseInput v-model="form.subject" label="Sujet" required />
        <BaseTextarea v-model="form.message" label="Votre message" :rows="4" required />
        <div class="mt-2 flex justify-end gap-2">
          <BaseButton type="button" variant="outline" @click="isFormOpen = false"
            >Annuler</BaseButton
          >
          <BaseButton type="submit" :loading="isSubmitting">Envoyer</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
