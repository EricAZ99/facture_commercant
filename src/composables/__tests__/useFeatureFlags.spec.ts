import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useFeatureFlags } from '../useFeatureFlags'
import { useAuthStore } from '@/stores'
import type { Business, FeatureFlagKey } from '@/types'

/** Construit un commerce factice avec les fonctionnalites donnees, pour les tests. */
function fakeBusiness(featureFlags: Record<FeatureFlagKey, boolean>): Business {
  return {
    id: 'business-1',
    name: 'Ma Boutique',
    businessType: 'boutique',
    email: 'contact@ma-boutique.test',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    vatEnabled: true,
    defaultVatRate: 18,
    invoiceSettings: {
      numberPrefix: 'FA-',
      nextNumber: 1,
      numberPadding: 4,
      defaultPaymentTermDays: 30
    },
    quoteSettings: { numberPrefix: 'DE-', nextNumber: 1, numberPadding: 4 },
    creditNoteSettings: { numberPrefix: 'AV-', nextNumber: 1, numberPadding: 4 },
    isSuspended: false,
    featureFlags,
    referralCode: 'REF12345',
    referralRedemptions: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
}

describe('useFeatureFlags', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("isEnabled() renvoie true quand aucun commerce n'est charge (jamais de masquage sur donnee incomplete)", () => {
    const { isEnabled } = useFeatureFlags()
    expect(isEnabled('quotes')).toBe(true)
  })

  it('isEnabled() reflete exactement les fonctionnalites du commerce actif', () => {
    const authStore = useAuthStore()
    authStore.business = fakeBusiness({
      quotes: true,
      creditNotes: false,
      reports: true,
      kits: false,
      apiAccess: true
    })

    const { isEnabled } = useFeatureFlags()
    expect(isEnabled('quotes')).toBe(true)
    expect(isEnabled('creditNotes')).toBe(false)
    expect(isEnabled('kits')).toBe(false)
    expect(isEnabled('apiAccess')).toBe(true)
  })
})
