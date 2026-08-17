# Backlog fonctionnalités frontend — Facture IA

*Liste exhaustive des fonctionnalités frontend possibles, non encore implémentées, sur l'espace commerçant et l'espace admin — y compris les "nice to have". Périmètre strictement frontend (aucun sujet infra/backend/sécurité serveur ici, déjà couvert dans l'audit d'architecture).*

---

## ESPACE COMMERÇANT

### Authentification & compte personnel
- [ ] Vérification d'email a l'inscription
- [ ] Authentification a deux facteurs (2FA/OTP)
- [ ] Connexion via Google/Facebook (OAuth social)
- [ ] Gestion des sessions actives (liste des appareils connectés, déconnexion a distance)
- [ ] Historique de connexion (dates, IP, appareil)
- [ ] Changement d'email (avec confirmation)
- [ ] Suppression de compte (droit a l'oubli)
- [ ] Export de mes données personnelles (RGPD)
- [ ] Photo de profil utilisateur (le champ `avatarUrl` existe déjà dans le type, aucun upload UI)

### Tableau de bord
- [ ] Widgets réorganisables / personnalisables (drag & drop)
- [ ] Comparaison période vs période precedente (delta %, pas juste la valeur brute)
- [ ] Objectifs de vente configurables (target mensuel, barre de progression)
- [ ] Export du tableau de bord (PDF/image)
- [ ] Centre d'alertes proactif (factures en retard, stock bas, abonnement bientot expiré) regroupé au meme endroit

### Clients
- [ ] Import en masse (CSV/Excel)
- [ ] Export de la liste (CSV/Excel/PDF)
- [ ] Notes/tags/catégories personnalisées sur une fiche client
- [ ] Segments/groupes de clients (VIP, grossiste...)
- [ ] Solde consolidé affiché sur la fiche (total du toutes factures confondues)
- [ ] Relance automatique programmée des impayés
- [ ] Fusion de fiches clients en doublon
- [ ] Import de contacts (Google/Outlook)

### Produits & services
- [ ] Import/export en masse
- [ ] Photo(s) produit (aucun champ image actuellement)
- [ ] Variantes de produit (taille, couleur...)
- [ ] Historique des mouvements de stock
- [ ] Seuil d'alerte de stock bas configurable
- [ ] Scan de code-barres
- [ ] Tarifs dégressifs par quantité
- [ ] Produits groupés / kits
- [ ] Catégories hiérarchiques (sous-catégories, actuellement un simple texte libre)

### Factures
- [ ] **Devis / proforma** — aucun module de devis, uniquement des factures directes
- [ ] **Avoirs / notes de crédit** — pas de mécanisme d'émission formel (seulement un statut "annulée")
- [ ] Factures récurrentes / abonnement client (facturation périodique automatique)
- [ ] Bons de commande / bons de livraison
- [ ] Modèles de facture visuels multiples (un seul template PDF actuellement)
- [ ] Champs personnalisés sur la facture
- [ ] Multi-devises par facture (le commerce n'a qu'une devise globale)
- [ ] Numérotation multi-séries (factures/devis/avoirs avec compteurs séparés)
- [ ] Rappels automatiques avant échéance
- [ ] Signature électronique du client
- [ ] Historique des modifications d'une facture (versions/diff)
- [ ] Pièces jointes libres sur une facture
- [ ] Aperçu PDF en direct pendant la saisie (avant finalisation)
- [ ] Traduction de la facture (langue du client, differente de l'UI)

### Paiements
- [ ] Lien de paiement en ligne pour le client (Stripe/Mobile Money...)
- [ ] Échéancier de paiement en plusieurs fois
- [ ] Remboursements (workflow de refund)
- [ ] Rapprochement bancaire
- [ ] Export comptable (format compatible logiciel de compta)

### Rapports
- [ ] Générateur de rapport personnalisable (choisir ses propres métriques/dimensions)
- [ ] Export PDF/Excel des rapports (actuellement visualisation uniquement)
- [ ] Rapports programmés envoyés par email (ex: chaque lundi)
- [ ] Comparaison multi-période sur un meme graphique
- [ ] Prévisions / projections de revenu
- [ ] Rapport dédié TVA collectée (aide déclaration fiscale)

### Équipe
- [ ] Rôles personnalisés (au-dela des 5 rôles fixes)
- [ ] Matrice de permissions éditable par le propriétaire du commerce
- [ ] Renvoyer une invitation expirée/non acceptée
- [ ] Départements/équipes internes (regrouper les utilisateurs)
- [ ] Journal d'activité par utilisateur ("qui a fait quoi" a l'intérieur du commerce)

### Paramètres entreprise
- [ ] Adresses multiples (facturation vs livraison)
- [ ] Horaires d'ouverture (pertinent resto/salon)
- [ ] Réseaux sociaux / site web du commerce
- [ ] Conditions générales de vente personnalisables (au-dela du texte "conditions de paiement")
- [ ] Signature/tampon numérique du commerce
- [ ] Clé API développeur / intégrations webhooks
- [ ] Export/sauvegarde manuelle de toutes les données du commerce
- [ ] Suppression du compte commerce (self-service)

### Abonnement SaaS (vue commerçant)
- [ ] Historique de facturation SaaS (mes factures/reçus d'abonnement Facture IA)
- [ ] Bannière de compte a rebours pendant la période d'essai
- [ ] Codes promo / parrainage
- [ ] Facturation annuelle avec réduction (seul le mensuel existe)

### UX transverse (tout l'espace commerçant)
- [ ] Mode sombre (Tailwind deja configuré en `darkMode: 'class'`, jamais utilisé)
- [ ] Recherche globale (Cmd+K)
- [ ] Raccourcis clavier
- [ ] Centre de notifications persistant (une cloche avec historique, pas juste des toasts éphémères)
- [ ] Fil d'activité personnel ("mes dernières actions")
- [ ] Onboarding guidé / tooltips contextuels pour un nouveau commerçant
- [ ] Chat support intégré
- [ ] PWA installable / mode hors-ligne
- [ ] Sélection multiple + actions groupées sur les tableaux (clients/produits/factures)
- [ ] Impression en lot de plusieurs factures
- [ ] Filtres sauvegardés / vues personnalisées sur les listes
- [ ] Colonnes de tableau configurables (afficher/masquer)
- [ ] Accessibilité avancée (contraste élevé, taille de police ajustable)
- [ ] Internationalisation (toute l'UI est en français code en dur)

---

## ESPACE ADMIN PLATEFORME

### Gestion des commerces (au-dela de l'existant)
- [ ] Suppression définitive d'un commerce (au-dela de la suspension)
- [ ] Export de la liste des commerces (CSV)
- [ ] Filtres avancés (par plan, date d'inscription, chiffre d'affaires facturé)
- [ ] Actions groupées (suspendre/exporter plusieurs commerces a la fois)
- [ ] Mode "aperçu" : voir l'interface telle qu'un commerçant donné la voit, sans se connecter a sa place

### Gestion des administrateurs
- [ ] Gestion des comptes admin eux-memes (inviter/désactiver d'autres admins) — un seul admin en dur aujourd'hui
- [ ] Rôles admin distincts (super-admin vs support en lecture seule)
- [ ] Historique de connexion des admins (qui s'est connecté a l'espace admin, quand)

### Support & assistance
- [ ] Impersonation ("se connecter en tant que" un commerçant, pour debug/support)
- [ ] Tickets support / messagerie admin ↔ commerçant
- [ ] Notifications admin (nouveau commerce inscrit, paiement échoué...)

### Finance & analytics plateforme
- [ ] Graphique de tendance MRR (actuellement une seule valeur instantanée, pas de courbe)
- [ ] Taux de churn / rétention
- [ ] Revenu par plan (répartition)
- [ ] Valeur vie client (LTV) moyenne

### Catalogue de plans (au-dela de l'existant)
- [ ] Suppression d'un plan (volontairement exclu pour l'instant)
- [ ] Duplication d'un plan existant comme point de départ
- [ ] Codes promo / remises applicables a un commerce

### Plateforme
- [ ] Journal d'audit global (toutes actions, tous commerces confondus — actuellement uniquement consultable commerce par commerce)
- [ ] Configuration de parametres globaux (devises supportées, textes légaux, mentions par défaut)
- [ ] Vue des erreurs applicatives remontées (si un outil de suivi d'erreurs existait)
