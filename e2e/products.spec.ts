import { expect, test } from '@playwright/test'

import { DEMO_EMAIL, DEMO_PASSWORD, loginViaUi, uniqueSuffix } from './helpers'

test('creation produit : un commercant peut creer un produit et le retrouver dans la liste', async ({
  page
}) => {
  const name = `Produit-${uniqueSuffix()}`

  await loginViaUi(page, DEMO_EMAIL, DEMO_PASSWORD)
  await page.goto('/products')

  await page.getByRole('button', { name: 'Nouveau produit' }).click()
  await page.getByLabel(/^Nom\s*\*?$/).fill(name)
  await page.getByLabel('Categorie').selectOption({ index: 1 })
  await page.getByLabel('Prix').fill('5000')
  await page.getByRole('button', { name: 'Creer le produit' }).click()

  await expect(page.getByText('Produit cree avec succes.')).toBeVisible()
  await page.getByPlaceholder('Rechercher un produit...').fill(name)
  await expect(page.getByText(name)).toBeVisible()
})
