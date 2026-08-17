# Mock backend (dev uniquement)

Petit serveur Express avec données en mémoire, pour tester le frontend en local **avant** que
le vrai backend Node/Express ne soit prêt. Ce n'est pas le backend de production : pas de
hachage de mot de passe, pas de persistance, jetons non signés.

## Démarrage

```bash
cd mock-server
npm install
npm start
```

Écoute sur `http://localhost:4000` (le `.env.local` du frontend pointe déjà dessus par défaut).

## Compte de démo

- Email : `demo@facture-ia.com`
- Mot de passe : `password123`

Vous pouvez aussi créer un nouveau compte via la page d'inscription du frontend.

## Endpoints

Implémente le contrat attendu par `src/constants/api.constants.ts` : `auth/*` (login, register,
logout, me, refresh, forgot/reset password), plus des stubs vides pour `clients`, `products`,
`invoices`, `payments`, `dashboard/*` et `subscription` afin que la navigation post-connexion ne
génère pas d'erreurs.
