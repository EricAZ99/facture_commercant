<script setup lang="ts">
import { AlertCircle, Plus } from 'lucide-vue-next'
import { computed } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import SearchableSelect from '@/components/base/SearchableSelect.vue'
import InvoiceItemRow from '@/components/invoices/InvoiceItemRow.vue'
import InvoiceSummary from '@/components/invoices/InvoiceSummary.vue'
import { DISCOUNT_TYPE_LABELS } from '@/constants'
import { useQuoteBuilder } from '@/composables'
import { clientService, productService } from '@/services'
import { useAuthStore } from '@/stores'
import type { Client, Product, Quote } from '@/types'

interface Props {
  /** Devis a modifier ; absent/`null` => formulaire de creation. */
  quote?: Quote | null
  client?: Client | null
}

const props = withDefaults(defineProps<Props>(), { quote: null, client: null })

const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const builder = useQuoteBuilder({ quote: props.quote ?? undefined, client: props.client })

const emit = defineEmits<{
  success: [quote: Quote]
  cancel: []
}>()

function clientLabel(c: Client): string {
  return `${c.firstName} ${c.lastName}${c.phone ? ` — ${c.phone}` : ''}`
}

async function searchClients(query: string): Promise<Client[]> {
  const response = await clientService.list({ search: query, perPage: 8 })
  return response.data
}

function productLabel(p: Product): string {
  return `${p.name} — ${p.price.toLocaleString('fr-FR')} ${currency.value}`
}

async function searchProducts(query: string): Promise<Product[]> {
  const response = await productService.list({ search: query, perPage: 8 })
  return response.data
}

const discountValueInput = computed({
  get: () => String(builder.discountValue.value),
  set: (value: string) => {
    const parsed = Number(value)
    builder.discountValue.value = Number.isFinite(parsed) ? parsed : 0
  }
})

async function onSubmit(mode: 'draft' | 'final'): Promise<void> {
  const quote = await builder.submit(mode)
  if (quote) emit('success', quote)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <BaseCard title="Client">
      <SearchableSelect
        :search="searchClients"
        :get-label="clientLabel"
        :get-key="(c: Client) => c.id"
        :selected="builder.client.value"
        placeholder="Rechercher un client par nom, email ou telephone..."
        @select="builder.setClient"
        @clear="builder.setClient(null)"
      />
    </BaseCard>

    <BaseCard title="Produits & services">
      <SearchableSelect
        :search="searchProducts"
        :get-label="productLabel"
        :get-key="(p: Product) => p.id"
        clear-on-select
        placeholder="Rechercher un produit ou service a ajouter..."
        @select="builder.addProduct"
      />

      <div class="mt-4">
        <div
          v-if="builder.lines.value.length > 0"
          class="grid grid-cols-12 gap-2 border-b border-gray-200 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500"
        >
          <span class="col-span-5">Description</span>
          <span class="col-span-2 text-right">Qte</span>
          <span class="col-span-2 text-right">Prix</span>
          <span class="col-span-1 text-right">TVA %</span>
          <span class="col-span-1 text-right">Total</span>
          <span class="col-span-1"></span>
        </div>

        <div v-if="builder.lines.value.length === 0" class="py-6 text-center text-sm text-gray-400">
          Aucune ligne. Recherchez un produit ci-dessus ou ajoutez une ligne libre.
        </div>
        <div v-else class="divide-y divide-gray-100">
          <InvoiceItemRow
            v-for="line in builder.lines.value"
            :key="line.key"
            :line="line"
            :currency="currency"
            @update="(patch) => builder.updateLine(line.key, patch)"
            @remove="builder.removeLine(line.key)"
          />
        </div>

        <button
          type="button"
          class="focus-ring mt-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-primary-600 hover:text-primary-700"
          @click="builder.addLine()"
        >
          <Plus class="size-4" aria-hidden="true" />
          Ligne libre
        </button>
      </div>
    </BaseCard>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <BaseCard title="Details">
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model="builder.issueDate.value" label="Date d'emission" type="date" />
            <BaseInput v-model="builder.expiryDate.value" label="Valide jusqu'au" type="date" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-gray-700" for="quote-discount-type">
                Type de remise
              </label>
              <select
                id="quote-discount-type"
                v-model="builder.discountType.value"
                class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option v-for="(label, value) in DISCOUNT_TYPE_LABELS" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>
            </div>
            <BaseInput
              v-model="discountValueInput"
              type="number"
              min="0"
              :label="
                builder.discountType.value === 'percentage' ? 'Remise (%)' : `Remise (${currency})`
              "
            />
          </div>

          <BaseTextarea v-model="builder.notes.value" label="Notes" :rows="2" />
        </div>
      </BaseCard>

      <BaseCard title="Recapitulatif">
        <InvoiceSummary
          :totals="builder.totals.value"
          :discount-type="builder.discountType.value"
          :discount-value="builder.discountValue.value"
          :currency="currency"
        />

        <div
          v-if="builder.submitError.value"
          class="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {{ builder.submitError.value.message }}
        </div>

        <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            v-if="builder.isEditing.value"
            type="button"
            variant="ghost"
            :disabled="builder.isSubmitting.value"
            @click="emit('cancel')"
          >
            Annuler
          </BaseButton>
          <BaseButton
            variant="outline"
            :loading="builder.submittingMode.value === 'draft'"
            :disabled="builder.isSubmitting.value"
            @click="onSubmit('draft')"
          >
            {{
              builder.isEditing.value
                ? 'Enregistrer les modifications'
                : 'Enregistrer comme brouillon'
            }}
          </BaseButton>
          <BaseButton
            :loading="builder.submittingMode.value === 'final'"
            :disabled="builder.isSubmitting.value"
            @click="onSubmit('final')"
          >
            {{ builder.isEditing.value ? 'Finaliser et envoyer' : 'Creer le devis' }}
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
