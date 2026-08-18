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
    changePassword: '/auth/change-password',
    changeEmail: '/auth/change-email',
    impersonateExchange: '/auth/impersonate-exchange'
  },
  users: {
    base: '/users',
    byId: (id: string) => `/users/${id}`,
    meLoginHistory: '/users/me/login-history',
    meExport: '/users/me/export',
    meAvatar: '/users/me/avatar',
    me: '/users/me'
  },
  business: {
    base: '/business',
    logo: '/business/logo',
    stamp: '/business/stamp',
    regenerateApiKey: '/business/api-key/regenerate',
    export: '/business/export'
  },
  clients: {
    base: '/clients',
    byId: (id: string) => `/clients/${id}`,
    import: '/clients/import',
    merge: '/clients/merge'
  },
  products: {
    base: '/products',
    byId: (id: string) => `/products/${id}`,
    image: (id: string) => `/products/${id}/image`,
    stockMovements: (id: string) => `/products/${id}/stock-movements`,
    stockAdjust: (id: string) => `/products/${id}/stock-adjust`,
    import: '/products/import'
  },
  invoices: {
    base: '/invoices',
    byId: (id: string) => `/invoices/${id}`,
    pdf: (id: string) => `/invoices/${id}/pdf`,
    send: (id: string) => `/invoices/${id}/send`
  },
  quotes: {
    base: '/quotes',
    byId: (id: string) => `/quotes/${id}`,
    convert: (id: string) => `/quotes/${id}/convert`
  },
  creditNotes: {
    base: '/credit-notes',
    byId: (id: string) => `/credit-notes/${id}`,
    byInvoice: (invoiceId: string) => `/invoices/${invoiceId}/credit-notes`
  },
  payments: {
    base: '/payments',
    byId: (id: string) => `/payments/${id}`,
    byInvoice: (invoiceId: string) => `/invoices/${invoiceId}/payments`,
    refund: (id: string) => `/payments/${id}/refund`
  },
  installmentPlans: {
    byInvoice: (invoiceId: string) => `/invoices/${invoiceId}/installment-plan`,
    payInstallment: (invoiceId: string, installmentId: string) =>
      `/invoices/${invoiceId}/installment-plan/${installmentId}/pay`
  },
  dashboard: {
    stats: '/dashboard/stats',
    revenue: '/dashboard/revenue',
    invoiceStatusBreakdown: '/dashboard/invoice-status-breakdown',
    paymentMethodBreakdown: '/dashboard/payment-method-breakdown',
    activity: '/dashboard/activity',
    alerts: '/dashboard/alerts'
  },
  subscription: {
    current: '/subscription',
    plans: '/subscription/plans',
    changePlan: '/subscription/change-plan',
    cancel: '/subscription/cancel',
    invoices: '/subscription/invoices',
    receipt: (id: string) => `/subscription/invoices/${id}/receipt`
  },
  reports: {
    summary: '/reports/summary',
    revenue: '/reports/revenue',
    revenueComparison: '/reports/revenue-comparison',
    invoiceStatus: '/reports/invoice-status',
    paymentMethods: '/reports/payment-methods',
    topProducts: '/reports/top-products',
    topClients: '/reports/top-clients',
    vat: '/reports/vat'
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
    impersonateBusiness: (id: string) => `/admin/businesses/${id}/impersonate`,
    applyDiscount: (id: string) => `/admin/businesses/${id}/discount`,
    auditLog: (businessId: string) => `/admin/businesses/${businessId}/audit-log`,
    globalAuditLog: '/admin/audit-log',
    plans: '/admin/plans',
    planById: (id: string) => `/admin/plans/${id}`,
    admins: '/admin/admins',
    adminById: (id: string) => `/admin/admins/${id}`,
    adminLoginHistory: '/admin/admins/login-history',
    notifications: '/admin/notifications',
    settings: '/admin/settings',
    supportTickets: '/admin/support/tickets',
    supportTicketById: (id: string) => `/admin/support/tickets/${id}`,
    supportTicketMessages: (id: string) => `/admin/support/tickets/${id}/messages`,
    supportTicketStatus: (id: string) => `/admin/support/tickets/${id}/status`,
    analyticsMrrTrend: '/admin/analytics/mrr-trend',
    analyticsRevenueByPlan: '/admin/analytics/revenue-by-plan',
    analyticsChurn: '/admin/analytics/churn',
    analyticsLtv: '/admin/analytics/ltv'
  },
  support: {
    tickets: '/support/tickets',
    ticketById: (id: string) => `/support/tickets/${id}`,
    ticketMessages: (id: string) => `/support/tickets/${id}/messages`
  }
} as const
