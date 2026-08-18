import { ref } from 'vue'

import { exportElementAsPdf, exportElementAsPng } from '@/utils/dashboardExport'

import { useToast } from './useToast'

function timestampedFilename(extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10)
  return `tableau-de-bord-${stamp}.${extension}`
}

/** Export du tableau de bord affiche a l'ecran, en image ou en PDF. */
export function useDashboardExport() {
  const toast = useToast()
  const isExporting = ref(false)

  async function exportAsPng(element: HTMLElement | null): Promise<void> {
    if (!element) return
    isExporting.value = true
    try {
      await exportElementAsPng(element, timestampedFilename('png'))
    } catch {
      toast.error("L'export du tableau de bord a echoue.")
    } finally {
      isExporting.value = false
    }
  }

  async function exportAsPdf(element: HTMLElement | null): Promise<void> {
    if (!element) return
    isExporting.value = true
    try {
      await exportElementAsPdf(element, timestampedFilename('pdf'))
    } catch {
      toast.error("L'export du tableau de bord a echoue.")
    } finally {
      isExporting.value = false
    }
  }

  return { isExporting, exportAsPng, exportAsPdf }
}
