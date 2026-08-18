import { adminAnalyticsService } from '@/services'

import { useApi } from './useApi'

/** Orchestre les indicateurs finance/analytics plateforme (tendance MRR, revenu par plan, churn, LTV). */
export function useAdminAnalytics() {
  const mrrTrend = useApi(adminAnalyticsService.getMrrTrend, { notifyOnError: false })
  const revenueByPlan = useApi(adminAnalyticsService.getRevenueByPlan, { notifyOnError: false })
  const churn = useApi(adminAnalyticsService.getChurn, { notifyOnError: false })
  const ltv = useApi(adminAnalyticsService.getLtv, { notifyOnError: false })

  async function load(): Promise<void> {
    await Promise.all([mrrTrend.execute(), revenueByPlan.execute(), churn.execute(), ltv.execute()])
  }

  return { mrrTrend, revenueByPlan, churn, ltv, load }
}
