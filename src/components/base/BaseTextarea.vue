<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
  rows?: number
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  rows: 3
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaId = useId()
const hasError = computed(() => Boolean(props.error))

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="textareaId" class="text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <textarea
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :aria-invalid="hasError"
      :aria-describedby="hasError ? `${textareaId}-error` : undefined"
      class="focus-ring resize-y rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
      :class="hasError ? 'border-red-400' : 'border-gray-300'"
      @input="onInput"
    />

    <p v-if="hasError" :id="`${textareaId}-error`" class="text-sm text-red-600">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-sm text-gray-500">{{ hint }}</p>
  </div>
</template>
