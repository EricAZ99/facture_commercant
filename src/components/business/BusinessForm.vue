<script setup lang="ts">
import { reactive, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import { BUSINESS_TYPE_OPTIONS, CURRENCY_OPTIONS } from '@/constants'
import type { Business, BusinessType, UpdateBusinessPayload } from '@/types'
import { isPositiveNumber, isRequired, isValidEmail } from '@/utils/validators'

interface Props {
  business: Business | null
  submitting?: boolean
  /** Erreurs de validation renvoyees par le backend, par champ. */
  serverErrors?: Record<string, string[]> | null
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
  serverErrors: null
})

const emit = defineEmits<{
  submit: [payload: UpdateBusinessPayload]
}>()

/**
 * Etat local du formulaire : toujours des chaines (jamais `undefined`/
 * `number`/`boolean`), pour rester compatible avec `v-model` sur
 * `BaseInput`. La conversion en payload type se fait uniquement a
 * l'emission.
 */
interface BusinessFormState {
  name: string
  businessType: BusinessType
  taxId: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  currency: string
  vatEnabled: boolean
  defaultVatRate: string
  numberPrefix: string
  numberPadding: string
  nextNumber: string
  defaultPaymentTermDays: string
  paymentTerms: string
}

function emptyForm(): BusinessFormState {
  return {
    name: '',
    businessType: 'pme',
    taxId: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    currency: 'XOF',
    vatEnabled: true,
    defaultVatRate: '0',
    numberPrefix: 'FA-',
    numberPadding: '4',
    nextNumber: '1',
    defaultPaymentTermDays: '30',
    paymentTerms: ''
  }
}

const form = reactive<BusinessFormState>(emptyForm())
const localErrors = reactive<Partial<Record<keyof BusinessFormState, string>>>({})

watch(
  () => props.business,
  (business) => {
    if (!business) {
      Object.assign(form, emptyForm())
      return
    }
    Object.assign(form, {
      name: business.name,
      businessType: business.businessType,
      taxId: business.taxId ?? '',
      address: business.address ?? '',
      city: business.city ?? '',
      country: business.country ?? '',
      phone: business.phone ?? '',
      email: business.email,
      currency: business.currency,
      vatEnabled: business.vatEnabled,
      defaultVatRate: String(business.defaultVatRate),
      numberPrefix: business.invoiceSettings.numberPrefix,
      numberPadding: String(business.invoiceSettings.numberPadding),
      nextNumber: String(business.invoiceSettings.nextNumber),
      defaultPaymentTermDays: String(business.invoiceSettings.defaultPaymentTermDays),
      paymentTerms: business.invoiceSettings.paymentTerms ?? ''
    })
  },
  { immediate: true }
)

/** Combine erreur locale (validation immediate) et erreur backend (apres soumission). */
function fieldError(field: keyof BusinessFormState): string | undefined {
  return localErrors[field] ?? props.serverErrors?.[field]?.[0]
}

function validate(): boolean {
  localErrors.name = !isRequired(form.name) ? 'Le nom du commerce est requis.' : undefined
  localErrors.email = !isRequired(form.email)
    ? "L'email est requis."
    : !isValidEmail(form.email)
      ? "Format d'email invalide."
      : undefined
  localErrors.currency = !isRequired(form.currency) ? 'La devise est requise.' : undefined

  const vatRate = Number(form.defaultVatRate)
  localErrors.defaultVatRate =
    form.defaultVatRate.trim() === '' || !isPositiveNumber(vatRate) || vatRate > 100
      ? 'Le taux de TVA doit etre compris entre 0 et 100.'
      : undefined

  localErrors.numberPrefix = !isRequired(form.numberPrefix)
    ? 'Le prefixe de numerotation est requis.'
    : undefined

  const padding = Number(form.numberPadding)
  localErrors.numberPadding =
    !Number.isInteger(padding) || padding < 1 || padding > 10
      ? 'Doit etre un nombre entier entre 1 et 10.'
      : undefined

  const nextNumber = Number(form.nextNumber)
  localErrors.nextNumber =
    !Number.isInteger(nextNumber) || nextNumber < 1
      ? 'Doit etre un nombre entier superieur ou egal a 1.'
      : undefined

  const paymentTermDays = Number(form.defaultPaymentTermDays)
  localErrors.defaultPaymentTermDays =
    !Number.isInteger(paymentTermDays) || paymentTermDays < 0
      ? 'Doit etre un nombre entier positif ou nul.'
      : undefined

  return Object.values(localErrors).every((message) => !message)
}

function onSubmit(): void {
  if (!validate()) return

  const payload: UpdateBusinessPayload = {
    name: form.name.trim(),
    businessType: form.businessType,
    taxId: form.taxId.trim() || undefined,
    address: form.address.trim() || undefined,
    city: form.city.trim() || undefined,
    country: form.country.trim() || undefined,
    phone: form.phone.trim() || undefined,
    email: form.email.trim(),
    currency: form.currency,
    vatEnabled: form.vatEnabled,
    defaultVatRate: Number(form.defaultVatRate),
    invoiceSettings: {
      numberPrefix: form.numberPrefix.trim(),
      numberPadding: Number(form.numberPadding),
      nextNumber: Number(form.nextNumber),
      defaultPaymentTermDays: Number(form.defaultPaymentTermDays),
      paymentTerms: form.paymentTerms.trim() || undefined
    }
  }
  emit('submit', payload)
}
</script>

<template>
  <form class="flex flex-col gap-8" @submit.prevent="onSubmit">
    <!-- Informations generales -->
    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-sm font-semibold text-gray-900">Informations generales</legend>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput
          v-model="form.name"
          label="Nom du commerce"
          :error="fieldError('name')"
          required
        />
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700" for="business-type">
            Categorie de commerce
          </label>
          <select
            id="business-type"
            v-model="form.businessType"
            class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            <option
              v-for="option in BUSINESS_TYPE_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
      <BaseInput
        v-model="form.taxId"
        label="Identifiant fiscal"
        hint="Numero de contribuable, RCCM... (optionnel)"
        :error="fieldError('taxId')"
      />
    </fieldset>

    <!-- Adresse -->
    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-sm font-semibold text-gray-900">Adresse</legend>
      <BaseInput v-model="form.address" label="Adresse" :error="fieldError('address')" />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput v-model="form.city" label="Ville" :error="fieldError('city')" />
        <BaseInput v-model="form.country" label="Pays" :error="fieldError('country')" />
      </div>
    </fieldset>

    <!-- Contact -->
    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-sm font-semibold text-gray-900">Contact</legend>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput v-model="form.phone" type="tel" label="Telephone" :error="fieldError('phone')" />
        <BaseInput
          v-model="form.email"
          type="email"
          label="Email"
          :error="fieldError('email')"
          required
        />
      </div>
    </fieldset>

    <!-- Devise et TVA -->
    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-sm font-semibold text-gray-900">Devise et TVA</legend>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700" for="business-currency">Devise</label>
          <select
            id="business-currency"
            v-model="form.currency"
            class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            <option v-for="option in CURRENCY_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <BaseInput
          v-model="form.defaultVatRate"
          type="number"
          label="Taux de TVA par defaut (%)"
          :disabled="!form.vatEnabled"
          :error="fieldError('defaultVatRate')"
        />
      </div>
      <label class="flex w-fit items-center gap-2 text-sm text-gray-700">
        <input
          v-model="form.vatEnabled"
          type="checkbox"
          class="focus-ring size-4 rounded border-gray-300 text-primary-600"
        />
        Commerce assujetti a la TVA
      </label>
    </fieldset>

    <!-- Configuration des factures -->
    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-sm font-semibold text-gray-900">Configuration des factures</legend>

      <div>
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Numerotation</p>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BaseInput
            v-model="form.numberPrefix"
            label="Prefixe"
            placeholder="FA-"
            :error="fieldError('numberPrefix')"
            required
          />
          <BaseInput
            v-model="form.numberPadding"
            type="number"
            label="Chiffres du numero"
            hint="Ex : 4 -> 0007"
            :error="fieldError('numberPadding')"
          />
          <BaseInput
            v-model="form.nextNumber"
            type="number"
            label="Prochain numero"
            :error="fieldError('nextNumber')"
          />
        </div>
      </div>

      <div>
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Conditions de paiement
        </p>
        <div class="flex flex-col gap-4">
          <BaseInput
            v-model="form.defaultPaymentTermDays"
            type="number"
            label="Delai de paiement par defaut (jours)"
            :error="fieldError('defaultPaymentTermDays')"
          />
          <BaseTextarea
            v-model="form.paymentTerms"
            label="Conditions de paiement affichees sur les factures"
            :rows="3"
            placeholder="Ex : Paiement a reception de facture."
            :error="fieldError('paymentTerms')"
          />
        </div>
      </div>
    </fieldset>

    <div class="flex justify-end">
      <BaseButton type="submit" :loading="submitting">Enregistrer les modifications</BaseButton>
    </div>
  </form>
</template>
