import { useUiStore } from '@/stores'

/** Acces simplifie aux notifications globales (toasts). */
export function useToast() {
  const uiStore = useUiStore()

  return {
    success: (message: string) => uiStore.pushToast(message, 'success'),
    error: (message: string) => uiStore.pushToast(message, 'error'),
    info: (message: string) => uiStore.pushToast(message, 'info'),
    warning: (message: string) => uiStore.pushToast(message, 'warning'),
    dismiss: (id: string) => uiStore.dismissToast(id)
  }
}
