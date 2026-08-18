import { ref } from 'vue'

import { exportElementAsPdf, exportElementAsPng } from '@/utils/dashboardExport'

import { useToast } from './useToast'

function timestampedFilename(extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10)
  return `rapport-${stamp}.${extension}`
}

/** Export du rapport affiche a l'ecran, en image, en PDF, ou en CSV (tableaux sous-jacents). */
export function useReportExport() {
  const toast = useToast()
  const isExporting = ref(false)

  async function exportAsPng(element: HTMLElement | null): Promise<void> {
    if (!element) return
    isExporting.value = true
    try {
      await exportElementAsPng(element, timestampedFilename('png'))
    } catch {
      toast.error("L'export du rapport a echoue.")
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
      toast.error("L'export du rapport a echoue.")
    } finally {
      isExporting.value = false
    }
  }

  return { isExporting, exportAsPng, exportAsPdf }
}
