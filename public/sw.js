/**
 * Service worker minimal : rend l'application installable (PWA) et met en
 * cache le "app shell" (les fichiers statiques buildés) pour un demarrage
 * plus rapide hors connexion. Volontairement PAS d'interception des appels
 * `/api/...` : les donnees metier (clients, factures, paiements...) doivent
 * toujours venir du reseau, jamais d'un cache perime — ce n'est pas un mode
 * hors-ligne avec ecriture/synchronisation differee, seulement un shell
 * installable qui s'affiche instantanement.
 */

const CACHE_NAME = 'facture-ia-shell-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add('/')))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Jamais de cache pour l'API : toujours le reseau, donnees toujours fraiches.
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
