# 🧺 KLIN UP WEB APP - Monorepo Plateforme Laverie & Pressing

Bienvenue dans le dépôt du projet **KLIN UP**, la solution complète de gestion de laverie, pressing et nettoyage à domicile.

Le projet est structuré sous forme de monorepo contenant **02 applications principales** (Admin Web CMS et Application Mobile Native Android) et des sous-dossiers thématiques :

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
├── 📱 android-app/           # Application Mobile Native (Kotlin & Jetpack Compose)
│   ├── app/                 # Code source Kotlin (UI Compose, ViewModels, Supabase SDK)
│   ├── build.gradle.kts     # Configuration Gradle du projet Android
│   └── gradlew.bat          # Wrapper Gradle pour compilation Windows
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
    ├── start-app.bat        # Compile et génère l'APK Debug Android (Kotlin/Compose)
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

### 2. Démarrer l'App Mobile Android Native (`android-app`)
Double-cliquez sur `start-app.bat` ou exécutez dans Android Studio / Terminal :
```bash
cd android-app
.\gradlew.bat assembleDebug
```
L'APK Debug généré se trouve dans : `android-app/app/build/outputs/apk/debug/app-debug.apk`

### 3. Démarrer le Serveur de Données Partagées (Optionnel pour test local)
Double-cliquez sur `start-db.bat` ou exécutez :
```bash
node shared-db/db-server.js
```
Port d'écoute : **`http://localhost:5050`**

---

## 📄 Documentation Complète
- [docs/DOCUMENTATION.md](file:///C:/Users/Andre/Documents/Projets/Plateforme%20Laverie%20KLIN%20UP/KLIN%20UP%20WEB%20APP/docs/DOCUMENTATION.md)
- [admin-cms/README.md](file:///C:/Users/Andre/Documents/Projets/Plateforme%20Laverie%20KLIN%20UP/KLIN%20UP%20WEB%20APP/admin-cms/README.md)
