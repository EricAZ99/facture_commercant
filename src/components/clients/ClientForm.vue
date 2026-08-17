<script setup lang="ts">
import { reactive, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import type { Client, CreateClientPayload } from '@/types'
import { isRequired, isValidEmail } from '@/utils/validators'

interface Props {
  /** Client a modifier ; absent/`null` => formulaire de creation. */
  client?: Client | null
  submitting?: boolean
  /** Erreurs de validation renvoyees par le backend, par champ. */
  serverErrors?: Record<string, string[]> | null
}

const props = withDefaults(defineProps<Props>(), {
  client: null,
  submitting: false,
  serverErrors: null
})

const emit = defineEmits<{
  submit: [payload: CreateClientPayload]
  cancel: []
}>()

/**
 * Etat local du formulaire : toujours des chaines (jamais `undefined`), pour
 * rester compatible avec `v-model` sur `BaseInput`. La conversion en champs
 * optionnels (`undefined` si vide) se fait uniquement au moment de l'emission.
 */
interface ClientFormState {
  firstName: string
  lastName: string
  phone: string
  email: string
  address: string
  city: string
  country: string
  taxId: string
}

function emptyForm(): ClientFormState {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    taxId: ''
  }
}

const form = reactive<ClientFormState>(emptyForm())
const localErrors = reactive<Partial<Record<keyof ClientFormState, string>>>({})

watch(
  () => props.client,
  (client) => {
    Object.assign(
      form,
      client
        ? {
            firstName: client.firstName,
            lastName: client.lastName,
            phone: client.phone ?? '',
            email: client.email ?? '',
            address: client.address ?? '',
            city: client.city ?? '',
            country: client.country ?? '',
            taxId: client.taxId ?? ''
          }
        : emptyForm()
    )
  },
  { immediate: true }
)

/** Combine erreur locale (validation immediate) et erreur backend (apres soumission). */
function fieldError(field: keyof ClientFormState): string | undefined {
  return localErrors[field] ?? props.serverErrors?.[field]?.[0]
}

function validate(): boolean {
  localErrors.firstName = !isRequired(form.firstName) ? 'Le prenom est requis.' : undefined
  localErrors.lastName = !isRequired(form.lastName) ? 'Le nom est requis.' : undefined
  localErrors.email =
    form.email && !isValidEmail(form.email) ? "Format d'email invalide." : undefined

  return Object.values(localErrors).every((message) => !message)
}

function onSubmit(): void {
  if (!validate()) return

  // On n'envoie pas de chaines vides pour les champs optionnels.
  const payload: CreateClientPayload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    address: form.address.trim() || undefined,
    city: form.city.trim() || undefined,
    country: form.country.trim() || undefined,
    taxId: form.taxId.trim() || undefined
  }
  emit('submit', payload)
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

    <div class="grid grid-cols-2 gap-4">
      <BaseInput
        v-model="form.phone"
        label="Telephone"
        placeholder="+225 07 00 00 00 00"
        :error="fieldError('phone')"
      />
      <BaseInput
        v-model="form.email"
        type="email"
        label="Email"
        placeholder="client@example.com"
        :error="fieldError('email')"
      />
    </div>

    <BaseInput v-model="form.address" label="Adresse" :error="fieldError('address')" />

    <div class="grid grid-cols-2 gap-4">
      <BaseInput v-model="form.city" label="Ville" :error="fieldError('city')" />
      <BaseInput v-model="form.country" label="Pays" :error="fieldError('country')" />
    </div>

    <BaseInput
      v-model="form.taxId"
      label="Identifiant fiscal"
      hint="Optionnel."
      :error="fieldError('taxId')"
    />

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        Annuler
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">
        {{ client ? 'Enregistrer' : 'Creer le client' }}
      </BaseButton>
    </div>
  </form>
</template>
