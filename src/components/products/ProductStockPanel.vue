<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'
import { reactive } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import LoadingState from '@/components/states/LoadingState.vue'
import type { ProductStockMovement } from '@/types'
import { formatDateTime } from '@/utils/formatters'

interface Props {
  currentStock: number
  movements: ProductStockMovement[]
  isLoadingMovements: boolean
  isAdjusting: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  adjust: [delta: number, reason: string]
}>()

const form = reactive({ quantity: '', reason: '' })

function submit(direction: 1 | -1): void {
  const quantity = Number(form.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) return
  emit('adjust', quantity * direction, form.reason.trim())
  form.quantity = ''
  form.reason = ''
}
</script>

<template>
  <BaseCard title="Stock" :subtitle="`${currentStock} unite(s) actuellement en stock.`">
    <form class="flex flex-wrap items-end gap-2" @submit.prevent>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600" for="stock-adjust-quantity"
          >Quantite</label
        >
        <input
          id="stock-adjust-quantity"
          v-model="form.quantity"
          type="number"
          min="1"
          placeholder="Ex : 10"
          class="focus-ring w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
        />
      </div>
      <div class="flex flex-1 flex-col gap-1">
        <label class="text-xs font-medium text-gray-600" for="stock-adjust-reason">
          Motif (optionnel)
        </label>
        <input
          id="stock-adjust-reason"
          v-model="form.reason"
          type="text"
          placeholder="Ex : Reception fournisseur, casse, inventaire..."
          class="focus-ring w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
        />
      </div>
      <BaseButton
        type="button"
        variant="outline"
        size="sm"
        :loading="isAdjusting"
        @click="submit(1)"
      >
        <Plus class="size-4" aria-hidden="true" />
        Entree
      </BaseButton>
      <BaseButton
        type="button"
        variant="outline"
        size="sm"
        :loading="isAdjusting"
        @click="submit(-1)"
      >
        <Minus class="size-4" aria-hidden="true" />
        Sortie
      </BaseButton>
    </form>

    <div class="mt-5 border-t border-gray-100 pt-4">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        Historique des mouvements
      </p>
      <LoadingState v-if="isLoadingMovements && movements.length === 0" message="Chargement..." />
      <p v-else-if="movements.length === 0" class="text-sm text-gray-400">
        Aucun mouvement de stock enregistre.
      </p>
      <ul v-else class="flex flex-col gap-2 text-sm">
        <li
          v-for="movement in movements"
          :key="movement.id"
          class="flex items-center justify-between gap-3"
        >
          <span class="text-gray-700">
            <span
              :class="movement.delta > 0 ? 'text-green-600' : 'text-red-600'"
              class="font-medium"
            >
              {{ movement.delta > 0 ? '+' : '' }}{{ movement.delta }}
            </span>
            — {{ movement.reason }}
          </span>
          <span class="shrink-0 text-xs text-gray-400">
            {{ formatDateTime(movement.createdAt) }} · stock : {{ movement.stockAfter }}
          </span>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>
