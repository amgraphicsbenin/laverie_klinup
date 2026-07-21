/**
 * @file db.js
 * @description Point d'entrée rétro-compatible de la base de données KLIN UP.
 * Ré-exporte les composants modulaires (seeds, dbEngine, syncEngine) pour maintenir la compatibilité avec le reste du projet.
 */

export { db } from './db/dbEngine';
export { hydrateOrder } from './db/dbEngine';
export { 
  initDb, 
  initializeDatabase, 
  loadFromLocalStorage, 
  persist 
} from './db/syncEngine';
