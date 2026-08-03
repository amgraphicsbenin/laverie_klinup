# 🧺 KLIN UP WEB APP - Monorepo Plateforme Laverie & Pressing

Bienvenue dans le dépôt du projet **KLIN UP**, la solution complète de gestion de laverie, pressing et nettoyage à domicile.

Le projet est structuré sous forme de monorepo contenant **02 applications principales** et des sous-dossiers thématiques propres :

---

## 📁 Architecture Optimisée du Projet

```
KLIN UP WEB APP/
│
├── 🖥️ admin-cms/             # Application Web CMS d'Administration (React / Vite / Tailwind)
│   ├── src/                 # Dashboard, gestion des commandes, clients, tarifs, staff
│   ├── package.json         # Dépendances du Back-Office
│   └── README.md            # Documentation spécifique Admin CMS
│
├── 📱 mobile-app/            # Application Mobile (Expo / React Native)
│   ├── src/                 # Vues client, création de commande, suivi livreur
│   ├── assets/              # Logos, icônes SVG de navigation, splash screen
│   ├── package.json         # Dépendances de l'application mobile
│   └── README.md            # Documentation spécifique App Mobile
│
├── 📚 docs/                  # Documentation générale et fonctionnelle du projet
│   ├── DOCUMENTATION.md     # Spécifications fonctionnelles et règles métier
│   └── DOCUMENTATION_KLIN_UP.docx
│
├── 🗄️ supabase/              # Configurations & Scripts de base de données PostgreSQL
│   ├── sql/                 # Schémas et scripts de migration SQL (schema.sql, etc.)
│   └── functions/           # Edge Functions Supabase (Push notifications, etc.)
│
├── 💾 shared-db/             # Serveur de données JSON partagé pour tests locaux
│   ├── db-server.js         # Serveur Node.js API local (Port 5050)
│   └── db.json              # Base de données JSON locale
│
└── ⚡ Scripts de Lancement Rapide (Racine)
    ├── start-admin.bat      # Lance le serveur Admin CMS (Port 5174)
    ├── start-app.bat        # Lance l'Aperçu Web Mobile Expo (Port 8081)
    └── start-db.bat         # Lance le serveur de base de données locale (Port 5050)
```

---

## 🚀 Démarrage des Applications

### 1. Démarrer l'Admin CMS (`admin-cms`)
Double-cliquez sur `start-admin.bat` ou exécutez :
```bash
cd admin-cms
npm run dev
```
Accès navigateur : **`http://localhost:5174`**

### 2. Démarrer l'App Mobile (`mobile-app`)
Double-cliquez sur `start-app.bat` ou exécutez :
```bash
cd mobile-app
npm run web
```
Accès navigateur : **`http://localhost:8081`**

### 3. Démarrer le Serveur de Données Partagées (Optionnel pour test local)
Double-cliquez sur `start-db.bat` ou exécutez :
```bash
node shared-db/db-server.js
```
Port d'écoute : **`http://localhost:5050`**

---

## 📄 Documentation Complète
- [docs/DOCUMENTATION.md](file:///d:/Works%20and%20Projects/Plateforme%20Laverie%20KLIN%20UP/KLIN%20UP%20WEB%20APP/docs/DOCUMENTATION.md)
- [admin-cms/README.md](file:///d:/Works%20and%20Projects/Plateforme%20Laverie%20KLIN%20UP/KLIN%20UP%20WEB%20APP/admin-cms/README.md)
- [mobile-app/README.md](file:///d:/Works%20and%20Projects/Plateforme%20Laverie%20KLIN%20UP/KLIN%20UP%20WEB%20APP/mobile-app/README.md)
