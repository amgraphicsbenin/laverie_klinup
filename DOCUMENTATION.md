# 📚 Documentation Technique & Fonctionnelle — Plateforme KLIN UP

> **Version** : 1.0 — **Date** : Juillet 2026  
> **Dépôt GitHub** : [amgraphicsbenin/laverie_klinup](https://github.com/amgraphicsbenin/laverie_klinup)

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Stack technique](#2-stack-technique)
3. [Architecture du projet](#3-architecture-du-projet)
4. [Base de données Supabase](#4-base-de-données-supabase)
5. [Système d'authentification & Rôles](#5-système-dauthentification--rôles)
6. [Application Mobile — Caisse & Atelier](#6-application-mobile--caisse--atelier)
7. [Interface Administration (CMS)](#7-interface-administration-cms)
8. [Moteur de base de données (db.js)](#8-moteur-de-base-de-données-dbjs)
9. [Catalogue & Tarifs](#9-catalogue--tarifs)
10. [Système d'abonnements](#10-système-dabonnements)
11. [Cycle de vie d'une commande](#11-cycle-de-vie-dune-commande)
12. [Programme de fidélité](#12-programme-de-fidélité)
13. [Connectivité & Mode hors-ligne](#13-connectivité--mode-hors-ligne)
14. [Déploiement & Développement](#14-déploiement--développement)
15. [Scripts utilitaires](#15-scripts-utilitaires)

---

## 1. Présentation générale

**KLIN UP** est une plateforme de gestion complète pour laveries professionnelles, composée de deux applications complémentaires :

| Application | Rôle | Cible |
|-------------|------|-------|
| **Application Mobile** | Caisse, suivi des commandes, gestion atelier, CRM client | Agents d'accueil, gérants sur tablette/téléphone Android |
| **Interface Administration (CMS)** | Analytique avancée, supervision, gestion du personnel, catalogue | Managers et Super Administrateurs sur ordinateur de bureau |

Les deux applications partagent la même base de données Supabase Cloud en temps réel. Toute modification effectuée sur l'une des interfaces est immédiatement visible sur l'autre grâce à Supabase Realtime.

---

## 2. Stack technique

### Frontend (commun aux deux apps)

| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | 19.2.6 | Bibliothèque UI principale |
| **Vite** | 8.0+ | Bundler et serveur de développement |
| **Vanilla CSS** | — | Styles (pas de Tailwind) |
| **Lucide React** | 0.475.0 | Icônes vectorielles |
| **Material Symbols** | 0.45.3 | Icônes Material Design |

### Backend & Données

| Technologie | Version | Usage |
|-------------|---------|-------|
| **Supabase** | 2.108.2 | BDD PostgreSQL + Realtime + Auth |
| **Supabase Realtime** | — | Synchronisation temps réel entre appareils |

### App Mobile — Couche native Android

| Technologie | Version | Usage |
|-------------|---------|-------|
| **Capacitor** | 8.4.0 | Emballage WebView → APK Android |
| **@capacitor/android** | 8.4.0 | Plugin natif Android |
| **@capacitor/status-bar** | 8.0.2 | Contrôle de la barre de statut Android |
| **@capacitor/app** | 8.1.0 | Cycle de vie de l'application native |
| **AndroidPrintPlugin** | Custom | Plugin Java custom pour l'impression de tickets via Bluetooth/USB |

---

## 3. Architecture du projet

```
KLIN UP WEB APP/
├── mobile-app/                     # Application mobile (Caisse & Atelier)
│   ├── src/
│   │   ├── components/
│   │   │   └── MobileView.jsx      # Interface principale (~5500 lignes)
│   │   ├── services/
│   │   │   ├── db.js               # Moteur de données (1330 lignes)
│   │   │   └── supabaseClient.js   # Client Supabase configuré
│   │   ├── utils/                  # Données utilitaires (pays, etc.)
│   │   ├── assets/                 # Logos, images
│   │   ├── index.css               # Système de design (~1200 lignes)
│   │   └── main.jsx                # Point d'entrée React
│   └── android/                    # Projet Android natif (Capacitor)
│       └── app/src/main/java/com/klinup/laverie/
│           └── AndroidPrintPlugin.java  # Plugin d'impression custom
│
├── admin-cms/                      # Interface Administration (CMS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminView.jsx       # Vues métier (~5500 lignes)
│   │   │   └── CustomSelect.jsx    # Composant select custom
│   │   ├── services/
│   │   │   ├── db.js               # Moteur de données (miroir mobile-app)
│   │   │   └── supabaseClient.js   # Client Supabase configuré
│   │   ├── utils/
│   │   ├── assets/
│   │   ├── index.css               # Système de design admin
│   │   ├── App.jsx                 # Authentification + Navigation + Layout
│   │   └── main.jsx
│
├── schema.sql                      # Schéma PostgreSQL complet + RLS + Seed
├── db.json                         # Base de données JSON (usage dev local)
├── db-server.js                    # Serveur JSON local (dev sans Supabase)
├── start-admin.bat                 # Lancement rapide admin (Windows)
├── start-app.bat                   # Lancement rapide app mobile (Windows)
└── start-db.bat                    # Lancement serveur JSON local (Windows)
```

---

## 4. Base de données Supabase

### Informations de connexion

| Paramètre | Valeur |
|-----------|--------|
| **URL Supabase** | `https://ucnqwqkjnlsrbdbmukvz.supabase.co` |
| **Clé anonyme** | Configurée via `VITE_SUPABASE_ANON_KEY` (ou hardcodée en fallback) |
| **Auth mode** | Anon Key (pas d'authentification Supabase Auth — système de PIN custom) |

### Tables

#### `staff` — Personnel

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | Identifiant unique (`u_xxxxx`) |
| `nom` | TEXT | Nom de famille |
| `prenom` | TEXT | Prénom |
| `role` | TEXT | Rôle (`super_admin`, `manager`, `agent_accueil`) |
| `email` | TEXT (UNIQUE) | Email professionnel (utilisé à la connexion) |
| `code_pin` | TEXT | Code PIN à 6 chiffres pour déverrouiller l'interface |
| `statut` | TEXT | `actif` ou `suspendu` |
| `telephone` | TEXT | Numéro de téléphone |
| `permissions` | JSONB | Permissions granulaires (objet JSON) |
| `created_at` | TIMESTAMPTZ | Date de création |

#### `customers` — Clients

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | Identifiant unique (`c_xxxxx`) |
| `nom` | TEXT | Nom |
| `prenom` | TEXT | Prénom |
| `telephone` | TEXT (UNIQUE) | Numéro de téléphone (clé d'identification principale) |
| `adresse` | TEXT | Adresse physique |
| `indicatif` | TEXT | Indicatif pays (`229` par défaut — Bénin) |
| `preferences_pliage` | TEXT | `Plié` ou `Suspendu` |
| `points_fidelite` | INT | Points de fidélité accumulés (1 pt / 1000 FCFA) |
| `solde_dette` | NUMERIC | Solde restant dû (dette) en FCFA |
| `active_subscription` | JSONB | Abonnement actif (objet JSON ou `null`) |
| `created_at` | TIMESTAMPTZ | Date de création |

#### `orders` — Commandes

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | Identifiant unique (`o_xxxxx`) |
| `customer_id` | TEXT (FK) | Référence client |
| `statut` | TEXT | Statut de la commande (voir cycle de vie) |
| `type_article` | TEXT | Article principal (pour commandes mono-article) |
| `type_service` | TEXT | Service principal |
| `niveau_urgence` | TEXT | `Normal` ou `Express` |
| `mode_reglement` | TEXT | `especes`, `mobile_money`, `abonnement`, `dette` |
| `avance_payee` | NUMERIC | Acompte versé en FCFA |
| `prix_total` | NUMERIC | Prix total calculé en FCFA |
| `identifiant_unique_marquage` | TEXT | Code de marquage `KLIN-XXXXXX` (imprimé sur ticket) |
| `created_at` | TIMESTAMPTZ | Date de création |
| `due_date` | TIMESTAMPTZ | Date d'échéance calculée selon urgence |
| `acompte_paid_at` | TIMESTAMPTZ | Date de paiement de l'acompte |
| `solde_paid_at` | TIMESTAMPTZ | Date de paiement du solde |
| `items` | JSONB | Liste des articles en multi-articles |
| `is_subscription_order` | BOOLEAN | `true` si commande sur abonnement |
| `subscription_details` | JSONB | Détails de la déduction abonnement |
| `created_by_id` | TEXT | ID de l'agent créateur |
| `created_by_name` | TEXT | Nom de l'agent créateur |

#### `activity_logs` — Journal d'activité

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | Identifiant unique (`l_xxxxx`) |
| `user_id` | TEXT | ID de l'utilisateur ayant déclenché l'action |
| `action` | TEXT | Code de l'action (ex. `CREATION_COMMANDE`) |
| `details` | TEXT | Description lisible de l'action |
| `timestamp` | TIMESTAMPTZ | Horodatage de l'action |

**Actions trackées** : `CONNEXION`, `DECONNEXION`, `CREATION_CLIENT`, `MODIFICATION_CLIENT`, `SUPPRESSION_CLIENT`, `CREATION_COMMANDE`, `MISE_A_JOUR_STATUT`, `PAIEMENT_FINAL`, `ANNULATION_COMMANDE`, `SOUSCRIPTION_ABONNEMENT`, `DESABONNEMENT`, `COMMANDE_ABONNEMENT`, `CREATION_PERSONNEL`, `MODIFICATION_PERSONNEL`, `SUPPRESSION_PERSONNEL`, `MODIFICATION_TARIF`, `MAJ_SOLDE_FINANCIER`, `DEMANDE_RESET_PIN`

#### `catalog` — Catalogue & Tarifs

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | Identifiant unique |
| `article` | TEXT | Nom de l'article |
| `service` | TEXT | Type de service (`lavage_simple`, `nettoyage_a_sec`, `repassage`, `abonnement`, `system`) |
| `prix` | NUMERIC | Prix en FCFA |
| `categorie` | TEXT | `individuel`, `abonnement`, `system_setting` |
| `description` | TEXT | Description (principalement pour abonnements) |

**Entrées spéciales dans le catalogue** :
- `setting_express_hours` : Délai Express en heures (par défaut : 6h)
- `setting_normal_hours` : Délai Normal en heures (par défaut : 48h)
- `setting_express_markup` : Majoration Express en % (par défaut : 50%)

#### `pin_reset_requests` — Demandes de réinitialisation PIN

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | Identifiant unique (`req_xxxxx`) |
| `email` | TEXT | Email du demandeur |
| `staff_name` | TEXT | Nom du membre du personnel |
| `status` | TEXT | `pending`, `approved`, `rejected` |
| `resolved_pin` | TEXT | Nouveau PIN généré (visible après approbation) |
| `created_at` | TIMESTAMPTZ | Date de la demande |

### Sécurité (RLS — Row Level Security)

RLS est activé sur toutes les tables. Les politiques actuelles autorisent **toutes les opérations** pour les rôles `anon` et `authenticated`. L'authentification est gérée en amont par le système de PIN applicatif (non par Supabase Auth).

### Realtime

Toutes les tables sont ajoutées à la publication `supabase_realtime`. Les événements `INSERT`, `UPDATE` et `DELETE` sont écoutés par les applications pour mettre à jour l'interface en temps réel sans rechargement.

---

## 5. Système d'authentification & Rôles

### Mécanisme d'authentification

L'authentification ne passe **pas** par Supabase Auth. Elle est entièrement custom :

1. **Étape 1 — Email** : L'utilisateur saisit son email professionnel. Le système cherche un `staff` correspondant dans la base.
2. **Étape 2 — PIN** : Un clavier numérique 6 chiffres apparaît. L'utilisateur saisit son code PIN.
3. **Étape 3 — Déverrouillage** : Si le PIN correspond au champ `code_pin` du membre du personnel, la session est ouverte.

La session est persistée dans `localStorage` via la clé `klin_up_current_user`. Un statut `suspendu` empêche l'accès même avec un PIN valide.

### Rôles

| Rôle | Description | Permissions |
|------|-------------|-------------|
| `super_admin` | Administrateur suprême | Accès total (dashboard, gestion commandes, CRM, catalogue, logs, personnel) |
| `manager` | Gérant | Dashboard, gestion commandes, CRM, catalogue (pas gestion personnel, pas logs complets) |
| `agent_accueil` | Agent de caisse | Gestion commandes, CRM uniquement |

### Permissions granulaires

Le champ `permissions` (JSONB) permet un contrôle fin par membre :

```json
{
  "can_view_dashboard": true,
  "can_manage_orders": true,
  "can_manage_crm": true,
  "can_edit_catalog": true,
  "can_view_logs": true,
  "can_manage_staff": true
}
```

### Réinitialisation de PIN

Si un employé oublie son PIN :

1. L'employé clique **"Mot de passe oublié"** sur l'écran de connexion.
2. Il saisit son email professionnel — une demande `pin_reset_requests` est créée.
3. Un Super Admin voit la demande dans les notifications de l'interface admin et l'approuve.
4. Un nouveau PIN à 6 chiffres est auto-généré et affiché dans la notification.
5. L'employé se reconnecte avec ce nouveau PIN.

---

## 6. Application Mobile — Caisse & Atelier

### Lancement

```bash
cd mobile-app
npm install
npm run dev          # Mode développement (localhost:5173)
npm run build        # Build production
```

Pour générer l'APK Android :

```bash
npx cap sync android
npx cap open android   # Ouvre Android Studio
```

### Interface & Navigation

L'interface mobile simule un affichage de téléphone vertical (`mobile-simulator`). La navigation est assurée par une barre d'onglets en bas de l'écran.

#### Onglets de navigation

| Onglet | Icône | Contenu |
|--------|-------|---------|
| **Accueil** | `home` | Tableau de bord opérationnel (KPIs, activité récente, top clients) |
| **Gestion** | `store` | Gestion des clients (CRM), abonnements |
| **Facturation** | `receipt_long` | Création de commandes, suivi atelier |
| **Profil** | `person` | Profil utilisateur, paramètres, diagnostic réseau, catalogue/tarifs |

### Onglet Accueil — Dashboard

- **KPIs en temps réel** : Chiffre d'affaires, commandes actives, commandes en attente, commandes livrées, commandes Express, commandes en retard
- **Pipeline de production** : Vue visuelle du flux (reçu → lavage → repassage → prêt)
- **Graphique d'activité** : Courbe du volume de linge traité sur la période sélectionnée (3 jours à 12 mois)
- **Activité récente** : Journal des 5 dernières actions
- **Top clients** : Classement des clients les plus actifs

Chaque carte KPI est cliquable et ouvre une liste détaillée des commandes concernées.

### Onglet Gestion — CRM

**Sous-vue Profils clients** :
- Liste paginée de tous les clients avec recherche
- Fiche client complète : nom, téléphone, adresse, indicatif pays, préférences de pliage
- Points de fidélité, solde dette, historique des commandes
- Abonnement actif avec solde de vêtements restants et date d'expiration
- Modification des informations, suppression

**Sous-vue Abonnements** :
- Liste de tous les clients avec abonnement actif
- Visualisation du solde et de l'expiration

### Onglet Facturation — Gestion des commandes

#### Création de commande

Le formulaire de création inclut :

1. **Sélection du client** (recherche par nom/téléphone)
2. **Multi-articles** : Sélectionner plusieurs articles avec quantités et services différents
3. **Niveau d'urgence** : Normal (48h par défaut) ou Express (6h par défaut, +50% sur le prix)
4. **Mode de règlement** : Espèces, Mobile Money, Abonnement, Dette
5. **Acompte versé** : Montant versé immédiatement
6. **Souscription d'abonnement** : Possibilité de souscrire à un abonnement en même temps que la commande
7. **Code de marquage** : Généré automatiquement (`KLIN-XXXXXX`)

#### Suivi des commandes

Vue kanban par statut avec filtres :
- **En attente** : Commandes reçues, non encore traitées
- **En cours** : En lavage/nettoyage/repassage
- **Prêtes** : Traitées, prêtes à être récupérées/livrées
- **Livrées** : Restituées au client
- **Annulées** : Commandes annulées

Actions disponibles sur chaque commande :
- Changer le statut (glissement dans le pipeline)
- Livraison avec paiement final (règle le solde restant)
- Annulation (recrédite la dette si applicable)
- Impression du ticket (via plugin Android)

### Onglet Profil

- **Profil utilisateur** : Informations personnelles, changement de session (déconnexion)
- **Paramètres** : Activer/désactiver les notifications WhatsApp
- **Gestion du catalogue** : Consultation et modification des tarifs (selon permissions)
- **Diagnostic réseau** : Test de connexion Supabase avec bouton "Réessayer"
- **Informations techniques** : Version de l'app, état de la connexion

### Mode CalmyClient

Interface simplifiée dédiée aux clients en libre-service (borne tactile) :
- Consulter le statut de sa commande par numéro de marquage
- Accès via code spécial depuis l'interface agent

---

## 7. Interface Administration (CMS)

### Lancement

```bash
cd admin-cms
npm install
npm run dev          # Mode développement (localhost:5174 ou autre port)
npm run build        # Build production
```

### Navigation

L'interface admin est une **Single Page Application** avec sidebar de navigation latérale (desktop uniquement).

#### Menu de navigation (Super Admin / Manager)

| Section | Icône | Contenu |
|---------|-------|---------|
| **Vue d'ensemble** | `dashboard` | Tableau de bord analytique avancé |
| **Gestion Commandes** | `shopping_bag` | Suivi et gestion de toutes les commandes |
| **CRM** | `people` | Gestion de la base clients |
| **Catalogue & Tarifs** | `menu_book` | Gestion du catalogue et des prix |
| **Personnel** | `badge` | Gestion des membres du personnel |
| **Historique** | `history` | Journal d'activité et logs |
| **Paramètres** | `settings` | Configuration du système (délais, majorations) |

### Section Dashboard — Analytics

- **KPIs financiers** : CA total, CA du mois, CA de la semaine
- **KPIs opérationnels** : Taux de complétion, commandes par statut, délais moyens
- **Graphiques métier** :
  - Volume de linge traité par période
  - Répartition par type de service (lavage/nettoyage/repassage)
  - Évolution du CA
- **Export KPI** : Export au format CSV (UTF-8 BOM pour Excel)
- **Filtres date** : Filtres personnalisables par plage de dates sur les panneaux KPI

### Section Gestion Commandes

- Tableau complet de toutes les commandes avec filtres avancés
- Changement de statut en masse
- Modale de livraison avec saisie du paiement final
- Annulation avec confirmation
- Filtres : par statut, par client, par date, par agent créateur

### Section CRM

- Base de données clients complète
- Recherche et filtrage
- Création, modification, suppression de clients
- Gestion des abonnements (souscription/résiliation)
- Consultation de l'historique de commandes par client
- Gestion des dettes

### Section Catalogue & Tarifs

- Liste de tous les articles du catalogue avec leurs tarifs
- Modification des prix article par article
- Ajout de nouveaux articles personnalisés
- Modification de la description des abonnements
- Réglages système (délais Express/Normal, majoration Express)

### Section Personnel

- Liste de tous les membres du personnel
- Création de nouveaux comptes (nom, prénom, rôle, email, PIN initial)
- Modification des informations et des permissions granulaires
- Suspension/réactivation de comptes
- Réinitialisation manuelle du PIN (par le Super Admin)
- Gestion des demandes de réinitialisation PIN en attente

### Section Historique (Logs)

- Journal complet de toutes les actions de l'application
- Filtres par type d'action, par utilisateur, par date
- Recherche plein texte
- Visible uniquement par le rôle `super_admin`

### Topbar et Notifications

- **Barre de recherche globale** : Recherche transversale sur toutes les vues
- **Cloche de notifications** : Flux en temps réel des actions récentes (commandes, paiements, demandes de reset PIN)
- **Actions rapides sur notifications** : Approuver/rejeter les demandes de reset PIN directement depuis le dropdown
- **Badge de connexion** : Indicateur de l'état de connexion Supabase (`Supabase` en vert)
- **Profil utilisateur** : Accès rapide à la déconnexion

---

## 8. Moteur de base de données (db.js)

Le fichier `db.js` constitue le cœur de l'application. Il est **identique** dans les deux projets (`mobile-app` et `admin-cms`).

### Architecture en mémoire

Toutes les données sont stockées dans un objet `memoryDb` en mémoire vive :

```javascript
let memoryDb = {
  staff: [],
  customers: [],
  orders: [],
  logs: [],
  catalog: [],
  current_user: null,
  pin_reset_requests: []
};
```

### Cycle d'initialisation

```
Démarrage application
    |
loadFromLocalStorage()  --> Charge current_user depuis localStorage
    |
initDb()               --> Tente de charger toutes les tables depuis Supabase
    |-- Succès          --> isUsingRemote = true, setupRealtime(), startPeriodicSync()
    +-- Echec (3 essais) --> startAutoReconnect() (tente toutes les 30s)
```

### Mécanismes de synchronisation

| Mécanisme | Fréquence | Déclencheur |
|-----------|-----------|-------------|
| **Realtime (WebSocket)** | Instantané | INSERT/UPDATE/DELETE sur Supabase |
| **Sync périodique** | Toutes les 60s | Timer automatique |
| **Reconnexion auto** | Toutes les 30s | Quand `isUsingRemote = false` |
| **Reconnexion manuelle** | Sur demande | Bouton "Réessayer" ou diagnostic réseau |

### Pattern Optimistic Update

Pour toutes les opérations d'écriture, le moteur applique une mise à jour **optimiste** :

1. La modification est appliquée immédiatement en mémoire (`memoryDb`)
2. L'UI est notifiée via `db.notify()`
3. La requête Supabase est envoyée en arrière-plan
4. En cas d'erreur Supabase : rollback automatique en mémoire + alerte utilisateur

### API publique (objet `db`)

| Méthode | Description |
|---------|-------------|
| `db.subscribe(listener)` | Abonner un composant React aux changements |
| `db.notify()` | Déclencher manuellement une notification à tous les abonnés |
| `db.getStaff()` | Retourne une copie du tableau du personnel |
| `db.getCustomers()` | Retourne une copie du tableau des clients |
| `db.getOrders()` | Retourne une copie du tableau des commandes |
| `db.getLogs()` | Retourne une copie des logs d'activité |
| `db.getCatalog()` | Retourne une copie du catalogue |
| `db.getCurrentUser()` | Retourne l'utilisateur connecté |
| `db.setCurrentUser(user)` | Connecter/déconnecter un utilisateur |
| `db.addCustomer(data)` | Créer un nouveau client |
| `db.updateCustomer(id, fields)` | Modifier un client |
| `db.deleteCustomer(id)` | Supprimer un client |
| `db.updateCustomerDebt(id, amount)` | Modifier la dette d'un client |
| `db.createOrder(data)` | Créer une commande (calcul automatique du prix) |
| `db.updateOrderStatus(id, status)` | Changer le statut d'une commande |
| `db.deliverOrderWithPayment(id, amount, method)` | Livrer avec paiement final |
| `db.cancelOrder(id)` | Annuler une commande |
| `db.addStaff(member)` | Créer un membre du personnel |
| `db.updateStaff(id, fields)` | Modifier un membre du personnel |
| `db.deleteStaff(id)` | Supprimer un membre du personnel |
| `db.subscribeCustomer(id, planId)` | Souscrire un client à un abonnement |
| `db.unsubscribeCustomer(id)` | Résilier l'abonnement d'un client |
| `db.updateCatalogPrice(id, price)` | Modifier le prix d'un article |
| `db.updateCatalogItem(id, fields)` | Modifier un article du catalogue |
| `db.addCatalogItem(...)` | Ajouter un article personnalisé |
| `db.createPinResetRequest(email)` | Soumettre une demande de reset PIN |
| `db.approvePinResetRequest(id)` | Approuver une demande de reset PIN |
| `db.rejectPinResetRequest(id)` | Rejeter une demande de reset PIN |
| `db.resetStaffPin(userId, newPin)` | Réinitialiser manuellement un PIN |
| `db.logAction(action, details)` | Enregistrer une action dans les logs |
| `db.isRemote()` | Vérifier si connecté à Supabase (boolean) |
| `db.testConnection()` | Tester la connexion Supabase (async, retourne `{success, error}`) |
| `db.canUserViewCA(user)` | Permission : voir le chiffre d'affaires |
| `db.canUserViewDashboard(user)` | Permission : voir le dashboard |
| `db.canUserManageOrders(user)` | Permission : gérer les commandes |
| `db.canUserManageCRM(user)` | Permission : gérer les clients |
| `db.canUserEditCatalog(user)` | Permission : modifier le catalogue |
| `db.canUserManageStaff(user)` | Permission : gérer le personnel |

---

## 9. Catalogue & Tarifs

### Articles disponibles (par défaut)

Le catalogue inclut **39 types d'articles** :

**Vêtements** : Chemise, Pantalon, Robe, Combinaison, Jupe, Pull, Culotte, T-shirt, Polo, Blouson, Veste, Costume, Cravate, Haut, Débardeur, Jeans, Robe de mariée, Robe fantaisiste, Ensemble 2 pièce, Ensemble 3 pièces, Chapeau, Foulard

**Linge de maison** : Couette Légée, Couette Lourd, 1 Drap + 2 Taies, 2 Draps + 2 Taies, Taies, Petite serviette, Grandes serviettes, Nappe de table, Rideau, Serpillière, Torchon, Chausette

### Services disponibles

| Service | Code | Description |
|---------|------|-------------|
| Lavage Simple | `lavage_simple` | Lavage standard |
| Nettoyage à Sec | `nettoyage_a_sec` | Dry cleaning |
| Repassage | `repassage` | Repassage uniquement |

### Tarifs de base (articles à prix définis par défaut)

| Article | Lavage Simple | Nettoyage à Sec | Repassage |
|---------|--------------|-----------------|-----------|
| Chemise | 1 500 FCFA | 3 000 FCFA | 1 000 FCFA |
| Pantalon | 2 000 FCFA | 3 500 FCFA | 1 200 FCFA |
| Robe | 2 500 FCFA | 4 500 FCFA | 1 500 FCFA |
| Combinaison | 3 000 FCFA | 5 000 FCFA | 1 800 FCFA |

> Tous les autres articles sont initialisés à **0 FCFA** et doivent être configurés manuellement par un admin ou manager.

### Majoration Express

Lorsqu'une commande est classée **Express** :
- Le délai est réduit à la valeur configurée (`setting_express_hours`, par défaut 6h)
- Le prix total est majoré du pourcentage configuré (`setting_express_markup`, par défaut 50%)
- Formule : `prix_final = round(prix_base x (1 + majoration/100))`

---

## 10. Système d'abonnements

### Formules disponibles

| Formule | Prix/mois | Quota vêtements | Ramassages inclus |
|---------|-----------|-----------------|-------------------|
| **Offre Active** | 20 000 FCFA | 25 vêtements | Livraison & ramassage gratuits |
| **Abonnement Premium** | 35 000 FCFA | 50 vêtements/mois | 2 ramassages max/mois |
| **Abonnement Prestige** | 60 000 FCFA | 100 vêtements/mois | 4 ramassages max/mois |
| **Abonnement VIP** | 100 000 FCFA | 200 vêtements/mois | 4 ramassages max/mois |

### Fonctionnement

1. Un client souscrit à un abonnement (via CRM ou lors d'une création de commande)
2. `active_subscription` est mis à jour sur le profil client avec :
   - Le nom du forfait
   - Le quota total et le quota restant
   - La date de souscription et la date d'expiration (1 mois)
3. Lors de la création d'une commande avec abonnement :
   - Le nombre de vêtements est déduit du quota (`remaining_clothes`)
   - Si le quota est insuffisant, une erreur est levée
4. La commande est marquée `is_subscription_order = true`

### Structure JSON de `active_subscription`

```json
{
  "catalog_item_id": "sub2",
  "name": "Abonnement Premium",
  "total_clothes": 50,
  "remaining_clothes": 37,
  "subscribed_at": "2026-07-01T10:00:00.000Z",
  "expires_at": "2026-08-01T10:00:00.000Z"
}
```

---

## 11. Cycle de vie d'une commande

```
CREATION
    |
en_attente     --> Commande reçue, pas encore prise en charge
    |
en_cours       --> En traitement (lavage/nettoyage/repassage)
    |
pret           --> Traitement terminé, en attente de restitution
    |
 [a_livrer | a_recuperer]   --> Variantes "prêt à rendre"
    |
restitue       --> Remis au client (solde réglé)
    |
    +--- annule  --> Commande annulée (la dette est recrédité si applicable)
```

### Gestion financière lors de la restitution

Quand une commande passe en `restitue`, `a_livrer` ou `a_recuperer` :
- Le solde restant (`prix_total - avance_payee`) est soustrait de `solde_dette` du client
- Des points de fidélité sont attribués : 1 point par 1 000 FCFA payés
- L'horodatage `solde_paid_at` est enregistré

---

## 12. Programme de fidélité

- **Accumulation** : 1 point de fidélité par 1 000 FCFA payés
- **Points sur acompte** : Crédités dès la création de la commande si un acompte est versé
- **Points sur solde** : Crédités lors de la restitution/livraison
- **Affichage** : Sur la fiche client dans le CRM et l'application mobile
- **Utilisation** : Consultation uniquement (pas encore de système de récompenses/conversion automatique)

---

## 13. Connectivité & Mode hors-ligne

### Comportement actuel

L'application fonctionne **exclusivement en mode connecté** à Supabase. Il n'existe pas de mode hors-ligne fonctionnel.

**Si la connexion Supabase échoue au démarrage :**
- Un écran de blocage plein écran s'affiche avec le message *"Erreur de connexion"*
- L'utilisateur ne peut accéder à aucune fonctionnalité de l'application
- Un bouton **"Réessayer"** relance manuellement la tentative de connexion
- Un mécanisme de reconnexion automatique tente toutes les **30 secondes** de rétablir la connexion en arrière-plan

**Si la connexion est rétablie :**
- L'application se réinitialise en direct (sans redémarrage) grâce à `initDb(true)`
- L'écran de blocage disparaît automatiquement
- Toutes les données sont rechargées depuis Supabase

### Délais & Timeouts

| Opération | Timeout |
|-----------|---------|
| Chargement initial de chaque table | 15 secondes |
| Requêtes de synchronisation périodique | 10 secondes |
| Reconnexion automatique | Intervalle de 30 secondes |
| Synchronisation périodique | Toutes les 60 secondes |
| Tentatives initiales | 3 essais (avec 3s entre chaque) |

---

## 14. Déploiement & Développement

### Pré-requis

- Node.js >= 18.x
- npm >= 9.x
- Android Studio (pour builds APK uniquement)
- JDK 17 (pour builds Android)

### Variables d'environnement

Fichier `.env` (optionnel, des valeurs hardcodées sont utilisées en fallback) :

```env
VITE_SUPABASE_URL=https://ucnqwqkjnlsrbdbmukvz.supabase.co
VITE_SUPABASE_ANON_KEY=<votre_cle_anon>
```

### Commandes de développement

```bash
# Application Mobile
cd mobile-app
npm install
npm run dev       # Démarrer le serveur de développement (port 5173)
npm run build     # Build production vers dist/

# Interface Administration
cd admin-cms
npm install
npm run dev       # Démarrer le serveur de développement (port auto)
npm run build     # Build production vers dist/
```

### Build Android (APK)

```bash
cd mobile-app
npm run build             # 1. Build du frontend
npx cap sync android      # 2. Synchronisation avec le projet Android natif
npx cap open android      # 3. Ouvrir Android Studio
# Dans Android Studio : Build > Generate Signed Bundle/APK
```

### Initialisation de la base de données

Pour créer la base de données sur un nouveau projet Supabase :

1. Ouvrir le **SQL Editor** de Supabase Dashboard
2. Copier-coller le contenu de `schema.sql`
3. Exécuter le script

Le script est **idempotent** (peut être exécuté plusieurs fois sans erreur grâce aux `ON CONFLICT DO NOTHING` et aux blocs `DO ... EXCEPTION`).

### Configuration du client Supabase (Android/Capacitor)

Le client est configuré pour fonctionner correctement dans un WebView Android :

```javascript
createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,  // Desactive la detection OAuth (bloque sur Android WebView)
    persistSession: true,       // Persiste la session dans localStorage
    autoRefreshToken: true,
  }
});
```

---

## 15. Scripts utilitaires

### `start-admin.bat` / `start-app.bat`

Scripts Windows pour lancer rapidement les applications en mode développement via un double-clic. Utiles pour les membres de l'équipe qui ne sont pas familiers avec la ligne de commande.

### `start-db.bat` / `db-server.js`

Serveur JSON local (`json-server`) pour les tests de développement sans Supabase. Utilise `db.json` comme base de données fichier. Permet de travailler entièrement en local sans connexion internet.

### `mobile-app/src/components/update_header.cjs`

Script Node.js utilitaire pour fusionner des fragments de l'interface mobile (fichiers `.tmp`) dans le fichier `MobileView.jsx` principal. Utile lors des développements sur des segments de code volumineux découpés en plusieurs fichiers temporaires.

---

## Comptes de démonstration (Seed)

Les comptes suivants sont créés automatiquement lors de l'initialisation de la base de données :

| Prénom | Nom | Rôle | Email | PIN |
|--------|-----|------|-------|-----|
| Jean-Luc | Gomez | super_admin | jean-luc.gomez@klinup.com | 111111 |
| Marie-Antoinette | Koffi | manager | marie.koffi@klinup.com | 222222 |
| Pierre | Diallo | agent_accueil | pierre.diallo@klinup.com | 333333 |
| André | Koutomi | super_admin | andre.koutomi98@gmail.com | 000000 |

> **IMPORTANT** : Changer les PINs de démonstration avant toute mise en production.

---

*Documentation générée à partir du code source — KLIN UP v1.0 — Juillet 2026*
