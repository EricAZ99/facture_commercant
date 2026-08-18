# Backlog fonctionnalités frontend — Facture IA

*Liste exhaustive des fonctionnalités frontend possibles, non encore implémentées, sur l'espace commerçant et l'espace admin — y compris les "nice to have". Périmètre strictement frontend (aucun sujet infra/backend/sécurité serveur ici, déjà couvert dans l'audit d'architecture).*

---

## ESPACE COMMERÇANT

### Authentification & compte personnel
- [ ] Vérification d'email a l'inscription — reporté, prochaine passe
- [ ] Authentification a deux facteurs (2FA/OTP) — ~~reporté~~ : modifierait significativement le flux de connexion central déjà vérifié ; un OTP simulé sans vrai canal d'envoi (SMS/email/authenticator) serait plus trompeur qu'utile
- [ ] Connexion via Google/Facebook (OAuth social) — ~~reporté~~ : nécessite de vraies applications OAuth enregistrées chez Google/Facebook (identifiants réels), hors périmètre de ce projet
- [ ] Gestion des sessions actives (liste des appareils connectés, déconnexion a distance) — ~~reporté~~ : demanderait de restructurer l'émission des jetons sur tous les points d'entrée d'authentification (connexion, inscription, rafraîchissement), risque de régression trop tard dans cette passe
- [x] Historique de connexion (dates, IP, appareil) — journalisé à chaque connexion, consultable dans "Mon compte"
- [x] Changement d'email (avec confirmation) — appliqué immédiatement après ressaisie du mot de passe (ce mock n'envoyant aucun email réel, un faux lien de confirmation par email aurait été trompeur — voir la même limite sur `/auth/forgot-password`)
- [x] Suppression de compte (droit a l'oubli) — suppression du compte individuel (non-propriétaire uniquement ; le propriétaire dispose déjà de la suppression du commerce entier)
- [x] Export de mes données personnelles (RGPD) — export JSON du profil et de l'historique de connexion
- [x] Photo de profil utilisateur (le champ `avatarUrl` existe déjà dans le type, aucun upload UI) — upload dédié, réutilise le composant d'upload déjà généralisé pour le logo/tampon du commerce

### Tableau de bord
- [x] Widgets réorganisables / personnalisables (drag & drop, persisté par navigateur)
- [x] Comparaison période vs période precedente (delta % sur CA/factures/clients)
- [x] Objectifs de vente configurables (target mensuel, barre de progression)
- [x] Export du tableau de bord (PDF/image)
- [x] Centre d'alertes proactif (factures en retard, stock bas, abonnement bientot expiré) regroupé au meme endroit

### Clients
- [x] Import en masse (CSV, compatible Excel)
- [x] Export de la liste (CSV, compatible Excel — filtre de recherche en cours applique)
- [x] Notes/tags/catégories personnalisées sur une fiche client
- [x] Segments/groupes de clients (VIP, grossiste... — via le meme systeme d'etiquettes, recherchable)
- [x] Solde consolidé affiché sur la fiche (total du toutes factures confondues)
- [x] Fusion de fiches clients en doublon (reattribution des factures + suppression du doublon)
- [ ] ~~Relance automatique programmée des impayés~~ — necessite un vrai service d'email + planificateur de taches (infra backend absente), reporte
- [ ] ~~Import de contacts (Google/Outlook)~~ — necessite une integration OAuth tierce (Google/Microsoft), hors perimetre de ce projet

### Produits & services
- [x] Import/export en masse (CSV, compatible Excel)
- [x] Photo produit (une photo par produit, meme mecanisme que le logo d'entreprise)
- [x] Historique des mouvements de stock (ajustements manuels : entree/sortie + motif)
- [x] Seuil d'alerte de stock bas configurable (par produit, remonte jusqu'au centre d'alertes du tableau de bord)
- [x] Tarifs dégressifs par quantité (paliers de prix, appliques automatiquement dans le constructeur de facture)
- [x] Code-barres — champ de donnees + recherche (saisie manuelle uniquement, voir note ci-dessous)
- [ ] ~~Scan de code-barres (camera)~~ — necessiterait une librairie de scan + acces camera ; le champ code-barres existe, seule la capture optique est reportee
- [ ] ~~Variantes de produit (taille, couleur...)~~ — changerait la relation produit↔ligne de facture en profondeur ; reporte pour ne pas fragiliser le module Factures deja verifie
- [ ] ~~Produits groupés / kits~~ — necessite une nouvelle entite (Kit) distincte du produit, reporte
- [ ] ~~Catégories hiérarchiques~~ — necessite une entite Categorie a part entiere pour rester robuste ; reporte plutot que de faire un pis-aller fragile

### Factures
- [x] **Devis / proforma** — module complet : `Quote`/`QuoteItem`, statuts (brouillon/envoyé/accepté/refusé/expiré/converti), builder réutilisant `InvoiceBuilderLine`/`computeInvoiceTotals`/`InvoiceItemRow`/`InvoiceSummary`, pages liste/création/détail, action "Convertir en facture" (`POST /quotes/:id/convert`, crée une vraie facture et verrouille le devis)
- [x] **Avoirs / notes de crédit** — émission depuis une facture (envoyée/payée uniquement), sélection ligne par ligne des quantités à créditer, garde-fou serveur anti-dépassement du montant facturé, page globale "Avoirs" + section dédiée sur le détail facture
- [ ] Factures récurrentes / abonnement client (facturation périodique automatique) — ~~reporté~~ : nécessite un ordonnanceur (cron/tâche planifiée) côté backend réel, hors périmètre du mock-server
- [ ] Bons de commande / bons de livraison
- [ ] Modèles de facture visuels multiples (un seul template PDF actuellement)
- [ ] Champs personnalisés sur la facture — reporté (voir historique des modifications ci-dessous)
- [ ] Multi-devises par facture (le commerce n'a qu'une devise globale)
- [x] Numérotation multi-séries (factures/devis/avoirs avec compteurs séparés) — `quoteSettings`/`creditNoteSettings` (`DE-`/`AV-`) ajoutés à `Business`, en plus de `invoiceSettings` (`FA-`) existant
- [ ] Rappels automatiques avant échéance — ~~reporté~~ : nécessite un ordonnanceur, meme limite que la facturation récurrente
- [ ] Signature électronique du client
- [ ] Historique des modifications d'une facture (versions/diff) — reporté, prochaine passe
- [ ] Pièces jointes libres sur une facture — reporté, prochaine passe
- [ ] Aperçu PDF en direct pendant la saisie (avant finalisation)
- [ ] Traduction de la facture (langue du client, differente de l'UI)

### Paiements
- [ ] Lien de paiement en ligne pour le client (Stripe/Mobile Money...) — ~~reporté~~ : nécessite de vraies clés/API d'un prestataire de paiement (Stripe, opérateur Mobile Money), hors périmètre du mock-server
- [x] Échéancier de paiement en plusieurs fois — `InstallmentPlan`/`PaymentInstallment` par facture, répartition égale configurable (2/3/4/6/12 échéances, dates éditables), encaissement échéance par échéance qui crée un vrai paiement et met à jour le solde de la facture, statut "en retard" calculé à la volée
- [x] Remboursements (workflow de refund) — action "Rembourser" sur chaque paiement de l'historique, montant partiel ou total plafonné au solde remboursable, met à jour le statut du paiement (`refunded` si intégral) et recalcule le solde/statut de la facture
- [ ] Rapprochement bancaire — ~~reporté~~ : un rapprochement fiable nécessite un vrai flux bancaire (import OFX/API bancaire) ; un simulateur CSV maison serait plus trompeur qu'utile sans données bancaires réelles
- [x] Export comptable (format compatible logiciel de compta) — export CSV de tous les paiements (date, n° facture, référence, moyen, statut, montant, montant remboursé) depuis la page Paiements

### Rapports
- [ ] Générateur de rapport personnalisable (choisir ses propres métriques/dimensions) — ~~reporté~~ : un vrai constructeur de requêtes (métriques/dimensions arbitraires) est un module à part entière, disproportionné face aux rapports déjà riches existants
- [x] Export PDF/Excel des rapports (actuellement visualisation uniquement) — export image (PNG), PDF (capture, réutilise `dashboardExport.ts`) et CSV (tableaux produits/clients/TVA) depuis le menu "Exporter"
- [ ] Rapports programmés envoyés par email (ex: chaque lundi) — ~~reporté~~ : nécessite un ordonnanceur + un service d'email, même limite que les autres automatisations différées
- [x] Comparaison multi-période sur un meme graphique — case à cocher "Comparer à la période précédente" superposant une ligne en pointillés (période précédente de même durée) sur le graphique de CA
- [x] Prévisions / projections de revenu — projection à 30 jours basée sur la moyenne quotidienne observée sur la période (affichée uniquement pour les périodes journalières : aujourd'hui/7j/30j, où l'extrapolation a un sens)
- [x] Rapport dédié TVA collectée (aide déclaration fiscale) — ventilation base imposable/TVA collectée par taux, remise répartie au prorata comme dans le calcul de facture

### Équipe
- [ ] Rôles personnalisés (au-dela des 5 rôles fixes) — ~~reporté~~ : nécessiterait de remplacer l'enum de rôles fixe par une entité `Role` dynamique par commerce, en profondeur dans tout le système de permissions (frontend ET mock-server) déjà vérifié — trop invasif
- [x] Matrice de permissions éditable par le propriétaire du commerce — dialogue "Modifier les permissions" par utilisateur (cases à cocher groupées par ressource), indépendant du rôle (`user.permissions` déjà distinct de `user.role`), avec "Réinitialiser aux permissions du rôle"
- [ ] Renvoyer une invitation expirée/non acceptée — ~~reporté~~ : ce mock-server crée les utilisateurs directement (pas de flux d'invitation par email ni d'état "en attente"), donc rien de réel à "renvoyer"
- [x] Départements/équipes internes (regrouper les utilisateurs) — champ libre `department` sur l'utilisateur, éditable à l'invitation, affiché en liste et filtrable
- [ ] Journal d'activité par utilisateur ("qui a fait quoi" a l'intérieur du commerce) — ~~reporté~~ : le journal d'activité existant n'attribue aucune entrée à un acteur précis ; l'ajouter proprement demanderait de faire transiter l'utilisateur authentifié dans chaque route mutante du mock-server (clients, produits, factures, devis, avoirs, paiements...), trop invasif pour un nice-to-have

### Paramètres entreprise
- [x] Adresses multiples (facturation vs livraison) — `Business.shippingAddress` distinct de l'adresse principale
- [x] Horaires d'ouverture (pertinent resto/salon) — planning hebdomadaire éditable (ouverture/fermeture par jour, ou "fermé")
- [x] Réseaux sociaux / site web du commerce — site web, WhatsApp, Facebook, Instagram
- [x] Conditions générales de vente personnalisables (au-dela du texte "conditions de paiement") — champ CGV dédié, distinct des conditions de paiement existantes
- [x] Signature/tampon numérique du commerce — upload dédié (`LogoUploader.vue` généralisé), même limite que le logo : non intégré au PDF (le PDF du mock-server est un texte brut sans image, le logo lui-même n'y figure pas non plus)
- [x] Clé API développeur / intégrations webhooks — génération/régénération de clé API + configuration URL/évènements webhook (scaffold de configuration ; aucun appel réel n'est émis, pas de vrai backend consommateur)
- [x] Export/sauvegarde manuelle de toutes les données du commerce — export JSON complet (clients, produits, factures, devis, avoirs, paiements, équipe)
- [x] Suppression du compte commerce (self-service) — réservé au propriétaire, confirmation par saisie exacte du nom du commerce, suppression en cascade de toutes les données rattachées

### Abonnement SaaS (vue commerçant)
- [x] Historique de facturation SaaS (mes factures/reçus d'abonnement Facture IA) — recus derives des cycles ecoules (pas de moteur de paiement recurrent reel), telechargement PDF par recu
- [x] Bannière de compte a rebours pendant la période d'essai — banniere globale (tout l'espace commerçant), jours restants, fermeture persistee jusqu'a la fin de cet essai
- [x] Codes promo / parrainage — codes promo statiques de demo + code de parrainage propre a chaque commerce (remise reelle appliquee au changement de plan, compteur de filleuls incremente, testé de bout en bout)
- [x] Facturation annuelle avec réduction (seul le mensuel existe) — variantes annuelles des plans payants (-20%), bascule mensuel/annuel sur la page

### UX transverse (tout l'espace commerçant)
- [ ] Mode sombre (Tailwind deja configuré en `darkMode: 'class'`, jamais utilisé) — ~~reporté~~ : une implémentation correcte demande des variantes `dark:` sur l'ensemble des composants déjà vérifiés (100+ fichiers) ; une application partielle rendrait l'UI incohérente, pire que l'absence de mode sombre
- [x] Recherche globale (Cmd+K) — palette de commandes (`Ctrl/Cmd+K` ou `/`) : navigation vers les sections autorisées, actions rapides (nouvelle facture/devis), recherche live clients/produits/factures, navigation clavier (flèches/Entrée/Échap)
- [x] Raccourcis clavier — `Ctrl/Cmd+K` et `/` pour la palette (bouton "Rechercher" visible dans la barre du haut pour la découvrabilité) ; pas de système de raccourcis configurable au-delà
- [x] Centre de notifications persistant (une cloche avec historique, pas juste des toasts éphémères) — réutilise le fil d'activité déjà journalisé côté serveur, compteur nonlu dérivé d'un horodatage "dernière consultation" persisté par navigateur
- [ ] Fil d'activité personnel ("mes dernières actions") — ~~reporté~~ : même limite que le journal d'activité par utilisateur (section Équipe) — aucune activité n'est aujourd'hui attribuée à un acteur précis
- [x] Onboarding guidé / tooltips contextuels pour un nouveau commerçant — présentation en 5 étapes à la première visite du tableau de bord (par commerce), passable à tout moment
- [ ] Chat support intégré — ~~reporté~~ : nécessite un vrai service tiers (Intercom/Crisp...) ou un système de tickets complet, hors périmètre du mock-server
- [x] PWA installable / mode hors-ligne — manifest + service worker minimal (app shell installable, cache des fichiers statiques) ; **le mode hors-ligne avec écriture/synchronisation différée n'est PAS implémenté** — toute donnée métier reste exclusivement servie par le réseau
- [ ] Sélection multiple + actions groupées sur les tableaux (clients/produits/factures) — reporté, prochaine passe
- [ ] Impression en lot de plusieurs factures — reporté, prochaine passe
- [ ] Filtres sauvegardés / vues personnalisées sur les listes — reporté, prochaine passe
- [ ] Colonnes de tableau configurables (afficher/masquer) — reporté, prochaine passe
- [x] Accessibilité avancée (contraste élevé, taille de police ajustable) — menu dédié dans la barre du haut (3 tailles de police, contraste élevé), préférences persistées par navigateur
- [ ] Internationalisation (toute l'UI est en français code en dur) — ~~reporté~~ : nécessiterait d'extraire chaque chaîne française codée en dur dans la totalité des composants (100+ fichiers) vers un système i18n — refactor mécanique trop large pour cette passe

---

## ESPACE ADMIN PLATEFORME

### Gestion des commerces (au-dela de l'existant)
- [x] Suppression définitive d'un commerce (au-dela de la suspension) — confirmation par saisie exacte du nom, cascade complète (réutilise la même logique que la suppression self-service commerçant)
- [x] Export de la liste des commerces (CSV) — liste complète (filtres appliqués) ou sélection uniquement
- [x] Filtres avancés (par plan, date d'inscription, chiffre d'affaires facturé) — filtres combinables, `revenueTotal`/`planId` ajoutés au résumé commerce côté backend
- [x] Actions groupées (suspendre/exporter plusieurs commerces a la fois) — sélection multiple, suspendre/réactiver/exporter la sélection
- [x] Mode "aperçu" : voir l'interface telle qu'un commerçant donné la voit, sans se connecter a sa place — ticket d'aperçu à usage unique (60s), échangé contre une vraie session commerçant dans un nouvel onglet, bannière persistante "Quitter l'aperçu" (testé de bout en bout : émission, échange, réutilisation du ticket rejetée)

### Gestion des administrateurs
- [x] Gestion des comptes admin eux-memes (inviter/désactiver d'autres admins) — réservé aux super-admins, auto-protection (un admin ne peut pas se modifier lui-même ici)
- [x] Rôles admin distincts (super-admin vs support en lecture seule) — `super_admin` gère les admins/paramètres globaux, `support` a accès à tout le reste (commerces, tickets, aperçu) en lecture seule sur ces deux périmètres
- [x] Historique de connexion des admins (qui s'est connecté a l'espace admin, quand) — journalisé à chaque connexion réussie

### Support & assistance
- [x] Impersonation ("se connecter en tant que" un commerçant, pour debug/support) — voir "Mode aperçu" dans Gestion des commerces (même fonctionnalité)
- [x] Tickets support / messagerie admin ↔ commerçant — le commerçant ouvre une demande et échange des messages avec le support ; l'admin voit tous les tickets tous commerces confondus, répond et ferme/rouvre (testé de bout en bout)
- [x] Notifications admin (nouveau commerce inscrit, paiement échoué...) — cloche dans l'espace admin sur les évènements réels déclenchables dans ce mock (nouveau commerce inscrit, nouveau ticket, fermeture de compte) ; ~~"paiement échoué"~~ n'a pas de déclencheur réel dans ce serveur factice (pas de moteur de paiement récurrent), non fabriqué

### Finance & analytics plateforme
- [x] Graphique de tendance MRR (actuellement une seule valeur instantanée, pas de courbe) — courbe des 6 derniers mois (approximation à partir des abonnements actifs et de leur date d'inscription, pas de grand livre de facturation réel)
- [x] Taux de churn / rétention — approximé à partir de la répartition actuelle des statuts d'abonnement
- [x] Revenu par plan (répartition) — MRR ventilé par plan
- [x] Valeur vie client (LTV) moyenne — approximée par le chiffre d'affaires facturé moyen observé par commerce

### Catalogue de plans (au-dela de l'existant)
- [ ] ~~Suppression d'un plan~~ — toujours volontairement exclu : supprimer un plan référencé par des abonnements existants les orphelinerait
- [x] Duplication d'un plan existant comme point de départ — bouton "Dupliquer", pré-remplit le formulaire de création (jamais d'écrasement du plan source)
- [x] Codes promo / remises applicables a un commerce — remise administrative appliquée directement par l'admin depuis le détail du commerce, distincte du code promo self-service (section Abonnement SaaS)

### Plateforme
- [x] Journal d'audit global (toutes actions, tous commerces confondus — actuellement uniquement consultable commerce par commerce) — page dédiée, paginée
- [x] Configuration de parametres globaux (devises supportées, textes légaux, mentions par défaut) — stocké et éditable (réservé aux super-admins) ; **non branché** dans les flux commerçant existants (ex: le sélecteur de devise de `BusinessForm.vue` reste sa propre liste) pour ne pas retoucher un flux déjà vérifié — configuration de référence pour l'instant
- [ ] Vue des erreurs applicatives remontées (si un outil de suivi d'erreurs existait) — reporté, nécessite un vrai outil de suivi d'erreurs (Sentry ou équivalent), explicitement hors périmètre de ce mock-server
