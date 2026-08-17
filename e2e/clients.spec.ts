import { expect, test } from '@playwright/test'

import { DEMO_EMAIL, DEMO_PASSWORD, loginViaUi, uniqueSuffix } from './helpers'

test('creation client : un commercant peut creer un client et le retrouver dans la liste', async ({
  page
}) => {
  const lastName = `Client-${uniqueSuffix()}`

  await loginViaUi(page, DEMO_EMAIL, DEMO_PASSWORD)
  await page.goto('/clients')

  await page.getByRole('button', { name: 'Nouveau client' }).click()
  await page.getByLabel('Prenom').fill('Jean')
  await page.getByLabel(/^Nom\s*\*?$/).fill(lastName)
  await page.getByLabel('Telephone').fill('+225 01 02 03 04 05')
  await page.getByRole('button', { name: 'Creer le client' }).click()

  // La confirmation de succes ferme le formulaire et le client apparait
  // dans la liste (recherche par nom pour retrouver la bonne ligne).
  await expect(page.getByText('Client cree avec succes.')).toBeVisible()
  await page.getByPlaceholder('Rechercher un client...').fill(lastName)
  await expect(page.getByText(`Jean ${lastName}`)).toBeVisible()
})
