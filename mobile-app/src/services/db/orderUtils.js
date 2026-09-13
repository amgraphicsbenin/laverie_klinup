/**
 * @file orderUtils.js
 * @description Fonctions pures et utilitaires d'hydratation, normalisation et réconciliation des commandes.
 * Séparé de dbEngine et syncEngine pour éliminer tout cycle de dépendances.
 */

import { memoryDb, notifyListeners } from './memoryStore';

/**
 * Normalise n'importe quelle variante de statut vers le cycle de vie standard KLIN UP.
 * @param {String} rawStatus - Statut brut.
 * @returns {String} Statut canonique.
 */
export function normalizeOrderStatus(rawStatus) {
  if (!rawStatus) return 'en_attente';
  const s = String(rawStatus).trim().toLowerCase();
  if (s === 'en_attente_validation' || s === 'attente_validation' || s === 'pending_validation' || s === 'a_valider') return 'en_attente_validation';
  if (s === 'pending' || s === 'attente' || s === 'en_attente') return 'en_attente';
  if (s === 'en_traitement' || s === 'traitement' || s === 'in_treatment') return 'en_traitement';
  if (s === 'lave' || s === 'lavé' || s === 'washing' || s === 'ready') return 'lave';
  if (s === 'pret_a_livrer' || s === 'pret' || s === 'prêt' || s === 'ready_to_deliver') return 'pret_a_livrer';
  if (s === 'en_cours_de_livraison' || s === 'livraison' || s === 'delivering') return 'en_cours_de_livraison';
  if (s === 'restitue' || s === 'restitué' || s === 'livre' || s === 'livré' || s === 'delivered') return 'restitue';
  if (s === 'annule' || s === 'annulé' || s === 'cancelled') return 'annule';
  return s;
}

/**
 * Hydrate un objet commande brut (depuis Supabase ou AsyncStorage) pour normaliser ses champs.
 * @param {Object} order - Objet commande brut.
 * @returns {Object} Commande hydratée et normalisée.
 */
export function hydrateOrder(order) {
  if (!order || typeof order !== 'object') return order;
  const hydrated = { ...order };

  if (order.client_nom && !order.client_name) {
    hydrated.client_name = order.client_nom;
  }
  if (order.client_telephone && !order.client_phone) {
    hydrated.client_phone = order.client_telephone;
  }

  if (order.status && !order.statut) {
    hydrated.statut = order.status;
  }
  hydrated.statut = normalizeOrderStatus(hydrated.statut || hydrated.status);

  // Normalisation des flags livreur / caisse
  if (hydrated.cree_par_livreur === undefined && hydrated.created_by_role === 'livreur') {
    hydrated.cree_par_livreur = true;
  }
  if (hydrated.validee_par_caisse === undefined) {
    hydrated.validee_par_caisse = hydrated.statut !== 'en_attente_validation';
  }

  if (order.date_depot && !order.created_at) {
    hydrated.created_at = order.date_depot;
  }
  if (order.date_retrait_prevue && !order.due_date) {
    hydrated.due_date = order.date_retrait_prevue;
  }

  if (order.articles_json && (!order.items || order.items.length === 0)) {
    try {
      hydrated.items = typeof order.articles_json === 'string'
        ? JSON.parse(order.articles_json)
        : order.articles_json;
    } catch (e) {
      hydrated.items = [];
    }
  }

  if (order.subscription_details) {
    if (order.subscription_details.remise_pourcentage !== undefined) {
      hydrated.remise_pourcentage = Number(order.subscription_details.remise_pourcentage) || 0;
    }
    if (order.subscription_details.remise_montant !== undefined) {
      hydrated.remise_montant = Number(order.subscription_details.remise_montant) || 0;
    }
    if (order.subscription_details.prix_base_avant_remise !== undefined) {
      hydrated.prix_base_avant_remise = Number(order.subscription_details.prix_base_avant_remise) || 0;
    }
  }
  return hydrated;
}

/**
 * Assainit et réconcilie l'état de toutes les commandes en mémoire.
 * @returns {Boolean} Vrai si au moins un ajustement a été apporté.
 */
export function reconcileOrderStates() {
  if (!memoryDb || !Array.isArray(memoryDb.orders)) return false;
  let hasChanges = false;
  const now = new Date();

  memoryDb.orders.forEach(order => {
    if (!order) return;

    const normalized = normalizeOrderStatus(order.statut || order.status);
    if (order.statut !== normalized) {
      order.statut = normalized;
      hasChanges = true;
    }

    const isCompleted = order.statut === 'restitue' || order.statut === 'annule';
    let isLate = false;
    if (!isCompleted && order.due_date) {
      const dueDateObj = new Date(order.due_date);
      if (!isNaN(dueDateObj.getTime()) && dueDateObj < now) {
        isLate = true;
      }
    }

    if (order.est_en_retard !== isLate) {
      order.est_en_retard = isLate;
      hasChanges = true;
    }

    if (order.prix_total !== undefined && typeof order.prix_total !== 'number') {
      order.prix_total = Number(order.prix_total) || 0;
      hasChanges = true;
    }
    if (order.avance_payee !== undefined && typeof order.avance_payee !== 'number') {
      order.avance_payee = Number(order.avance_payee) || 0;
      hasChanges = true;
    }
  });

  return hasChanges;
}

let orderCronTimer = null;
/**
 * Cron local de réconciliation des états de commandes en mémoire vive (intervalle: 2000 ms).
 * @param {Function} [onPersist] - Fonction optionnelle pour persister lors des changements.
 */
export function startOrderStateCron(onPersist) {
  if (orderCronTimer) return;
  if (reconcileOrderStates()) {
    if (typeof onPersist === 'function') onPersist();
    notifyListeners();
  }
  orderCronTimer = setInterval(() => {
    try {
      if (reconcileOrderStates()) {
        if (typeof onPersist === 'function') onPersist();
        notifyListeners();
      }
    } catch (e) {
      console.warn('[Order Cron Local 2s] Erreur silencieuse:', e);
    }
  }, 2000);
}

