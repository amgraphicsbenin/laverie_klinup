/**
 * @file memoryStore.js
 * @description Store centralise en memoire de KLIN UP.
 * Contient l'etat partage (memoryDb, listeners, pendingOrderUpdates) sans dependance circulaire.
 */

// Base de donnees locale en memoire (chargee en direct depuis Supabase / AsyncStorage)
export const memoryDb = {
  staff: [],
  customers: [],
  orders: [],
  logs: [],
  notifications: [],
  catalog: [],
  stores: [],
  delivery_zones: [],
  pickup_zones: [],
  current_user: null,
  sync_queue: [],
  pin_reset_requests: [],
  dark_mode: false,
  settings: {
    fidelity_active: true,
    fidelity_spend_per_point: 1000,
    fidelity_tier_silver_pts: 50,
    fidelity_tier_gold_pts: 150,
    fidelity_tier_platinum_pts: 300
  }
};

// Ensemble d'ecouteurs de changement d'etat (Pattern Observateur)
export const listeners = new Set();

// -- File des commandes en cours de mutation locale (anti-ecrasement par sync periodique) --
const pendingOrderUpdates = new Set();

export function addPendingOrderUpdate(orderId) {
  if (orderId) pendingOrderUpdates.add(orderId);
}
export function removePendingOrderUpdate(orderId) {
  if (orderId) pendingOrderUpdates.delete(orderId);
}
export function isPendingOrderUpdate(orderId) {
  return orderId ? pendingOrderUpdates.has(orderId) : false;
}

/**
 * Notifie tous les ecouteurs qu'un changement a eu lieu dans memoryDb.
 */
export const notifyListeners = () => {
  listeners.forEach(listener => listener());
};
