<script setup lang="ts">
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirmer',
  cancelLabel: 'Annuler',
  variant: 'danger',
  loading: false
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <BaseModal :open="open" :title="title" @close="emit('cancel')">
    <p class="text-sm text-gray-600">{{ message }}</p>

    <template #footer>
      <BaseButton variant="outline" :disabled="loading" @click="emit('cancel')">
        {{ cancelLabel }}
      </BaseButton>
      <BaseButton
        :variant="variant === 'danger' ? 'danger' : 'primary'"
        :loading="loading"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
