# 🛡️ Rapport d'Audit de Sécurité – Failles Identifiées dans l'Admin CMS KLIN UP

> **Document produit par :** Claude Fable 5 (SeekAI Engine)  
> **Cible :** Application Web Admin CMS KLIN UP (`admin-cms`)  
> **Domaine :** Sécurité, Authentification, RBAC, Protection des Données & API Supabase  

---

## Executive Summary

Une analyse approfondie du code source de l'application **Admin CMS KLIN UP** a permis d'identifier **8 failles de sécurité majeures et critiques**. La majorité de ces vulnérabilités réside dans le report du contrôle d'accès au seul niveau de l'interface graphique (React UI) plutôt qu'au niveau du serveur (Supabase RLS), ainsi que dans le stockage en texte clair des secrets et identifiants de caisse.

---

## 🚨 Table des Failles de Sécurité Détectées

| ID | Faille de Sécurité | Niveau de Risque | Fichier Concerné | OWASP Top 10 |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Exposition de la clé d'API Supabase Anon & URL en fallback | 🔴 **CRITIQUE** | `src/services/supabaseClient.js` | A05:2021-Security Misconfiguration |
| **SEC-02** | Absence de Row Level Security (RLS) & Contrôle d'accès UI uniquement | 🔴 **CRITIQUE** | `src/App.jsx`, Supabase Tables | A01:2021-Broken Access Control |
| **SEC-03** | Stockage et comparaison des codes PIN en texte clair (Absence de Hash) | 🔴 **CRITIQUE** | `src/services/db/dbEngine.ts`, `StaffTab.jsx` | A02:2021-Cryptographic Failures |
| **SEC-04** | Code PIN initial par défaut fixe (`000000`) sans force-reset | 🟠 **ÉLEVÉ** | `src/features/staff/components/StaffTab.jsx` | A07:2021-Identification & Auth Failures |
| **SEC-05** | Stockage de la session et des rôles dans le `localStorage` (Sensible au XSS) | 🟠 **ÉLEVÉ** | `src/App.jsx`, `dbEngine.ts` | A04:2021-Insecure Design / XSS |
| **SEC-06** | Absence de Rate Limiting sur la saisie du PIN (Attaque Force Brute) | 🟠 **ÉLEVÉ** | `src/features/staff/components/StaffTab.jsx` | A07:2021-Identification & Auth Failures |
| **SEC-07** | Absence de Sanitization des entrées formulaires (Risque XSS Stocké) | 🟡 **MOYEN** | `OrderFormModal.jsx`, `CustomersTab.jsx` | A03:2021-Injection (Stored XSS) |
| **SEC-08** | Absence de verrouillage automatique sur inactivité (*Session Timeout*) | 🟡 **MOYEN** | `src/App.jsx` | A07:2021-Identification & Auth Failures |

---

## 🔍 Analyse Détaillée des Failles

### 1. 🔴 SEC-01 : Exposition de la clé d'API Supabase Anon & URL en fallback
* **Emplacement** : `admin-cms/src/services/supabaseClient.js` (Lignes 3-4)
* **Code vulnérable** :
  ```javascript
  const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://ucnqwqkjnlsrbdbmukvz.supabase.co';
  const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1...';
  ```
* **Description** : Les jetons d'accès et l'URL du projet Supabase de production sont codés en dur dans le fichier source JavaScript et compilés dans le bundle Web distribué au navigateur.
* **Risque** : Tout utilisateur ou attaquant peut extraire l'URL Supabase et la clé Anon via l'inspecteur du navigateur, pour tenter des attaques directes sur la base de données.

---

### 2. 🔴 SEC-02 : Absence de Row Level Security (RLS) & Contrôle d'accès UI uniquement
* **Emplacement** : `admin-cms/src/App.jsx`, `admin-cms/src/services/db/dbEngine.ts`
* **Description** : Les droits d'accès et habilitations (`can_manage_staff`, `can_view_logs`, `can_manage_orders`) sont uniquement vérifiés par masquage de composants dans le rendu React (`if (!permissions.can_view_logs) return null;`).
* **Risque** : Un employé ayant un rôle restreint (ex: Caissier) peut utiliser la console développeur ou un script Postman avec la clé Anon pour lire directement la table `activity_logs`, la table `staff` ou modifier les tarifs du catalogue.

---

### 3. 🔴 SEC-03 : Stockage et comparaison des codes PIN en texte clair (Absence de Hash)
* **Emplacement** : `admin-cms/src/services/db/dbEngine.ts`, `StaffTab.jsx`
* **Description** : Les codes PIN à 6 chiffres des employés sont enregistrés, transmis et comparés sous forme de chaînes de caractères brutes (ex: `"123456"`) dans la base de données et dans la mémoire locale.
* **Risque** : En cas de fuite de la base de données ou d'inspection du réseau/logs, tous les codes de caisse des employés sont immédiatement compromis sans nécessiter de décryptage.

---

### 4. 🟠 SEC-04 : Code PIN initial par défaut fixe (`000000`) sans changement obligatoire
* **Emplacement** : `admin-cms/src/features/staff/components/StaffTab.jsx`
* **Description** : Tout nouvel agent ou caissier créé se voit attribuer le code PIN `000000`. L'application n'impose aucun changement de PIN obligatoire lors de la première connexion.
* **Risque** : Un tiers peut se connecter sous le profil d'un nouvel agent non encore initialisé simplement en testant `000000`.

---

### 5. 🟠 SEC-05 : Stockage des jetons et rôles de session dans le `localStorage`
* **Emplacement** : `admin-cms/src/App.jsx`, `dbEngine.ts`
* **Description** : Les données de session de l'utilisateur connecté (`klin_up_user`, rôle, permissions) sont stockées dans le `localStorage` du navigateur sans chiffrement ni flag `HttpOnly`.
* **Risque** : Le `localStorage` est lisible par n'importe quel script JavaScript s'exécutant sur la page. En cas de vulnérabilité XSS ou d'injection d'un package npm malveillant, la session et le rôle de l'administrateur peuvent être siphonnés.

---

### 6. 🟠 SEC-06 : Absence de Rate Limiting sur la saisie du PIN de caisse
* **Emplacement** : Modale d'authentification de caisse / changement d'agent
* **Description** : L'interface de saisie du PIN autorise un nombre illimité d'essais consécutifs sans délai de blocage temporaire.
* **Risque** : Un code PIN à 6 chiffres comporte 1 000 000 de combinaisons. Sans limitation de fréquence (*Rate Limiting*), une attaque automatisée par force brute peut déterminer le PIN en quelques minutes.

---

### 7. 🟡 SEC-07 : Absence de Sanitization des entrées formulaires (Risque XSS Stocké)
* **Emplacement** : `OrderFormModal.jsx`, `CustomersTab.jsx`, `StaffTab.jsx`
* **Description** : Les champs texte (noms de clients, remarques sur les vêtements, notes internes) ne sont pas assainis (*sanitized*) avant leur enregistrement et leur affichage.
* **Risque** : Injection de balises de script HTML/JS (`<script>`, `onload=`) qui s'exécutent dans le navigateur de l'administrateur lorsqu'il consulte la fiche du client ou la commande.

---

### 8. 🟡 SEC-08 : Absence de verrouillage automatique sur inactivité (*Session Timeout*)
* **Emplacement** : `App.jsx`
* **Description** : L'application n'intègre pas d'écouteur d'inactivité (souris, clavier, tactile). La session de caisse reste active indéfiniment tant que l'onglet n'est pas fermé.
* **Risque** : Un caissier quittant son poste laisse le terminal d'administration entièrement accessible à n'importe quel client ou personne physique présente dans le magasin.
