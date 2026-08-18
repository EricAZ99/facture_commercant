<script setup lang="ts">
import { Upload } from 'lucide-vue-next'
import { ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import { parseClientsCsv } from '@/utils/clientCsv'

interface Props {
  open: boolean
  submitting?: boolean
}

withDefaults(defineProps<Props>(), {
  submitting: false
})

const emit = defineEmits<{
  import: [fileText: string]
  close: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const previewCount = ref<number | null>(null)
const previewErrors = ref<string[]>([])
const fileText = ref('')

function onFileChange(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result ?? '')
    fileText.value = text
    const { clients, errors } = parseClientsCsv(text)
    previewCount.value = clients.length
    previewErrors.value = errors.map((e) => `Ligne ${e.row} : ${e.message}`)
  }
  reader.readAsText(file)
}

function reset(): void {
  fileName.value = ''
  fileText.value = ''
  previewCount.value = null
  previewErrors.value = []
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function onClose(): void {
  reset()
  emit('close')
}

function onConfirm(): void {
  if (!fileText.value) return
  emit('import', fileText.value)
}

/** Expose a l'appelant pour reinitialiser l'etat apres un import reussi. */
defineExpose({ reset })
</script>

<template>
  <BaseModal :open="open" title="Importer des clients (CSV)" @close="onClose">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-gray-500">
        Colonnes attendues : Prenom, Nom, Telephone, Email, Adresse, Ville, Pays, Identifiant
        fiscal, Notes, Etiquettes. Une ligne d'entete est optionnelle.
      </p>

      <div>
        <input
          ref="fileInputRef"
          type="file"
          accept=".csv,text/csv"
          class="focus-ring block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
          @change="onFileChange"
        />
      </div>

      <div v-if="previewCount !== null" class="rounded-lg bg-gray-50 p-3 text-sm">
        <p class="font-medium text-gray-900">
          {{ previewCount }} ligne(s) prete(s) a etre importee(s) depuis "{{ fileName }}".
        </p>
        <ul v-if="previewErrors.length > 0" class="mt-2 flex flex-col gap-0.5 text-red-600">
          <li v-for="(error, index) in previewErrors" :key="index">{{ error }}</li>
        </ul>
      </div>

      <div class="mt-2 flex justify-end gap-2">
        <BaseButton type="button" variant="outline" :disabled="submitting" @click="onClose">
          Annuler
        </BaseButton>
        <BaseButton
          type="button"
          :loading="submitting"
          :disabled="!previewCount"
          @click="onConfirm"
        >
          <Upload class="size-4" aria-hidden="true" />
          Importer {{ previewCount ? `(${previewCount})` : '' }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
