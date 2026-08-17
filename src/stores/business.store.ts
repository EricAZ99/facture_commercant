import { defineStore } from 'pinia'

import { businessService } from '@/services'
import type { Business, UpdateBusinessPayload } from '@/types'

import { useAuthStore } from './auth.store'

/**
 * Store dedie aux mutations des parametres du commerce. Ne duplique pas
 * `authStore.business` (source unique de verite du commerce actif) :
 * chaque mutation reussie ecrit directement dans `authStore.business`, afin
 * que tout le reste de l'application (en-tete API multi-tenant, tableau de
 * bord, numerotation des factures...) reflete le changement immediatement,
 * sans rechargement de page.
 */
export const useBusinessStore = defineStore('business', () => {
  async function updateBusiness(payload: UpdateBusinessPayload): Promise<Business> {
    const business = await businessService.update(payload)
    useAuthStore().setBusiness(business)
    return business
  }

  async function uploadLogo(file: File): Promise<Business> {
    const business = await businessService.uploadLogo(file)
    useAuthStore().setBusiness(business)
    return business
  }

  return { updateBusiness, uploadLogo }
})
