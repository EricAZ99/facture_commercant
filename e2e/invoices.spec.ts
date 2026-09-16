import { expect, test } from '@playwright/test'

import { DEMO_EMAIL, DEMO_PASSWORD, loginViaUi } from './helpers'

test('creation facture : un commercant peut creer une facture pour un client existant', async ({
  page
}) => {
  await loginViaUi(page, DEMO_EMAIL, DEMO_PASSWORD)
  await page.goto('/invoices/create')

  // Client et produit issus des donnees de demo (voir mock-server/server.js).
  await page.getByPlaceholder('Rechercher un client par nom, email ou téléphone...').fill('Fatou')
  await page.getByText(/Fatou Diarra/).click()

  await page.getByPlaceholder('Rechercher un produit ou service à ajouter...').fill('T-shirt')
  await page.getByText(/T-shirt coton/).click()

  await page.getByRole('button', { name: 'Créer la facture' }).click()

  await expect(page.getByText('Facture creee avec succes.')).toBeVisible()
  await expect(page).toHaveURL(/\/invoices\/[^/]+/)
  await expect(page.getByRole('heading', { name: /^Facture / })).toBeVisible()
})

test('consultation facture : un commercant peut ouvrir une facture existante depuis la liste', async ({
  page
}) => {
  await loginViaUi(page, DEMO_EMAIL, DEMO_PASSWORD)
  await page.goto('/invoices')

  await expect(page.getByRole('table')).toBeVisible()
  await page.getByRole('button', { name: 'Consulter la facture' }).first().click()

  await expect(page).toHaveURL(/\/invoices\/[^/]+$/)
  await expect(page.getByRole('heading', { name: /^Facture / })).toBeVisible()
  await expect(page.getByText('Détails de la facture.')).toBeVisible()
})
