import {
  BarChart3,
  ClipboardList,
  CreditCard,
  FileMinus,
  FileText,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Settings,
  UserCog,
  Users,
  Wallet,
  type LucideIcon
} from 'lucide-vue-next'

import type { Permission } from '@/types'

import { ROUTE_NAMES } from './route.constants'

export interface NavItem {
  label: string
  routeName: string
  icon: LucideIcon
  /** Permission requise pour afficher l'entree; absente = toujours visible. */
  permission?: Permission
}

/** Elements de navigation principaux affiches dans la barre laterale. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', routeName: ROUTE_NAMES.dashboard, icon: LayoutDashboard },
  { label: 'Clients', routeName: ROUTE_NAMES.clients, icon: Users, permission: 'client:read' },
  {
    label: 'Produits',
    routeName: ROUTE_NAMES.products,
    icon: Package,
    permission: 'product:read'
  },
  {
    label: 'Kits',
    routeName: ROUTE_NAMES.kits,
    icon: Layers,
    permission: 'product:read'
  },
  {
    label: 'Devis',
    routeName: ROUTE_NAMES.quotes,
    icon: ClipboardList,
    permission: 'invoice:read'
  },
  {
    label: 'Factures',
    routeName: ROUTE_NAMES.invoices,
    icon: FileText,
    permission: 'invoice:read'
  },
  {
    label: 'Avoirs',
    routeName: ROUTE_NAMES.creditNotes,
    icon: FileMinus,
    permission: 'invoice:read'
  },
  {
    label: 'Paiements',
    routeName: ROUTE_NAMES.payments,
    icon: Wallet,
    permission: 'payment:read'
  },
  {
    label: 'Rapports',
    routeName: ROUTE_NAMES.reports,
    icon: BarChart3,
    permission: 'report:read'
  },
  {
    label: 'Equipe',
    routeName: ROUTE_NAMES.users,
    icon: UserCog,
    permission: 'user:manage'
  },
  {
    label: 'Abonnement',
    routeName: ROUTE_NAMES.subscription,
    icon: CreditCard,
    permission: 'subscription:read'
  },
  { label: 'Parametres', routeName: ROUTE_NAMES.settings, icon: Settings },
  { label: 'Support', routeName: ROUTE_NAMES.support, icon: LifeBuoy }
]
