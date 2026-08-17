<script setup lang="ts">
import { reactive } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { BUSINESS_TYPE_OPTIONS, ROUTE_NAMES } from '@/constants'
import { useAuth } from '@/composables'
import type { RegisterPayload } from '@/types'
import { isRequired, isValidEmail, minLength } from '@/utils/validators'

const { authStore, registerAndRedirect } = useAuth()

const form = reactive<RegisterPayload>({
  businessName: '',
  businessType: 'pme',
  firstName: '',
  lastName: '',
  email: '',
  password: ''
})

const errors = reactive<Partial<Record<keyof typeof form, string>>>({})

function validate(): boolean {
  errors.businessName = !isRequired(form.businessName)
    ? 'Le nom du commerce est requis.'
    : undefined
  errors.firstName = !isRequired(form.firstName) ? 'Le prenom est requis.' : undefined
  errors.lastName = !isRequired(form.lastName) ? 'Le nom est requis.' : undefined
  errors.email = !isRequired(form.email)
    ? "L'email est requis."
    : !isValidEmail(form.email)
      ? "Format d'email invalide."
      : undefined
  errors.password = !minLength(form.password, 8)
    ? 'Le mot de passe doit contenir au moins 8 caracteres.'
    : undefined

  return Object.values(errors).every((message) => !message)
}

async function onSubmit(): Promise<void> {
  if (!validate()) return
  await registerAndRedirect(form)
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-lg font-semibold text-gray-900">Creer votre compte</h1>
    <p class="mb-6 text-sm text-gray-500">
      Configurez votre espace de facturation en quelques instants.
    </p>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.businessName"
        label="Nom du commerce"
        placeholder="Ma Boutique"
        :error="errors.businessName"
        required
      />

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700" for="businessType">Type de commerce</label>
        <select
          id="businessType"
          v-model="form.businessType"
          class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option v-for="type in BUSINESS_TYPE_OPTIONS" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.firstName" label="Prenom" :error="errors.firstName" required />
        <BaseInput v-model="form.lastName" label="Nom" :error="errors.lastName" required />
      </div>

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
        hint="8 caracteres minimum."
        :error="errors.password"
        required
      />

      <BaseButton type="submit" :loading="authStore.loading" class="w-full">
        Creer mon compte
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      Deja un compte ?
      <RouterLink
        :to="{ name: ROUTE_NAMES.login }"
        class="font-medium text-primary-600 hover:underline"
      >
        Se connecter
      </RouterLink>
    </p>
  </div>
</template>
