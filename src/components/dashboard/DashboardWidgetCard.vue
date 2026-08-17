<script setup lang="ts">
import { Loader2, type LucideIcon } from 'lucide-vue-next'
import { computed } from 'vue'

import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/states/EmptyState.vue'
import ErrorState from '@/components/states/ErrorState.vue'
import LoadingState from '@/components/states/LoadingState.vue'

interface Props {
  title: string
  subtitle?: string
  /** Requete en cours pour ce widget (chargement initial ou actualisation en arriere-plan). */
  loading: boolean
  /** Des donnees (memes perimees) sont deja disponibles pour ce widget. */
  hasData: boolean
  /** Message d'erreur a afficher, ou `null` si pas d'erreur. */
  error?: string | null
  /** Chargement termine avec succes mais rien a afficher. */
  isEmpty?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  error: null,
  isEmpty: false
})

const emit = defineEmits<{
  retry: []
}>()

// Un chargement en arriere-plan (donnees deja presentes) ne doit pas
// remplacer le contenu existant : seul un chargement "a vide" (premiere
// tentative ou apres erreur) bloque l'affichage du widget.
const showBlockingLoading = computed(() => props.loading && !props.hasData)
const showBlockingError = computed(() => Boolean(props.error) && !props.hasData)
</script>

<template>
  <BaseCard :title="title" :subtitle="subtitle">
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>

    <LoadingState v-if="showBlockingLoading" />
    <ErrorState
      v-else-if="showBlockingError"
      :message="error ?? undefined"
      @retry="emit('retry')"
    />
    <EmptyState v-else-if="isEmpty" :icon="emptyIcon" :title="emptyTitle" :message="emptyMessage" />
    <div v-else class="relative">
      <Loader2
        v-if="loading"
        class="absolute -top-1 right-0 size-4 animate-spin text-gray-300"
        aria-hidden="true"
      />
      <slot />
    </div>
  </BaseCard>
</template>
