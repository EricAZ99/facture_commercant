<script setup lang="ts">
import { reactive } from 'vue'
import { useRoute } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { useAuth } from '@/composables'
import { minLength } from '@/utils/validators'

const route = useRoute()
const { authStore, resetPasswordAndRedirect } = useAuth()

const form = reactive({ password: '' })
const errors = reactive<{ password?: string }>({})

function validate(): boolean {
  errors.password = !minLength(form.password, 8)
    ? 'Le mot de passe doit contenir au moins 8 caracteres.'
    : undefined
  return !errors.password
}

async function onSubmit(): Promise<void> {
  if (!validate()) return

  const token = typeof route.query.token === 'string' ? route.query.token : ''
  await resetPasswordAndRedirect({ token, password: form.password })
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-lg font-semibold text-gray-900">Reinitialiser le mot de passe</h1>
    <p class="mb-6 text-sm text-gray-500">Choisissez un nouveau mot de passe pour votre compte.</p>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.password"
        type="password"
        label="Nouveau mot de passe"
        hint="8 caracteres minimum."
        :error="errors.password"
        required
      />
      <BaseButton type="submit" :loading="authStore.loading" class="w-full">
        Reinitialiser
      </BaseButton>
    </form>
  </div>
</template>
