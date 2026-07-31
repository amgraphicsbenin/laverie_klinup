/**
 * @file syncEngine.js
 * @description Moteur de synchronisation bidirectionnelle en temps réel avec Supabase.
 * Gère la persistance locale (AsyncStorage), les files d'attente hors-ligne, les tentatives de reconnexion
 * automatique et l'abonnement aux événements Postgres en temps réel.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';
import { memoryDb, db, hydrateOrder, startOrderStateCron, isPendingOrderUpdate, removePendingOrderUpdate } from './dbEngine';
import {
  DEFAULT_STAFF,
  DEFAULT_CUSTOMERS,
  DEFAULT_ORDERS,
  DEFAULT_LOGS,
  DEFAULT_CATALOG,
  STORAGE_KEYS
} from './seeds';
import { sendOrderNotification } from '../notificationService';

// État de la connexion au cloud Supabase
let isUsingRemote = false;
export function getIsUsingRemote() {
  return isUsingRemote;
}

// --- PERSISTENCE HELPERS (ASYNCSTORAGE) ---

/**
 * Charge une clé de stockage locale ou retourne sa valeur par défaut si absente.
 */
const loadData = async (key, defaultData) => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (!data) {
      await AsyncStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    const parsed = JSON.parse(data);
    if (key === STORAGE_KEYS.CATALOG) {
      const hasZeroPriceClothes = parsed.some(item => item.categorie === 'individuel' && (!item.prix || Number(item.prix) === 0));
      const hasMissingActiveKeys = parsed.some(item => item.categorie === 'individuel' && item.is_active === undefined && item.statut === 'inactif');
      const needsMigration = parsed.length < defaultData.length || !parsed[0].hasOwnProperty('categorie') || hasZeroPriceClothes || hasMissingActiveKeys;
      if (needsMigration) {
        await AsyncStorage.setItem(key, JSON.stringify(defaultData));
        return defaultData;
      }
    }
    return parsed;
  } catch (e) {
    return defaultData;
  }
};

/**
 * Persiste localement une clé et son contenu.
 */
const saveData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Erreur lors de la persistance locale :", e);
  }
};

/**
 * Charge l'ensemble des données locales persistées en mémoire vive.
 */
/**
 * Charge les préférences de session (utilisateur connecté, mode sombre) depuis AsyncStorage.
 */
export async function loadFromLocalStorage() {
  try {
    const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (userRaw) memoryDb.current_user = JSON.parse(userRaw);
    const darkRaw = await AsyncStorage.getItem('klin_up_dark_mode');
    if (darkRaw) memoryDb.dark_mode = JSON.parse(darkRaw);
  } catch (e) {
    console.warn('[DB] Erreur chargement session locale:', e);
  }
  db.notify();
}

/**
 * Persiste la session utilisateur et les préférences UI locales.
 */
export async function persist() {
  try {
    if (memoryDb.current_user) {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(memoryDb.current_user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    await AsyncStorage.setItem('klin_up_dark_mode', JSON.stringify(memoryDb.dark_mode || false));
  } catch (e) {
    console.error("Erreur lors de la persistance locale de session :", e);
  }
}

// --- NETWORK SYNC LAYER ---

/**
 * Filtre les données pour éviter d'envoyer des propriétés calculées localement à Supabase.
 */
function sanitizePayload(table, data) {
  if (!data) return data;
  const sanitized = { ...data };
  if (table === 'orders') {
    delete sanitized.remise_pourcentage;
    delete sanitized.remise_montant;
    delete sanitized.prix_base_avant_remise;
  } else if (table === 'catalog') {
    delete sanitized.sku;
    delete sanitized.prix_urgent;
    delete sanitized.is_active;
  } else if (table === 'stores') {
    delete sanitized.ville;
    delete sanitized.responsable_id;
    delete sanitized.responsable_nom;
  } else if (table === 'staff') {
    delete sanitized.store_id;
  } else if (table === 'customers') {
    delete sanitized.store_id;
  }
  return sanitized;
}

/**
 * Exécute une mutation réseau (insert/update/delete) directement sur Supabase.
 * Lève une exception si l'opération échoue.
 */
export async function performMutation(action, table, recordId, data) {
  if (!supabase) {
    throw new Error('Supabase non connecté. Vérifiez votre connexion réseau.');
  }

  const sanitizedData = sanitizePayload(table, data);
  let res;

  try {
    if (action === 'insert') {
      res = await supabase.from(table).insert(sanitizedData);
    } else if (action === 'update') {
      res = await supabase.from(table).update(sanitizedData).eq('id', recordId);
    } else if (action === 'delete') {
      res = await supabase.from(table).delete().eq('id', recordId);
    }
  } catch (networkErr) {
    throw new Error(`Erreur réseau lors de la communication avec Supabase : ${networkErr.message}`);
  }

  if (res?.error) {
    const errMsg = res.error.message || '';
    const errCode = res.error.code || '';

    if (
      errCode === '42501' ||
      errMsg.toLowerCase().includes('row-level security') ||
      errMsg.toLowerCase().includes('rls policy')
    ) {
      console.warn(`[DB Sync] ⚠️ RLS Supabase actif sur la table '${table}' (${errMsg}).`);
      return null;
    }

    if (
      errCode === 'PGRST204' ||
      errCode === '42703' ||
      errMsg.includes('column') ||
      errMsg.includes('schema cache')
    ) {
      console.warn(`[DB Sync] Colonne non trouvée (${errMsg}). Tentative de repli...`);
      const retriedData = { ...sanitizedData };
      if (table !== 'orders') {
        delete retriedData.store_id;
      }
      delete retriedData.motif_annulation;
      delete retriedData.remise_pourcentage;
      delete retriedData.remise_montant;
      delete retriedData.responsable_id;
      delete retriedData.responsable_nom;
      delete retriedData.solde_paid_at;
      delete retriedData.subscription_details;
      delete retriedData.reference_paiement;
      delete retriedData.reference_momo;
      delete retriedData.acompte_paid_at;
      delete retriedData.is_subscription_order;
      delete retriedData.created_by_id;
      delete retriedData.created_by_name;

      let retryRes;
      try {
        if (action === 'insert') {
          retryRes = await supabase.from(table).insert(retriedData);
        } else if (action === 'update') {
          retryRes = await supabase.from(table).update(retriedData).eq('id', recordId);
        }
      } catch (retryErr) {
        throw new Error(`Erreur réseau lors du repli : ${retryErr.message}`);
      }

      if (retryRes?.error) {
        if (
          retryRes.error.code === '42501' ||
          retryRes.error.message.toLowerCase().includes('row-level security')
        ) {
          console.warn(`[DB Sync] ⚠️ RLS Supabase actif lors du repli sur '${table}'.`);
          return null;
        }
        throw new Error(retryRes.error.message);
      }
      return retryRes?.data;
    }

    throw new Error(res.error.message);
  }

  return res?.data;
}

// Timeout helper
function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`[TIMEOUT] ${label} a dépassé ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Tente de se connecter à Supabase pour initialiser les données locales.
 * Si le réseau échoue, l'application fonctionne avec le stockage hors-ligne local.
 */
export async function initDb(isRetry = false) {
  if (!supabase) {
    console.warn("[DB Sync] Client Supabase indisponible.");
    db.notify();
    return;
  }

  let attempt = 0;
  const maxAttempts = isRetry ? 1 : 3;
  const retryDelayMs = 3000;

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`[DB Sync] Connexion à Supabase... Essai ${attempt}/${maxAttempts}`);

    try {
      const TIMEOUT_MS = 15000;
      const [staffRes, custRes, orderRes, logsRes, catalogRes, reqsRes] = await Promise.allSettled([
        withTimeout(supabase.from('staff').select('*'), TIMEOUT_MS, 'staff'),
        withTimeout(supabase.from('customers').select('*'), TIMEOUT_MS, 'customers'),
        withTimeout(supabase.from('orders').select('*'), TIMEOUT_MS, 'orders'),
        withTimeout(supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }), TIMEOUT_MS, 'activity_logs'),
        withTimeout(supabase.from('catalog').select('*'), TIMEOUT_MS, 'catalog'),
        withTimeout(supabase.from('pin_reset_requests').select('*'), TIMEOUT_MS, 'pin_reset_requests'),
      ]);

      const staffOk = staffRes.status === 'fulfilled' && !staffRes.value?.error;
      const custOk = custRes.status === 'fulfilled' && !custRes.value?.error;
      const orderOk = orderRes.status === 'fulfilled' && !orderRes.value?.error;

      if (!staffOk && !custOk && !orderOk) {
        throw new Error("Tables principales inaccessibles.");
      }

      if (staffRes.status === 'fulfilled' && !staffRes.value?.error && staffRes.value?.data) {
        const remoteStaff = staffRes.value.data || [];
        const pendingOfflineStaffIds = (memoryDb.sync_queue || [])
          .filter(q => q.table === 'staff' && q.action === 'INSERT')
          .map(q => q.recordId);
        const validStaff = [...remoteStaff];
        (memoryDb.staff || []).forEach(localItem => {
          if (localItem && localItem.id && pendingOfflineStaffIds.includes(localItem.id) && !validStaff.some(r => r.id === localItem.id)) {
            validStaff.push(localItem);
          }
        });
        memoryDb.staff = validStaff;
      }
      if (custRes.status === 'fulfilled' && !custRes.value?.error) {
        memoryDb.customers = custRes.value.data || [];
      }
      if (orderRes.status === 'fulfilled' && !orderRes.value?.error) {
        const remoteOrders = orderRes.value.data || [];
        const pendingOfflineOrderIds = (memoryDb.sync_queue || [])
          .filter(q => q.table === 'orders' && q.action === 'insert')
          .map(q => q.recordId);

        const mergedOrders = remoteOrders.map(ro => {
          const localOrder = (memoryDb.orders || []).find(lo => lo && lo.id === ro.id);
          let merged = { ...ro };
          if (localOrder && localOrder.motif_annulation && !ro.motif_annulation) {
            merged.motif_annulation = localOrder.motif_annulation;
          }
          return hydrateOrder(merged);
        });

        // Retain locally created orders that have not yet synced to remote
        (memoryDb.orders || []).forEach(localOrder => {
          if (localOrder && localOrder.id && pendingOfflineOrderIds.includes(localOrder.id) && !mergedOrders.some(r => r.id === localOrder.id)) {
            mergedOrders.push(hydrateOrder(localOrder));
          }
        });

        memoryDb.orders = mergedOrders;
      }
      if (logsRes.status === 'fulfilled' && !logsRes.value?.error) {
        memoryDb.logs = logsRes.value.data || [];
      }
      if (catalogRes.status === 'fulfilled' && !catalogRes.value?.error && catalogRes.value?.data) {
        memoryDb.catalog = catalogRes.value.data.map(item => {
          const isActive = item.is_active === false || item.statut === 'inactif' ? false : true;
          return {
            ...item,
            is_active: isActive,
            statut: isActive ? 'actif' : 'inactif'
          };
        });
      }
      if (reqsRes.status === 'fulfilled' && !reqsRes.value?.error) {
        memoryDb.pin_reset_requests = reqsRes.value.data || [];
      }

      memoryDb.current_user = await loadData(STORAGE_KEYS.CURRENT_USER, null);
      isUsingRemote = true;

      console.log("[DB Sync] ✅ Connecté à Supabase.");
      await syncOfflineQueue();
      checkAndEvictDisabledCurrentUser();
      await persist();
      db.notify();

      try { setupRealtime(); } catch (e) { console.warn("[DB Sync] Realtime non disponible :", e.message); }
      startPeriodicSync();
      return;

    } catch (err) {
      console.warn(`[DB Sync] Tentative ${attempt} échouée : ${err.message}`);
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, retryDelayMs));
      } else {
        console.warn("[DB Sync] Échec de connexion globale. Fonctionnement hors-ligne.");
        db.notify();
        startAutoReconnect();
      }
    }
  }
}

export async function refreshStaff() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('staff').select('*');
    if (!error && data) {
      const pendingOfflineStaffIds = (memoryDb.sync_queue || [])
        .filter(q => q.table === 'staff' && q.action === 'INSERT')
        .map(q => q.recordId);
      const validStaff = [...(data || [])];
      (memoryDb.staff || []).forEach(localItem => {
        if (localItem && localItem.id && pendingOfflineStaffIds.includes(localItem.id) && !validStaff.some(r => r.id === localItem.id)) {
          validStaff.push(localItem);
        }
      });
      memoryDb.staff = validStaff;
      checkAndEvictDisabledCurrentUser();
      await persist();
      db.notify();
    }
  } catch (e) {
    console.error("[DB Sync] Échec du rafraîchissement du personnel :", e);
  }
}

// Reconnexion automatique
let reconnectInterval = null;
export function startAutoReconnect() {
  if (reconnectInterval) return;
  reconnectInterval = setInterval(async () => {
    if (isUsingRemote) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
      return;
    }
    console.log("[DB Sync] Tentative de reconnexion automatique...");
    try {
      if (!supabase) return;
      const { error } = await supabase.from('staff').select('id').limit(1);
      if (!error) {
        console.log("[DB Sync] Connexion rétablie. Re-synchronisation...");
        await initDb(true);
        if (isUsingRemote) {
          clearInterval(reconnectInterval);
          reconnectInterval = null;
        }
      }
    } catch (e) {
      // Échec silencieux
    }
  }, 30000);
}

// Cron de synchronisation de fallback (toutes les 5s — uniquement si le Realtime WebSocket est défaillant)
// La voie PRINCIPALE est le Supabase Realtime (WebSocket instantané).
// Ce cron est un filet de sécurité : il ne fetch que les commandes du point de laverie courant.
let syncInterval = null;
export async function startPeriodicSync() {
  if (syncInterval) return;
  syncInterval = setInterval(async () => {
    if (!supabase) return;
    try {
      const { data: remoteOrders, error } = await supabase
        .from('orders')
        .select('*');

      if (error || !remoteOrders) return;

      const mergedOrders = remoteOrders.map(ro => {
        const localOrder = (memoryDb.orders || []).find(lo => lo && lo.id === ro.id);
        // ── Préserver les modifications locales en attente (anti-écrasement par sync périodique) ──
        if (localOrder && isPendingOrderUpdate(ro.id)) {
          return hydrateOrder(localOrder);
        }
        let merged = { ...ro };
        if (localOrder && localOrder.motif_annulation && !merged.motif_annulation) {
          merged.motif_annulation = localOrder.motif_annulation;
        }
        return hydrateOrder(merged);
      });

      // Conserver les commandes créées localement non encore synchronisées
      const pendingOfflineOrderIds = (memoryDb.sync_queue || [])
        .filter(q => q.table === 'orders' && q.action === 'insert')
        .map(q => q.recordId);
      (memoryDb.orders || []).forEach(localOrder => {
        if (localOrder && localOrder.id && pendingOfflineOrderIds.includes(localOrder.id) && !mergedOrders.some(r => r.id === localOrder.id)) {
          mergedOrders.push(hydrateOrder(localOrder));
        }
      });

      if (JSON.stringify(memoryDb.orders) !== JSON.stringify(mergedOrders)) {
        memoryDb.orders = mergedOrders;
        await persist();
        db.notify();
      }
    } catch (e) {
      // Sync silencieuse — le Realtime WebSocket prend le relais
    }
  }, 5000);
}

let realtimeChannels = [];

// Abonnements en temps réel
export function setupRealtime() {
  if (realtimeChannels.length > 0) {
    realtimeChannels.forEach(ch => {
      try {
        supabase.removeChannel(ch);
      } catch (e) { }
    });
    realtimeChannels = [];
  }

  const tables = ['staff', 'customers', 'orders', 'activity_logs', 'catalog', 'pin_reset_requests', 'stores', 'order_notifications'];

  tables.forEach(table => {
    const ch = supabase
      .channel(`${table}_channel`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
        const { eventType, new: newRow, old: oldRow } = payload;

        let targetList = [];
        if (table === 'staff') targetList = memoryDb.staff;
        else if (table === 'customers') targetList = memoryDb.customers;
        else if (table === 'orders') targetList = memoryDb.orders;
        else if (table === 'activity_logs') targetList = memoryDb.logs;
        else if (table === 'catalog') targetList = memoryDb.catalog;
        else if (table === 'pin_reset_requests') targetList = memoryDb.pin_reset_requests;
        else if (table === 'stores') targetList = memoryDb.stores;

        // ── Notifications centralisées en base de données (order_notifications) ──
        if (table === 'order_notifications' && eventType === 'INSERT' && newRow) {
          const currentUser = memoryDb.current_user;
          if (currentUser) {
            const notifStoreId = newRow.store_id || 'store_central';
            const userStoreId = currentUser.store_id || 'store_central';
            const isSuperAdmin = currentUser.role === 'super_admin' || userStoreId === 'all';

            if (isSuperAdmin || userStoreId === notifStoreId) {
              // 1. Déclencher l'alerte sonore et visuelle immédiate sur l'appareil
              const sendSystemNotification = require('../notificationService').sendSystemNotification;
              sendSystemNotification(newRow.titre, newRow.message, {
                orderId: newRow.order_id,
                statut: newRow.metadata?.statut,
                screen: 'gestion'
              });

              // 2. Ajouter l'entrée dans la liste locale des notifications
              if (!memoryDb.notifications) memoryDb.notifications = [];
              const notifExists = memoryDb.notifications.some(n => n.id === newRow.id);
              if (!notifExists) {
                memoryDb.notifications.unshift({
                  id: newRow.id,
                  action: newRow.titre,
                  details: newRow.message,
                  timestamp: newRow.created_at || new Date().toISOString(),
                  read: false,
                  type: 'order'
                });
              }
            }
          }
        }

        // ── Capture de l'ancien statut pour détecter les vrais changements ──
        let oldOrderStatus = null;
        if (table === 'orders' && eventType === 'UPDATE') {
          const existingOrder = targetList.find(x => x.id === newRow.id);
          oldOrderStatus = existingOrder ? (existingOrder.statut || existingOrder.status) : null;
        }

        if (eventType === 'INSERT') {
          const exists = targetList.some(x => x.id === newRow.id);
          if (!exists) {
            const rowToAdd = table === 'orders' ? hydrateOrder(newRow) : newRow;
            if (table === 'activity_logs') {
              targetList.unshift(rowToAdd);
            } else {
              targetList.push(rowToAdd);
            }
          }
        } else if (eventType === 'UPDATE') {
          // ── Libérer le verrou "pending" : l'événement Realtime confirme que la mutation a réussi côté Supabase ──
          if (table === 'orders' && newRow?.id) {
            removePendingOrderUpdate(newRow.id);
          }
          const idx = targetList.findIndex(x => x.id === newRow.id);
          if (idx !== -1) {
            let mergedRow = { ...newRow };
            if (table === 'orders' && targetList[idx].motif_annulation && !mergedRow.motif_annulation) {
              mergedRow.motif_annulation = targetList[idx].motif_annulation;
            }
            if (table === 'orders') {
              mergedRow = hydrateOrder(mergedRow);
            }
            targetList[idx] = mergedRow;
          } else {
            const rowToAdd = table === 'orders' ? hydrateOrder(newRow) : newRow;
            targetList.push(rowToAdd);
          }
        } else if (eventType === 'DELETE') {
          const idx = targetList.findIndex(x => x.id === oldRow.id);
          if (idx !== -1) {
            targetList.splice(idx, 1);
          }
        }

        // ── Notification en temps réel ciblée par Point de Laverie (store_id) ──
        if (table === 'orders' && newRow && (eventType === 'INSERT' || eventType === 'UPDATE')) {
          const hydratedNewOrder = hydrateOrder(newRow);
          const currentUser = memoryDb.current_user;

          if (currentUser) {
            const orderStoreId = hydratedNewOrder.store_id || 'store_central';
            const userStoreId = currentUser.store_id || 'store_central';
            const isSuperAdmin = currentUser.role === 'super_admin' || userStoreId === 'all';

            // Seuls les utilisateurs rattachés au même point de laverie (ou super_admin) reçoivent la notification
            if (isSuperAdmin || userStoreId === orderStoreId) {
              sendOrderNotification(eventType, hydratedNewOrder, oldOrderStatus).catch(() => { });
            }
          }
        }

        // Éviction automatique immédiate si l'utilisateur actuellement connecté est désactivé ou supprimé
        if (table === 'staff' && memoryDb.current_user) {
          const currentId = memoryDb.current_user.id;
          const currentEmail = (memoryDb.current_user.email || '').toLowerCase();

          if (eventType === 'DELETE' && oldRow && (oldRow.id === currentId || (oldRow.email && oldRow.email.toLowerCase() === currentEmail))) {
            console.warn("[Auth Realtime] Compte supprimé à distance. Déconnexion immédiate de l'application mobile !");
            memoryDb.current_user = null;
          } else if (eventType === 'UPDATE' && newRow && (newRow.id === currentId || (newRow.email && newRow.email.toLowerCase() === currentEmail))) {
            if (newRow.statut === 'suspendu' || newRow.statut === 'inactif') {
              console.warn("[Auth Realtime] Compte désactivé/suspendu à distance. Déconnexion immédiate de l'application mobile !");
              memoryDb.current_user = null;
            }
          }
        }

        persist();
        db.notify();
      })
      .subscribe();

    realtimeChannels.push(ch);
  });
}

/**
 * Vérifie si l'utilisateur actuellement connecté a été désactivé ou suspendu, et le déconnecte le cas échéant.
 */
export function checkAndEvictDisabledCurrentUser() {
  if (!memoryDb.current_user || !memoryDb.staff) return false;
  const currentId = memoryDb.current_user.id;
  const currentEmail = (memoryDb.current_user.email || '').toLowerCase();

  const foundInStaff = memoryDb.staff.find(s =>
    (s.id && s.id === currentId) ||
    (s.email && s.email.toLowerCase() === currentEmail)
  );

  if (foundInStaff && (foundInStaff.statut === 'suspendu' || foundInStaff.statut === 'inactif')) {
    console.warn("[Auth] Détection d'un compte suspendu ou inactif. Déconnexion forcée !");
    memoryDb.current_user = null;
    persist();
    db.notify();
    return true;
  }
  return false;
}

// Security Heartbeat : Vérification périodique du statut du compte connecté auprès de Supabase
let securityHeartbeatInterval = null;
function startSecurityHeartbeat() {
  if (securityHeartbeatInterval) return;
  securityHeartbeatInterval = setInterval(async () => {
    if (memoryDb.current_user && supabase) {
      try {
        const email = memoryDb.current_user.email;
        if (email) {
          const { data } = await supabase.from('staff').select('id, statut').ilike('email', email.trim()).maybeSingle();
          if (data && (data.statut === 'suspendu' || data.statut === 'inactif')) {
            console.warn(`[Security Heartbeat] Compte mobile désactivé (${data.statut}). Déconnexion forcée immédiate !`);
            memoryDb.current_user = null;
            await persist();
            db.notify();
          }
        }
      } catch (e) {
        // Erreurs réseau temporaires ignorées
      }
    }
  }, 10000);
}

/**
 * Initialise l'ensemble de la base de données.
 */
export async function initializeDatabase() {
  await loadFromLocalStorage();
  await initDb();
  checkAndEvictDisabledCurrentUser();
  startSecurityHeartbeat();
  startOrderStateCron();
}