# RÈGLES DE DÉVELOPPEMENT ET DÉPLOIEMENT (OBLIGATOIRES)

Ce fichier définit les règles fondamentales à respecter à chaque exécution d'instruction par l'agent IA :

---

## 🚫 1. Interdiction de Push sur GitHub sans autorisation
- **Ne JAMAIS faire de `git push`** sur GitHub (que ce soit sur `production`, `staging`, `test`, `main` ou toute autre branche) sans l'autorisation expresse et préalable de l'utilisateur.
- Les commits doivent rester **exclusivement locaux** tant que l'utilisateur n'a pas explicitement demandé ou validé l'envoi distant.

---

## 💻 2. Travail 100% en local avant tout envoi en Test
- Tout ce qui est développé ou modifié (code frontend, backend, base de données, configurations, scripts) doit obligatoirement être réalisé et validé **en local d'abord**.
- Aucun envoi, synchronisation ou déploiement vers l'environnement de **test** (ou staging/production) ne doit être fait sans l'autorisation explicite de l'utilisateur.

