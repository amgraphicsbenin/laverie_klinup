# 🎨 Rapport d'Audit Design & Front-End — KLIN UP Admin CMS
> Analyse UI/UX complète — Tous les modules et composants
> Date : 2026-07-27

---

## 📋 Méthodologie

Audit statique complet du code source JSX/CSS couvrant tous les modules :
- Écran de connexion (Lockscreen), Sidebar & Navigation, Topbar & Notifications
- Dashboard, Gestion des Commandes, Clients CRM, Catalogue Tarifs
- Gestion Staff/Accès, Journal d'Audit, Paramètres, Modales globales

---

## ✅ CORRECTIONS DÉJÀ APPLIQUÉES (Phase 1 + Bonus)

| Réf | Fichier | Description |
|-----|---------|-------------|
| B-001 | index.css | ✅ Supprimé le `backdrop-filter: none !important` global — les effets glassmorphism des modales sont restaurés |
| B-006 | index.css | ✅ Fusionné les doubles déclarations de scrollbar webkit |
| B-007 | index.css | ✅ Ajouté la classe `.chart-title` manquante utilisée dans LogsTab |
| B-009 | index.css | ✅ Réduit le `padding-bottom` de `.main-content` de 6rem → 2.5rem |
| B-011 | App.jsx | ✅ L'input email du lockscreen nettoie maintenant les espaces en temps réel |
| D-002 | OrdersTab, CustomersTab, index.css | ✅ Badge `en_cours_livraison` corrigé : couleur quasi-noire → indigo lisible |
| D-006 | index.css | ✅ Hover des lignes de table plus visible (3% → 6% opacité) |
| D-010 | DashboardTab.jsx | ✅ `justify` → `justifyContent` dans le style JSX de la bannière dashboard |
| D-012 | index.css | ✅ Badge `annule` : opacity corrigée 0.6 → 0.75 |
| D-001 | index.css | ✅ Taille de police des `<th>` augmentée 0.72rem → 0.75rem |

---

## 🔴 BUGS CRITIQUES RESTANTS

### B-002 — La sidebar disparaît en dessous de 1024px sans remplacement mobile
**Fichier :** `src/index.css` — lignes 1399–1406  
**Symptôme :** `@media (max-width: 1024px) { .sidebar { display: none; } }` — la sidebar est cachée sans alternative.  
**Correction :** Implémenter un hamburger menu ou un tiroir (drawer) mobile avec overlay.

### B-003 — Le conteneur modal-backdrop manque de hauteur max sur les grandes modales
**Fichier :** `src/index.css` — ligne 601  
**Correction :** Ajouter `overflow-y: auto` systématique sur la zone body des grandes modales.

### B-004 — Pas de feedback de chargement lors du démarrage de l'app (connexion Supabase)
**Fichier :** `src/App.jsx` — lignes 424–502  
**Correction :** Ajouter un état `isConnecting` avec un spinner animé pendant la vérification initiale.

---

## 🟠 BUGS MAJEURS RESTANTS

### B-005 — Bouton "Aide" non fonctionnel dans la sidebar
**Fichier :** `src/App.jsx` — ligne 843  
**Correction :** Implémenter une page d'aide ou retirer l'item du menu.

### B-008 — `overflow-y: hidden` sur `body` bloque le scroll global
**Fichier :** `src/index.css` — ligne 111  
**Correction :** S'assurer que chaque vue scrollable a `overflow-y: auto`.

### B-010 — Notification dropdown peut déborder hors écran sur petits écrans
**Fichier :** `src/App.jsx` — ligne 961  
**Correction :** Ajouter `max-width: calc(100vw - 2rem)` sur le dropdown.

---

## 🟡 PROBLÈMES DESIGN & UX RESTANTS

| Réf | Description |
|-----|-------------|
| D-003 | Sidebar manque d'un indicateur de version |
| D-004 | Avatar topbar manque d'attributs ARIA (`role="img"`, `aria-label`) |
| D-005 | Pills de filtre sans style `:focus-visible` (accessibilité clavier) |
| D-007 | Sous-menu "Gestion des Accès" sans transition d'animation |
| D-008 | Store switcher utilise `<select>` natif au lieu de `<CustomSelect>` |
| D-009 | LogsTab sans pagination (performance sur grand volume de logs) |
| D-011 | Input PIN reset sans style focus cohérent |
| D-013 | Boutons "Approuver/Rejeter" PIN sans état de chargement |

---

## 🟢 AMÉLIORATIONS SUGGÉRÉES

| Réf | Suggestion |
|-----|-----------|
| S-001 | Tooltips informatifs sur les badges de statut |
| S-002 | Badge numérique de commandes actives dans la sidebar |
| S-003 | Animation pulse sur le badge de notification |
| S-004 | Bouton "Enregistrer" dans Paramètres centré / pleine largeur |
| S-005 | Compteur de résultats "X résultats" après filtrage |
| S-006 | LogsTab : mapper les codes d'action vers des libellés français |
| S-007 | Lockscreen placeholder email : "votre.email@klinup.com" |
| S-008 | Animation stagger sur les cartes KPI de OrdersTab et CustomersTab |

---

## 📊 Récapitulatif

| Priorité | Corrigé | Restant | Total |
|----------|---------|---------|-------|
| 🔴 Critique | 1 | 3 | 4 |
| 🟠 Majeur | 4 | 3 | 7 |
| 🟡 Moyen | 5 | 8 | 13 |
| 🟢 Suggestion | 0 | 8 | 8 |
| **Total** | **10** | **22** | **32** |
