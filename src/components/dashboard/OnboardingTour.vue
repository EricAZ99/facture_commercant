<script setup lang="ts">
import {
  ArrowRight,
  Check,
  ChevronLeft,
  FileText,
  Package,
  Settings,
  Sparkles,
  Users,
  X,
  type LucideIcon
} from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ROUTE_NAMES, STORAGE_KEYS } from '@/constants'
import { storage } from '@/utils/storage'

interface Props {
  businessId: string
}

const props = defineProps<Props>()
const router = useRouter()

type Accent = 'primary' | 'emerald' | 'amber' | 'violet' | 'rose'

/**
 * Chaque teinte est ecrite en toutes lettres (jamais construite par
 * interpolation, ex. `bg-${accent}-500`) : le JIT de Tailwind scanne le
 * code source a la recherche de classes litterales, une classe assemblee
 * dynamiquement ne serait jamais generee.
 */
const ACCENTS: Record<
  Accent,
  { hero: string; blobA: string; blobB: string; bar: string; chip: string }
> = {
  primary: {
    hero: 'from-primary-500 to-primary-700',
    blobA: 'bg-primary-400',
    blobB: 'bg-primary-300',
    bar: 'bg-primary-600',
    chip: 'bg-primary-50 text-primary-700'
  },
  emerald: {
    hero: 'from-emerald-500 to-emerald-700',
    blobA: 'bg-emerald-400',
    blobB: 'bg-emerald-300',
    bar: 'bg-emerald-600',
    chip: 'bg-emerald-50 text-emerald-700'
  },
  amber: {
    hero: 'from-amber-500 to-amber-700',
    blobA: 'bg-amber-400',
    blobB: 'bg-amber-300',
    bar: 'bg-amber-600',
    chip: 'bg-amber-50 text-amber-700'
  },
  violet: {
    hero: 'from-violet-500 to-violet-700',
    blobA: 'bg-violet-400',
    blobB: 'bg-violet-300',
    bar: 'bg-violet-600',
    chip: 'bg-violet-50 text-violet-700'
  },
  rose: {
    hero: 'from-rose-500 to-rose-700',
    blobA: 'bg-rose-400',
    blobB: 'bg-rose-300',
    bar: 'bg-rose-600',
    chip: 'bg-rose-50 text-rose-700'
  }
}

interface Step {
  icon: LucideIcon
  accent: Accent
  eyebrow: string
  title: string
  description: string
  tips?: string[]
  cta?: { label: string; routeName: string }
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    accent: 'primary',
    eyebrow: 'Bienvenue',
    title: 'Facture IA, votre commerce en un coup d’œil',
    description:
      'Un tour de 5 etapes (moins d’une minute) pour savoir exactement par ou commencer.',
    tips: [
      'Ajoutez vos clients et votre catalogue',
      'Émettez votre premiere facture',
      'Personnalisez votre commerce'
    ]
  },
  {
    icon: Users,
    accent: 'emerald',
    eyebrow: 'Etape 2',
    title: 'Vos clients, toujours a portee de main',
    description:
      'Chaque client enregistre est immediatement disponible lors de la creation d’une facture ou d’un devis.',
    tips: [
      'Utilisez les etiquettes (VIP, Grossiste…) pour segmenter et retrouver vos clients en un instant',
      'L’identifiant fiscal est utile pour vos clients professionnels'
    ],
    cta: { label: 'Ajouter mon premier client', routeName: ROUTE_NAMES.clients }
  },
  {
    icon: Package,
    accent: 'amber',
    eyebrow: 'Etape 3',
    title: 'Un catalogue construit une seule fois',
    description: 'Chaque produit ou service s’ajoute ensuite en un clic sur vos factures et devis.',
    tips: [
      'Definissez des tarifs degressifs pour recompenser les grosses quantites',
      'Suivez votre stock et recevez une alerte avant la rupture'
    ],
    cta: { label: 'Créer mon catalogue', routeName: ROUTE_NAMES.products }
  },
  {
    icon: FileText,
    accent: 'violet',
    eyebrow: 'Etape 4',
    title: 'Du devis au paiement encaisse',
    description:
      'Proposez un devis, convertissez-le en facture en un clic, puis suivez chaque paiement.',
    tips: [
      'Un devis accepte se transforme en facture sans ressaisie',
      'Reglez delais de paiement et numerotation dans Parametres'
    ],
    cta: { label: 'Créer ma première facture', routeName: ROUTE_NAMES.invoiceCreate }
  },
  {
    icon: Settings,
    accent: 'rose',
    eyebrow: 'Etape 5',
    title: 'Quelques reglages avant de facturer',
    description: 'Logo, TVA, numerotation, conditions de paiement : tout se joue ici.',
    tips: [
      'Votre logo apparait automatiquement sur vos factures PDF',
      'Prefixe et format de numerotation restent modifiables a tout moment'
    ],
    cta: { label: 'Personnaliser mon commerce', routeName: ROUTE_NAMES.settings }
  }
]

function storageKey(): string {
  return `${STORAGE_KEYS.onboardingSeenPrefix}${props.businessId}`
}

const isOpen = ref(storage.get(storageKey()) !== '1')
const stepIndex = ref(0)

const currentStep = computed(() => STEPS[stepIndex.value]!)
const accent = computed(() => ACCENTS[currentStep.value.accent])
const isLastStep = computed(() => stepIndex.value === STEPS.length - 1)
const progressPercent = computed(() => ((stepIndex.value + 1) / STEPS.length) * 100)

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

function prev(): void {
  if (stepIndex.value > 0) stepIndex.value -= 1
}

function onCta(): void {
  const cta = currentStep.value.cta
  if (!cta) return
  finish()
  void router.push({ name: cta.routeName })
}

function onKeydown(event: KeyboardEvent): void {
  if (!isOpen.value) return
  if (event.key === 'Escape') finish()
  else if (event.key === 'ArrowRight') next()
  else if (event.key === 'ArrowLeft') prev()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="tour-backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        @click.self="finish"
      >
        <div class="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <!-- Bandeau colore, propre a chaque etape -->
          <div
            class="relative overflow-hidden bg-gradient-to-br px-6 pb-9 pt-6 transition-colors duration-300"
            :class="accent.hero"
          >
            <div
              class="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full opacity-25 blur-2xl transition-colors duration-300"
              :class="accent.blobA"
              aria-hidden="true"
            />
            <div
              class="pointer-events-none absolute -bottom-16 left-10 size-32 rounded-full opacity-20 blur-2xl transition-colors duration-300"
              :class="accent.blobB"
              aria-hidden="true"
            />

            <div class="relative flex items-center justify-between">
              <span class="text-xs font-medium uppercase tracking-wide text-white/70">
                {{ currentStep.eyebrow }} — {{ stepIndex + 1 }}/{{ STEPS.length }}
              </span>
              <button
                type="button"
                class="focus-ring rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Passer la découverte"
                @click="finish"
              >
                <X class="size-4" aria-hidden="true" />
              </button>
            </div>

            <div
              class="relative mt-5 flex size-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25"
            >
              <component :is="currentStep.icon" class="size-6 text-white" aria-hidden="true" />
            </div>
          </div>

          <!-- Barre de progression -->
          <div class="h-1 w-full bg-gray-100">
            <div
              class="h-full transition-all duration-300 ease-out"
              :class="accent.bar"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>

          <!-- Contenu de l'etape, transition douce -->
          <Transition name="tour-step" mode="out-in">
            <div :key="stepIndex" class="px-6 pb-2 pt-5">
              <h3 id="onboarding-title" class="text-lg font-semibold text-gray-900">
                {{ currentStep.title }}
              </h3>
              <p class="mt-1.5 text-sm leading-relaxed text-gray-600">
                {{ currentStep.description }}
              </p>

              <ul v-if="currentStep.tips" class="mt-4 flex flex-col gap-2">
                <li
                  v-for="tip in currentStep.tips"
                  :key="tip"
                  class="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span
                    class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full"
                    :class="accent.chip"
                  >
                    <Check class="size-2.5" aria-hidden="true" />
                  </span>
                  {{ tip }}
                </li>
              </ul>

              <button
                v-if="currentStep.cta"
                type="button"
                class="focus-ring mt-5 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                @click="onCta"
              >
                {{ currentStep.cta.label }}
                <ArrowRight class="size-4" aria-hidden="true" />
              </button>
            </div>
          </Transition>

          <!-- Navigation -->
          <div class="mt-4 flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              class="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:invisible"
              :disabled="stepIndex === 0"
              @click="prev"
            >
              <ChevronLeft class="size-4" aria-hidden="true" />
              Précédent
            </button>

            <div class="flex items-center gap-3">
              <button
                type="button"
                class="focus-ring rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                @click="finish"
              >
                Passer
              </button>
              <button
                type="button"
                class="focus-ring inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                :class="accent.bar"
                @click="next"
              >
                {{ isLastStep ? 'Terminer' : 'Suivant' }}
                <ArrowRight class="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tour-backdrop-enter-active,
.tour-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.tour-backdrop-enter-from,
.tour-backdrop-leave-to {
  opacity: 0;
}

.tour-step-enter-active,
.tour-step-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.tour-step-enter-from {
  opacity: 0;
  transform: translateX(8px);
}
.tour-step-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .tour-backdrop-enter-active,
  .tour-backdrop-leave-active,
  .tour-step-enter-active,
  .tour-step-leave-active {
    transition: none;
  }
}
</style>
