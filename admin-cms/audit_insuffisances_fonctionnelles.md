# 📑 Rapport d'Audit Fonctionnel – Insuffisances et Axes d'Amélioration Admin CMS KLIN UP

> **Document produit le :** 28 Juillet 2026  
> **Cible :** Application Web Admin CMS KLIN UP (`admin-cms`)  
> **Objet :** Relevé exhaustif des insuffisances fonctionnelles, limites techniques, manques UX et failles d'intégrité opérationnelle.

---

## 1. ⚙️ Architecture, Données & Multi-Boutiques

### 1.1 Non-persistance des paramètres globaux système
- **Constat** : Les réglages de délais (délai normal, délai express) et de taux de majoration express (`inputExpressHours`, `inputExpressMarkup`, `inputNormalHours`) dans l'onglet *Paramètres* sont uniquement stockés dans le state React local / LocalStorage du navigateur client.
- **Impact** : En cas de changement de navigateur, d'appareil ou de réinitialisation du cache, l'application retombe sur les valeurs par défaut. Aucun stockage n'est effectué dans une table `settings` sur le serveur Supabase.

### 1.2 Grille tarifaire unique (Absence de tarification par boutique)
- **Constat** : Le catalogue d'articles et de tarifs est strictement global à toute la plateforme.
- **Impact** : Impossible pour l'entreprise d'appliquer des prix différenciés selon l'emplacement du point de vente (ex: pressing situé dans une zone résidentielle à fort pouvoir d'achat vs pressing de quartier).

### 1.3 Gestion hors-ligne sans résolution de conflits (Optimistic Concurrency)
- **Constat** : La file d'attente hors-ligne (`klin_up_sync_queue`) réapplique les requêtes enregistrées localement dès le retour de la connexion Internet.
- **Impact** : Si deux utilisateurs modifient le même client ou la même commande hors-ligne sur deux postes différents, la dernière mutation réémise écrase brutalement l'état distant sans avertissement ni détection de conflit (*last-write-wins* sans verrouillage optimiste).

---

## 2. 🧺 Module Gestion des Commandes & Atelier

### 2.1 Absence de gestion des paiements partiels (Acomptes & Solde à la livraison)
- **Constat** : L'état financier d'une commande est binaire : soit *Payé*, soit *Non Payé*.
- **Impact** : Impossible d'enregistrer un acompte lors de la dépose du linge (ex: 50% versé à la dépose et 50% au retrait). Le solde impayé n'apparaît que globalement dans la dette client sans détail des acomptes par commande.

### 2.2 Absence de déduction automatique des abonnements lors de la commande
- **Constat** : Lors de la création d'une commande pour un client bénéficiant d'un abonnement actif, le nombre de vêtements déposés n'est pas automatiquement déduit du solde d'articles de son abonnement.
- **Impact** : L'opérateur de caisse doit ajuster manuellement le quota de l'abonnement depuis la fiche CRM du client, ce qui entraîne de fréquentes omissions et des pertes financières.

### 2.3 Workflow de restitution sans signature ni preuve de livraison
- **Constat** : Le changement de statut vers `restitue` ou `livre` se fait d'un simple clic sans validation secondaire.
- **Impact** : Aucun émargement, signature digitale client ou code OTP de confirmation de livraison n'est requis. En cas de contestation de livraison par un client, l'admin ne dispose d'aucune preuve formelle.

### 2.4 Impression des reçus dépendante du navigateur (Sans driver thermique direct)
- **Constat** : L'impression du ticket/facture s'effectue via le dialogue standard `window.print()`.
- **Impact** : Pas d'intégration directe avec des imprimantes thermiques de caisse (protocole ESC/POS via USB/Bluetooth/LAN). Les entêtes et pieds de tickets (Logo, NIF, IFU, Mentions légales) ne sont pas configurables de manière dynamique.

---

## 3. 👥 Module CRM Clients & Abonnements

### 3.1 Calcul rigide et codé en dur des crédits d'abonnement
- **Constat** : Dans `dbEngine.js` (`subscribeCustomer`), le quota de pièces attribué lors d'un abonnement est déterminé par une structure conditionnelle fixe (`25`, `50`, `100`, `200` pièces).
- **Impact** : Si l'administrateur crée un nouveau forfait sur-mesure dans le catalogue (ex: "Abonnement Étudiant - 15 pièces"), la souscription attribue un quota erroné ou par défaut car la durée et la quantité ne sont pas lues dynamiquement depuis l'article du catalogue.

### 3.2 Suivi historique et reçu de paiement des dettes inexistant
- **Constat** : Le bouton "Solder la dette" réinitialise la dette du client à 0.00 FCFA sans ventilation sur les factures historiques ni génération d'un reçu d'encaissement de dette.
- **Impact** : Impossibilité de tracer quelle commande spécifique a été réglée lors d'un paiement global de dette, ce qui complique les rapprochements comptables.

---

## 4. 🏷️ Module Catalogue & Tarifications

### 4.1 Catégories d'articles fixes non éditables
- **Constat** : Les catégories (`Vêtements`, `Linge de maison`, `Chaussures`, `Pressing Délicat`, `Abonnements`) sont définies de façon statique.
- **Impact** : Impossible d'ajouter de nouvelles catégories d'activité (ex: *Maroquinerie & Sacs*, *Tapis & Moquettes*, *Blanchisserie Industrielle*) sans modifier le code source.

### 4.2 Tarification au poids (kg) ou à la surface (m²) absente
- **Constat** : Le système ne prend en compte que la tarification à la pièce (quantité entière).
- **Impact** : Les prestations au kilo (ex: lavage/séchage au kg) ou au mètre carré (ex: nettoyage de tapis) doivent être converties artificiellement en unités fixes, faussant la métrologie de l'atelier.

---

## 5. 🔐 Module Sécurité, Rôles & Sécurisation des Accès (RBAC)

### 5.1 Sécurisation des routes par masquage UI uniquement (Absence de Route Guard)
- **Constat** : Les permissions granulaires (`can_manage_staff`, `can_edit_catalog`, etc.) contrôlent l'affichage des éléments d'interface dans les composants React.
- **Impact** : En l'absence de vérification stricte au niveau du routeur principal ou de garde-fous sur les méthodes de l'API/DB, un utilisateur malveillant manipulant le state React ou les props peut accéder aux vues restreintes.

### 5.2 Absences de politique de sécurité des PIN & expiration de session
- **Constat** :
  - Le code PIN initial de tout nouvel employé est `000000` sans obligation de réinitialisation lors du premier usage.
  - Aucun mécanisme de déconnexion automatique pour inactivité (*Session Timeout*) n'est présent.
- **Impact** : Un terminal de caisse laissé ouvert permet à n'importe qui d'effectuer des opérations sensibles (annulations, remises, suppressions) au nom de l'utilisateur connecté.

---

## 6. 📊 Module Reporting, Clôture de Caisse & Analytics

### 6.1 Absence du rapport de clôture de caisse journalière (Z de Caisse)
- **Constat** : L'application ne propose aucun module de clôture de caisse journalière.
- **Impact** : L'administrateur ne peut pas effectuer le comptage physique des espèces, Mobile Money et chèques en fin de journée pour comparer le solde réel au solde théorique et valider les écarts de caisse.

### 6.2 Impossibilité d'exporter les données financières (CSV / Excel / PDF)
- **Constat** : Aucun bouton d'exportation de données n'existe sur le Tableau de bord, le Journal d'Audit ou la liste des Commandes.
- **Impact** : L'équipe comptable ne peut pas extraire les ventes, la TVA ou le détail du chiffre d'affaires vers un tableur Excel ou un logiciel de comptabilité.

---

## 7. 📜 Module Journal d'Audit (Logs)

### 7.1 Tronquage de l'historique d'audit à 200 entrées
- **Constat** : La requête Supabase effectue un `.limit(200)` systématique sur la table `activity_logs`.
- **Impact** : L'historique d'audit au-delà des 200 dernières actions est invisible dans l'interface, sans possibilité de charger les archives plus anciennes ou de filtrer par plage de dates (ex: recherche d'un événement survenu il y a 3 mois).

---

## 8. 💻 Expérience Utilisateur (UX) & Ergonomie

### 8.1 Ergonomie des formulaires de caisse sur terminaux tactiles
- **Constat** : La modale d'enregistrement des commandes comporte de nombreux petits champs déroulants et boutons non optimisés pour l'usage tactile sur tablette de caisse.
- **Impact** : Ralentissement de la saisie en période d'affluence en boutique.

### 8.2 Absence de raccourcis clavier opérationnels
- **Constat** : La saisie et la validation s'effectuent exclusivement à la souris/toucher.
- **Impact** : L'absence de raccourcis clavier (`F2` Nouvelle commande, `F4` Encaissement rapide, `F8` Impression, `ESC` Fermer) pénalise la vitesse d'exécution des caissiers expérimentés.

---

## 💡 Synthèse des Recommandations Prioritaires

| Priorité | Domaine | Action Recommandée |
|---|---|---|
| 🔴 **P1** | **Finances** | Implémenter la gestion des **acomptes / paiements partiels** et le solde dû à la livraison. |
| 🔴 **P1** | **Abonnements** | Automatiser le **débit des quotas d'abonnement** directement lors de la création d'une commande. |
| 🟠 **P2** | **Comptabilité** | Ajouter le module de **Clôture de Caisse Journalière (Z de caisse)** et l'export CSV/Excel des ventes. |
| 🟠 **P2** | **Persistance** | Persister les **Paramètres Système (Délais/Majorations)** dans la base Supabase. |
| 🟡 **P3** | **Sécurité** | Implémenter le **Session Timeout** (déconnexion après inactivité) et le changement de PIN obligatoire à la première connexion. |
| 🟡 **P3** | **Audit** | Ajouter la **pagination et le filtre par intervalle de dates** sur le journal d'audit des logs. |
