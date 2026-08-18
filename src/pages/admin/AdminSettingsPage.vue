<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import { onMounted, reactive, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import { CURRENCY_OPTIONS } from '@/constants'
import { useAdminAuditLog, useAdminSettings } from '@/composables'
import { useAdminAuthStore } from '@/stores'
import { formatDateTime } from '@/utils/formatters'

const { settings, isLoading, isSaving, load, submitUpdate } = useAdminSettings()
const auditLog = useAdminAuditLog()
const adminAuthStore = useAdminAuthStore()
const isSuperAdmin = adminAuthStore.admin?.role === 'super_admin'

onMounted(() => {
  void load()
  void auditLog.load()
})

const form = reactive({
  supportedCurrencies: new Set<string>(),
  legalMentions: '',
  defaultTermsAndConditions: ''
})

watch(settings, (value) => {
  if (!value) return
  form.supportedCurrencies = new Set(value.supportedCurrencies)
  form.legalMentions = value.legalMentions
  form.defaultTermsAndConditions = value.defaultTermsAndConditions
})

function toggleCurrency(value: string): void {
  if (form.supportedCurrencies.has(value)) {
    form.supportedCurrencies.delete(value)
  } else {
    form.supportedCurrencies.add(value)
  }
}

async function onSubmit(): Promise<void> {
  await submitUpdate({
    supportedCurrencies: Array.from(form.supportedCurrencies),
    legalMentions: form.legalMentions,
    defaultTermsAndConditions: form.defaultTermsAndConditions
  })
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-gray-900">Parametres plateforme</h1>
      <p class="mt-1 text-sm text-gray-500">
        Configuration globale de Facture IA et journal d'audit de toutes les actions admin.
      </p>
    </div>

    <div class="flex flex-col gap-4">
      <BaseCard title="Configuration globale">
        <LoadingState v-if="isLoading && !settings" message="Chargement..." />
        <form v-else class="flex flex-col gap-4" @submit.prevent="onSubmit">
          <div>
            <p class="mb-2 text-sm font-medium text-gray-700">Devises supportees</p>
            <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <label
                v-for="option in CURRENCY_OPTIONS"
                :key="option.value"
                class="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  :checked="form.supportedCurrencies.has(option.value)"
                  :disabled="!isSuperAdmin"
                  class="focus-ring size-4 rounded border-gray-300"
                  @change="toggleCurrency(option.value)"
                />
                {{ option.value }}
              </label>
            </div>
          </div>

          <BaseTextarea
            v-model="form.legalMentions"
            label="Mentions legales par defaut"
            :rows="3"
            :disabled="!isSuperAdmin"
          />
          <BaseTextarea
            v-model="form.defaultTermsAndConditions"
            label="Conditions generales de vente par defaut"
            hint="Proposees aux nouveaux commerces, modifiables ensuite par chacun."
            :rows="3"
            :disabled="!isSuperAdmin"
          />

          <div v-if="isSuperAdmin" class="flex justify-end">
            <BaseButton type="submit" :loading="isSaving">Enregistrer</BaseButton>
          </div>
          <p v-else class="text-sm text-gray-400">
            Reserve aux super-administrateurs (vous etes en lecture seule).
          </p>
        </form>
      </BaseCard>

      <BaseCard
        title="Journal d'audit global"
        subtitle="Toutes les actions administratives, tous commerces confondus."
      >
        <LoadingState
          v-if="auditLog.isLoading.value && auditLog.items.value.length === 0"
          message="Chargement..."
        />
        <EmptyState
          v-else-if="auditLog.items.value.length === 0"
          :icon="FileText"
          title="Aucune action enregistree"
        />
        <template v-else>
          <ul class="flex flex-col gap-3 text-sm">
            <li
              v-for="entry in auditLog.items.value"
              :key="entry.id"
              class="flex justify-between gap-4"
            >
              <span class="text-gray-700">
                <span class="font-medium text-gray-900">{{ entry.businessName }}</span> —
                {{ entry.message }}
              </span>
              <span class="shrink-0 text-xs text-gray-400">
                {{ entry.adminName }} · {{ formatDateTime(entry.createdAt) }}
              </span>
            </li>
          </ul>

          <div
            class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
          >
            <p>{{ auditLog.meta.value.total }} entree(s)</p>
            <div class="flex items-center gap-2">
              <BaseButton
                variant="outline"
                size="sm"
                :disabled="auditLog.page.value <= 1"
                @click="auditLog.goToPage(auditLog.page.value - 1)"
              >
                Precedent
              </BaseButton>
              <span>Page {{ auditLog.page.value }} / {{ auditLog.meta.value.totalPages }}</span>
              <BaseButton
                variant="outline"
                size="sm"
                :disabled="auditLog.page.value >= auditLog.meta.value.totalPages"
                @click="auditLog.goToPage(auditLog.page.value + 1)"
              >
                Suivant
              </BaseButton>
            </div>
          </div>
        </template>
      </BaseCard>
    </div>
  </div>
</template>
