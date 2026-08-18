/**
 * Export visuel du tableau de bord tel qu'affiche a l'ecran (capture DOM),
 * a des fins de partage/archivage rapide. A bien distinguer des documents
 * officiels (factures) : ceux-la ne sont JAMAIS generes cote client — voir
 * `services/invoice.actions.ts`. Une capture de tableau de bord n'est pas
 * un document legal, ce n'est qu'une image de l'ecran courant.
 *
 * `html2canvas`/`jspdf` (~770 Ko a eux deux) sont importes dynamiquement,
 * uniquement au moment ou l'utilisateur declenche reellement un export —
 * jamais charges avec la page Tableau de bord elle-meme.
 */

async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas')
  return html2canvas(element, {
    backgroundColor: '#f9fafb',
    scale: 2,
    useCORS: true
  })
}

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportElementAsPng(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await captureElement(element)
  const url = canvas.toDataURL('image/png')
  triggerDownload(url, filename)
}

export async function exportElementAsPdf(element: HTMLElement, filename: string): Promise<void> {
  const [canvas, { jsPDF }] = await Promise.all([captureElement(element), import('jspdf')])
  const imageData = canvas.toDataURL('image/png')

  // Une page PDF a la meme proportion que la capture, en format portrait ou
  // paysage selon ce qui correspond le mieux au contenu du tableau de bord.
  const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'pt', format: [canvas.width, canvas.height] })
  pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(filename)
}
