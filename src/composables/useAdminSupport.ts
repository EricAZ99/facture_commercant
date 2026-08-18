import { ref } from 'vue'

import { adminSupportService } from '@/services'
import type {
  ApiError,
  ID,
  PaginationMeta,
  PlatformEvent,
  SupportTicket,
  SupportTicketStatus
} from '@/types'

import { useToast } from './useToast'

const EMPTY_META: PaginationMeta = { page: 1, perPage: 20, total: 0, totalPages: 1 }

/** Liste des tickets support, tous commerces confondus (espace admin). */
export function useAdminSupport() {
  const items = ref<SupportTicket[]>([])
  const meta = ref<PaginationMeta>(EMPTY_META)
  const isLoading = ref(false)
  const page = ref(1)
  const statusFilter = ref<SupportTicketStatus | ''>('')

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      const response = await adminSupportService.listTickets({
        page: page.value,
        perPage: 20,
        status: statusFilter.value || undefined
      })
      items.value = response.data
      meta.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  function setStatusFilter(status: SupportTicketStatus | ''): void {
    if (status === statusFilter.value) return
    statusFilter.value = status
    page.value = 1
    void load()
  }

  function goToPage(target: number): void {
    if (target === page.value) return
    page.value = target
    void load()
  }

  return { items, meta, isLoading, page, statusFilter, load, setStatusFilter, goToPage }
}

/** Detail d'un ticket support (espace admin) : lecture, reponse, changement de statut. */
export function useAdminSupportTicket(id: ID) {
  const toast = useToast()

  const ticket = ref<SupportTicket | null>(null)
  const isLoading = ref(false)
  const isReplying = ref(false)
  const isUpdatingStatus = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      ticket.value = await adminSupportService.getTicket(id)
    } finally {
      isLoading.value = false
    }
  }

  async function reply(message: string): Promise<boolean> {
    isReplying.value = true
    try {
      ticket.value = await adminSupportService.reply(id, message)
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isReplying.value = false
    }
  }

  async function setStatus(status: SupportTicketStatus): Promise<boolean> {
    isUpdatingStatus.value = true
    try {
      ticket.value = await adminSupportService.setStatus(id, status)
      toast.success(status === 'closed' ? 'Ticket ferme.' : 'Ticket rouvert.')
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isUpdatingStatus.value = false
    }
  }

  return { ticket, isLoading, isReplying, isUpdatingStatus, load, reply, setStatus }
}

/** Notifications plateforme (evenements recents), pour la cloche de l'espace admin. */
export function useAdminNotifications() {
  const items = ref<PlatformEvent[]>([])
  const isLoading = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      items.value = await adminSupportService.listNotifications(15)
    } catch {
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  return { items, isLoading, load }
}
