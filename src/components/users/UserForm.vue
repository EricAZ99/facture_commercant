<script setup lang="ts">
import { reactive } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { INVITABLE_ROLES, ROLE_LABELS } from '@/constants'
import type { CreateUserPayload, UserRole } from '@/types'
import { isRequired, isValidEmail } from '@/utils/validators'

interface Props {
  submitting?: boolean
  /** Erreurs de validation renvoyees par le backend, par champ. */
  serverErrors?: Record<string, string[]> | null
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
  serverErrors: null
})

const emit = defineEmits<{
  submit: [payload: CreateUserPayload]
  cancel: []
}>()

interface UserFormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: UserRole
  department: string
}

const form = reactive<UserFormState>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'cashier',
  department: ''
})

const localErrors = reactive<Partial<Record<keyof UserFormState, string>>>({})

function fieldError(field: keyof UserFormState): string | undefined {
  return localErrors[field] ?? props.serverErrors?.[field]?.[0]
}

function validate(): boolean {
  localErrors.firstName = !isRequired(form.firstName) ? 'Le prenom est requis.' : undefined
  localErrors.lastName = !isRequired(form.lastName) ? 'Le nom est requis.' : undefined
  localErrors.email = !isRequired(form.email)
    ? "L'email est requis."
    : !isValidEmail(form.email)
      ? "Format d'email invalide."
      : undefined

  return Object.values(localErrors).every((message) => !message)
}

function onSubmit(): void {
  if (!validate()) return

  emit('submit', {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || undefined,
    role: form.role,
    department: form.department.trim() || undefined
  })
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <div class="grid grid-cols-2 gap-4">
      <BaseInput
        v-model="form.firstName"
        label="Prenom"
        :error="fieldError('firstName')"
        required
      />
      <BaseInput v-model="form.lastName" label="Nom" :error="fieldError('lastName')" required />
    </div>

    <BaseInput
      v-model="form.email"
      type="email"
      label="Email"
      placeholder="collegue@commerce.com"
      :error="fieldError('email')"
      required
    />
    <BaseInput
      v-model="form.phone"
      label="Telephone"
      hint="Optionnel."
      :error="fieldError('phone')"
    />
    <BaseInput
      v-model="form.department"
      label="Departement"
      hint="Optionnel, ex: Ventes, Comptabilite."
    />

    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-gray-700" for="user-role">Role</label>
      <select
        id="user-role"
        v-model="form.role"
        class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
      >
        <option v-for="role in INVITABLE_ROLES" :key="role" :value="role">
          {{ ROLE_LABELS[role] }}
        </option>
      </select>
      <p class="text-sm text-gray-500">Determine les permissions par defaut de cet utilisateur.</p>
    </div>

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        Annuler
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">Inviter</BaseButton>
    </div>
  </form>
</template>
