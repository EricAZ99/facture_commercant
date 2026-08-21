<script setup lang="ts">
import QRCode from 'qrcode'
import { Check, Copy } from 'lucide-vue-next'
import { ref, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import LoadingState from '@/components/states/LoadingState.vue'

interface Props {
  open: boolean
  /** URL publique complete ; `null` tant qu'elle n'a pas encore ete generee. */
  shareUrl: string | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), { isLoading: false })

const emit = defineEmits<{
  close: []
}>()

const qrDataUrl = ref<string | null>(null)
const isCopied = ref(false)

watch(
  () => [props.open, props.shareUrl],
  async ([open, url]) => {
    qrDataUrl.value = null
    if (open && url) {
      qrDataUrl.value = await QRCode.toDataURL(String(url), { margin: 1, width: 220 })
    }
  },
  { immediate: true }
)

async function copyLink(): Promise<void> {
  if (!props.shareUrl) return
  await navigator.clipboard.writeText(props.shareUrl)
  isCopied.value = true
  setTimeout(() => (isCopied.value = false), 2000)
}
</script>

<template>
  <BaseModal :open="open" title="Lien public de la facture" @close="emit('close')">
    <div class="flex flex-col items-center gap-4">
      <p class="text-center text-sm text-gray-500">
        Ce lien permet a votre client de consulter et telecharger sa facture sans se connecter.
      </p>

      <LoadingState v-if="isLoading" message="Generation du lien..." />

      <template v-else-if="shareUrl">
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          alt="QR code du lien public de la facture"
          class="size-44 rounded-lg border border-gray-200"
        />

        <div class="flex w-full items-center gap-2">
          <input
            :value="shareUrl"
            type="text"
            readonly
            class="focus-ring w-full truncate rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />
          <BaseButton variant="outline" size="sm" @click="copyLink">
            <Check v-if="isCopied" class="size-4 text-green-600" aria-hidden="true" />
            <Copy v-else class="size-4" aria-hidden="true" />
          </BaseButton>
        </div>
      </template>

      <div class="mt-2 flex w-full justify-end">
        <BaseButton variant="outline" @click="emit('close')">Fermer</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
