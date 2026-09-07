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
- [x] Relance manuelle ponctuelle ("Envoyer un rappel" sur une facture envoyée/partiellement payée/en retard avec solde restant) — ouvre un email pré-rempli au client (mailto, même mécanisme que "Envoyer par email") + télécharge le PDF à joindre, et enregistre l'envoi côté backend (`lastReminderSentAt`, journalisé dans le fil d'activité) ; distinct de la relance automatique programmée ci-dessus, ne nécessite aucun ordonnanceur
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
- [x] Produits groupés / kits — entite `ProductKit` distincte du produit (`items` = liste produit+quantite, prix de vente force ou calcule comme somme des composants, stock assemblable derive du stock des composants). Page dediee (liste/creation/detail), action "Facturer ce kit" qui cree une facture brouillon (une ligne par composant) en reutilisant directement la creation de facture existante — n'a jamais touche au schema/module Factures deja verifie
- [x] Catégories hiérarchiques — entite `ProductCategory` a part entiere (`parentId` optionnel), gestionnaire dedie (creer/renommer/deplacer/supprimer avec garde-fous : refuse si sous-categories ou produits rattaches, refuse un deplacement qui creerait un cycle), remplace le champ texte libre sur le produit ; filtre catalogue par categorie (inclut les sous-categories), import CSV toujours en texte libre (chemin hierarchique, creation automatique des segments manquants)

### Factures
- [x] **Devis / proforma** — module complet : `Quote`/`QuoteItem`, statuts (brouillon/envoyé/accepté/refusé/expiré/converti), builder réutilisant `InvoiceBuilderLine`/`computeInvoiceTotals`/`InvoiceItemRow`/`InvoiceSummary`, pages liste/création/détail, action "Convertir en facture" (`POST /quotes/:id/convert`, crée une vraie facture et verrouille le devis)
- [x] **Avoirs / notes de crédit** — émission depuis une facture (envoyée/payée uniquement), sélection ligne par ligne des quantités à créditer, garde-fou serveur anti-dépassement du montant facturé, page globale "Avoirs" + section dédiée sur le détail facture
- [ ] Factures récurrentes / abonnement client (facturation périodique automatique) — ~~reporté~~ : nécessite un ordonnanceur (cron/tâche planifiée) côté backend réel, hors périmètre du mock-server
- [ ] Bons de commande / bons de livraison — reporté cette passe : une entité document a part entière (numérotation, statuts, PDF), comparable en volume à Devis+Avoirs combinés ; mérite sa propre passe dédiée plutôt que d'être bâclée au milieu de plusieurs autres chantiers Factures
- [ ] Modèles de facture visuels multiples — ~~reporté~~ : le générateur PDF actuel est un document texte brut sans mise en page ni image (le logo lui-même n'y figure pas) ; "plusieurs modèles visuels" supposerait d'abord un vrai moteur de mise en page, hors périmètre de ce mock
- [x] Champs personnalisés sur la facture — paires libellé/valeur ajoutées à la volée dans le formulaire, affichées sur le détail facture et sur le lien public (jamais sur le PDF texte, ni sur les notes internes)
- [ ] Multi-devises par facture (le commerce n'a qu'une devise globale) — ~~reporté~~ : la devise unique du commerce est une hypothèse structurante dans les factures, rapports, exports et calculs déjà vérifiés ; la conversion multi-devises (taux de change, arrondis) toucherait tout cela en profondeur
- [x] Numérotation multi-séries (factures/devis/avoirs avec compteurs séparés) — `quoteSettings`/`creditNoteSettings` (`DE-`/`AV-`) ajoutés à `Business`, en plus de `invoiceSettings` (`FA-`) existant
- [ ] Rappels automatiques avant échéance — ~~reporté~~ : nécessite un ordonnanceur, meme limite que la facturation récurrente
- [ ] Signature électronique du client — ~~reporté~~ : une vraie capture de signature prendrait tout son sens sur le lien public désormais en place (voir ci-dessous), mais mérite sa propre passe plutôt qu'un ajout hâtif
- [ ] Historique des modifications d'une facture (versions/diff) — reporté : demanderait de capturer un instantané a chaque mutation, sur toutes les routes qui touchent une facture (paiements, avoirs, échéancier...), trop invasif pour cette passe
- [x] Pièces jointes libres sur une facture — upload/liste/suppression de fichiers (devis fournisseur, bon signé...), réutilise le mécanisme de stockage déjà en place pour le logo, nettoyage automatique a la suppression de la facture ou du commerce
- [x] Aperçu PDF en direct pendant la saisie (avant finalisation) — nouvelle route `POST /invoices/preview-pdf` qui génère le PDF a partir de l'état courant du formulaire sans rien persister (pas de numéro attribué, filigrane "APERCU" systématique pour ne jamais le confondre avec le PDF officiel)
- [ ] Traduction de la facture (langue du client, differente de l'UI) — ~~reporté~~ : même limite que l'internationalisation de l'UI, hors périmètre de cette passe
- [x] Lien public partageable pour consulter/télécharger une facture — jeton généré a la demande (`shareToken`), route publique dédiée ne renvoyant jamais les notes internes ni aucune donnée non destinée au client, page de consultation dédiée avec téléchargement du PDF
- [x] QR code — affiché dans la boîte de dialogue "Lien public" (pointant vers ce lien), généré côté client ; non intégré au PDF texte lui-même (le générateur PDF actuel n'a pas de support d'image, voir "Modèles visuels" ci-dessus)
- [x] Filigrane sur le PDF selon le statut (BROUILLON / PAYÉE / ANNULÉE / EN RETARD) — texte diagonal semi-transparent intégré directement au générateur PDF existant (aucune facture "sent"/"partially_paid" n'a de filigrane, statut normal en cours)
- [x] Duplication rapide d'une facture ou d'un devis en un clic — la duplication de facture existait déjà ; ajoutée pour les devis (bouton "Dupliquer" sur le détail du devis)
- [x] Notes internes sur une facture — champ dédié distinct des notes client, encadré visuellement, jamais inclus dans le PDF ni le lien public
- [ ] Export groupé de plusieurs factures en un seul PDF/ZIP — reporté : dépend d'une sélection multiple sur la liste des factures, qui n'existe pas encore (voir "Sélection multiple + actions groupées" dans UX transverse, elle-même différée) ; le faire maintenant dupliquerait ce travail a venir

### Paiements
- [ ] Lien de paiement en ligne pour le client (Stripe/Mobile Money...) — ~~reporté~~ : nécessite de vraies clés/API d'un prestataire de paiement (Stripe, opérateur Mobile Money), hors périmètre du mock-server
- [x] Échéancier de paiement en plusieurs fois — `InstallmentPlan`/`PaymentInstallment` par facture, répartition égale configurable (2/3/4/6/12 échéances, dates éditables), encaissement échéance par échéance qui crée un vrai paiement et met à jour le solde de la facture, statut "en retard" calculé à la volée
- [x] Remboursements (workflow de refund) — action "Rembourser" sur chaque paiement de l'historique, montant partiel ou total plafonné au solde remboursable, met à jour le statut du paiement (`refunded` si intégral) et recalcule le solde/statut de la facture
- [ ] Rapprochement bancaire — ~~reporté~~ : un rapprochement fiable nécessite un vrai flux bancaire (import OFX/API bancaire) ; un simulateur CSV maison serait plus trompeur qu'utile sans données bancaires réelles
- [x] Export comptable (format compatible logiciel de compta) — export CSV de tous les paiements (date, n° facture, référence, moyen, statut, montant, montant remboursé) depuis la page Paiements
- [ ] Frais de retard automatiques (pénalité configurable au-delà de l'échéance) et escompte pour paiement anticipé

### Rapports
- [ ] Générateur de rapport personnalisable (choisir ses propres métriques/dimensions) — ~~reporté~~ : un vrai constructeur de requêtes (métriques/dimensions arbitraires) est un module à part entière, disproportionné face aux rapports déjà riches existants
- [x] Export PDF/Excel des rapports (actuellement visualisation uniquement) — export image (PNG), PDF (capture, réutilise `dashboardExport.ts`) et CSV (tableaux produits/clients/TVA) depuis le menu "Exporter"
- [ ] Rapports programmés envoyés par email (ex: chaque lundi) — ~~reporté~~ : nécessite un ordonnanceur + un service d'email, même limite que les autres automatisations différées
- [x] Comparaison multi-période sur un meme graphique — case à cocher "Comparer à la période précédente" superposant une ligne en pointillés (période précédente de même durée) sur le graphique de CA
- [x] Prévisions / projections de revenu — projection à 30 jours basée sur la moyenne quotidienne observée sur la période (affichée uniquement pour les périodes journalières : aujourd'hui/7j/30j, où l'extrapolation a un sens)
- [x] Rapport dédié TVA collectée (aide déclaration fiscale) — ventilation base imposable/TVA collectée par taux, remise répartie au prorata comme dans le calcul de facture
- [ ] Balance âgée / aging report des créances (0-30j, 30-60j, 60-90j, 90j+)

### Équipe
- [ ] Rôles personnalisés (au-dela des 5 rôles fixes) — ~~reporté~~ : nécessiterait de remplacer l'enum de rôles fixe par une entité `Role` dynamique par commerce, en profondeur dans tout le système de permissions (frontend ET mock-server) déjà vérifié — trop invasif
- [x] Matrice de permissions éditable par le propriétaire du commerce — dialogue "Modifier les permissions" par utilisateur (cases à cocher groupées par ressource), indépendant du rôle (`user.permissions` déjà distinct de `user.role`), avec "Réinitialiser aux permissions du rôle"
- [x] Connexion réelle des utilisateurs invités — l'invitation générait un mot de passe aléatoire (UUID) jamais transmis, rendant la connexion impossible en pratique. Un mot de passe temporaire lisible est désormais généré à la création, renvoyé une seule fois au propriétaire (boîte de dialogue avec copie en un clic) pour transmission manuelle (toujours pas d'email réel envoyé) ; testé de bout en bout : l'utilisateur invité se connecte bien avec. Complète aussi "Renvoyer une invitation" — un bouton dédié régénère un nouveau mot de passe temporaire pour un compte existant (protégé pour le propriétaire et l'auto-modification)
- [x] Changer mon mot de passe — formulaire dédié dans "Mon compte" (`authService.changePassword` existait déjà côté service mais n'était relié à aucune page), permet à tout utilisateur (y compris un compte invité) de remplacer son mot de passe temporaire par un choix personnel
- [x] Départements/équipes internes (regrouper les utilisateurs) — champ libre `department` sur l'utilisateur, éditable à l'invitation, affiché en liste et filtrable
- [x] Déconnexion automatique lors de la désactivation d'un compte — la désactivation (`PATCH /users/:id`) révoque immédiatement les jetons d'accès/rafraîchissement de l'utilisateur visé (même logique que la suppression, mutualisée dans `revokeUserTokens`) ; `requireAuth` refuse aussi tout jeton résiduel d'un compte `isActive: false` en défense en profondeur, et la connexion elle-même est bloquée pour un compte désactivé. Côté frontend, un watcher réactif dans `App.vue` (`authStore.authenticated`) redirige vers `/connexion` dès que le prochain appel API échoue en 401, même si l'utilisateur reste sur la même page (le garde de navigation seul ne le détecte qu'au changement de route). Toujours scopé par tenant : `findTeamMember` filtre par `businessId`, un propriétaire ne peut ni désactiver ni consulter un utilisateur d'un autre commerce (testé : 404)
- [x] Confirmation avant les actions importantes sur un utilisateur — désactivation, changement de rôle et régénération de mot de passe demandent désormais une confirmation explicite (même mécanisme que la suppression, déjà protégée). Pour le rôle (`<select>` natif), le nouveau rôle choisi reste affiché comme "en attente" tant que la confirmation n'est pas tranchée ; sur "Annuler", la liste revient au rôle réel (testé de bout en bout dans un vrai navigateur, y compris ce cas de re-synchronisation)
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
- [ ] Politique de mot de passe configurable par le propriétaire (longueur minimale, complexité)
- [ ] Journal des appels webhook (succès/échec/tentatives) — complète la configuration webhook existante
- [ ] Signature HMAC des webhooks (secret partagé pour vérifier l'authenticité côté client)

### Abonnement SaaS (vue commerçant)
- [x] Historique de facturation SaaS (mes factures/reçus d'abonnement Facture IA) — recus derives des cycles ecoules (pas de moteur de paiement recurrent reel), telechargement PDF par recu
- [x] Bannière de compte a rebours pendant la période d'essai — banniere globale (tout l'espace commerçant), jours restants, fermeture persistee jusqu'a la fin de cet essai
- [x] Codes promo / parrainage — codes promo statiques de demo + code de parrainage propre a chaque commerce (remise reelle appliquee au changement de plan, compteur de filleuls incremente, testé de bout en bout)
- [x] Facturation annuelle avec réduction (seul le mensuel existe) — variantes annuelles des plans payants (-20%), bascule mensuel/annuel sur la page

### UX transverse (tout l'espace commerçant)
- [x] Mode sombre — pas de variantes `dark:` ajoutées composant par composant (100+ fichiers) : une surcouche CSS centralisée (`main.css`) réassocie directement les classes Tailwind claires déjà en place à des équivalents sombres, de façon uniforme (même technique déjà utilisée pour le contraste élevé). Bascule dans la barre du haut (`ThemeToggle.vue`), persistée par navigateur, valeur par défaut = préférence système, script inline dans `index.html` pour éviter le flash au chargement. Portée strictement à l'espace commerçant (`body.commerce-scope`, posé dynamiquement selon la route) : l'espace admin garde son identité visuelle sombre fixe, indépendante du bascule
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
- [x] Internationalisation (français, anglais, espagnol, italien) — infrastructure `vue-i18n` (français par défaut, sans détection de la langue du navigateur : reste prévisible d'une visite à l'autre) + sélecteur dans la barre du haut (`LanguageSwitcher.vue`, à côté du mode sombre), persisté par navigateur, met à jour `<html lang>`. Traduit pour l'instant : authentification (connexion/inscription/mot de passe oublié-réinitialisé), navigation (barre latérale, palette de commandes), tableau de bord, coquille de la page Paramètres (titres de section, hors formulaires imbriqués comme les infos du commerce ou le compte), les modules Clients, Produits, Équipe et **Factures en entier** (liste, formulaire, page détail 919 lignes, et les 10 formulaires/composants imbriqués — paiement, remboursement, échéancier, avoirs, pièces jointes, partage), ainsi que le module **Devis en entier**, les pages dédiées **Avoirs** et **Paiements**, le module **Rapports en entier**, et les **formulaires détaillés de Paramètres** : `BusinessForm.vue` (493 lignes — infos générales, adresses, réseaux sociaux, horaires d'ouverture, contact, devise/TVA, configuration des factures), `MyAccountCard.vue` (historique de connexion, changement de mot de passe/email), `DangerZoneCard.vue`, `DeleteAccountDialog.vue`, `DeveloperSettingsCard.vue` (clé API, webhook) — tous réutilisant massivement les clés déjà traduites (`clients.form.*`, `auth.*`, `common.*`) pour les concepts identiques. Nouveau namespace `roles` pour les 5 rôles (`ROLE_LABELS` retiré de `permission.constants.ts`, devenu mort après migration). Namespace `common` pour les mots partagés entre modules (précédent/suivant/annuler/enregistrer/supprimer/exporter). **Avec ce module, la quasi-totalité de l'espace commerçant est traduite.** **Reste en français** : labels de référence détaillés (types de produit/entreprise, permissions granulaires, événements webhook — dictionnaires statiques peu prioritaires), espace admin plateforme (hors périmètre commerçant). Piège rencontré et corrigé : un `@` littéral dans un message vue-i18n (ex. placeholder d'email) est interprété comme le début de sa syntaxe de "message lié" et fait planter tout le rendu — les textes d'exemple de ce type sont sortis du système de traduction plutôt que d'être échappés
- [ ] Annulation ("Undo") après suppression — toast avec bouton "Annuler" quelques secondes avant que la suppression soit effective
- [ ] Corbeille / restauration d'éléments supprimés (clients, produits, factures) sous 30 jours, au lieu d'une suppression définitive immédiate
- [ ] Aide raccourcis clavier (modal listant les raccourcis disponibles, notamment ceux de la palette de commandes)
- [ ] Épinglage / favoris (clients ou factures fréquemment consultés)
- [ ] Préférences de notification (choisir quels évènements déclenchent une notification dans la cloche)

---

## ESPACE ADMIN PLATEFORME

### Gestion des commerces (au-dela de l'existant)
- [x] Suppression définitive d'un commerce (au-dela de la suspension) — confirmation par saisie exacte du nom, cascade complète (réutilise la même logique que la suppression self-service commerçant)
- [x] Export de la liste des commerces (CSV) — liste complète (filtres appliqués) ou sélection uniquement
- [x] Filtres avancés (par plan, date d'inscription, chiffre d'affaires facturé) — filtres combinables, `revenueTotal`/`planId` ajoutés au résumé commerce côté backend
- [x] Actions groupées (suspendre/exporter plusieurs commerces a la fois) — sélection multiple, suspendre/réactiver/exporter la sélection
- [x] Mode "aperçu" : voir l'interface telle qu'un commerçant donné la voit, sans se connecter a sa place — ticket d'aperçu à usage unique (60s), échangé contre une vraie session commerçant dans un nouvel onglet, bannière persistante "Quitter l'aperçu" (testé de bout en bout : émission, échange, réutilisation du ticket rejetée)
- [ ] Fonctionnalités activables par commerce (feature flags) — activer/désactiver une fonctionnalité pour un tenant donné
- [ ] Historique des changements de plan par commerce (timeline upgrade/downgrade)

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
- [ ] Page de statut interne (uptime simulé, dernière erreur, latence moyenne — pas un vrai APM)
