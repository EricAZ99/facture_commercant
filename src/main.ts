import './assets/main.css'

import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { useAdminAuthStore, useAuthStore } from './stores'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
setActivePinia(pinia)
app.use(router)

// Restaure les deux sessions persistees (commercant + admin, jetons
// distincts) avant le premier rendu, pour que les guards de route
// disposent d'un etat d'authentification a jour des la navigation initiale.
// Les deux realms sont independants : chacun restaure le sien, en parallele.
const authStore = useAuthStore()
const adminAuthStore = useAdminAuthStore()

Promise.all([authStore.fetchCurrentUser(), adminAuthStore.fetchCurrentAdmin()]).finally(() => {
  app.mount('#app')
})

// PWA : enregistre le service worker uniquement en production (le HMR de
// Vite en dev serait perturbe par un cache intermediaire).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installation non critique : l'application reste pleinement
      // fonctionnelle sans service worker.
    })
  })
}
