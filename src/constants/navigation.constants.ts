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
  /** Cle i18n du libelle (voir `src/locales/*.json`, namespace `nav`) — resolue avec `t()` par les consommateurs, jamais affichee telle quelle. */
  labelKey: string
  routeName: string
  icon: LucideIcon
  /** Permission requise pour afficher l'entree; absente = toujours visible. */
  permission?: Permission
}

/** Elements de navigation principaux affiches dans la barre laterale. */
export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', routeName: ROUTE_NAMES.dashboard, icon: LayoutDashboard },
  {
    labelKey: 'nav.clients',
    routeName: ROUTE_NAMES.clients,
    icon: Users,
    permission: 'client:read'
  },
  {
    labelKey: 'nav.products',
    routeName: ROUTE_NAMES.products,
    icon: Package,
    permission: 'product:read'
  },
  {
    labelKey: 'nav.kits',
    routeName: ROUTE_NAMES.kits,
    icon: Layers,
    permission: 'product:read'
  },
  {
    labelKey: 'nav.quotes',
    routeName: ROUTE_NAMES.quotes,
    icon: ClipboardList,
    permission: 'invoice:read'
  },
  {
    labelKey: 'nav.invoices',
    routeName: ROUTE_NAMES.invoices,
    icon: FileText,
    permission: 'invoice:read'
  },
  {
    labelKey: 'nav.creditNotes',
    routeName: ROUTE_NAMES.creditNotes,
    icon: FileMinus,
    permission: 'invoice:read'
  },
  {
    labelKey: 'nav.payments',
    routeName: ROUTE_NAMES.payments,
    icon: Wallet,
    permission: 'payment:read'
  },
  {
    labelKey: 'nav.reports',
    routeName: ROUTE_NAMES.reports,
    icon: BarChart3,
    permission: 'report:read'
  },
  {
    labelKey: 'nav.team',
    routeName: ROUTE_NAMES.users,
    icon: UserCog,
    permission: 'user:manage'
  },
  {
    labelKey: 'nav.subscription',
    routeName: ROUTE_NAMES.subscription,
    icon: CreditCard,
    permission: 'subscription:read'
  },
  { labelKey: 'nav.settings', routeName: ROUTE_NAMES.settings, icon: Settings },
  { labelKey: 'nav.support', routeName: ROUTE_NAMES.support, icon: LifeBuoy }
]
