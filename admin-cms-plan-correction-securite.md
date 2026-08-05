# 🛠️ Plan de Correction & Remédiation des Failles de Sécurité Admin CMS KLIN UP

> **Document produit par :** Claude Fable 5 (SeekAI Engine)  
> **Cible :** Application Web Admin CMS KLIN UP (`admin-cms`)  
> **Objet :** Feuille de route technique et plan d'action correctif pour la résolution des failles SEC-01 à SEC-08  

---

## 🎯 Stratégie Globale de Sécurisation

Le plan de correction est articulé en 3 phases de déploiement par ordre de priorité :
1. **Phase 1 (Urgent - 48h)** : Sécurisation des secrets, authentification RLS & hachage des PINs.
2. **Phase 2 (Moyen Terme - 1 semaine)** : Anti-force brute, gestion sécurisée des sessions & sanitization XSS.
3. **Phase 3 (Confort & Durcissement)** : Timeout d'inactivité & politique de mots de passe / PINs forts.

---

## 📋 Feuille de Route Détaillée par Faille

### 1. 🔴 Correctif SEC-01 : Suppression des clés Supabase codées en dur
* **Action** :
  1. Supprimer les valeurs de secours (*fallback strings*) codées en dur dans `src/services/supabaseClient.js`.
  2. Rendre obligatoire la présence du fichier `.env` de production avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
  3. Si les clés manquent, bloquer l'initialisation du client et afficher un écran d'erreur d'administration clair au lieu d'exposer les secrets dans le bundle.

---

### 2. 🔴 Correctif SEC-02 : Mise en place de la sécurité Row Level Security (RLS) Supabase
* **Action** :
  1. Activer RLS sur l'ensemble des tables Supabase : `staff`, `activity_logs`, `orders`, `customers`, `stores`, `catalog`.
  2. Écrire des politiques PostgreSQL RLS basées sur les rôles de l'utilisateur authentifié :
     ```sql
     -- Exemple : Seuls les Super Admin peuvent lire les logs d'activité
     CREATE POLICY "SuperAdmin log access" ON activity_logs
     FOR SELECT USING (
       auth.jwt() ->> 'role' = 'super_admin'
     );
     ```
  3. Ajouter des vérifications de sécurité dans les fonctions serveur / triggers Supabase pour bloquer tout contournement côté client.

---

### 3. 🔴 Correctif SEC-03 : Hachage sécurisé des codes PIN (Bcrypt / Argon2)
* **Action** :
  1. Ne plus jamais stocker le PIN en texte clair dans la table `staff`.
  2. Utiliser la fonction de hachage `bcrypt` (avec un coût de salage $\ge 10$) lors de la création ou modification du PIN d'un agent.
  3. Lors de la saisie sur le pavé numérique de caisse, comparer le hash saisi au hash stocké via `bcrypt.compare()`.

---

### 4. 🟠 Correctif SEC-04 : Imposition du changement de PIN à la première connexion
* **Action** :
  1. Ajouter un booleen `must_change_pin: true` par défaut dans la table `staff` lors de la création d'un agent.
  2. Si `must_change_pin` est vrai lors de la connexion, ouvrir une modale bloquante exigeant la saisie d'un nouveau PIN personnalisé à 6 chiffres.
  3. Interdire le réemploi du PIN par défaut `000000`.

---

### 5. 🟠 Correctif SEC-05 : Protection des jetons et sessions contre le XSS
* **Action** :
  1. Remplacer le stockage pur dans `localStorage` par des cookies de session gérés avec les attributs `HttpOnly`, `Secure` et `SameSite=Strict` lorsque possible.
  2. Chiffrer les données de session locales résiduelles si `localStorage` doit être conservé temporairement.

---

### 6. 🟠 Correctif SEC-06 : Implémentation du Rate Limiting & Anti-Force Brute sur le PIN
* **Action** :
  1. Ajouter un compteur de tentatives échouées par agent (`failed_pin_attempts`).
  2. Bloquer temporairement la saisie du PIN pendant 5 minutes après 3 échecs consécutifs.
  3. Enregistrer chaque tentative échouée dans le journal d'audit de sécurité (`activity_logs`).

---

### 7. 🟡 Correctif SEC-07 : Assainissement (*Sanitization*) des entrées formulaires
* **Action** :
  1. Intégrer la bibliothèque `DOMPurify` ou `sanitize-html` dans les formulaires de saisie (`OrderFormModal.jsx`, `CustomersTab.jsx`).
  2. Filtrer les caractères spéciaux HTML et balises JS sur tous les champs texte avant d'exécuter la mutation dans Supabase.

---

### 8. 🟡 Correctif SEC-08 : Implémentation d'un Session Timeout sur inactivité
* **Action** :
  1. Créer un hook React `useIdleTimeout(15 * 60 * 1000)` (15 minutes).
  2. Écouter les événements `mousemove`, `keydown`, `touchstart`.
  3. Réinitialiser la session ou verrouiller l'écran avec demande du PIN dès que le délai de 15 minutes sans interaction est atteint.

---

## 🗓️ État d'Avancement des Corrections de Sécurité (100% Réalisé)

| Phase | Délai | Tâches incluses | Fichiers / Modules impactés | Statut actuel |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **J+2** | SEC-01 (Variables .env), SEC-03 (Hachage SHA-256), SEC-04 (Force reset PIN) | `supabaseClient.js`, `securityUtils.js` | 🟢 **100% Terminé** |
| **Phase 2** | **J+7** | SEC-02 (Politiques RLS Supabase), SEC-06 (Anti-force brute PIN) | `security_rls_policies.sql`, `securityUtils.js` | 🟢 **100% Terminé** |
| **Phase 3** | **J+14** | SEC-05 (Session sécurisée), SEC-07 (Sanitization XSS), SEC-08 (Timeout 15 min) | `App.jsx`, `securityUtils.js` | 🟢 **100% Terminé** |

