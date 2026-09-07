import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Compte de demo pre-seede par `mock-server` (donnees d'exemple : clients,
 * produits, factures...). Reutilise par les specs qui n'ont pas besoin
 * d'un commerce vierge (paiements, consultation de facture...).
 */
export const DEMO_EMAIL = 'demo@facture-ia.com'
export const DEMO_PASSWORD = 'password123'

/** Suffixe unique (horodatage) pour eviter toute collision entre executions de tests. */
export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

export interface NewBusiness {
  businessName: string
  firstName: string
  lastName: string
  email: string
  password: string
}

/** Genere des donnees d'inscription uniques (pas de collision entre executions). */
export function generateNewBusiness(): NewBusiness {
  const suffix = uniqueSuffix()
  return {
    businessName: `Commerce Test ${suffix}`,
    firstName: 'Test',
    lastName: 'Utilisateur',
    email: `e2e.${suffix}@example.com`,
    password: 'password123'
  }
}

/**
 * Ferme la banniere d'accueil guidee si elle est visible (premiere visite du
 * tableau de bord pour ce commerce, voir `OnboardingTour.vue`). Sans effet
 * si elle n'apparait pas : evite qu'elle n'intercepte les clics suivants
 * (ex: menu utilisateur du topbar) sans dupliquer cette logique dans chaque test.
 */
async function dismissOnboardingIfPresent(page: Page): Promise<void> {
  // `exact: true` : "Passer" (sans correspondance partielle) pour ne jamais
  // matcher un autre bouton dont le libelle accessible contiendrait ce mot
  // (ex: bascule de theme "Activer le theme sombre" ne le contient plus,
  // mais on reste explicite par robustesse).
  const skipButton = page.getByRole('button', { name: 'Passer', exact: true })
  try {
    // `isVisible()` seul n'attend pas l'apparition (verification immediate,
    // sujette a une course avec le rendu) : `waitFor` reessaie reellement
    // pendant la fenetre impartie.
    await skipButton.waitFor({ state: 'visible', timeout: 3000 })
    await skipButton.click()
  } catch {
    // Pas d'onboarding a ecarter (deja vu pour ce commerce, ou n'apparait pas).
  }
}

/** Inscrit un nouveau commerce via le formulaire d'inscription et attend l'atterrissage sur le tableau de bord. */
export async function registerViaUi(page: Page, business: NewBusiness): Promise<void> {
  await page.goto('/register')
  await page.getByLabel('Nom du commerce').fill(business.businessName)
  await page.getByLabel('Prenom').fill(business.firstName)
  await page.getByLabel(/^Nom\s*\*?$/).fill(business.lastName)
  await page.getByLabel('Email').fill(business.email)
  await page.getByLabel('Mot de passe').fill(business.password)
  await page.getByRole('button', { name: 'Creer mon compte' }).click()
  // Le tableau de bord vit a la racine ("/") : on verifie le contenu affiche
  // plutot qu'un segment d'URL "/dashboard" qui n'existe pas dans le routeur.
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
  await dismissOnboardingIfPresent(page)
}

/** Connecte un utilisateur existant via le formulaire de connexion et attend l'atterrissage sur le tableau de bord. */
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
  await dismissOnboardingIfPresent(page)
}

/** Deconnecte l'utilisateur courant via le menu du topbar et attend l'atterrissage sur la page de connexion. */
export async function logoutViaUi(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Menu utilisateur' }).click()
  await page.getByRole('button', { name: 'Se deconnecter' }).click()
  await expect(page).toHaveURL(/\/login/)
}
