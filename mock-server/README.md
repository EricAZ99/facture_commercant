# Mock backend (démo)

Serveur Express pour faire tourner Facture IA sans vrai backend de production. Depuis la
Phase 1 "vrai backend" : **commerces, utilisateurs et administrateurs plateforme sont
persistés dans Postgres**, avec mots de passe hachés (bcrypt) et jetons JWT signés. Toutes les
**autres** entités (clients, produits, factures, devis, avoirs, paiements...) restent en
mémoire uniquement, perdues au redémarrage — portée volontaire de cette phase, pas un oubli.

## Démarrage

```bash
cd mock-server
npm install
npm start
```

Écoute sur `http://localhost:4000` (le `.env.local` du frontend pointe déjà dessus par défaut).

Sans configuration supplémentaire, tourne exactement comme avant : tout en mémoire, y compris
commerces/utilisateurs/admins (utile pour un dev rapide sans base). Pour activer la
persistance Postgres en local aussi, créez `mock-server/.env.local` :

```bash
DATABASE_URL=postgresql://...   # chaîne de connexion Neon (ou tout Postgres compatible)
JWT_SECRET=une-chaine-aleatoire-longue
```

## Compte de démo

- Email : `demo@facture-ia.com`
- Mot de passe : `password123`

Vous pouvez aussi créer un nouveau compte via la page d'inscription du frontend.

## Endpoints

Implémente le contrat attendu par `src/constants/api.constants.ts` : `auth/*` (login, register,
logout, me, refresh, forgot/reset password), plus l'ensemble des routes métier (clients,
produits, factures, devis, avoirs, paiements, tableau de bord, abonnement, espace admin...).

## Déploiement Vercel (démo)

`api/index.js` réexporte `server.js` tel quel comme fonction serverless (voir `vercel.json`).
Utilisable pour une **démo cliquable** avec authentification fiable, pas pour une vraie mise en
production :

- **Commerces/utilisateurs/admins** : persistés dans Postgres (via l'intégration Neon du
  Marketplace Vercel), mots de passe hachés (bcrypt), jetons JWT signés et vérifiés en direct
  contre la base à chaque requête (une désactivation de compte ou une suspension de commerce
  prend donc effet immédiatement, sur n'importe quelle instance serverless).
- **Tout le reste** (clients, produits, factures, devis, avoirs, paiements...) vit toujours dans
  des tableaux en mémoire — ces données peuvent disparaître à tout moment (redémarrage à froid)
  ou être incohérentes entre deux requêtes arrivant sur des instances serverless différentes.
- Les uploads (logo, tampon, pièces jointes) écrivent dans `os.tmpdir()` sur Vercel (le reste du
  système de fichiers est en lecture seule) — ça évite l'erreur, mais sans garantie de
  persistance, pour la même raison que les données ci-dessus.

Variables d'environnement requises sur Vercel : `DATABASE_URL` (auto-injectée par l'intégration
Neon) et `JWT_SECRET` (chaîne aléatoire à définir manuellement — le serveur refuse de démarrer
sans elle en environnement Vercel, pour ne jamais tourner avec un secret par défaut public).

Une vraie mise en production nécessiterait de persister aussi le reste des entités et de gérer
un vrai stockage de fichiers (Vercel Blob, S3...), hors périmètre de cette phase.
