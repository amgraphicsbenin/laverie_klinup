# KLIN UP - Application Mobile (Expo / React Native)

Ce dossier contient le code source de l'application mobile pour les clients, livreurs et pressings partenaires de la plateforme **KLIN UP**.

## 🛠️ Stack Technique
- **Framework** : Expo SDK 57 / React Native 0.86
- **Langage** : JavaScript / JSX
- **Composants & Animations** : Reanimated, Moti, Lucide React Native, Expo Linear Gradient, React Native SVG
- **Stockage Local & Backend** : AsyncStorage, Supabase JS Client

## 📁 Structure du projet `mobile-app`
```
mobile-app/
├── assets/               # Logos, icônes SVG de navigation, illustrations
├── src/
│   ├── components/       # Composants UI réutilisables (Cards, Buttons, Modals, TopBar)
│   ├── features/         # Modules fonctionnels de l'application
│   │   ├── auth/         # Connexion, inscription et gestion de profil
│   │   ├── orders/       # Création de commande, suivi en temps réel et historique
│   │   ├── catalog/      # Affichage des tarifs et sélection des prestations
│   │   ├── clients/      # Vue gestion client et portefeuille
│   │   └── delivery/     # Module pour livreurs et ramassage
│   ├── services/         # Intégration Supabase et API
│   ├── theme/            # Design system, couleurs KLIN UP et typographie
│   └── utils/            # Formateurs de prix, dates et fonctions utilitaires
├── App.js                # Composant racine de l'application mobile
├── index.js              # Point d'entrée Expo / Web
├── app.json              # Configuration Expo (Nom, icône, splash screen, permissions)
├── babel.config.js       # Plugins Babel (Reanimated, etc.)
└── package.json          # Dépendances et scripts Expo
```

## 🚀 Démarrage Rapide

### Option 1 : Via le script racine (Aperçu Web)
Depuis la racine de `KLIN UP WEB APP`, double-cliquez sur `start-app.bat`.

### Option 2 : En ligne de commande
```bash
cd mobile-app
npm install --legacy-peer-deps

# Pour lancer en mode Web (navigateur)
npm run web

# Pour lancer avec Expo Go (sur téléphone ou émulateur)
npx expo start
```
