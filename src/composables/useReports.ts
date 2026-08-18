import { computed, reactive, ref } from 'vue'

import { reportService } from '@/services'
import type { Client, InvoiceStatus, Product, ReportPeriod } from '@/types'

import { useApi } from './useApi'

/** Options du filtre de periode, dans l'ordre d'affichage attendu. */
export const REPORT_PERIOD_OPTIONS: Array<{ value: ReportPeriod; label: string }> = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '3m', label: '3 mois' },
  { value: 'year', label: 'Année' }
]

const DEFAULT_PERIOD: ReportPeriod = '30d'

interface ReportFiltersState {
  period: ReportPeriod
  productId: string
  clientId: string
  status: InvoiceStatus | ''
  /** Superpose la periode precedente de meme duree sur le graphique de CA. */
  comparePrevious: boolean
}

/**
 * Orchestre les rapports du commerce : synthese, evolution du chiffre
 * d'affaires, repartition des factures/paiements, produits les plus vendus
 * et meilleurs clients. Chaque section reste une requete independante (voir
 * `report.service.ts`) avec son propre etat loading/erreur/succes ; un seul
 * `AbortController` partage les 6 requetes liees aux filtres, pour annuler
 * immediatement toute requete en vol des qu'un filtre change (evite qu'une
 * reponse perimee n'ecrase une reponse plus recente, et evite le gaspillage
 * reseau lors de changements rapides de filtre).
 */
export function useReports() {
  const filters = reactive<ReportFiltersState>({
    period: DEFAULT_PERIOD,
    productId: '',
    clientId: '',
    status: '',
    comparePrevious: false
  })
  const selectedProduct = ref<Product | null>(null)
  const selectedClient = ref<Client | null>(null)
  /** Devient vrai des que le tout premier chargement s'est termine (succes ou echec). */
  const hasLoadedOnce = ref(false)

  const summary = useApi(reportService.getSummary, { notifyOnError: false })
  const revenue = useApi(reportService.getRevenueEvolution, { notifyOnError: false })
  const previousRevenue = useApi(reportService.getRevenueComparison, { notifyOnError: false })
  const invoiceStatus = useApi(reportService.getInvoiceStatusBreakdown, { notifyOnError: false })
  const paymentMethods = useApi(reportService.getPaymentMethodBreakdown, { notifyOnError: false })
  const topProducts = useApi(reportService.getTopProducts, { notifyOnError: false })
  const topClients = useApi(reportService.getTopClients, { notifyOnError: false })
  const vat = useApi(reportService.getVatBreakdown, { notifyOnError: false })

  /**
   * Projection simple : chiffre d'affaires moyen par jour observe sur la
   * periode, extrapole sur 30 jours. Uniquement pertinent pour une fenetre
   * en jours (today/7d/30d) — une semaine ou un mois "moyen" n'a pas de sens
   * pour des buckets hebdomadaires/mensuels (3m/year), donc masque alors.
   */
  const monthlyProjection = computed(() => {
    if (!['today', '7d', '30d'].includes(filters.period)) return null
    const points = revenue.data.value
    if (!points || points.length === 0) return null
    const total = points.reduce((sum, p) => sum + p.amount, 0)
    const avgPerDay = total / points.length
    return Math.round(avgPerDay * 30)
  })

  let controller: AbortController | null = null

  /** Recharge les 6 sections avec les filtres courants. A utiliser au montage et sur chaque changement de filtre. */
  async function refresh(): Promise<void> {
    controller?.abort()
    const activeController = new AbortController()
    controller = activeController

    const params = {
      period: filters.period,
      productId: filters.productId || undefined,
      clientId: filters.clientId || undefined,
      status: filters.status || undefined,
      signal: activeController.signal
    }

    await Promise.all([
      summary.execute(params),
      revenue.execute(params),
      invoiceStatus.execute(params),
      paymentMethods.execute(params),
      topProducts.execute(params),
      topClients.execute(params),
      vat.execute(params),
      filters.comparePrevious ? previousRevenue.execute(params) : Promise.resolve(null)
    ])
    hasLoadedOnce.value = true
  }

  function toggleComparePrevious(): void {
    filters.comparePrevious = !filters.comparePrevious
    if (!filters.comparePrevious) {
      previousRevenue.reset()
      return
    }
    void refresh()
  }

  function setPeriod(period: ReportPeriod): void {
    if (period === filters.period) return
    filters.period = period
    void refresh()
  }

  function setProductFilter(product: Product | null): void {
    if (product?.id === selectedProduct.value?.id) return
    selectedProduct.value = product
    filters.productId = product?.id ?? ''
    void refresh()
  }

  function setClientFilter(client: Client | null): void {
    if (client?.id === selectedClient.value?.id) return
    selectedClient.value = client
    filters.clientId = client?.id ?? ''
    void refresh()
  }

  function setStatusFilter(status: InvoiceStatus | ''): void {
    if (status === filters.status) return
    filters.status = status
    void refresh()
  }

  function resetFilters(): void {
    filters.period = DEFAULT_PERIOD
    filters.productId = ''
    filters.clientId = ''
    filters.status = ''
    filters.comparePrevious = false
    selectedProduct.value = null
    selectedClient.value = null
    previousRevenue.reset()
    void refresh()
  }

  const isInitialLoading = computed(() => !hasLoadedOnce.value && summary.isLoading.value)
  const isRefreshing = computed(
    () =>
      hasLoadedOnce.value &&
      (summary.isLoading.value ||
        revenue.isLoading.value ||
        invoiceStatus.isLoading.value ||
        paymentMethods.isLoading.value ||
        topProducts.isLoading.value ||
        topClients.isLoading.value ||
        vat.isLoading.value)
  )
  /** Echec bloquant : meme l'indicateur principal (synthese) n'a jamais pu etre charge. */
  const hasFatalError = computed(
    () => hasLoadedOnce.value && summary.isError.value && summary.data.value === null
  )
  /** Aucune donnee sur la periode/les filtres selectionnes. */
  const isEmpty = computed(() => {
    const data = summary.data.value
    return data !== null && data.invoicesCount === 0 && data.salesCount === 0
  })

  return {
    filters,
    selectedProduct,
    selectedClient,
    periodOptions: REPORT_PERIOD_OPTIONS,
    summary,
    revenue,
    previousRevenue,
    invoiceStatus,
    paymentMethods,
    topProducts,
    topClients,
    vat,
    monthlyProjection,
    isInitialLoading,
    isRefreshing,
    hasFatalError,
    isEmpty,
    setPeriod,
    setProductFilter,
    setClientFilter,
    setStatusFilter,
    toggleComparePrevious,
    resetFilters,
    refresh
  }
}
