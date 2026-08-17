/**
 * Noms de routes centralises (utilises avec `router.push({ name: ... })`)
 * pour eviter les chaines litterales eparpillees dans le code.
 */
export const ROUTE_NAMES = {
  login: 'login',
  register: 'register',
  forgotPassword: 'forgot-password',
  resetPassword: 'reset-password',
  dashboard: 'dashboard',
  clients: 'clients',
  clientDetail: 'client-detail',
  products: 'products',
  productDetail: 'product-detail',
  invoices: 'invoices',
  invoiceCreate: 'invoice-create',
  invoiceDetail: 'invoice-detail',
  payments: 'payments',
  reports: 'reports',
  users: 'users',
  subscription: 'subscription',
  settings: 'settings',
  notFound: 'not-found',
  forbidden: 'forbidden',
  adminLogin: 'admin-login',
  adminDashboard: 'admin-dashboard',
  adminBusinesses: 'admin-businesses',
  adminBusinessDetail: 'admin-business-detail',
  adminPlans: 'admin-plans'
} as const
