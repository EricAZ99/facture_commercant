<script setup lang="ts">
import { AlertTriangle, Check, Copy } from 'lucide-vue-next'
import { ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import type { InvitedUser } from '@/types'

interface Props {
  user: InvitedUser
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const copiedField = ref<'email' | 'password' | null>(null)

async function copy(field: 'email' | 'password'): Promise<void> {
  const value = field === 'email' ? props.user.email : props.user.temporaryPassword
  await navigator.clipboard.writeText(value)
  copiedField.value = field
  setTimeout(() => {
    if (copiedField.value === field) copiedField.value = null
  }, 2000)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
    >
      <AlertTriangle class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        {{ $t('users.credentials.warningBefore') }}
        <strong>{{ user.firstName }} {{ user.lastName }}</strong>
        {{ $t('users.credentials.warningAfter') }}
      </p>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-gray-700">{{
        $t('users.credentials.emailLabel')
      }}</label>
      <div class="flex items-center gap-2">
        <input
          :value="user.email"
          type="text"
          readonly
          class="focus-ring w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
        />
        <BaseButton variant="outline" size="sm" @click="copy('email')">
          <Check v-if="copiedField === 'email'" class="size-4 text-green-600" aria-hidden="true" />
          <Copy v-else class="size-4" aria-hidden="true" />
        </BaseButton>
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-gray-700">{{
        $t('users.credentials.passwordLabel')
      }}</label>
      <div class="flex items-center gap-2">
        <input
          :value="user.temporaryPassword"
          type="text"
          readonly
          class="focus-ring w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900"
        />
        <BaseButton variant="outline" size="sm" @click="copy('password')">
          <Check
            v-if="copiedField === 'password'"
            class="size-4 text-green-600"
            aria-hidden="true"
          />
          <Copy v-else class="size-4" aria-hidden="true" />
        </BaseButton>
      </div>
      <p class="text-sm text-gray-500">
        {{ $t('users.credentials.passwordHint', { name: user.firstName }) }}
      </p>
    </div>

    <div class="mt-2 flex justify-end">
      <BaseButton @click="emit('close')">{{ $t('users.credentials.done') }}</BaseButton>
    </div>
  </div>
</template>
