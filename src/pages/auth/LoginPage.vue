<script setup lang="ts">
import { reactive } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { ROUTE_NAMES } from '@/constants'
import { useAuth } from '@/composables'
import { isRequired, isValidEmail } from '@/utils/validators'

const { authStore, loginAndRedirect } = useAuth()

const form = reactive({ email: '', password: '' })
const errors = reactive<{ email?: string; password?: string }>({})

function validate(): boolean {
  errors.email = !isRequired(form.email)
    ? "L'email est requis."
    : !isValidEmail(form.email)
      ? "Format d'email invalide."
      : undefined
  errors.password = !isRequired(form.password) ? 'Le mot de passe est requis.' : undefined
  return !errors.email && !errors.password
}

async function onSubmit(): Promise<void> {
  if (!validate()) return
  await loginAndRedirect(form)
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-lg font-semibold text-gray-900">Connexion</h1>
    <p class="mb-6 text-sm text-gray-500">Connectez-vous a votre espace commercant.</p>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.email"
        type="email"
        label="Email"
        placeholder="vous@commerce.com"
        :error="errors.email"
        required
      />
      <BaseInput
        v-model="form.password"
        type="password"
        label="Mot de passe"
        placeholder="••••••••"
        :error="errors.password"
        required
      />

      <div class="flex justify-end">
        <RouterLink
          :to="{ name: ROUTE_NAMES.forgotPassword }"
          class="text-sm font-medium text-primary-600 hover:underline"
        >
          Mot de passe oublie ?
        </RouterLink>
      </div>

      <BaseButton type="submit" :loading="authStore.loading" class="w-full">
        Se connecter
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      Pas encore de compte ?
      <RouterLink
        :to="{ name: ROUTE_NAMES.register }"
        class="font-medium text-primary-600 hover:underline"
      >
        Creer un compte
      </RouterLink>
    </p>
  </div>
</template>
