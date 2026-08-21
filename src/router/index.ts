import { watch } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { ROUTE_NAMES } from '@/constants'
import { useAdminAuthStore, useAuthStore } from '@/stores'
import type { Permission } from '@/types'

declare module 'vue-router' {
  interface RouteMeta {
    /** Route accessible uniquement a un utilisateur authentifie. */
    requiresAuth?: boolean
    /** Route accessible uniquement a un visiteur non authentifie. */
    guestOnly?: boolean
    /** Permission requise pour acceder a la route (en plus de `requiresAuth`). */
    permission?: Permission
    /**
     * Route de l'espace admin plateforme, accessible uniquement a un admin
     * authentifie. Realm entierement separe de `requiresAuth`/`permission`
     * (identite, session et jetons distincts — voir `stores/adminAuth.store.ts`).
     */
    adminRequiresAuth?: boolean
    /** Route de l'espace admin accessible uniquement a un admin non authentifie. */
    adminGuestOnly?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: ROUTE_NAMES.dashboard,
        component: () => import('@/pages/DashboardPage.vue')
      },
      {
        path: 'clients',
        name: ROUTE_NAMES.clients,
        component: () => import('@/pages/ClientsPage.vue'),
        meta: { permission: 'client:read' }
      },
      {
        path: 'clients/:id',
        name: ROUTE_NAMES.clientDetail,
        component: () => import('@/pages/ClientDetailPage.vue'),
        props: true,
        meta: { permission: 'client:read' }
      },
      {
        path: 'products',
        name: ROUTE_NAMES.products,
        component: () => import('@/pages/ProductsPage.vue'),
        meta: { permission: 'product:read' }
      },
      {
        path: 'products/:id',
        name: ROUTE_NAMES.productDetail,
        component: () => import('@/pages/ProductDetailPage.vue'),
        props: true,
        meta: { permission: 'product:read' }
      },
      {
        path: 'kits',
        name: ROUTE_NAMES.kits,
        component: () => import('@/pages/KitsPage.vue'),
        meta: { permission: 'product:read' }
      },
      {
        path: 'kits/:id',
        name: ROUTE_NAMES.kitDetail,
        component: () => import('@/pages/KitDetailPage.vue'),
        props: true,
        meta: { permission: 'product:read' }
      },
      {
        path: 'invoices',
        name: ROUTE_NAMES.invoices,
        component: () => import('@/pages/InvoicesPage.vue'),
        meta: { permission: 'invoice:read' }
      },
      {
        // Doit rester declare avant `invoices/:id` : Vue Router priorise
        // deja les segments statiques sur les segments dynamiques, mais on
        // le garde explicite pour la lisibilite.
        path: 'invoices/create',
        name: ROUTE_NAMES.invoiceCreate,
        component: () => import('@/pages/InvoiceCreatePage.vue'),
        meta: { permission: 'invoice:create' }
      },
      {
        path: 'invoices/:id',
        name: ROUTE_NAMES.invoiceDetail,
        component: () => import('@/pages/InvoiceDetailPage.vue'),
        props: true,
        meta: { permission: 'invoice:read' }
      },
      {
        path: 'quotes',
        name: ROUTE_NAMES.quotes,
        component: () => import('@/pages/QuotesPage.vue'),
        meta: { permission: 'invoice:read' }
      },
      {
        // Meme remarque que pour `invoices/create` : ordre statique/dynamique.
        path: 'quotes/create',
        name: ROUTE_NAMES.quoteCreate,
        component: () => import('@/pages/QuoteCreatePage.vue'),
        meta: { permission: 'invoice:create' }
      },
      {
        path: 'quotes/:id',
        name: ROUTE_NAMES.quoteDetail,
        component: () => import('@/pages/QuoteDetailPage.vue'),
        props: true,
        meta: { permission: 'invoice:read' }
      },
      {
        path: 'credit-notes',
        name: ROUTE_NAMES.creditNotes,
        component: () => import('@/pages/CreditNotesPage.vue'),
        meta: { permission: 'invoice:read' }
      },
      {
        path: 'payments',
        name: ROUTE_NAMES.payments,
        component: () => import('@/pages/PaymentsPage.vue'),
        meta: { permission: 'payment:read' }
      },
      {
        path: 'reports',
        name: ROUTE_NAMES.reports,
        component: () => import('@/pages/ReportsPage.vue'),
        meta: { permission: 'report:read' }
      },
      {
        path: 'users',
        name: ROUTE_NAMES.users,
        component: () => import('@/pages/UsersPage.vue'),
        meta: { permission: 'user:manage' }
      },
      {
        path: 'subscription',
        name: ROUTE_NAMES.subscription,
        component: () => import('@/pages/SubscriptionPage.vue'),
        meta: { permission: 'subscription:read' }
      },
      {
        path: 'settings',
        name: ROUTE_NAMES.settings,
        component: () => import('@/pages/SettingsPage.vue')
      },
      {
        path: 'support',
        name: ROUTE_NAMES.support,
        component: () => import('@/pages/SupportPage.vue')
      },
      {
        path: 'support/:id',
        name: ROUTE_NAMES.supportDetail,
        component: () => import('@/pages/SupportDetailPage.vue'),
        props: true
      }
    ]
  },
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { guestOnly: true },
    children: [
      {
        path: 'login',
        name: ROUTE_NAMES.login,
        component: () => import('@/pages/auth/LoginPage.vue')
      },
      {
        path: 'register',
        name: ROUTE_NAMES.register,
        component: () => import('@/pages/auth/RegisterPage.vue')
      },
      {
        path: 'forgot-password',
        name: ROUTE_NAMES.forgotPassword,
        component: () => import('@/pages/auth/ForgotPasswordPage.vue')
      },
      {
        path: 'reset-password',
        name: ROUTE_NAMES.resetPassword,
        component: () => import('@/pages/auth/ResetPasswordPage.vue')
      }
    ]
  },
  {
    // Espace admin plateforme : back-office operateur, hors du realm
    // d'authentification commercant (voir la note sur `adminRequiresAuth`
    // ci-dessus). Prefixe `/admin` dedie, jamais melange aux routes commerce.
    path: '/admin/login',
    name: ROUTE_NAMES.adminLogin,
    component: () => import('@/pages/admin/AdminLoginPage.vue'),
    meta: { adminGuestOnly: true }
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { adminRequiresAuth: true },
    children: [
      {
        path: '',
        name: ROUTE_NAMES.adminDashboard,
        component: () => import('@/pages/admin/AdminDashboardPage.vue')
      },
      {
        path: 'businesses',
        name: ROUTE_NAMES.adminBusinesses,
        component: () => import('@/pages/admin/AdminBusinessesPage.vue')
      },
      {
        path: 'businesses/:id',
        name: ROUTE_NAMES.adminBusinessDetail,
        component: () => import('@/pages/admin/AdminBusinessDetailPage.vue'),
        props: true
      },
      {
        path: 'plans',
        name: ROUTE_NAMES.adminPlans,
        component: () => import('@/pages/admin/AdminPlansPage.vue')
      },
      {
        path: 'admins',
        name: ROUTE_NAMES.adminAdmins,
        component: () => import('@/pages/admin/AdminAdminsPage.vue')
      },
      {
        path: 'support',
        name: ROUTE_NAMES.adminSupport,
        component: () => import('@/pages/admin/AdminSupportPage.vue')
      },
      {
        path: 'support/:id',
        name: ROUTE_NAMES.adminSupportDetail,
        component: () => import('@/pages/admin/AdminSupportDetailPage.vue'),
        props: true
      },
      {
        path: 'settings',
        name: ROUTE_NAMES.adminSettings,
        component: () => import('@/pages/admin/AdminSettingsPage.vue')
      }
    ]
  },
  {
    path: '/403',
    name: ROUTE_NAMES.forbidden,
    component: () => import('@/pages/ForbiddenPage.vue')
  },
  {
    // Echange un ticket de mode "apercu" admin contre une session
    // commercant : accessible independamment de l'etat d'authentification
    // courant (voir `ImpersonatePage.vue`), jamais sous `requiresAuth`/`guestOnly`.
    path: '/apercu/:ticket',
    name: ROUTE_NAMES.impersonate,
    component: () => import('@/pages/ImpersonatePage.vue'),
    props: true
  },
  {
    // Lien public de consultation d'une facture (voir `InvoiceShareDialog.vue`) :
    // le visiteur est le client de la facture, jamais authentifie. Route
    // publique independante de `requiresAuth`/`guestOnly`, comme `/apercu/:ticket`.
    path: '/facture/:token',
    name: ROUTE_NAMES.publicInvoice,
    component: () => import('@/pages/PublicInvoicePage.vue'),
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAMES.notFound,
    component: () => import('@/pages/NotFoundPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

/**
 * Attend la fin de la restauration de session (`fetchCurrentUser`/
 * `fetchCurrentAdmin`, lancees au demarrage dans `main.ts`) avant de
 * laisser passer la toute premiere navigation. Sans cela, sur un
 * rechargement complet d'une route protegee, le guard s'executerait AVANT
 * que le token persiste en localStorage ait pu etre verifie aupres du
 * backend (session encore `null`), et renverrait a tort vers la connexion
 * malgre une session valide. Generique : fonctionne pour le store commercant
 * comme pour le store admin, tous deux exposant `isInitializing`.
 */
function waitForInitialization(store: { isInitializing: boolean }): Promise<void> {
  if (!store.isInitializing) return Promise.resolve()

  return new Promise((resolve) => {
    const stopWatching = watch(
      () => store.isInitializing,
      (stillInitializing) => {
        if (!stillInitializing) {
          stopWatching()
          resolve()
        }
      }
    )
  })
}

router.beforeEach(async (to) => {
  // Realm admin plateforme : entierement separe du realm commercant
  // ci-dessous (pas de notion de permission, une seule identite d'admin).
  if (to.meta.adminRequiresAuth || to.meta.adminGuestOnly) {
    const adminAuthStore = useAdminAuthStore()
    await waitForInitialization(adminAuthStore)

    if (to.meta.adminRequiresAuth && !adminAuthStore.authenticated) {
      return { name: ROUTE_NAMES.adminLogin, query: { redirect: to.fullPath } }
    }
    if (to.meta.adminGuestOnly && adminAuthStore.authenticated) {
      return { name: ROUTE_NAMES.adminDashboard }
    }
    return true
  }

  const authStore = useAuthStore()
  await waitForInitialization(authStore)

  if (to.meta.requiresAuth && !authStore.authenticated) {
    return { name: ROUTE_NAMES.login, query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && authStore.authenticated) {
    return { name: ROUTE_NAMES.dashboard }
  }

  if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
    return { name: ROUTE_NAMES.forbidden }
  }

  return true
})

export default router
