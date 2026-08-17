import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  variant: ToastVariant
  message: string
  timeoutMs: number
}

/**
 * Store d'etat d'interface transverse: notifications (toasts) et indicateur
 * de chargement global. Permet a la gestion centralisee des erreurs API
 * (voir composables/useApi) de notifier l'utilisateur sans dependance a
 * un composant particulier.
 */
export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const globalLoadingCount = ref(0)
  /** Visibilite du menu lateral en mode mobile/tablette (tiroir superpose). */
  const isMobileSidebarOpen = ref(false)

  function pushToast(message: string, variant: ToastVariant = 'info', timeoutMs = 5000): string {
    const id = crypto.randomUUID()
    toasts.value.push({ id, message, variant, timeoutMs })
    return id
  }

  function dismissToast(id: string): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function startGlobalLoading(): void {
    globalLoadingCount.value += 1
  }

  function stopGlobalLoading(): void {
    globalLoadingCount.value = Math.max(0, globalLoadingCount.value - 1)
  }

  function openMobileSidebar(): void {
    isMobileSidebarOpen.value = true
  }

  function closeMobileSidebar(): void {
    isMobileSidebarOpen.value = false
  }

  function toggleMobileSidebar(): void {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
  }

  return {
    toasts,
    globalLoadingCount,
    isMobileSidebarOpen,
    pushToast,
    dismissToast,
    startGlobalLoading,
    stopGlobalLoading,
    openMobileSidebar,
    closeMobileSidebar,
    toggleMobileSidebar
  }
})
