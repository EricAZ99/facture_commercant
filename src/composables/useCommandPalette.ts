import { FilePlus, type LucideIcon } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { NAV_ITEMS, ROUTE_NAMES } from '@/constants'
import { clientService, invoiceService, productService } from '@/services'
import type { Client, Invoice, Product } from '@/types'

import { usePermissions } from './usePermissions'

export interface CommandResult {
  id: string
  label: string
  sublabel?: string
  icon: LucideIcon
  action: () => void
}

const SEARCH_DEBOUNCE_MS = 250
const MAX_RESULTS_PER_ENTITY = 5

/**
 * Palette de commandes globale (Ctrl/Cmd+K) : navigation rapide vers les
 * sections autorisees + recherche d'entites (clients, produits, factures).
 * Etat module-level partage (une seule instance de palette dans toute
 * l'application, montee une fois dans `DashboardLayout`).
 */
export function useCommandPalette() {
  const router = useRouter()
  const { can } = usePermissions()

  const isOpen = ref(false)
  const query = ref('')
  const activeIndex = ref(0)
  const isSearching = ref(false)
  const entityResults = reactive<{ clients: Client[]; products: Product[]; invoices: Invoice[] }>({
    clients: [],
    products: [],
    invoices: []
  })

  function open(): void {
    isOpen.value = true
    query.value = ''
    activeIndex.value = 0
    entityResults.clients = []
    entityResults.products = []
    entityResults.invoices = []
  }

  function close(): void {
    isOpen.value = false
  }

  const navCommands = computed<CommandResult[]>(() =>
    NAV_ITEMS.filter((item) => !item.permission || can(item.permission)).map((item) => ({
      id: `nav-${item.routeName}`,
      label: item.label,
      icon: item.icon,
      action: () => router.push({ name: item.routeName })
    }))
  )

  const quickActions = computed<CommandResult[]>(() => {
    const actions: CommandResult[] = []
    if (can('invoice:create')) {
      actions.push({
        id: 'action-new-invoice',
        label: 'Nouvelle facture',
        icon: FilePlus,
        action: () => router.push({ name: ROUTE_NAMES.invoiceCreate })
      })
      actions.push({
        id: 'action-new-quote',
        label: 'Nouveau devis',
        icon: FilePlus,
        action: () => router.push({ name: ROUTE_NAMES.quoteCreate })
      })
    }
    return actions
  })

  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  function onQueryChange(value: string): void {
    query.value = value
    activeIndex.value = 0
    if (debounceTimer) clearTimeout(debounceTimer)
    if (value.trim().length < 2) {
      entityResults.clients = []
      entityResults.products = []
      entityResults.invoices = []
      return
    }
    debounceTimer = setTimeout(() => void runSearch(value.trim()), SEARCH_DEBOUNCE_MS)
  }

  async function runSearch(search: string): Promise<void> {
    isSearching.value = true
    try {
      const [clients, products, invoices] = await Promise.all([
        can('client:read')
          ? clientService.list({ search, perPage: MAX_RESULTS_PER_ENTITY })
          : Promise.resolve(null),
        can('product:read')
          ? productService.list({ search, perPage: MAX_RESULTS_PER_ENTITY })
          : Promise.resolve(null),
        can('invoice:read')
          ? invoiceService.list({ search, perPage: MAX_RESULTS_PER_ENTITY })
          : Promise.resolve(null)
      ])
      entityResults.clients = clients?.data ?? []
      entityResults.products = products?.data ?? []
      entityResults.invoices = invoices?.data ?? []
    } finally {
      isSearching.value = false
    }
  }

  const results = computed<CommandResult[]>(() => {
    const q = query.value.trim().toLowerCase()
    const staticResults = [...quickActions.value, ...navCommands.value].filter(
      (r) => !q || r.label.toLowerCase().includes(q)
    )

    const clientResults: CommandResult[] = entityResults.clients.map((client) => ({
      id: `client-${client.id}`,
      label: `${client.firstName} ${client.lastName}`,
      sublabel: 'Client',
      icon: NAV_ITEMS.find((n) => n.routeName === ROUTE_NAMES.clients)!.icon,
      action: () => router.push({ name: ROUTE_NAMES.clientDetail, params: { id: client.id } })
    }))
    const productResults: CommandResult[] = entityResults.products.map((product) => ({
      id: `product-${product.id}`,
      label: product.name,
      sublabel: 'Produit',
      icon: NAV_ITEMS.find((n) => n.routeName === ROUTE_NAMES.products)!.icon,
      action: () => router.push({ name: ROUTE_NAMES.productDetail, params: { id: product.id } })
    }))
    const invoiceResults: CommandResult[] = entityResults.invoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      label: invoice.number,
      sublabel: invoice.clientName ? `Facture — ${invoice.clientName}` : 'Facture',
      icon: NAV_ITEMS.find((n) => n.routeName === ROUTE_NAMES.invoices)!.icon,
      action: () => router.push({ name: ROUTE_NAMES.invoiceDetail, params: { id: invoice.id } })
    }))

    return [...staticResults, ...clientResults, ...productResults, ...invoiceResults]
  })

  function moveActive(delta: number): void {
    if (results.value.length === 0) return
    activeIndex.value = (activeIndex.value + delta + results.value.length) % results.value.length
  }

  function runActive(): void {
    const result = results.value[activeIndex.value]
    if (!result) return
    result.action()
    close()
  }

  return {
    isOpen,
    query,
    activeIndex,
    isSearching,
    results,
    open,
    close,
    onQueryChange,
    moveActive,
    runActive
  }
}
