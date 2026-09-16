import type { FeatureFlagKey } from '@/types'

/** Description d'une fonctionnalite activable/desactivable par commerce, pour l'UI admin. */
export interface FeatureFlagDefinition {
  key: FeatureFlagKey
  label: string
  description: string
}

/**
 * Catalogue des fonctionnalites que l'espace admin peut activer/desactiver
 * individuellement pour un commerce donne. Ajouter une entree ici, un
 * `featureFlag` sur le `NavItem`/la route concernee (voir
 * `navigation.constants.ts`/`router/index.ts`) si elle correspond a une
 * page entiere, et sa valeur par defaut dans `DEFAULT_FEATURE_FLAGS`.
 */
export const FEATURE_FLAG_DEFINITIONS: FeatureFlagDefinition[] = [
  {
    key: 'quotes',
    label: 'Devis',
    description: 'Création et suivi des devis, indépendamment des factures.'
  },
  {
    key: 'creditNotes',
    label: 'Avoirs',
    description: 'Émission de notes de crédit depuis les factures.'
  },
  {
    key: 'reports',
    label: 'Rapports',
    description: 'Tableaux de bord analytiques (ventes, TVA, meilleurs clients...).'
  },
  {
    key: 'kits',
    label: 'Kits',
    description: 'Regroupement de produits en kits facturables en une seule ligne.'
  },
  {
    key: 'apiAccess',
    label: 'Accès API & webhooks',
    description:
      'Clé API développeur et configuration des webhooks, dans les paramètres du commerce.'
  }
]

/** Fonctionnalites activees par defaut pour un commerce nouvellement cree. */
export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, boolean> = {
  quotes: true,
  creditNotes: true,
  reports: true,
  kits: true,
  apiAccess: true
}
