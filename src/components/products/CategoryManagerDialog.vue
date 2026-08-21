<script setup lang="ts">
import { Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import { useProductCategories } from '@/composables'
import type { ID } from '@/types'
import { buildCategoryOptions } from '@/utils/categoryTree'

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const { store, ensureLoaded, submitCreate, submitUpdate, removeCategory } = useProductCategories()

watch(
  () => props.open,
  (open) => {
    if (open) void ensureLoaded()
  },
  { immediate: true }
)

const options = computed(() => buildCategoryOptions(store.items))

// --- Creation / renommage --------------------------------------------------

interface CategoryFormState {
  name: string
  parentId: ID | ''
}

function emptyForm(): CategoryFormState {
  return { name: '', parentId: '' }
}

const editingId = ref<ID | null>(null)
const form = reactive<CategoryFormState>(emptyForm())
const isSubmitting = ref(false)
const formError = ref<string | null>(null)

function startCreate(): void {
  editingId.value = null
  Object.assign(form, emptyForm())
  formError.value = null
}

function startEdit(id: ID): void {
  const category = store.items.find((c) => c.id === id)
  if (!category) return
  editingId.value = id
  form.name = category.name
  form.parentId = category.parentId ?? ''
  formError.value = null
}

async function onFormSubmit(): Promise<void> {
  if (!form.name.trim()) {
    formError.value = 'Le nom est requis.'
    return
  }
  formError.value = null
  isSubmitting.value = true
  try {
    const payload = { name: form.name.trim(), parentId: form.parentId || undefined }
    const error = editingId.value
      ? await submitUpdate(editingId.value, payload)
      : await submitCreate(payload)
    if (error) {
      formError.value = Object.values(error.details ?? {})[0]?.[0] ?? error.message
      return
    }
    startCreate()
  } finally {
    isSubmitting.value = false
  }
}

// --- Suppression ------------------------------------------------------

const deletingId = ref<ID | null>(null)

async function onDelete(id: ID): Promise<void> {
  deletingId.value = id
  const success = await removeCategory(id)
  deletingId.value = null
  if (success && editingId.value === id) startCreate()
}
</script>

<template>
  <BaseModal :open="open" title="Gerer les categories" @close="emit('close')">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-gray-500">
        Organisez vos categories en arborescence (ex : "Vetements" puis "Hauts" en sous-categorie).
      </p>

      <ul
        v-if="options.length > 0"
        class="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200"
      >
        <li
          v-for="option in options"
          :key="option.id"
          class="flex items-center justify-between gap-2 px-3 py-2 text-sm"
        >
          <span class="text-gray-900" :style="{ paddingLeft: `${option.depth * 16}px` }">
            {{ option.label }}
          </span>
          <div class="flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Renommer/deplacer"
              @click="startEdit(option.id)"
            >
              <Pencil class="size-4" />
            </button>
            <button
              type="button"
              class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Supprimer"
              :disabled="deletingId === option.id"
              @click="onDelete(option.id)"
            >
              <Trash2 class="size-4" />
            </button>
          </div>
        </li>
      </ul>
      <p v-else-if="!store.isLoading" class="text-sm text-gray-400">
        Aucune categorie pour l'instant.
      </p>

      <form
        class="flex flex-col gap-3 rounded-lg border border-gray-200 p-3"
        @submit.prevent="onFormSubmit"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-700">
            {{ editingId ? 'Modifier la categorie' : 'Nouvelle categorie' }}
          </p>
          <button
            v-if="editingId"
            type="button"
            class="focus-ring rounded p-0.5 text-gray-400 hover:text-gray-600"
            aria-label="Annuler la modification"
            @click="startCreate"
          >
            <X class="size-4" />
          </button>
        </div>
        <BaseInput v-model="form.name" label="Nom" placeholder="Ex : T-shirts" required />
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700" for="category-parent">
            Categorie parente
          </label>
          <select
            id="category-parent"
            v-model="form.parentId"
            class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            <option value="">Aucune (categorie racine)</option>
            <option
              v-for="option in options.filter((o) => o.id !== editingId)"
              :key="option.id"
              :value="option.id"
            >
              {{ '—'.repeat(option.depth) }} {{ option.label }}
            </option>
          </select>
        </div>
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end">
          <BaseButton type="submit" size="sm" :loading="isSubmitting">
            <Plus v-if="!editingId" class="size-4" aria-hidden="true" />
            {{ editingId ? 'Enregistrer' : 'Creer' }}
          </BaseButton>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
