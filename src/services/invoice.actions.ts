import type { Invoice } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

import { invoiceDownloadService } from './invoiceDownload.service'

/**
 * Actions reutilisables sur une facture : telecharger, ouvrir, imprimer,
 * partager, envoyer par email ou par WhatsApp. Regroupees ici pour etre
 * appelees indifferemment depuis la liste ou le detail d'une facture (voir
 * `useInvoiceActions` dans `composables/useInvoices.ts` pour l'etat
 * loading/succes/erreur associe a chaque action).
 *
 * Regle d'architecture : aucune action ne genere de PDF cote frontend.
 * Telecharger/ouvrir/imprimer s'appuient tous sur le PDF officiel recupere
 * via `invoiceDownloadService` (donc sur l'API). Seuls le partage
 * texte (WhatsApp/email) construisent un resume minimal cote client, sans
 * jamais recreer le document lui-meme.
 */

const OBJECT_URL_REVOKE_DELAY_MS = 60_000

/** Telecharge le PDF officiel de la facture (delegue a `invoiceDownloadService`). */
async function downloadInvoicePdf(invoice: Pick<Invoice, 'id' | 'number'>): Promise<void> {
  await invoiceDownloadService.downloadPdf(invoice)
}

/** Ouvre le PDF officiel dans un nouvel onglet, pour consultation sans telechargement force. */
async function openInvoicePdf(invoice: Pick<Invoice, 'id'>): Promise<void> {
  const blob = await invoiceDownloadService.fetchPdfBlob(invoice.id)
  const url = URL.createObjectURL(blob)
  const opened = window.open(url, '_blank', 'noopener,noreferrer')

  if (!opened) {
    URL.revokeObjectURL(url)
    throw new Error("Le PDF n'a pas pu etre ouvert (bloqueur de fenetres popup ?).")
  }

  // Le nouvel onglet a besoin de temps pour charger le blob avant qu'on
  // libere son URL ; on la revoque apres coup plutot qu'immediatement.
  setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS)
}

/** Imprime le PDF officiel (jamais la page HTML) via un iframe cache. */
async function printInvoicePdf(invoice: Pick<Invoice, 'id'>): Promise<void> {
  const blob = await invoiceDownloadService.fetchPdfBlob(invoice.id)
  const url = URL.createObjectURL(blob)

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'

  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve()
    iframe.onerror = () => reject(new Error("Le PDF n'a pas pu etre charge pour l'impression."))
    iframe.src = url
    document.body.appendChild(iframe)
  })

  iframe.contentWindow?.print()

  // Nettoyage differe : laisse le temps a la boite de dialogue d'impression
  // de s'ouvrir avant de retirer l'iframe et de liberer l'URL objet.
  setTimeout(() => {
    iframe.remove()
    URL.revokeObjectURL(url)
  }, OBJECT_URL_REVOKE_DELAY_MS)
}

/**
 * Resume minimal d'une facture pour le partage texte (WhatsApp/email/partage
 * natif). Volontairement limite au numero, au montant et a l'echeance : ni
 * coordonnees du client, ni detail des lignes, ni notes internes.
 */
function buildShareSummary(invoice: Invoice, currency: string): string {
  return [
    `Facture ${invoice.number}`,
    `Montant : ${formatCurrency(invoice.total, currency)}`,
    `Echeance : ${formatDate(invoice.dueDate)}`
  ].join('\n')
}

/** Construit le lien de partage WhatsApp (wa.me), sans dependance externe. */
function buildWhatsAppShareUrl(invoice: Invoice, currency: string): string {
  return `https://wa.me/?text=${encodeURIComponent(buildShareSummary(invoice, currency))}`
}

/** Ouvre WhatsApp (application ou web) avec le message pre-rempli, puis telecharge le PDF a joindre. */
async function sendInvoiceByWhatsApp(invoice: Invoice, currency: string): Promise<void> {
  window.open(buildWhatsAppShareUrl(invoice, currency), '_blank', 'noopener,noreferrer')
  await downloadInvoicePdf(invoice)
}

/** Construit un lien `mailto:` pre-rempli (objet + corps), sans piece jointe (limitation du protocole). */
function buildEmailShareUrl(invoice: Invoice, currency: string): string {
  const subject = `Facture ${invoice.number}`
  const body = buildShareSummary(invoice, currency)
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/** Ouvre le client email avec un message pre-rempli, puis telecharge le PDF a joindre manuellement. */
async function sendInvoiceByEmail(invoice: Invoice, currency: string): Promise<void> {
  window.location.href = buildEmailShareUrl(invoice, currency)
  await downloadInvoicePdf(invoice)
}

/**
 * Partage natif (Web Share API). Joint le PDF lui-meme quand la plateforme
 * le permet (mobile principalement) ; sinon partage un resume texte.
 * Retourne `false` si le partage natif n'est pas disponible sur cet
 * appareil/navigateur (a l'appelant de proposer un repli, ex: WhatsApp/email).
 */
async function shareInvoice(invoice: Invoice, currency: string): Promise<boolean> {
  if (typeof navigator.share !== 'function') return false

  const title = `Facture ${invoice.number}`
  const text = buildShareSummary(invoice, currency)

  if (typeof navigator.canShare === 'function') {
    try {
      const blob = await invoiceDownloadService.fetchPdfBlob(invoice.id)
      const file = new File([blob], `${invoice.number}.pdf`, { type: 'application/pdf' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ title, text, files: [file] })
        return true
      }
    } catch (err) {
      // L'utilisateur a annule le partage natif : ce n'est pas une erreur.
      if (err instanceof Error && err.name === 'AbortError') return true
      throw err
    }
  }

  try {
    await navigator.share({ title, text })
    return true
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return true
    throw err
  }
}

export const invoiceActions = {
  downloadInvoicePdf,
  openInvoicePdf,
  printInvoicePdf,
  buildWhatsAppShareUrl,
  sendInvoiceByWhatsApp,
  buildEmailShareUrl,
  sendInvoiceByEmail,
  shareInvoice
}
