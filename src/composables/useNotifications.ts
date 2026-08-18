import { computed, ref } from 'vue'

import { dashboardService } from '@/services'
import { STORAGE_KEYS } from '@/constants'
import type { ActivityItem } from '@/types'
import { storage } from '@/utils/storage'

const NOTIFICATIONS_LIMIT = 15

/**
 * Centre de notifications persistant : reutilise le fil d'activite recente
 * du commerce (deja journalise cote serveur pour le tableau de bord) comme
 * source, avec un etat lu/non-lu derive d'un horodatage "derniere
 * consultation" persiste par navigateur (pas de notion de lu/non-lu par
 * notification cote backend, volontairement simple).
 */
export function useNotifications() {
  const items = ref<ActivityItem[]>([])
  const isLoading = ref(false)
  const lastSeenAt = ref(storage.get(STORAGE_KEYS.notificationsLastSeenAt))

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      items.value = await dashboardService.getRecentActivity({ limit: NOTIFICATIONS_LIMIT })
    } catch {
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  const unreadCount = computed(() => {
    if (!lastSeenAt.value) return items.value.length
    return items.value.filter((item) => item.createdAt > (lastSeenAt.value as string)).length
  })

  function markAllAsRead(): void {
    const latest = items.value[0]?.createdAt ?? new Date().toISOString()
    lastSeenAt.value = latest
    storage.set(STORAGE_KEYS.notificationsLastSeenAt, latest)
  }

  return { items, isLoading, unreadCount, load, markAllAsRead }
}
