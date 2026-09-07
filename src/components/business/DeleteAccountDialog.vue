<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'

interface Props {
  businessName: string
  submitting?: boolean
  serverErrors?: Record<string, string[]> | null
}

const props = withDefaults(defineProps<Props>(), { submitting: false, serverErrors: null })

const emit = defineEmits<{
  confirm: [confirmName: string]
  cancel: []
}>()

const input = ref('')
const isMatching = computed(() => input.value === props.businessName)

function onSubmit(): void {
  if (!isMatching.value) return
  emit('confirm', input.value)
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <div class="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      <AlertTriangle class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        {{ $t('settingsDeleteAccountDialog.warningText') }}
      </p>
    </div>

    <BaseInput
      v-model="input"
      :label="$t('settingsDeleteAccountDialog.confirmInputLabel', { name: businessName })"
      :error="serverErrors?.confirmName?.[0]"
      autocomplete="off"
    />

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" variant="danger" :disabled="!isMatching" :loading="submitting">
        {{ $t('settingsDeleteAccountDialog.confirmDeleteForever') }}
      </BaseButton>
    </div>
  </form>
</template>
