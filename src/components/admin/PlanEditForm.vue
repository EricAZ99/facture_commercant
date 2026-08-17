<script setup lang="ts">
import { reactive, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import type { CreatePlanPayload, SubscriptionPlan } from '@/types'
import { isRequired } from '@/utils/validators'

interface Props {
  /** Plan a modifier ; absent/`null` => formulaire de creation. */
  plan?: SubscriptionPlan | null
  submitting?: boolean
  serverErrors?: Record<string, string[]> | null
}

const props = withDefaults(defineProps<Props>(), {
  plan: null,
  submitting: false,
  serverErrors: null
})

const emit = defineEmits<{
  submit: [payload: CreatePlanPayload]
  cancel: []
}>()

interface PlanFormState {
  name: string
  description: string
  price: string
  /** Une fonctionnalite par ligne. */
  features: string
  maxInvoicesPerMonth: string
  maxClients: string
  maxUsers: string
}

function emptyForm(): PlanFormState {
  return {
    name: '',
    description: '',
    price: '0',
    features: '',
    maxInvoicesPerMonth: '',
    maxClients: '',
    maxUsers: ''
  }
}

const form = reactive<PlanFormState>(emptyForm())
const localErrors = reactive<Partial<Record<keyof PlanFormState, string>>>({})

watch(
  () => props.plan,
  (plan) => {
    Object.assign(
      form,
      plan
        ? {
            name: plan.name,
            description: plan.description ?? '',
            price: String(plan.price),
            features: plan.features.join('\n'),
            maxInvoicesPerMonth:
              plan.limits.maxInvoicesPerMonth === null
                ? ''
                : String(plan.limits.maxInvoicesPerMonth),
            maxClients: plan.limits.maxClients === null ? '' : String(plan.limits.maxClients),
            maxUsers: plan.limits.maxUsers === null ? '' : String(plan.limits.maxUsers)
          }
        : emptyForm()
    )
  },
  { immediate: true }
)

function fieldError(field: keyof PlanFormState): string | undefined {
  return localErrors[field] ?? props.serverErrors?.[field]?.[0]
}

function validate(): boolean {
  localErrors.name = !isRequired(form.name) ? 'Le nom du plan est requis.' : undefined

  const price = Number(form.price)
  localErrors.price =
    form.price.trim() === '' || !Number.isFinite(price) || price < 0
      ? 'Le prix doit etre un nombre positif ou nul.'
      : undefined

  return Object.values(localErrors).every((message) => !message)
}

/** `''` => illimite (`null`), sinon nombre entier. */
function parseLimit(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

function onSubmit(): void {
  if (!validate()) return

  const payload: CreatePlanPayload = {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    price: Number(form.price),
    billingCycle: 'monthly',
    features: form.features
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    limits: {
      maxInvoicesPerMonth: parseLimit(form.maxInvoicesPerMonth),
      maxClients: parseLimit(form.maxClients),
      maxUsers: parseLimit(form.maxUsers)
    }
  }
  emit('submit', payload)
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <div class="grid grid-cols-2 gap-4">
      <BaseInput v-model="form.name" label="Nom du plan" :error="fieldError('name')" required />
      <BaseInput
        v-model="form.price"
        type="number"
        min="0"
        label="Prix mensuel"
        :error="fieldError('price')"
        required
      />
    </div>

    <BaseTextarea v-model="form.description" label="Description" :rows="2" />

    <BaseTextarea
      v-model="form.features"
      label="Fonctionnalites"
      hint="Une fonctionnalite par ligne."
      :rows="4"
    />

    <div class="grid grid-cols-3 gap-4">
      <BaseInput
        v-model="form.maxInvoicesPerMonth"
        type="number"
        min="0"
        label="Factures / mois"
        hint="Vide = illimite"
      />
      <BaseInput
        v-model="form.maxClients"
        type="number"
        min="0"
        label="Clients"
        hint="Vide = illimite"
      />
      <BaseInput
        v-model="form.maxUsers"
        type="number"
        min="0"
        label="Utilisateurs"
        hint="Vide = illimite"
      />
    </div>

    <div class="mt-2 flex justify-end gap-2">
      <BaseButton type="button" variant="outline" :disabled="submitting" @click="emit('cancel')">
        Annuler
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">
        {{ plan ? 'Enregistrer' : 'Creer le plan' }}
      </BaseButton>
    </div>
  </form>
</template>
