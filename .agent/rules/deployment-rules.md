---
trigger: always_on
---

# RÈGLES DE DÉVELOPPEMENT ET DÉPLOIEMENT (OBLIGATOIRES)

Ces règles sont d'application stricte et permanente à chaque exécution d'instruction :

1. **INTERDICTION DE PUSH SUR GITHUB SANS AUTORISATION** :
   - Ne JAMAIS exécuter de commande `git push` vers GitHub (sur n'importe quelle branche : `test`, `staging`, `production`, etc.) sans l'autorisation explicite préalable de l'utilisateur.
   - Tous les commits doivent rester strictement locaux.

2. **DÉVELOPPEMENT ET VALIDATION STRICTEMENT LOCAUX** :
   - Tout ce que nous faisons (code, scripts, migrations SQL, tests) doit obligatoirement être fait et testé en local d'abord.
   - Aucun envoi ou déploiement vers l'environnement de test (ou tout autre environnement distant) ne doit être déclenché sans l'accord explicite de l'utilisateur.

