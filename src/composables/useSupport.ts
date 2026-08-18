import { ref } from 'vue'

import { supportService } from '@/services'
import type { ApiError, CreateSupportTicketPayload, ID, SupportTicket } from '@/types'

import { useToast } from './useToast'

/** Tickets support du commerce courant : liste et creation. */
export function useSupport() {
  const toast = useToast()

  const items = ref<SupportTicket[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      items.value = await supportService.list()
    } finally {
      isLoading.value = false
    }
  }

  async function createTicket(payload: CreateSupportTicketPayload): Promise<SupportTicket | null> {
    isSubmitting.value = true
    try {
      const ticket = await supportService.create(payload)
      toast.success('Votre demande a ete envoyee au support.')
      items.value = [ticket, ...items.value]
      return ticket
    } catch (err) {
      toast.error((err as ApiError).message)
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  return { items, isLoading, isSubmitting, load, createTicket }
}

/** Detail d'un ticket support du commerce courant : lecture et reponse. */
export function useSupportTicket(id: ID) {
  const toast = useToast()

  const ticket = ref<SupportTicket | null>(null)
  const isLoading = ref(false)
  const isReplying = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      ticket.value = await supportService.getById(id)
    } finally {
      isLoading.value = false
    }
  }

  async function reply(message: string): Promise<boolean> {
    isReplying.value = true
    try {
      ticket.value = await supportService.reply(id, message)
      return true
    } catch (err) {
      toast.error((err as ApiError).message)
      return false
    } finally {
      isReplying.value = false
    }
  }

  return { ticket, isLoading, isReplying, load, reply }
}
