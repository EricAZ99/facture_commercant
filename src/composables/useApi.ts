import { computed, ref, type Ref } from 'vue'

import { useUiStore } from '@/stores'
import type { ApiError, AsyncStatus } from '@/types'

interface UseApiOptions {
  /** Affiche automatiquement un toast d'erreur en cas d'echec (defaut: true). */
  notifyOnError?: boolean
}

export interface UseApiReturn<TResult, TArgs extends unknown[]> {
  data: Ref<TResult | null>
  error: Ref<ApiError | null>
  status: Ref<AsyncStatus>
  isLoading: Ref<boolean>
  isError: Ref<boolean>
  isSuccess: Ref<boolean>
  execute: (...args: TArgs) => Promise<TResult | null>
  reset: () => void
}

/**
 * Encapsule l'appel a un service (jamais Axios directement) en exposant les
 * etats loading/error/success attendus par toutes les pages, ainsi qu'une
 * gestion centralisee des erreurs API (toast automatique).
 *
 * Usage: `const { data, isLoading, execute } = useApi(clientService.list)`
 */
export function useApi<TResult, TArgs extends unknown[] = []>(
  requestFn: (...args: TArgs) => Promise<TResult>,
  options: UseApiOptions = {}
): UseApiReturn<TResult, TArgs> {
  const { notifyOnError = true } = options
  const uiStore = useUiStore()

  const data = ref<TResult | null>(null) as Ref<TResult | null>
  const error = ref<ApiError | null>(null)
  const status = ref<AsyncStatus>('idle')

  const isLoading = computed(() => status.value === 'loading')
  const isError = computed(() => status.value === 'error')
  const isSuccess = computed(() => status.value === 'success')

  async function execute(...args: TArgs): Promise<TResult | null> {
    status.value = 'loading'
    error.value = null

    try {
      const result = await requestFn(...args)
      data.value = result
      status.value = 'success'
      return result
    } catch (err) {
      const apiError = err as ApiError

      // Requete abandonnee au profit d'une requete plus recente (ex: l'utilisateur
      // change de filtre avant la reponse precedente) : ce n'est pas une erreur,
      // on l'ignore silencieusement et on laisse l'appel plus recent faire foi.
      if (apiError.code === 'REQUEST_CANCELED') {
        return null
      }

      error.value = apiError
      status.value = 'error'
      if (notifyOnError) {
        uiStore.pushToast(apiError.message, 'error')
      }
      return null
    }
  }

  function reset(): void {
    data.value = null
    error.value = null
    status.value = 'idle'
  }

  return { data, error, status, isLoading, isError, isSuccess, execute, reset }
}
