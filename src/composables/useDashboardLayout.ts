import { computed, ref, watch } from 'vue'

import { STORAGE_KEYS } from '@/constants'
import { storage } from '@/utils/storage'

/** Identifiant stable de chaque widget deplaçable/masquable du tableau de bord. */
export type DashboardWidgetId =
  | 'kpis'
  | 'alerts'
  | 'salesTarget'
  | 'revenueChart'
  | 'paymentBreakdown'
  | 'recentInvoices'
  | 'recentActivity'

/** Ordre et visibilite par defaut, avant toute personnalisation. */
const DEFAULT_WIDGET_ORDER: DashboardWidgetId[] = [
  'kpis',
  'alerts',
  'salesTarget',
  'revenueChart',
  'paymentBreakdown',
  'recentInvoices',
  'recentActivity'
]

const ALL_WIDGET_IDS = new Set<DashboardWidgetId>(DEFAULT_WIDGET_ORDER)

interface StoredLayout {
  order: DashboardWidgetId[]
  hidden: DashboardWidgetId[]
}

function loadStoredLayout(): StoredLayout {
  const raw = storage.get(STORAGE_KEYS.dashboardLayout)
  if (!raw) return { order: [...DEFAULT_WIDGET_ORDER], hidden: [] }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredLayout>
    const storedOrder = Array.isArray(parsed.order)
      ? parsed.order.filter((id) => ALL_WIDGET_IDS.has(id))
      : []
    // Ajoute a la fin tout widget introduit depuis (nouvelle version de
    // l'app) qui ne serait pas encore dans l'ordre sauvegarde localement.
    const missing = DEFAULT_WIDGET_ORDER.filter((id) => !storedOrder.includes(id))
    const hidden = Array.isArray(parsed.hidden)
      ? parsed.hidden.filter((id) => ALL_WIDGET_IDS.has(id))
      : []
    return { order: [...storedOrder, ...missing], hidden }
  } catch {
    return { order: [...DEFAULT_WIDGET_ORDER], hidden: [] }
  }
}

/**
 * Disposition personnalisable du tableau de bord : ordre des widgets (glisser-
 * deposer) et visibilite (masquer/afficher), persistes en local (preference
 * d'affichage propre a ce navigateur, jamais synchronisee cote serveur).
 */
export function useDashboardLayout() {
  const initial = loadStoredLayout()
  const order = ref<DashboardWidgetId[]>(initial.order)
  const hidden = ref<Set<DashboardWidgetId>>(new Set(initial.hidden))
  const isEditing = ref(false)

  watch(
    [order, hidden],
    () => {
      const payload: StoredLayout = { order: order.value, hidden: [...hidden.value] }
      storage.set(STORAGE_KEYS.dashboardLayout, JSON.stringify(payload))
    },
    { deep: true }
  )

  /** Widgets visibles, dans l'ordre choisi — ce que le tableau de bord doit reellement afficher. */
  const visibleOrder = computed(() => order.value.filter((id) => !hidden.value.has(id)))

  function isHidden(id: DashboardWidgetId): boolean {
    return hidden.value.has(id)
  }

  function toggleVisibility(id: DashboardWidgetId): void {
    const next = new Set(hidden.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    hidden.value = next
  }

  /** Deplace le widget `draggedId` juste avant/apres `targetId` selon leur position relative actuelle. */
  function moveWidget(draggedId: DashboardWidgetId, targetId: DashboardWidgetId): void {
    if (draggedId === targetId) return
    const next = [...order.value]
    const fromIndex = next.indexOf(draggedId)
    const toIndex = next.indexOf(targetId)
    if (fromIndex === -1 || toIndex === -1) return

    next.splice(fromIndex, 1)
    next.splice(toIndex, 0, draggedId)
    order.value = next
  }

  function resetLayout(): void {
    order.value = [...DEFAULT_WIDGET_ORDER]
    hidden.value = new Set()
  }

  function toggleEditing(): void {
    isEditing.value = !isEditing.value
  }

  return {
    order,
    visibleOrder,
    isEditing,
    isHidden,
    toggleVisibility,
    moveWidget,
    resetLayout,
    toggleEditing
  }
}
