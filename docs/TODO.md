# TODO — Facture IA Frontend

Tâches restantes extraites du backlog. Les items barrés (~~...~~) sont volontairement exclus du périmètre (dépendance infra/backend réel, OAuth tiers, etc.).

---

## Authentification & compte
- [ ] Vérification d'email à l'inscription

## Clients
- [ ] Relance automatique programmée des impayés *(nécessite ordonnanceur backend)*

## Produits
- [ ] Variantes de produit (taille, couleur…) *(impacte le schéma facture)*
- [ ] Scan de code-barres (caméra) *(le champ existe, seule la capture optique manque)*

## Factures
- [ ] Factures récurrentes / abonnement client *(nécessite ordonnanceur)*
- [ ] Bons de commande / bons de livraison *(entité document à part entière)*
- [ ] Modèles de facture visuels multiples *(nécessite un vrai moteur PDF)*
- [ ] Multi-devises par facture
- [ ] Rappels automatiques avant échéance *(nécessite ordonnanceur)*
- [ ] Signature électronique du client
- [ ] Historique des modifications d'une facture (versions/diff)
- [ ] Export groupé de plusieurs factures en un seul PDF/ZIP *(dépend de la sélection multiple)*
- [ ] Traduction de la facture dans la langue du client

## Paiements
- [ ] Lien de paiement en ligne (Stripe/Mobile Money…) *(nécessite prestataire réel)*
- [ ] Rapprochement bancaire *(nécessite flux bancaire réel)*
- [ ] Frais de retard automatiques et escompte pour paiement anticipé

## Rapports
- [ ] Générateur de rapport personnalisable (métriques/dimensions libres)
- [ ] Rapports programmés envoyés par email *(nécessite ordonnanceur + service email)*
- [ ] Balance âgée / aging report des créances (0-30j, 30-60j, 60-90j, 90j+)

## Équipe
- [ ] Rôles personnalisés (au-delà des 5 rôles fixes)
- [ ] Journal d'activité par utilisateur ("qui a fait quoi")

## Paramètres entreprise
- [ ] Politique de mot de passe configurable par le propriétaire
- [ ] Journal des appels webhook (succès/échec/tentatives)
- [ ] Signature HMAC des webhooks

## UX transverse
- [ ] Sélection multiple + actions groupées sur les tableaux (clients/produits/factures)
- [ ] Impression en lot de plusieurs factures
- [ ] Filtres sauvegardés / vues personnalisées sur les listes
- [ ] Colonnes de tableau configurables (afficher/masquer)
- [ ] Annulation ("Undo") après suppression — toast avec délai
- [ ] Corbeille / restauration d'éléments supprimés sous 30 jours
- [ ] Aide raccourcis clavier (modal récapitulatif)
- [ ] Épinglage / favoris (clients ou factures fréquemment consultés)
- [ ] Préférences de notification (choisir les évènements)
- [ ] Fil d'activité personnel ("mes dernières actions")

## Internationalisation (i18n)
- [ ] Traduire : avoirs (liste), paiements (liste), rapports
- [ ] Traduire : formulaires détaillés de Paramètres
- [ ] Traduire : catégories, permissions, statuts de facture détaillés
- [ ] Traduire : espace admin

---

## Espace Admin

### Gestion des commerces
- [ ] Feature flags par commerce (activer/désactiver une fonctionnalité par tenant)
- [ ] Historique des changements de plan par commerce (timeline upgrade/downgrade)

### Finance & analytics
*(tout déjà implémenté)*

### Catalogue de plans
*(tout déjà implémenté)*

### Plateforme
- [ ] Page de statut interne (uptime simulé, latence…) *(hors périmètre mock-server)*
- [ ] Vue des erreurs applicatives remontées *(nécessite Sentry ou équivalent)*

---

## Priorités suggérées (quick wins)

1. **Sélection multiple + actions groupées** — débloque l'export groupé de factures et l'impression en lot
2. **Balance âgée** — rapport à forte valeur métier, données déjà disponibles
3. **Frais de retard / escompte** — logique de calcul pure, pas de dépendance externe
4. **Filtres sauvegardés** — amélioration UX transverse à fort impact
5. **Annulation après suppression** — quick win UX, toast + délai côté client uniquement
6. **Colonnes configurables** — amélioration UX transverse
7. **i18n : avoirs, paiements, rapports** — extension mécanique de l'infra déjà en place
