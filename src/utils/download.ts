/**
 * Declenche le telechargement d'un `Blob` recu de l'API (ex: PDF) sans
 * naviguer hors de l'application. Generique et reutilisable pour tout
 * telechargement binaire.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
