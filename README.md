# Facture IA — Frontend

Frontend d'un SaaS de gestion de facturation pour commerçants (restaurants, boutiques,
salons de coiffure, hôtels, pharmacies, PME). Architecture mise en place et prête à recevoir
les fonctionnalités métier ; branchement à une API REST Node.js/Express.

## Stack

Vue 3 (Composition API, `<script setup>`) · TypeScript strict · Vite · Vue Router · Pinia ·
Axios · Tailwind CSS · Lucide Vue Next · ESLint · Prettier.

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigner VITE_API_BASE_URL vers votre backend
npm run dev
```

Scripts disponibles : `dev`, `build`, `preview`, `type-check`, `lint`, `lint:check`, `format`,
`format:check`.

## Architecture

```
src/
├── assets/         # CSS global (Tailwind)
├── components/
│   ├── base/       # Composants UI génériques (Button, Input, Card, Badge, Modal, Spinner)
│   ├── states/     # Loading / Error / Empty state, réutilisés sur toutes les pages
│   └── layout/     # Sidebar, Topbar, PageHeader, ToastContainer
├── composables/    # Logique réutilisable: useApi, useAuth, usePermissions, useToast, usePagination
├── layouts/        # AuthLayout (pages publiques), DashboardLayout (pages protégées)
├── pages/          # Vues routées (une page = un cas d'usage)
├── router/          # Router + guards (auth, permissions)
├── stores/         # État global Pinia (auth/session, ui)
├── services/       # Couche d'accès à l'API (seule couche autorisée à utiliser Axios)
├── types/          # Types TypeScript des entités et contrats API
├── constants/       # Endpoints, rôles/permissions, routes, navigation — valeurs centralisées
└── utils/          # Fonctions pures (formatage, validation, storage)
```

### Règles d'architecture

1. **Aucun appel Axios direct** dans une page ou un composant : tout passe par `services/`.
2. Chaque service expose des méthodes typées qui retournent directement les données utiles
   (l'enveloppe `{ success, data }` de l'API est déballée dans le service).
3. Les endpoints sont centralisés dans `constants/api.constants.ts`.
4. L'état global (session utilisateur, commerce, notifications) est géré avec Pinia.
5. `useApi` encapsule les états `loading/error/success` et la notification d'erreur — à utiliser
   pour tout appel service déclenché depuis une page.
6. Le multi-tenant est géré via le store d'auth (`business` courant) qui alimente l'en-tête
   `X-Business-Id` de chaque requête (voir `services/api.ts`).
7. Les permissions utilisateur (`user.permissions`) proviennent du backend ; `usePermissions`
   et le champ `meta.permission` des routes s'en servent pour l'affichage conditionnel et le
   contrôle d'accès côté client. Le backend reste la source de vérité.

## Authentification

Le système d'authentification est implémenté de bout en bout :

- **`services/auth.service.ts`** : `login`, `register`, `logout`, `getCurrentUser` (`GET /auth/me`),
  `forgotPassword`, `resetPassword`, `changePassword`.
- **`stores/auth.store.ts`** : état `user`, `business`, `accessToken`, `authenticated` (computed),
  `loading`, `role`, `permissions` ; actions `login`, `register`, `logout`, `forgotPassword`,
  `resetPassword`, `fetchCurrentUser` (restauration de session au démarrage). Seuls les jetons
  sont persistés (`localStorage`) — `user`/`business` ne vivent qu'en mémoire et sont
  re-récupérés via `fetchCurrentUser()` à chaque chargement.
- **`composables/useAuth.ts`** : actions avec effets de bord UI (navigation, toasts) —
  `loginAndRedirect` (respecte `?redirect=` si présent et interne), `registerAndRedirect`,
  `logoutAndRedirect`, `requestPasswordReset`, `resetPasswordAndRedirect`.
- **`services/api.ts`** : intercepteur de requête qui injecte `Authorization: Bearer <token>` et
  `X-Business-Id` ; intercepteur de réponse qui rafraîchit automatiquement le token sur un 401 (en
  mettant en file d'attente les requêtes concurrentes) et déclenche la déconnexion si le
  rafraîchissement échoue.
- **Guards du router** (`router/index.ts`) : `meta.requiresAuth` redirige vers `/login` (avec
  `?redirect=`) si non authentifié ; `meta.guestOnly` redirige vers `/dashboard` si déjà
  authentifié ; `meta.permission` redirige vers `/403`. Routes publiques : `/login`, `/register`,
  `/forgot-password`, `/reset-password`. Routes privées : `/dashboard`, `/clients`, `/products`,
  `/invoices`, `/reports`, `/payments`, `/subscription`, `/settings`.

## Connexion au backend

Le backend attendu est une API REST Node.js/Express exposant une enveloppe standard
`{ success, data }` (voir `types/common.types.ts`) et les endpoints listés dans
`constants/api.constants.ts`. Le rafraîchissement de session (`refresh token`) et la
récupération de la session courante (`GET /auth/me`) sont déjà câblés dans
`services/api.ts` / `stores/auth.store.ts`.

## État actuel

L'architecture, la couche API, les stores, les composables et les composants de base sont en
place. Les pages métier (clients, produits, factures, paiements, abonnement) sont des écrans
minimaux qui démontrent le flux complet (service → composable `useApi` → états
loading/error/empty/success) mais n'implémentent pas encore les fonctionnalités métier
(formulaires de création/édition, filtres, détail, etc.), à construire dans une prochaine
itération.
