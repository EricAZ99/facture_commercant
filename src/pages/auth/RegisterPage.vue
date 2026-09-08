<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { BUSINESS_TYPE_OPTIONS, ROUTE_NAMES } from '@/constants'
import { useAuth } from '@/composables'
import type { RegisterPayload } from '@/types'
import { isRequired, isValidEmail, minLength } from '@/utils/validators'

const { t } = useI18n()
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
    ? t('auth.register.businessNameRequired')
    : undefined
  errors.firstName = !isRequired(form.firstName) ? t('auth.register.firstNameRequired') : undefined
  errors.lastName = !isRequired(form.lastName) ? t('auth.register.lastNameRequired') : undefined
  errors.email = !isRequired(form.email)
    ? t('auth.emailRequired')
    : !isValidEmail(form.email)
      ? t('auth.emailInvalid')
      : undefined
  errors.password = !minLength(form.password, 8) ? t('auth.passwordMinLength') : undefined

  return Object.values(errors).every((message) => !message)
}

async function onSubmit(): Promise<void> {
  if (!validate()) return
  await registerAndRedirect(form)
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-lg font-semibold text-gray-900">{{ $t('auth.register.title') }}</h1>
    <p class="mb-6 text-sm text-gray-500">
      {{ $t('auth.register.subtitle') }}
    </p>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.businessName"
        :label="$t('auth.register.businessNameLabel')"
        :placeholder="$t('auth.register.businessNamePlaceholder')"
        :error="errors.businessName"
        required
      />

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700" for="businessType">{{
          $t('auth.register.businessTypeLabel')
        }}</label>
        <select
          id="businessType"
          v-model="form.businessType"
          class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option v-for="type in BUSINESS_TYPE_OPTIONS" :key="type.value" :value="type.value">
            {{ $t(type.label) }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseInput
          v-model="form.firstName"
          :label="$t('auth.register.firstNameLabel')"
          :error="errors.firstName"
          required
        />
        <BaseInput
          v-model="form.lastName"
          :label="$t('auth.register.lastNameLabel')"
          :error="errors.lastName"
          required
        />
      </div>

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
        :hint="$t('auth.passwordHintMin')"
        :error="errors.password"
        required
      />

      <BaseButton type="submit" :loading="authStore.loading" class="w-full">
        {{ $t('auth.register.submit') }}
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      {{ $t('auth.register.haveAccount') }}
      <RouterLink
        :to="{ name: ROUTE_NAMES.login }"
        class="font-medium text-primary-600 hover:underline"
      >
        {{ $t('auth.register.loginLink') }}
      </RouterLink>
    </p>
  </div>
</template>
