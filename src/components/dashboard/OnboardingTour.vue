<script setup lang="ts">
import { FileText, LayoutDashboard, Package, Settings, Users } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import { STORAGE_KEYS } from '@/constants'
import { storage } from '@/utils/storage'

interface Props {
  businessId: string
}

const props = defineProps<Props>()

const STEPS = [
  {
    icon: LayoutDashboard,
    title: 'Bienvenue sur Facture IA',
    description:
      "Votre tableau de bord centralise votre chiffre d'affaires, vos factures et vos alertes. Faisons un tour rapide des sections principales."
  },
  {
    icon: Users,
    title: 'Clients',
    description:
      "Ajoutez vos clients pour les retrouver instantanement lors de la creation d'une facture."
  },
  {
    icon: Package,
    title: 'Produits & services',
    description:
      "Creez votre catalogue une fois : il s'ajoutera ensuite en un clic sur vos factures."
  },
  {
    icon: FileText,
    title: 'Devis & factures',
    description:
      'Emettez des devis, convertissez-les en factures, et suivez les paiements encaisses.'
  },
  {
    icon: Settings,
    title: 'Parametres',
    description:
      'Personnalisez votre commerce (logo, TVA, numerotation) avant votre premiere facture.'
  }
]

function storageKey(): string {
  return `${STORAGE_KEYS.onboardingSeenPrefix}${props.businessId}`
}

const isOpen = ref(storage.get(storageKey()) !== '1')
const stepIndex = ref(0)

const currentStep = computed(() => STEPS[stepIndex.value]!)
const isLastStep = computed(() => stepIndex.value === STEPS.length - 1)

function finish(): void {
  storage.set(storageKey(), '1')
  isOpen.value = false
}

function next(): void {
  if (isLastStep.value) {
    finish()
    return
  }
  stepIndex.value += 1
}
</script>

<template>
  <BaseModal :open="isOpen" title="Decouvrir Facture IA" @close="finish">
    <div class="flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700"
        >
          <component :is="currentStep.icon" class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 class="text-base font-semibold text-gray-900">{{ currentStep.title }}</h3>
          <p class="mt-1 text-sm text-gray-600">{{ currentStep.description }}</p>
        </div>
      </div>

      <div class="flex items-center justify-center gap-1.5">
        <span
          v-for="(_, index) in STEPS"
          :key="index"
          class="size-1.5 rounded-full"
          :class="index === stepIndex ? 'bg-primary-600' : 'bg-gray-200'"
        />
      </div>

      <div class="flex justify-end gap-2">
        <BaseButton variant="ghost" @click="finish">Passer</BaseButton>
        <BaseButton @click="next">{{ isLastStep ? 'Terminer' : 'Suivant' }}</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
