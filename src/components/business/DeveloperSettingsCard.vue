<script setup lang="ts">
import { Check, Copy, KeyRound, RefreshCw } from 'lucide-vue-next'
import { reactive, ref, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { WEBHOOK_EVENT_OPTIONS } from '@/constants'
import type { Business } from '@/types'

interface Props {
  business: Business | null
  regeneratingKey?: boolean
  savingWebhook?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  regeneratingKey: false,
  savingWebhook: false
})

const emit = defineEmits<{
  regenerateKey: []
  submitWebhook: [payload: { webhookUrl?: string; webhookEvents: string[] }]
}>()

const form = reactive({ webhookUrl: '', webhookEvents: new Set<string>() })

watch(
  () => props.business,
  (business) => {
    form.webhookUrl = business?.webhookUrl ?? ''
    form.webhookEvents = new Set(business?.webhookEvents ?? [])
  },
  { immediate: true }
)

function toggleEvent(value: string): void {
  if (form.webhookEvents.has(value)) {
    form.webhookEvents.delete(value)
  } else {
    form.webhookEvents.add(value)
  }
}

function onSubmitWebhook(): void {
  emit('submitWebhook', {
    webhookUrl: form.webhookUrl.trim() || undefined,
    webhookEvents: Array.from(form.webhookEvents)
  })
}

const isCopied = ref(false)

async function copyKey(): Promise<void> {
  if (!props.business?.apiKey) return
  await navigator.clipboard.writeText(props.business.apiKey)
  isCopied.value = true
  setTimeout(() => (isCopied.value = false), 2000)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        Cle API developpeur
      </p>
      <p class="mb-3 text-sm text-gray-500">
        A consommer par une future integration cote backend de production. Aucun appel n'est realise
        avec cette cle par cette demonstration.
      </p>
      <div v-if="business?.apiKey" class="flex flex-wrap items-center gap-2">
        <code class="rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-sm text-gray-800">
          {{ business.apiKey }}
        </code>
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          @click="copyKey"
        >
          <Check v-if="isCopied" class="size-4 text-green-600" aria-hidden="true" />
          <Copy v-else class="size-4" aria-hidden="true" />
          {{ isCopied ? 'Copie !' : 'Copier' }}
        </button>
      </div>
      <p v-else class="text-sm text-gray-400">Aucune cle generee pour le moment.</p>
      <BaseButton
        variant="outline"
        size="sm"
        class="mt-3"
        :loading="regeneratingKey"
        @click="emit('regenerateKey')"
      >
        <RefreshCw v-if="!regeneratingKey" class="size-4" aria-hidden="true" />
        {{ business?.apiKey ? 'Regenerer la cle' : 'Generer une cle' }}
      </BaseButton>
    </div>

    <form
      class="flex flex-col gap-3 border-t border-gray-100 pt-4"
      @submit.prevent="onSubmitWebhook"
    >
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Webhook</p>
      <BaseInput
        v-model="form.webhookUrl"
        type="url"
        label="URL de destination"
        placeholder="https://votre-service.com/webhooks/facture-ia"
      />
      <div class="flex flex-col gap-1.5">
        <label
          v-for="option in WEBHOOK_EVENT_OPTIONS"
          :key="option.value"
          class="flex items-center gap-2 text-sm text-gray-700"
        >
          <input
            type="checkbox"
            :checked="form.webhookEvents.has(option.value)"
            class="focus-ring size-4 rounded border-gray-300"
            @change="toggleEvent(option.value)"
          />
          {{ option.label }}
        </label>
      </div>
      <div class="flex justify-end">
        <BaseButton type="submit" size="sm" variant="outline" :loading="savingWebhook">
          <KeyRound class="size-4" aria-hidden="true" />
          Enregistrer le webhook
        </BaseButton>
      </div>
    </form>
  </div>
</template>
