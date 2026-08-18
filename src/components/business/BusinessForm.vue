<script setup lang="ts">
import { reactive, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import { BUSINESS_TYPE_OPTIONS, CURRENCY_OPTIONS, WEEKDAYS } from '@/constants'
import type { Business, BusinessType, OpeningHours, UpdateBusinessPayload, Weekday } from '@/types'
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
/** Etat local des horaires, en chaines editables pour un `<input type="time">`. */
type OpeningHoursFormState = Record<Weekday, { open: string; close: string; closed: boolean }>

function emptyOpeningHours(): OpeningHoursFormState {
  const day = { open: '09:00', close: '18:00', closed: false }
  return {
    monday: { ...day },
    tuesday: { ...day },
    wednesday: { ...day },
    thursday: { ...day },
    friday: { ...day },
    saturday: { ...day },
    sunday: { ...day, closed: true }
  }
}

interface BusinessFormState {
  name: string
  businessType: BusinessType
  taxId: string
  address: string
  city: string
  country: string
  shippingAddress: string
  shippingCity: string
  shippingCountry: string
  phone: string
  email: string
  website: string
  facebook: string
  instagram: string
  whatsapp: string
  currency: string
  vatEnabled: boolean
  defaultVatRate: string
  numberPrefix: string
  numberPadding: string
  nextNumber: string
  defaultPaymentTermDays: string
  paymentTerms: string
  termsAndConditions: string
  openingHours: OpeningHoursFormState
}

function emptyForm(): BusinessFormState {
  return {
    name: '',
    businessType: 'pme',
    taxId: '',
    address: '',
    city: '',
    country: '',
    shippingAddress: '',
    shippingCity: '',
    shippingCountry: '',
    phone: '',
    email: '',
    website: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
    currency: 'XOF',
    vatEnabled: true,
    defaultVatRate: '0',
    numberPrefix: 'FA-',
    numberPadding: '4',
    nextNumber: '1',
    defaultPaymentTermDays: '30',
    paymentTerms: '',
    termsAndConditions: '',
    openingHours: emptyOpeningHours()
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
    const defaults = emptyOpeningHours()
    const openingHours = { ...defaults }
    if (business.openingHours) {
      for (const day of Object.keys(defaults) as Weekday[]) {
        const source = business.openingHours[day]
        if (source) {
          openingHours[day] = {
            open: source.open ?? defaults[day].open,
            close: source.close ?? defaults[day].close,
            closed: source.closed
          }
        }
      }
    }

    Object.assign(form, {
      name: business.name,
      businessType: business.businessType,
      taxId: business.taxId ?? '',
      address: business.address ?? '',
      city: business.city ?? '',
      country: business.country ?? '',
      shippingAddress: business.shippingAddress?.address ?? '',
      shippingCity: business.shippingAddress?.city ?? '',
      shippingCountry: business.shippingAddress?.country ?? '',
      phone: business.phone ?? '',
      email: business.email,
      website: business.socialLinks?.website ?? '',
      facebook: business.socialLinks?.facebook ?? '',
      instagram: business.socialLinks?.instagram ?? '',
      whatsapp: business.socialLinks?.whatsapp ?? '',
      currency: business.currency,
      vatEnabled: business.vatEnabled,
      defaultVatRate: String(business.defaultVatRate),
      numberPrefix: business.invoiceSettings.numberPrefix,
      numberPadding: String(business.invoiceSettings.numberPadding),
      nextNumber: String(business.invoiceSettings.nextNumber),
      defaultPaymentTermDays: String(business.invoiceSettings.defaultPaymentTermDays),
      paymentTerms: business.invoiceSettings.paymentTerms ?? '',
      termsAndConditions: business.termsAndConditions ?? '',
      openingHours
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

function toOpeningHoursPayload(): OpeningHours {
  const result = {} as OpeningHours
  for (const day of Object.keys(form.openingHours) as Weekday[]) {
    const entry = form.openingHours[day]
    result[day] = {
      closed: entry.closed,
      open: entry.closed ? undefined : entry.open || undefined,
      close: entry.closed ? undefined : entry.close || undefined
    }
  }
  return result
}

function onSubmit(): void {
  if (!validate()) return

  const hasShippingAddress =
    form.shippingAddress.trim() || form.shippingCity.trim() || form.shippingCountry.trim()
  const hasSocialLinks =
    form.website.trim() || form.facebook.trim() || form.instagram.trim() || form.whatsapp.trim()

  const payload: UpdateBusinessPayload = {
    name: form.name.trim(),
    businessType: form.businessType,
    taxId: form.taxId.trim() || undefined,
    address: form.address.trim() || undefined,
    city: form.city.trim() || undefined,
    country: form.country.trim() || undefined,
    shippingAddress: hasShippingAddress
      ? {
          address: form.shippingAddress.trim() || undefined,
          city: form.shippingCity.trim() || undefined,
          country: form.shippingCountry.trim() || undefined
        }
      : undefined,
    phone: form.phone.trim() || undefined,
    email: form.email.trim(),
    socialLinks: hasSocialLinks
      ? {
          website: form.website.trim() || undefined,
          facebook: form.facebook.trim() || undefined,
          instagram: form.instagram.trim() || undefined,
          whatsapp: form.whatsapp.trim() || undefined
        }
      : undefined,
    currency: form.currency,
    vatEnabled: form.vatEnabled,
    defaultVatRate: Number(form.defaultVatRate),
    termsAndConditions: form.termsAndConditions.trim() || undefined,
    openingHours: toOpeningHoursPayload(),
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
      <legend class="mb-1 text-sm font-semibold text-gray-900">Adresse de facturation</legend>
      <BaseInput v-model="form.address" label="Adresse" :error="fieldError('address')" />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput v-model="form.city" label="Ville" :error="fieldError('city')" />
        <BaseInput v-model="form.country" label="Pays" :error="fieldError('country')" />
      </div>
    </fieldset>

    <!-- Adresse de livraison -->
    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-sm font-semibold text-gray-900">
        Adresse de livraison
        <span class="font-normal text-gray-400">(si differente de la facturation)</span>
      </legend>
      <BaseInput v-model="form.shippingAddress" label="Adresse" />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput v-model="form.shippingCity" label="Ville" />
        <BaseInput v-model="form.shippingCountry" label="Pays" />
      </div>
    </fieldset>

    <!-- Reseaux sociaux -->
    <fieldset class="flex flex-col gap-4">
      <legend class="mb-1 text-sm font-semibold text-gray-900">Site web & reseaux sociaux</legend>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput v-model="form.website" type="url" label="Site web" placeholder="https://..." />
        <BaseInput v-model="form.whatsapp" label="WhatsApp" placeholder="+225 07 00 00 00 00" />
        <BaseInput v-model="form.facebook" type="url" label="Facebook" placeholder="https://..." />
        <BaseInput
          v-model="form.instagram"
          type="url"
          label="Instagram"
          placeholder="https://..."
        />
      </div>
    </fieldset>

    <!-- Horaires d'ouverture -->
    <fieldset class="flex flex-col gap-3">
      <legend class="mb-1 text-sm font-semibold text-gray-900">Horaires d'ouverture</legend>
      <div
        v-for="day in WEEKDAYS"
        :key="day.value"
        class="grid grid-cols-1 items-center gap-2 sm:grid-cols-4"
      >
        <span class="text-sm text-gray-700">{{ day.label }}</span>
        <template v-if="!form.openingHours[day.value].closed">
          <input
            v-model="form.openingHours[day.value].open"
            type="time"
            class="focus-ring rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
          />
          <input
            v-model="form.openingHours[day.value].close"
            type="time"
            class="focus-ring rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
          />
        </template>
        <span v-else class="text-sm text-gray-400 sm:col-span-2">Ferme</span>
        <label class="flex items-center gap-2 text-sm text-gray-600">
          <input
            v-model="form.openingHours[day.value].closed"
            type="checkbox"
            class="focus-ring size-4 rounded border-gray-300"
          />
          Ferme ce jour
        </label>
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

      <BaseTextarea
        v-model="form.termsAndConditions"
        label="Conditions generales de vente"
        :rows="4"
        placeholder="Vos CGV, affichables sur vos documents..."
      />
    </fieldset>

    <div class="flex justify-end">
      <BaseButton type="submit" :loading="submitting">Enregistrer les modifications</BaseButton>
    </div>
  </form>
</template>
