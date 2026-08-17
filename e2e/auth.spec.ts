import { expect, test } from '@playwright/test'

import { DEMO_EMAIL, DEMO_PASSWORD, generateNewBusiness, loginViaUi, logoutViaUi } from './helpers'

test.describe('Authentification', () => {
  test("inscription : un nouveau commerce peut s'inscrire et atterrit sur le tableau de bord", async ({
    page
  }) => {
    const business = generateNewBusiness()

    await page.goto('/register')
    await page.getByLabel('Nom du commerce').fill(business.businessName)
    await page.getByLabel('Prenom').fill(business.firstName)
    await page.getByLabel(/^Nom\s*\*?$/).fill(business.lastName)
    await page.getByLabel('Email').fill(business.email)
    await page.getByLabel('Mot de passe').fill(business.password)
    await page.getByRole('button', { name: 'Creer mon compte' }).click()

    // Un compte nouvellement inscrit demarre sans donnees : l'etat vide du
    // tableau de bord doit s'afficher, pas une erreur.
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
    await expect(page).not.toHaveURL(/\/register/)
  })

  test('connexion : un utilisateur existant peut se connecter avec des identifiants valides', async ({
    page
  }) => {
    await loginViaUi(page, DEMO_EMAIL, DEMO_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('connexion : des identifiants invalides affichent une erreur et ne connectent pas', async ({
    page
  }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(DEMO_EMAIL)
    await page.getByLabel('Mot de passe').fill('mot-de-passe-incorrect')
    await page.getByRole('button', { name: 'Se connecter' }).click()

    await expect(page.getByText(/incorrect/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test("deconnexion : un utilisateur connecte peut se deconnecter et perd l'acces aux pages protegees", async ({
    page
  }) => {
    await loginViaUi(page, DEMO_EMAIL, DEMO_PASSWORD)
    await logoutViaUi(page)

    // Une fois deconnecte, une page protegee redirige vers la connexion.
    await page.goto('/clients')
    await expect(page).toHaveURL(/\/login/)
  })
})
