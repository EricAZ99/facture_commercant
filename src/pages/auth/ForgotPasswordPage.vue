<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { ROUTE_NAMES } from '@/constants'
import { useAuth } from '@/composables'
import { isRequired, isValidEmail } from '@/utils/validators'

const { t } = useI18n()
const { authStore, requestPasswordReset } = useAuth()

const form = reactive({ email: '' })
const errors = reactive<{ email?: string }>({})
const isSuccess = ref(false)

function validate(): boolean {
  errors.email = !isRequired(form.email)
    ? t('auth.emailRequired')
    : !isValidEmail(form.email)
      ? t('auth.emailInvalid')
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
    <h1 class="mb-1 text-lg font-semibold text-gray-900">{{ $t('auth.forgotPassword.title') }}</h1>
    <p class="mb-6 text-sm text-gray-500">
      {{ $t('auth.forgotPassword.subtitle') }}
    </p>

    <div v-if="isSuccess" class="rounded-lg bg-green-50 p-4 text-sm text-green-700">
      {{ $t('auth.forgotPassword.success') }}
    </div>

    <form v-else class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.email"
        type="email"
        :label="$t('auth.emailLabel')"
        placeholder="email@example.com"
        :error="errors.email"
        required
      />
      <BaseButton type="submit" :loading="authStore.loading" class="w-full">
        {{ $t('auth.forgotPassword.submit') }}
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      <RouterLink
        :to="{ name: ROUTE_NAMES.login }"
        class="font-medium text-primary-600 hover:underline"
      >
        {{ $t('auth.forgotPassword.backToLogin') }}
      </RouterLink>
    </p>
  </div>
</template>
