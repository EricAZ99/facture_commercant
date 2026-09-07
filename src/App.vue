<script setup lang="ts">
import { watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ToastContainer from '@/components/layout/ToastContainer.vue'
import { ROUTE_NAMES } from '@/constants'
import { useAuthStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Le theme sombre ne concerne que l'espace commercant (`requiresAuth`/
// `guestOnly`, voir `router/index.ts`), jamais l'espace admin (identite
// visuelle sombre fixe et independante) ni les pages publiques (lien
// facture, apercu, erreurs). La classe est posee sur `<body>` plutot que
// sur un wrapper de layout : les elements teleportes vers `<body>`
// (`BaseModal`, `DropdownMenu`) restent ainsi dans la portee du theme.
watchEffect(() => {
  document.body.classList.toggle(
    'commerce-scope',
    Boolean(route.meta.requiresAuth || route.meta.guestOnly)
  )
})

// Le garde de navigation (`router/index.ts`) ne verifie l'authentification
// qu'au moment de naviguer : si la session est invalidee en arriere-plan
// (ex. compte desactive pendant que l'utilisateur reste sur la meme page —
// voir `setUnauthorizedHandler` dans `auth.store.ts`), rien ne le
// redirigerait sans cette surveillance reactive.
watch(
  () => authStore.authenticated,
  (isAuthenticated) => {
    if (!isAuthenticated && !authStore.isInitializing && route.meta.requiresAuth) {
      void router.push({ name: ROUTE_NAMES.login, query: { redirect: route.fullPath } })
    }
  }
)
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
