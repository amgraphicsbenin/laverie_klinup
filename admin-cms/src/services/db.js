import { dbEngine, listeners, notifyListeners } from './db/dbEngine';
import {
  getIsUsingRemote,
  initDb,
  refreshStaff,
  refreshStores,
  testConnection
} from './db/syncEngine';

/**
 * Interface unifiée d'accès aux services de données KLIN UP Admin.
 * Toutes les mutations passent directement par Supabase (Supabase-first).
 * Appeler db.init() au démarrage de l'application pour charger les données.
 */
export const db = {
  // Gestion des écouteurs de changements React
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  notify: () => notifyListeners(),

  // Ré-exportation des méthodes métier
  ...dbEngine,

  // Méthodes de synchronisation et état de la connexion
  isRemote: () => getIsUsingRemote(),
  init: initDb,        // Appelé une fois depuis App.jsx au démarrage
  refreshStaff,
  refreshStores,
  testConnection,
};

export { hydrateOrder } from './db/dbEngine';
export { performMutation } from './db/syncEngine';
