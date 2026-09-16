# 🚀 Guide Complet d'Architecture et de Déploiement Multi-Environnements

Ce guide détaille le fonctionnement, la configuration et la gestion opérationnelle de l'architecture multi-environnements mise en place pour la plateforme **KLIN UP** (Application Mobile, Admin CMS et bases de données Supabase).

---

## 🏛️ 1. Vue d'Ensemble de l'Architecture

Pour garantir qu'aucun test ni aucune validation n'affecte les données réelles des clients et des caisses, l'écosystème est divisé en **3 environnements étanches** :

```
┌─────────────────┬─────────────────┬────────────────────────────┐
│   TEST (QA)     │ STAGING (BÊTA)  │      PRODUCTION (LIVE)     │
├─────────────────┼─────────────────┼────────────────────────────┤
│ Branche: test   │ Branche: staging│ Branche: production (main) │
│                 │                 │                            │
│ 🗄️ Supabase Test│ 🗄️ Supab. Stag. │ 🗄️ Supabase Production     │
│ klinup-test     │ klinup-staging  │ klinup-prod (Officiel)     │
│                 │                 │                            │
│ 📱 Mobile Test  │ 📱 Mobile Bêta  │ 📱 Mobile Production       │
│ KLIN UP (Test)  │ KLIN UP (Bêta)  │ KLIN UP                    │
│ .laverie.test   │ .laverie.beta   │ .laverie                   │
│                 │                 │                            │
│ 🖥️ CMS Test     │ 🖥️ CMS Staging  │ 🖥️ CMS Production          │
│ Bandeau Jaune ⚠️│ Bandeau Orange 🟠│ Aucun bandeau (Épuré)     │
└─────────────────┴─────────────────┴────────────────────────────┘
```

---

## 🗄️ 2. Configuration des 3 Projets Supabase

Dans votre compte [Supabase](https://supabase.com/dashboard) :

### Étape 2.1 : Vos 3 Projets
1. **`klinup-prod`** : Votre projet actuel (`ucnqwqkjnlsrbdbmukvz`). Contient les vraies données.
2. **`klinup-staging`** : Créez un nouveau projet gratuit/pro nommé `klinup-staging`.
3. **`klinup-test`** : Créez un nouveau projet gratuit/pro nommé `klinup-test`.

### Étape 2.2 : Initialisation du Schéma sur Staging et Test
Pour chaque nouveau projet (`klinup-staging` et `klinup-test`) :
1. Allez dans le **SQL Editor** de Supabase.
2. Ouvrez et exécutez le fichier [`supabase/sql/schema.sql`](../supabase/sql/schema.sql).
3. Ouvrez et exécutez le fichier [`supabase/sql/security_rls_policies.sql`](../supabase/sql/security_rls_policies.sql).

### Étape 2.3 : Peuplement de la Base de Test
Uniquement sur le projet **`klinup-test`** :
1. Dans le **SQL Editor**, exécutez le fichier [`supabase/seed_test.sql`](../supabase/seed_test.sql).
2. Cela crée automatiquement des comptes employés de test (PIN `000000` et `123456`), des clients de test, le catalogue et des commandes modèles.

---

## 🔑 3. Configuration des Secrets dans GitHub

Dans votre dépôt GitHub : `https://github.com/amgraphicsbenin/laverie_klinup` :

### Étape 3.1 : Création des Environnements GitHub
Allez dans **Settings > Environments** et cliquez sur **New environment** pour créer 3 environnements :
1. `test`
2. `staging`
3. `production` (Vous pouvez cocher *Required reviewers* pour exiger une validation manuelle avant tout déploiement en prod).

### Étape 3.2 : Renseigner les Secrets par Environnement
Dans chaque environnement, ajoutez les secrets correspondants :

| Nom du Secret | Valeur pour `test` & `staging` | Valeur pour `production` |
|---|---|---|
| `SUPABASE_URL` | `https://ryjwrjzggfwglfmyovhk.supabase.co` | `https://ucnqwqkjnlsrbdbmukvz.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5andyanpnZ2Z3Z2xmbXlvdmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDE4NDcsImV4cCI6MjEwNTExNzg0N30.SuL0HAWzX2EmISFgf01wt5huArlRw5Dcd4fayMpVt8c` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnF3cWtqbmxzcmJkYm11a3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA1NzEsImV4cCI6MjA5Njg0NjU3MX0.8RdoITBg_AXDqN2DxuZlarrF_sx-ya1DCSyS-FLy0mo` |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://ryjwrjzggfwglfmyovhk.supabase.co` | `https://ucnqwqkjnlsrbdbmukvz.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | *(Même clé anon que ci-dessus)* | *(Même clé anon que ci-dessus)* |
| `VITE_SUPABASE_URL` | `https://ryjwrjzggfwglfmyovhk.supabase.co` | `https://ucnqwqkjnlsrbdbmukvz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(Même clé anon que ci-dessus)* | *(Même clé anon que ci-dessus)* |

---

## 📱 4. Coexistence des Applications sur Smartphone

Grâce au fichier [`mobile-app/app.config.js`](../mobile-app/app.config.js), le nom de l'application et l'identifiant de package Android changent automatiquement selon la branche et l'environnement :

* **`KLIN UP (Test)`** (`com.klinup.laverie.test`)
* **`KLIN UP (Bêta)`** (`com.klinup.laverie.beta`)
* **`KLIN UP`** (`com.klinup.laverie`)

> [!TIP]
> **Avantage majeur** : Les livreurs, gérants et développeurs peuvent installer **simultanément** la version de test et la version officielle de production sur le même téléphone Android sans conflit ni désinstallation.

---

## 🔄 5. Flux de Travail Git & Déploiement Quotidien

### 1. Développement d'une nouvelle fonctionnalité
```bash
git checkout -b feature/ma-fonctionnalite
# ... code et modifications ...
git commit -m "feat: ajout du suivi livreur en direct"
```

### 2. Déploiement en Test (QA)
```bash
git checkout test
git merge feature/ma-fonctionnalite
git push origin test
```
* **Résultat automatique** :
  - GitHub Actions compile l'APK `klinup-test-vX.X.X-bY.apk` connecté à `klinup-test`.
  - GitHub Actions compile l'Admin CMS Test avec le bandeau d'alerte jaune.

### 3. Promotion en Staging (Bêta)
Une fois testé et validé techniquement :
```bash
git checkout staging
git merge test
git push origin staging
```
* **Résultat automatique** :
  - GitHub Actions compile l'APK `klinup-staging-vX.X.X-bY.apk` connecté à `klinup-staging`.
  - La direction et les livreurs bêta-testeurs testent sur le terrain.

### 4. Mise en Production Finale
Une fois la bêta approuvée :
```bash
git checkout production   # ou main
git merge staging
git push origin production
```
* **Résultat automatique** :
  - Génération de l'APK Release finale `klinup-production-vX.X.X-bY.apk` connecté à la vraie base de données.
  - Déploiement de l'Admin CMS officiel en direct.

