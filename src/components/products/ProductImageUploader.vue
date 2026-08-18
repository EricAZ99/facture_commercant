<script setup lang="ts">
import { ImageUp, Loader2, Package } from 'lucide-vue-next'
import { ref, useId } from 'vue'

import { PRODUCT_IMAGE_ACCEPTED_TYPES, PRODUCT_IMAGE_MAX_SIZE_BYTES } from '@/constants'

interface Props {
  imageUrl?: string
  uploading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  imageUrl: undefined,
  uploading: false
})

const emit = defineEmits<{
  upload: [file: File]
}>()

const inputId = useId()
const inputRef = ref<HTMLInputElement | null>(null)
const localError = ref<string | undefined>(undefined)

function openPicker(): void {
  inputRef.value?.click()
}

function onFileSelected(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  ;(event.target as HTMLInputElement).value = ''
  if (!file) return

  localError.value = undefined

  if (!PRODUCT_IMAGE_ACCEPTED_TYPES.includes(file.type)) {
    localError.value = 'Format non supporte. Utilisez un fichier PNG, JPEG ou WEBP.'
    return
  }
  if (file.size > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
    localError.value = `Le fichier depasse la taille maximale autorisee (${Math.round(PRODUCT_IMAGE_MAX_SIZE_BYTES / (1024 * 1024))} Mo).`
    return
  }

  emit('upload', file)
}
</script>

<template>
  <div class="flex items-center gap-4">
    <div
      class="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
    >
      <img v-if="props.imageUrl" :src="props.imageUrl" alt="" class="size-full object-cover" />
      <Package v-else class="size-8 text-gray-300" aria-hidden="true" />

      <div
        v-if="props.uploading"
        class="absolute inset-0 flex items-center justify-center bg-white/70"
      >
        <Loader2 class="size-5 animate-spin text-primary-600" aria-hidden="true" />
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <label
        :for="inputId"
        class="focus-ring inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        :class="{ 'pointer-events-none opacity-60': props.uploading }"
        @click.prevent="openPicker"
      >
        <ImageUp class="size-4" aria-hidden="true" />
        {{ props.imageUrl ? 'Changer la photo' : 'Ajouter une photo' }}
      </label>
      <input
        :id="inputId"
        ref="inputRef"
        type="file"
        class="hidden"
        :accept="PRODUCT_IMAGE_ACCEPTED_TYPES.join(',')"
        :disabled="props.uploading"
        @change="onFileSelected"
      />
      <p class="text-sm text-gray-500">PNG, JPEG ou WEBP, 2 Mo maximum.</p>
      <p v-if="localError" class="text-sm text-red-600">{{ localError }}</p>
    </div>
  </div>
</template>
