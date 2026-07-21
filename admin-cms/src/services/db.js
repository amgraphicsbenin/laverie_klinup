import { dbEngine, listeners, notifyListeners } from './db/dbEngine';
import {
  getIsUsingRemote,
  loadFromLocalStorage,
  initDb,
  refreshStaff,
  testConnection
} from './db/syncEngine';

// Chargement initial des données locales persistées
loadFromLocalStorage();

// Initialisation asynchrone et synchro avec la base distante Supabase
initDb();

/**
 * Interface unifiée d'accès aux services de données de KLIN UP Admin.
 * Regroupe les méthodes CRUD locales (dbEngine) et les méthodes réseau (syncEngine).
 */
export const db = {
  // Gestion des écouteurs de changements
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  notify: () => {
    notifyListeners();
  },

  // Ré-exportation directe des méthodes métier locales
  ...dbEngine,

  // Méthodes de synchronisation et état de la connexion
  isRemote: () => getIsUsingRemote(),
  refreshStaff,
  testConnection
};

// Ré-exportation des helpers et de performMutation pour usage interne dans dbEngine/syncEngine
export { hydrateOrder } from './db/dbEngine';
export { performMutation } from './db/syncEngine';

