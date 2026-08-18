<script setup lang="ts">
import { ImageUp, Loader2 } from 'lucide-vue-next'
import { ref, useId } from 'vue'

import { LOGO_ACCEPTED_TYPES, LOGO_MAX_SIZE_BYTES } from '@/constants'

interface Props {
  logoUrl?: string
  businessName?: string
  uploading?: boolean
  /** Nom de l'image geree (utilise dans les libelles/textes alternatifs) : "logo" ou "tampon". */
  itemLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  logoUrl: undefined,
  businessName: '',
  uploading: false,
  itemLabel: 'logo'
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

  if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
    localError.value = 'Format non supporte. Utilisez un fichier PNG, JPEG, WEBP ou SVG.'
    return
  }
  if (file.size > LOGO_MAX_SIZE_BYTES) {
    localError.value = `Le fichier depasse la taille maximale autorisee (${Math.round(LOGO_MAX_SIZE_BYTES / (1024 * 1024))} Mo).`
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
      <img
        v-if="props.logoUrl"
        :src="props.logoUrl"
        :alt="`${itemLabel === 'logo' ? 'Logo' : 'Tampon'} de ${props.businessName || 'votre commerce'}`"
        class="size-full object-contain"
      />
      <span v-else class="text-lg font-semibold text-gray-400">
        {{ props.businessName ? props.businessName.charAt(0).toUpperCase() : '?' }}
      </span>

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
        {{ props.logoUrl ? `Changer le ${itemLabel}` : `Ajouter un ${itemLabel}` }}
      </label>
      <input
        :id="inputId"
        ref="inputRef"
        type="file"
        class="hidden"
        :accept="LOGO_ACCEPTED_TYPES.join(',')"
        :disabled="props.uploading"
        @change="onFileSelected"
      />
      <p class="text-sm text-gray-500">PNG, JPEG, WEBP ou SVG, 2 Mo maximum.</p>
      <p v-if="localError" class="text-sm text-red-600">{{ localError }}</p>
    </div>
  </div>
</template>
