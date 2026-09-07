<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { ROUTE_NAMES } from '@/constants'
import { useAuth } from '@/composables'
import { isRequired, isValidEmail } from '@/utils/validators'

const { t } = useI18n()
const { authStore, loginAndRedirect } = useAuth()

const form = reactive({ email: '', password: '' })
const errors = reactive<{ email?: string; password?: string }>({})

function validate(): boolean {
  errors.email = !isRequired(form.email)
    ? t('auth.emailRequired')
    : !isValidEmail(form.email)
      ? t('auth.emailInvalid')
      : undefined
  errors.password = !isRequired(form.password) ? t('auth.passwordRequired') : undefined
  return !errors.email && !errors.password
}

async function onSubmit(): Promise<void> {
  if (!validate()) return
  await loginAndRedirect(form)
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-lg font-semibold text-gray-900">{{ $t('auth.login.title') }}</h1>
    <p class="mb-6 text-sm text-gray-500">{{ $t('auth.login.subtitle') }}</p>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.email"
        type="email"
        :label="$t('auth.emailLabel')"
        placeholder="email@example.com"
        :error="errors.email"
        required
      />
      <BaseInput
        v-model="form.password"
        type="password"
        :label="$t('auth.passwordLabel')"
        :placeholder="$t('auth.passwordPlaceholder')"
        :error="errors.password"
        required
      />

      <div class="flex justify-end">
        <RouterLink
          :to="{ name: ROUTE_NAMES.forgotPassword }"
          class="text-sm font-medium text-primary-600 hover:underline"
        >
          {{ $t('auth.login.forgotPassword') }}
        </RouterLink>
      </div>

      <BaseButton type="submit" :loading="authStore.loading" class="w-full">
        {{ $t('auth.login.submit') }}
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      {{ $t('auth.login.noAccount') }}
      <RouterLink
        :to="{ name: ROUTE_NAMES.register }"
        class="font-medium text-primary-600 hover:underline"
      >
        {{ $t('auth.login.registerLink') }}
      </RouterLink>
    </p>
  </div>
</template>
