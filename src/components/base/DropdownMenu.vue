<script setup lang="ts">
import { MoreVertical } from 'lucide-vue-next'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref({ top: '0px', right: '0px' })

/**
 * Le panneau est teleporte vers `<body>` (voir template) plutot que
 * positionne en `absolute` dans son wrapper local : un `<main>` scrollable
 * (`overflow-y-auto`) est souvent promu sur son propre calque de
 * composition par le moteur de rendu, ce qui peut faire passer son contenu
 * AU-DESSUS d'un panneau `absolute` d'un frere precedent dans le DOM (ici la
 * barre du haut), meme avec un z-index superieur — le calcul de la pile CSS
 * "gagne" mais le rendu composite peut ne pas le respecter. Teleporter vers
 * `<body>` sort entierement le panneau de ce probleme.
 */
function updatePosition(): void {
  if (!rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  panelStyle.value = {
    top: `${rect.bottom + 4}px`,
    right: `${window.innerWidth - rect.right}px`
  }
}

async function toggle(): Promise<void> {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    updatePosition()
  }
}

function close(): void {
  isOpen.value = false
}

function onClickOutside(event: MouseEvent): void {
  const target = event.target as Node
  if (
    rootRef.value &&
    !rootRef.value.contains(target) &&
    !(panelRef.value && panelRef.value.contains(target))
  ) {
    close()
  }
}

// `scroll` ne remonte pas (bubble) : capture=true pour detecter le defilement
// de n'importe quel ancetre (notamment le `<main>` de l'application), pas
// seulement celui de `window`. Revers de la medaille : un listener de capture
// sur `window` intercepte AUSSI le defilement d'un contenu scrollable a
// l'interieur du panneau lui-meme (ex. la liste de notifications, `max-h-80
// overflow-y-auto`) puisqu'il n'est pas limite aux ancetres du declencheur —
// on l'ignore explicitement pour ne fermer que sur un defilement exterieur.
function onScrollOrResize(event: Event): void {
  if (!isOpen.value) return
  const target = event.target
  if (panelRef.value && target instanceof Node && panelRef.value.contains(target)) {
    return
  }
  close()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})

defineExpose({ close })
</script>

<template>
  <div ref="rootRef" class="relative inline-block text-left">
    <slot name="trigger" :toggle="toggle" :is-open="isOpen">
      <button
        type="button"
        class="focus-ring rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="Ouvrir le menu d'actions"
        :aria-expanded="isOpen"
        @click="toggle"
      >
        <MoreVertical class="size-4" />
      </button>
    </slot>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="panelRef"
        class="fixed z-20 min-w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        :style="panelStyle"
        @click="close"
      >
        <slot />
      </div>
    </Teleport>
  </div>
</template>
