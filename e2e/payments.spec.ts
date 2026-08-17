import { expect, test } from '@playwright/test'

import { DEMO_EMAIL, DEMO_PASSWORD, loginViaUi } from './helpers'

test('enregistrement paiement : un commercant peut enregistrer un paiement partiel sur une facture', async ({
  page
}) => {
  await loginViaUi(page, DEMO_EMAIL, DEMO_PASSWORD)
  await page.goto('/invoices')

  // Filtre sur les factures "Envoyee" (non soldees) : la donnee de demo en
  // contient toujours au moins une (voir mock-server/server.js). On attend
  // la reponse de l'API filtree avant de cliquer, pour ne pas cliquer sur
  // une ligne de l'ancienne liste non filtree (course possible sinon).
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/invoices') && res.url().includes('status=sent')
    ),
    page.getByLabel('Filtrer par statut').selectOption('sent')
  ])
  await page.getByRole('button', { name: 'Consulter la facture' }).first().click()

  await page.getByRole('button', { name: 'Enregistrer un paiement' }).click()
  await page.getByLabel(/^Montant/).fill('1000')
  await page.getByRole('button', { name: 'Enregistrer le paiement' }).click()

  await expect(page.getByText('Paiement enregistre avec succes.')).toBeVisible()
  // Le formulaire se ferme automatiquement apres un enregistrement reussi.
  await expect(page.getByRole('button', { name: 'Enregistrer le paiement' })).not.toBeVisible()
})
