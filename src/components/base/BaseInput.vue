<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  modelValue: string | number | null
  label?: string
  type?: string
  placeholder?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = useId()
const hasError = computed(() => Boolean(props.error))

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="inputId" class="text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="hasError"
      :aria-describedby="hasError ? `${inputId}-error` : undefined"
      class="focus-ring rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
      :class="hasError ? 'border-red-400' : 'border-gray-300'"
      @input="onInput"
    />

    <p v-if="hasError" :id="`${inputId}-error`" class="text-sm text-red-600">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-sm text-gray-500">{{ hint }}</p>
  </div>
</template>
