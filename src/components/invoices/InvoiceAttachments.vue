<script setup lang="ts">
import { Download, Paperclip, Trash2, Upload } from 'lucide-vue-next'
import { ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import type { InvoiceAttachment } from '@/types'
import { formatDateTime, formatFileSize } from '@/utils/formatters'

interface Props {
  attachments: InvoiceAttachment[]
  isUploading?: boolean
  removingId?: string | null
}

withDefaults(defineProps<Props>(), { isUploading: false, removingId: null })

const emit = defineEmits<{
  upload: [file: File]
  remove: [attachment: InvoiceAttachment]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function onFileChange(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) emit('upload', file)
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div>
    <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
    <BaseButton
      variant="outline"
      size="sm"
      :loading="isUploading"
      class="mb-4"
      @click="fileInput?.click()"
    >
      <Upload v-if="!isUploading" class="size-4" aria-hidden="true" />
      {{ $t('invoices.detail.attachments.add') }}
    </BaseButton>

    <EmptyState
      v-if="attachments.length === 0"
      :icon="Paperclip"
      :title="$t('invoices.detail.attachments.emptyTitle')"
      :message="$t('invoices.detail.attachments.emptyMessage')"
    />
    <ul v-else class="flex flex-col divide-y divide-gray-100">
      <li
        v-for="attachment in attachments"
        :key="attachment.id"
        class="flex items-center justify-between gap-3 py-2"
      >
        <div class="flex min-w-0 items-center gap-2">
          <Paperclip class="size-4 shrink-0 text-gray-400" aria-hidden="true" />
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-900">{{ attachment.filename }}</p>
            <p class="text-xs text-gray-400">
              {{ formatFileSize(attachment.sizeBytes) }} ·
              {{ formatDateTime(attachment.createdAt) }}
            </p>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <a
            :href="attachment.url"
            target="_blank"
            rel="noopener noreferrer"
            class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            :aria-label="$t('invoices.list.download')"
          >
            <Download class="size-4" />
          </a>
          <button
            type="button"
            class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
            :aria-label="$t('common.delete')"
            :disabled="removingId === attachment.id"
            @click="emit('remove', attachment)"
          >
            <Trash2 class="size-4" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
