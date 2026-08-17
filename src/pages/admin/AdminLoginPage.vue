<script setup lang="ts">
import { Receipt } from 'lucide-vue-next'
import { reactive } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import { useAdminAuth } from '@/composables'
import { isRequired, isValidEmail } from '@/utils/validators'

const { adminAuthStore, loginAndRedirect } = useAdminAuth()

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
  <div class="flex min-h-screen items-center justify-center bg-gray-900 px-4">
    <div class="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-950 p-8 shadow-lg">
      <div class="mb-6 flex items-center gap-2">
        <Receipt class="size-6 text-primary-400" aria-hidden="true" />
        <span class="text-base font-semibold text-white">Facture IA — Admin</span>
      </div>
      <h1 class="mb-1 text-lg font-semibold text-white">Espace administrateur</h1>
      <p class="mb-6 text-sm text-gray-400">
        Reserve aux operateurs de la plateforme. Ceci n'est pas l'espace commercant.
      </p>

      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-300" for="admin-email">
            Email
            <span class="text-red-400">*</span>
          </label>
          <input
            id="admin-email"
            v-model="form.email"
            type="email"
            placeholder="admin@facture-ia.com"
            class="focus-ring rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500"
            :class="errors.email ? 'border-red-500' : 'border-gray-700'"
          />
          <p v-if="errors.email" class="text-sm text-red-400">{{ errors.email }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-300" for="admin-password">
            Mot de passe
            <span class="text-red-400">*</span>
          </label>
          <input
            id="admin-password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            class="focus-ring rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500"
            :class="errors.password ? 'border-red-500' : 'border-gray-700'"
          />
          <p v-if="errors.password" class="text-sm text-red-400">{{ errors.password }}</p>
        </div>

        <BaseButton type="submit" :loading="adminAuthStore.loading" class="w-full">
          Se connecter
        </BaseButton>
      </form>
    </div>
  </div>
</template>
