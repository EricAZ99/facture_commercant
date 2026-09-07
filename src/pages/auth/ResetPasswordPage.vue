<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { useAuth } from '@/composables'
import { minLength } from '@/utils/validators'

const route = useRoute()
const { t } = useI18n()
const { authStore, resetPasswordAndRedirect } = useAuth()

const form = reactive({ password: '' })
const errors = reactive<{ password?: string }>({})

function validate(): boolean {
  errors.password = !minLength(form.password, 8) ? t('auth.passwordMinLength') : undefined
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
    <h1 class="mb-1 text-lg font-semibold text-gray-900">{{ $t('auth.resetPassword.title') }}</h1>
    <p class="mb-6 text-sm text-gray-500">{{ $t('auth.resetPassword.subtitle') }}</p>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.password"
        type="password"
        :label="$t('auth.resetPassword.newPasswordLabel')"
        :hint="$t('auth.passwordHintMin')"
        :error="errors.password"
        required
      />
      <BaseButton type="submit" :loading="authStore.loading" class="w-full">
        {{ $t('auth.resetPassword.submit') }}
      </BaseButton>
    </form>
  </div>
</template>
