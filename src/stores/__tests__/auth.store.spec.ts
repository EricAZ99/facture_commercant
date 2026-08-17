import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthResponse } from '@/types'

vi.mock('@/services', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    getCurrentUser: vi.fn()
  },
  setBusinessIdProvider: vi.fn(),
  setUnauthorizedHandler: vi.fn()
}))

// Importe apres le mock (le store consomme `authService` au moment de l'appel,
// pas a l'import, mais on garde l'ordre conventionnel par lisibilite).
import { authService } from '@/services'
import { useAuthStore } from '../auth.store'

function fakeAuthResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    user: {
      id: 'user-1',
      businessId: 'business-1',
      firstName: 'Erik',
      lastName: 'Azankpo',
      email: 'erik@example.com',
      role: 'owner',
      permissions: ['invoice:read'],
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    business: {
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
      isSuspended: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    tokens: { accessToken: 'access-token-123', refreshToken: 'refresh-token-456' },
    ...overrides
  }
}

describe('useAuthStore (authentification)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it("n'est pas authentifie par defaut", () => {
    const store = useAuthStore()
    expect(store.authenticated).toBe(false)
    expect(store.user).toBeNull()
  })

  it('login() etablit la session et persiste les jetons', async () => {
    const response = fakeAuthResponse()
    vi.mocked(authService.login).mockResolvedValue(response)

    const store = useAuthStore()
    await store.login({ email: 'erik@example.com', password: 'password123' })

    expect(store.authenticated).toBe(true)
    expect(store.user?.email).toBe('erik@example.com')
    expect(store.business?.name).toBe('Ma Boutique')
    expect(window.localStorage.getItem('facture_ia_access_token')).toBe('access-token-123')
    expect(window.localStorage.getItem('facture_ia_refresh_token')).toBe('refresh-token-456')
  })

  it("login() ne connecte pas l'utilisateur en cas d'identifiants invalides", async () => {
    vi.mocked(authService.login).mockRejectedValue({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Email ou mot de passe incorrect.'
    })

    const store = useAuthStore()
    await expect(
      store.login({ email: 'erik@example.com', password: 'mauvais' })
    ).rejects.toBeTruthy()
    expect(store.authenticated).toBe(false)
    expect(window.localStorage.getItem('facture_ia_access_token')).toBeNull()
  })

  it("logout() efface la session et les jetons persistes, meme si l'appel serveur echoue", async () => {
    vi.mocked(authService.login).mockResolvedValue(fakeAuthResponse())
    vi.mocked(authService.logout).mockRejectedValue(new Error('network error'))

    const store = useAuthStore()
    await store.login({ email: 'erik@example.com', password: 'password123' })
    expect(store.authenticated).toBe(true)

    // `logout()` propage l'echec serveur (pas de `catch` interne), mais la
    // session locale doit malgre tout etre nettoyee via son `finally`.
    await expect(store.logout()).rejects.toThrow()

    expect(store.authenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(window.localStorage.getItem('facture_ia_access_token')).toBeNull()
  })

  it("hasPermission() reflete les permissions de l'utilisateur connecte", async () => {
    vi.mocked(authService.login).mockResolvedValue(
      fakeAuthResponse({
        user: {
          ...fakeAuthResponse().user,
          permissions: ['invoice:read', 'client:read']
        }
      })
    )

    const store = useAuthStore()
    await store.login({ email: 'erik@example.com', password: 'password123' })

    expect(store.hasPermission('invoice:read')).toBe(true)
    expect(store.hasPermission('invoice:delete')).toBe(false)
    expect(store.hasAnyPermission(['invoice:delete', 'client:read'])).toBe(true)
  })

  it('setBusiness() met a jour le commerce actif sans toucher a la session utilisateur', async () => {
    vi.mocked(authService.login).mockResolvedValue(fakeAuthResponse())
    const store = useAuthStore()
    await store.login({ email: 'erik@example.com', password: 'password123' })

    const updatedBusiness = { ...fakeAuthResponse().business, name: 'Nouveau Nom' }
    store.setBusiness(updatedBusiness)

    expect(store.business?.name).toBe('Nouveau Nom')
    expect(store.authenticated).toBe(true)
  })
})
