<script setup lang="ts">
import { Pencil, Target } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  revenueThisMonth: number
  /** `null`/`undefined` = aucun objectif defini. */
  target?: number | null
  currency: string
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  target: null,
  submitting: false
})

const emit = defineEmits<{
  /** `null` pour retirer l'objectif. */
  submit: [target: number | null]
}>()

const isEditing = ref(false)
const inputValue = ref('')

const progressPercent = computed(() => {
  if (!props.target || props.target <= 0) return 0
  return Math.min(100, Math.round((props.revenueThisMonth / props.target) * 100))
})

const isReached = computed(
  () => Boolean(props.target) && props.revenueThisMonth >= (props.target ?? 0)
)

function openEditor(): void {
  inputValue.value = props.target ? String(props.target) : ''
  isEditing.value = true
}

function cancelEdit(): void {
  isEditing.value = false
}

function onSubmit(): void {
  const parsed = inputValue.value.trim() === '' ? null : Number(inputValue.value)
  if (parsed !== null && (!Number.isFinite(parsed) || parsed <= 0)) return
  emit('submit', parsed)
  isEditing.value = false
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <form v-if="isEditing" class="flex items-end gap-2" @submit.prevent="onSubmit">
      <div class="flex flex-1 flex-col gap-1">
        <label class="text-xs font-medium text-gray-600" for="sales-target-input">
          Objectif mensuel ({{ currency }})
        </label>
        <input
          id="sales-target-input"
          v-model="inputValue"
          type="number"
          min="0"
          placeholder="Ex : 500000"
          class="focus-ring rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
        />
      </div>
      <BaseButton type="submit" size="sm" :loading="submitting">Enregistrer</BaseButton>
      <BaseButton
        type="button"
        variant="outline"
        size="sm"
        :disabled="submitting"
        @click="cancelEdit"
      >
        Annuler
      </BaseButton>
    </form>

    <template v-else-if="target">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-600">
          <span class="font-semibold text-gray-900">{{
            formatCurrency(revenueThisMonth, currency)
          }}</span>
          sur {{ formatCurrency(target, currency) }} ce mois-ci
        </p>
        <button
          type="button"
          class="focus-ring rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Modifier l'objectif"
          @click="openEditor"
        >
          <Pencil class="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <div class="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          class="h-full rounded-full transition-all"
          :class="isReached ? 'bg-green-500' : 'bg-primary-500'"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <p class="text-xs text-gray-500">
        {{ isReached ? 'Objectif atteint !' : `${progressPercent}% de l'objectif` }}
      </p>
    </template>

    <div v-else class="flex flex-col items-center gap-2 py-4 text-center">
      <Target class="size-6 text-gray-300" aria-hidden="true" />
      <p class="text-sm text-gray-500">Aucun objectif defini pour ce mois.</p>
      <BaseButton variant="outline" size="sm" @click="openEditor">Definir un objectif</BaseButton>
    </div>
  </div>
</template>
