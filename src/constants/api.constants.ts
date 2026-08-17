/**
 * Endpoints API centralises.
 *
 * Toute URL d'appel backend doit etre definie ici et consommee uniquement
 * depuis la couche `services/`. Aucune page ni composant ne doit
 * construire une URL d'API en dur.
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password'
  },
  users: {
    base: '/users',
    byId: (id: string) => `/users/${id}`
  },
  business: {
    base: '/business',
    logo: '/business/logo'
  },
  clients: {
    base: '/clients',
    byId: (id: string) => `/clients/${id}`
  },
  products: {
    base: '/products',
    byId: (id: string) => `/products/${id}`
  },
  invoices: {
    base: '/invoices',
    byId: (id: string) => `/invoices/${id}`,
    pdf: (id: string) => `/invoices/${id}/pdf`,
    send: (id: string) => `/invoices/${id}/send`
  },
  payments: {
    base: '/payments',
    byId: (id: string) => `/payments/${id}`,
    byInvoice: (invoiceId: string) => `/invoices/${invoiceId}/payments`
  },
  dashboard: {
    stats: '/dashboard/stats',
    revenue: '/dashboard/revenue',
    invoiceStatusBreakdown: '/dashboard/invoice-status-breakdown',
    paymentMethodBreakdown: '/dashboard/payment-method-breakdown',
    activity: '/dashboard/activity'
  },
  subscription: {
    current: '/subscription',
    plans: '/subscription/plans',
    changePlan: '/subscription/change-plan',
    cancel: '/subscription/cancel'
  },
  reports: {
    summary: '/reports/summary',
    revenue: '/reports/revenue',
    invoiceStatus: '/reports/invoice-status',
    paymentMethods: '/reports/payment-methods',
    topProducts: '/reports/top-products',
    topClients: '/reports/top-clients'
  },
  /**
   * Espace admin plateforme (back-office operateur, distinct des commercants
   * eux-memes). Realm d'authentification separe : voir `adminAuth`.
   */
  adminAuth: {
    login: '/admin/auth/login',
    logout: '/admin/auth/logout',
    refresh: '/admin/auth/refresh',
    me: '/admin/auth/me'
  },
  admin: {
    stats: '/admin/stats',
    businesses: '/admin/businesses',
    businessById: (id: string) => `/admin/businesses/${id}`,
    suspendBusiness: (id: string) => `/admin/businesses/${id}/suspend`,
    changeBusinessPlan: (id: string) => `/admin/businesses/${id}/plan`,
    auditLog: (businessId: string) => `/admin/businesses/${businessId}/audit-log`,
    plans: '/admin/plans',
    planById: (id: string) => `/admin/plans/${id}`
  }
} as const
