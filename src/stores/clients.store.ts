import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { clientService } from '@/services'
import type {
  ApiError,
  AsyncStatus,
  Client,
  CreateClientPayload,
  ID,
  ListQueryParams,
  PaginationMeta,
  UpdateClientPayload
} from '@/types'

const EMPTY_META: PaginationMeta = { page: 1, perPage: 10, total: 0, totalPages: 1 }

/**
 * Etat global de la liste des clients (page courante, pagination, statut).
 * Les mutations (create/update/delete) se contentent d'appeler le service
 * et de renvoyer/propager le resultat : c'est a l'appelant (voir
 * `useClients`) de decider quand rafraichir la liste, pour rester coherent
 * avec le tri/filtre/pagination gere cote serveur.
 */
export const useClientsStore = defineStore('clients', () => {
  const items = ref<Client[]>([])
  const meta = ref<PaginationMeta>(EMPTY_META)
  const status = ref<AsyncStatus>('idle')
  const error = ref<ApiError | null>(null)

  const isLoading = computed(() => status.value === 'loading')

  async function fetchClients(params?: ListQueryParams): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      const response = await clientService.list(params)
      items.value = response.data
      meta.value = response.meta
      status.value = 'success'
    } catch (err) {
      error.value = err as ApiError
      status.value = 'error'
    }
  }

  function createClient(payload: CreateClientPayload): Promise<Client> {
    return clientService.create(payload)
  }

  function updateClient(id: ID, payload: UpdateClientPayload): Promise<Client> {
    return clientService.update(id, payload)
  }

  function deleteClient(id: ID): Promise<void> {
    return clientService.remove(id)
  }

  return {
    items,
    meta,
    status,
    error,
    isLoading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient
  }
})
