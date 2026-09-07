<script setup lang="ts">
import { AlertCircle, Eye, Plus, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import SearchableSelect from '@/components/base/SearchableSelect.vue'
import { DISCOUNT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/constants'
import { useInvoiceBuilder } from '@/composables'
import { clientService, productService } from '@/services'
import { useAuthStore } from '@/stores'
import type { Client, Invoice, Product } from '@/types'

import InvoiceItemRow from './InvoiceItemRow.vue'
import InvoiceSummary from './InvoiceSummary.vue'

interface Props {
  /** Facture a modifier ; absente/`null` => formulaire de creation. */
  invoice?: Invoice | null
  client?: Client | null
}

const props = withDefaults(defineProps<Props>(), { invoice: null, client: null })

const authStore = useAuthStore()
const currency = computed(() => authStore.business?.currency ?? 'XOF')

const builder = useInvoiceBuilder({ invoice: props.invoice ?? undefined, client: props.client })

const emit = defineEmits<{
  success: [invoice: Invoice]
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
  const invoice = await builder.submit(mode)
  if (invoice) emit('success', invoice)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <BaseCard :title="$t('invoices.form.clientSectionTitle')">
      <SearchableSelect
        :search="searchClients"
        :get-label="clientLabel"
        :get-key="(c: Client) => c.id"
        :selected="builder.client.value"
        :placeholder="$t('invoices.form.clientSearchPlaceholder')"
        @select="builder.setClient"
        @clear="builder.setClient(null)"
      />
    </BaseCard>

    <BaseCard :title="$t('invoices.form.productsSectionTitle')">
      <SearchableSelect
        :search="searchProducts"
        :get-label="productLabel"
        :get-key="(p: Product) => p.id"
        clear-on-select
        :placeholder="$t('invoices.form.productSearchPlaceholder')"
        @select="builder.addProduct"
      />

      <div class="mt-4">
        <div
          v-if="builder.lines.value.length > 0"
          class="grid grid-cols-12 gap-2 border-b border-gray-200 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500"
        >
          <span class="col-span-5">{{ $t('invoices.form.columnDescription') }}</span>
          <span class="col-span-2 text-right">{{ $t('invoices.form.columnQuantity') }}</span>
          <span class="col-span-2 text-right">{{ $t('invoices.form.columnPrice') }}</span>
          <span class="col-span-1 text-right">{{ $t('invoices.form.columnTax') }}</span>
          <span class="col-span-1 text-right">{{ $t('invoices.form.columnLineTotal') }}</span>
          <span class="col-span-1"></span>
        </div>

        <div v-if="builder.lines.value.length === 0" class="py-6 text-center text-sm text-gray-400">
          {{ $t('invoices.form.noLines') }}
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
          {{ $t('invoices.form.addFreeLine') }}
        </button>
      </div>
    </BaseCard>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <BaseCard :title="$t('invoices.form.detailsSectionTitle')">
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <BaseInput
              v-model="builder.issueDate.value"
              :label="$t('invoices.form.issueDateLabel')"
              type="date"
            />
            <BaseInput
              v-model="builder.dueDate.value"
              :label="$t('invoices.form.dueDateLabel')"
              type="date"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-gray-700" for="discount-type">
                {{ $t('invoices.form.discountTypeLabel') }}
              </label>
              <select
                id="discount-type"
                v-model="builder.discountType.value"
                class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option v-for="(label, value) in DISCOUNT_TYPE_LABELS" :key="value" :value="value">
                  {{ $t(label) }}
                </option>
              </select>
            </div>
            <BaseInput
              v-model="discountValueInput"
              type="number"
              min="0"
              :label="
                builder.discountType.value === 'percentage'
                  ? $t('invoices.form.discountValuePercentLabel')
                  : $t('invoices.form.discountValueAmountLabel', { currency })
              "
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700" for="payment-method">
              {{ $t('invoices.form.paymentMethodLabel') }}
            </label>
            <select
              id="payment-method"
              v-model="builder.paymentMethod.value"
              class="focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{{ $t('invoices.form.payLaterOption') }}</option>
              <option v-for="(label, value) in PAYMENT_METHOD_LABELS" :key="value" :value="value">
                {{ $t(label) }}
              </option>
            </select>
            <p class="text-sm text-gray-500">
              {{ $t('invoices.form.paymentMethodHint') }}
            </p>
          </div>

          <BaseTextarea
            v-model="builder.notes.value"
            :label="$t('invoices.form.notesLabel')"
            :rows="2"
          />
          <BaseTextarea
            v-model="builder.internalNotes.value"
            :label="$t('invoices.form.internalNotesLabel')"
            :hint="$t('invoices.form.internalNotesHint')"
            :rows="2"
          />

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">{{
                $t('invoices.form.customFieldsLabel')
              }}</label>
              <button
                type="button"
                class="focus-ring inline-flex items-center gap-1 rounded-lg text-sm font-medium text-primary-600 hover:text-primary-700"
                @click="builder.addCustomField()"
              >
                <Plus class="size-3.5" aria-hidden="true" />
                {{ $t('invoices.form.addCustomField') }}
              </button>
            </div>
            <div
              v-for="(field, index) in builder.customFields.value"
              :key="index"
              class="flex items-center gap-2"
            >
              <input
                v-model="field.label"
                type="text"
                :placeholder="$t('invoices.form.customFieldLabelPlaceholder')"
                class="focus-ring w-1/2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
              />
              <input
                v-model="field.value"
                type="text"
                :placeholder="$t('invoices.form.customFieldValuePlaceholder')"
                class="focus-ring w-1/2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
              />
              <button
                type="button"
                class="focus-ring shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                :aria-label="$t('invoices.form.removeCustomField')"
                @click="builder.removeCustomField(index)"
              >
                <Trash2 class="size-4" />
              </button>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard :title="$t('invoices.form.summarySectionTitle')">
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
            {{ $t('common.cancel') }}
          </BaseButton>
          <BaseButton
            type="button"
            variant="outline"
            :loading="builder.isPreviewingPdf.value"
            :disabled="builder.isSubmitting.value"
            @click="builder.previewPdf()"
          >
            <Eye v-if="!builder.isPreviewingPdf.value" class="size-4" aria-hidden="true" />
            {{ $t('invoices.form.previewPdf') }}
          </BaseButton>
          <BaseButton
            variant="outline"
            :loading="builder.submittingMode.value === 'draft'"
            :disabled="builder.isSubmitting.value"
            @click="onSubmit('draft')"
          >
            {{
              builder.isEditing.value
                ? $t('invoices.form.saveChanges')
                : $t('invoices.form.saveDraft')
            }}
          </BaseButton>
          <BaseButton
            :loading="builder.submittingMode.value === 'final'"
            :disabled="builder.isSubmitting.value"
            @click="onSubmit('final')"
          >
            {{
              builder.isEditing.value
                ? $t('invoices.form.finalizeAndSend')
                : $t('invoices.form.createInvoiceSubmit')
            }}
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
