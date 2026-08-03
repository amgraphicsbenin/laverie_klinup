# KLIN UP - Admin CMS (Web Application)

Ce dossier contient le code source de l'application Web d'Administration (CMS) du service de blanchisserie et laverie **KLIN UP**.

## 🛠️ Stack Technique
- **Framework** : React 18+ / Vite
- **Langage** : JavaScript / JSX
- **Styling** : Tailwind CSS, Lucide React (Icônes)
- **Base de données / Backend** : Supabase & Serveur DB JSON local (`db-server.js`)

## 📁 Structure du projet `admin-cms`
```
admin-cms/
├── src/
│   ├── components/       # Composants globaux UI (Modals, Headers, Sidebar, Notifications)
│   ├── features/         # Modules fonctionnels de l'administration
│   │   ├── dashboard/    # Tableau de bord et métriques globales
│   │   ├── orders/       # Gestion des commandes et statuts de traitement
│   │   ├── catalog/      # Gestion du catalogue d'articles et formules
│   │   ├── clients/      # Gestion de la clientèle et historiques
│   │   ├── staff/        # Gestion du personnel et rôles
│   │   ├── pressings/    # Gestion des pressings partenaires
│   │   ├── finances/     # Suivi du chiffre d'affaires et paiements
│   │   └── settings/     # Configurations de la plateforme
│   ├── services/         # Services Supabase et API
│   ├── assets/           # Logos et images de l'admin
│   ├── App.jsx           # Composant racine
│   └── main.jsx          # Point d'entrée Vite
├── index.html            # Template HTML d'entrée
├── vite.config.js        # Configuration du bundler Vite
├── package.json          # Dépendances et scripts npm
└── start.bat             # Script batch d'exécution autonome
```

## 🚀 Démarrage Rapide

### Option 1 : Via le script racine
Depuis la racine de `KLIN UP WEB APP`, double-cliquez sur `start-admin.bat`.

### Option 2 : En ligne de commande
```bash
cd admin-cms
npm install
npm run dev
```
L'application sera accessible par défaut sur `http://localhost:5174`.
