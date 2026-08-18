import { computed, ref } from 'vue'

import { dashboardService, invoiceService } from '@/services'
import type { DashboardPeriod } from '@/types'

import { useApi } from './useApi'

/** Options du filtre de periode, dans l'ordre d'affichage attendu. */
export const DASHBOARD_PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '3m', label: '3 mois' },
  { value: 'year', label: 'Année' }
]

const DEFAULT_PERIOD: DashboardPeriod = '30d'
const RECENT_INVOICES_LIMIT = 5
const RECENT_ACTIVITY_LIMIT = 8

/**
 * Orchestre les donnees du tableau de bord commercant : indicateurs cles,
 * evolution du CA, repartition des paiements (tous sensibles au filtre de
 * periode), et listes independantes de la periode (dernieres factures,
 * activite recente).
 *
 * Chaque section garde son propre etat loading/error/success (via `useApi`)
 * pour rester decouplee des autres — un widget en erreur n'affecte pas les
 * autres. Le detail des messages d'erreur est deja gere par `useApi`; ici
 * on desactive le toast automatique car chaque widget affiche sa propre
 * erreur inline (voir `DashboardPage.vue`).
 */
export function useDashboard() {
  const period = ref<DashboardPeriod>(DEFAULT_PERIOD)
  /** Devient vrai des que le tout premier chargement s'est termine (succes ou echec). */
  const hasLoadedOnce = ref(false)

  const stats = useApi(dashboardService.getStats, { notifyOnError: false })
  const revenue = useApi(dashboardService.getRevenueEvolution, { notifyOnError: false })
  const paymentBreakdown = useApi(dashboardService.getPaymentMethodBreakdown, {
    notifyOnError: false
  })
  const recentInvoices = useApi(invoiceService.list, { notifyOnError: false })
  const recentActivity = useApi(dashboardService.getRecentActivity, { notifyOnError: false })
  // Independantes de la periode : les alertes portent sur l'etat actuel du
  // commerce (factures en retard, stock, abonnement), pas sur une fenetre
  // temporelle choisie par l'utilisateur.
  const alerts = useApi(dashboardService.getAlerts, { notifyOnError: false })

  // Un seul controleur pour les 3 appels lies a la periode : changer de
  // periode annule immediatement toute requete en vol pour cette periode,
  // evitant qu'une reponse lente et perimee n'ecrase une reponse plus recente.
  let periodController: AbortController | null = null

  async function loadPeriodScopedData(targetPeriod: DashboardPeriod): Promise<void> {
    periodController?.abort()
    const controller = new AbortController()
    periodController = controller

    await Promise.all([
      stats.execute({ period: targetPeriod, signal: controller.signal }),
      revenue.execute({ period: targetPeriod, signal: controller.signal }),
      paymentBreakdown.execute({ period: targetPeriod, signal: controller.signal })
    ])
  }

  function loadRecentData(): Promise<unknown> {
    return Promise.all([
      recentInvoices.execute({
        page: 1,
        perPage: RECENT_INVOICES_LIMIT,
        sortBy: 'issueDate',
        sortOrder: 'desc'
      }),
      recentActivity.execute({ limit: RECENT_ACTIVITY_LIMIT }),
      alerts.execute()
    ])
  }

  /** Recharge tout (periode + listes recentes). A utiliser au montage et sur "Actualiser". */
  async function refresh(): Promise<void> {
    await Promise.all([loadPeriodScopedData(period.value), loadRecentData()])
    hasLoadedOnce.value = true
  }

  /** Change de periode et ne recharge que si elle differe reellement de l'actuelle. */
  function setPeriod(next: DashboardPeriod): void {
    if (next === period.value) return
    period.value = next
    void loadPeriodScopedData(next)
  }

  const isInitialLoading = computed(() => !hasLoadedOnce.value && stats.isLoading.value)
  const isRefreshing = computed(
    () =>
      hasLoadedOnce.value &&
      (stats.isLoading.value ||
        revenue.isLoading.value ||
        paymentBreakdown.isLoading.value ||
        recentInvoices.isLoading.value ||
        recentActivity.isLoading.value ||
        alerts.isLoading.value)
  )
  /** Echec bloquant : meme l'indicateur principal (stats) n'a jamais pu etre charge. */
  const hasFatalError = computed(
    () => hasLoadedOnce.value && stats.isError.value && stats.data.value === null
  )
  /** Commerce sans aucune activite (facture, client, produit) : encart d'accueil plutot que des graphiques vides. */
  const isEmpty = computed(() => {
    const s = stats.data.value
    return s !== null && s.invoicesCount === 0 && s.clientsCount === 0 && s.productsCount === 0
  })

  return {
    period,
    periodOptions: DASHBOARD_PERIOD_OPTIONS,
    setPeriod,
    refresh,
    stats,
    revenue,
    paymentBreakdown,
    recentInvoices,
    recentActivity,
    alerts,
    isInitialLoading,
    isRefreshing,
    hasFatalError,
    isEmpty
  }
}
