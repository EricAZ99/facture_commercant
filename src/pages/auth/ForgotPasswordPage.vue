<script setup lang="ts">
import { reactive, ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { ROUTE_NAMES } from '@/constants'
import { useAuth } from '@/composables'
import { isRequired, isValidEmail } from '@/utils/validators'

const { authStore, requestPasswordReset } = useAuth()

const form = reactive({ email: '' })
const errors = reactive<{ email?: string }>({})
const isSuccess = ref(false)

function validate(): boolean {
  errors.email = !isRequired(form.email)
    ? "L'email est requis."
    : !isValidEmail(form.email)
      ? "Format d'email invalide."
      : undefined
  return !errors.email
}

async function onSubmit(): Promise<void> {
  if (!validate()) return
  isSuccess.value = await requestPasswordReset(form)
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-lg font-semibold text-gray-900">Mot de passe oublie</h1>
    <p class="mb-6 text-sm text-gray-500">
      Renseignez votre email pour recevoir un lien de reinitialisation.
    </p>

    <div v-if="isSuccess" class="rounded-lg bg-green-50 p-4 text-sm text-green-700">
      Si un compte existe pour cet email, un lien de reinitialisation vient de lui etre envoye.
    </div>

    <form v-else class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.email"
        type="email"
        label="Email"
        placeholder="vous@commerce.com"
        :error="errors.email"
        required
      />
      <BaseButton type="submit" :loading="authStore.loading" class="w-full">
        Envoyer le lien
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      <RouterLink
        :to="{ name: ROUTE_NAMES.login }"
        class="font-medium text-primary-600 hover:underline"
      >
        Retour a la connexion
      </RouterLink>
    </p>
  </div>
</template>
