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
  }
  return sanitized;
}

/**
 * Exécute une mutation réseau (insert/update/delete) directement sur Supabase.
 * Architecture STRICT : toute erreur Supabase lève une exception.
 * Le code appelant ne doit JAMAIS mettre à jour memoryDb si cette fonction lève.
 */
export async function performMutation(action, table, recordId, data) {
  if (!supabase) {
    throw new Error('[KLIN UP DB] Supabase non connecté. Vérifiez votre connexion réseau.');
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
    throw new Error(`[KLIN UP DB] Erreur réseau Supabase (table: ${table}) : ${networkErr.message}`);
  }

  if (!res?.error) {
    return res?.data ?? null;
  }

  const errCode = res.error.code || '';
  const errMsg = res.error.message || '';

  console.error(`[KLIN UP DB] ❌ Erreur Supabase sur table '${table}' [${action}] :`, errCode, errMsg);

  // Schéma cache / colonne manquante → un seul repli ciblé
  if (
    errCode === 'PGRST204' ||
    errCode === '42703' ||
    errMsg.includes('column') ||
    errMsg.includes('schema cache')
  ) {
    const retriedData = { ...sanitizedData };

    const match = errMsg.match(/Could not find the '([^']+)' column/i)
                || errMsg.match(/column "([^"]+)"/i);
    const missingCol = match?.[1];

    if (missingCol) {
      console.warn(`[KLIN UP DB] ⚠️ Colonne '${missingCol}' absente — retrait automatique pour repli.`);
      delete retriedData[missingCol];
    } else {
      const optionalCols = ['ville', 'responsable_id', 'responsable_nom', 'created_by_id', 'created_by_name',
                            'push_token', 'push_token_updated_at', 'motif_annulation', 'solde_paid_at',
                            'reference_paiement', 'reference_momo', 'acompte_paid_at'];
      for (const col of optionalCols) delete retriedData[col];
    }

    let retryRes;
    try {
      if (action === 'insert') retryRes = await supabase.from(table).insert(retriedData);
      else if (action === 'update') retryRes = await supabase.from(table).update(retriedData).eq('id', recordId);
      else if (action === 'delete') retryRes = await supabase.from(table).delete().eq('id', recordId);
    } catch (retryErr) {
      throw new Error(`[KLIN UP DB] Erreur réseau lors du repli (table: ${table}) : ${retryErr.message}`);
    }

    if (!retryRes?.error) {
      console.info(`[KLIN UP DB] ✅ Repli réussi pour table '${table}'.`);
      return retryRes?.data ?? null;
    }

    throw new Error(
      `[KLIN UP DB] Échec persistant sur '${table}' après repli de schéma. Erreur : ${retryRes.error.message} (code: ${retryRes.error.code})`
    );
  }

  // RLS ou autre erreur → toujours lever une exception
  if (errCode === '42501' || errMsg.toLowerCase().includes('row-level security')) {
    throw new Error(
      `[KLIN UP DB] Accès refusé par Supabase (RLS) sur la table '${table}'. ` +
      `Exécutez le script de migration SQL dans Supabase pour activer les politiques d'accès. Détail : ${errMsg}`
    );
  }

  throw new Error(`[KLIN UP DB] Supabase a rejeté l'opération sur '${table}' : ${errMsg} (code: ${errCode})`);
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

              // 3. Fallback : invoquer l'Edge Function pour les push distants
              // Le trigger serveur `trg_dispatch_push` (pg_net) devrait déjà l'avoir fait,
              // mais si pg_net/Vault n'est pas configuré, on s'assure que les appareils
              // fermés/en arrière-plan reçoivent quand même la notification.
              // L'Edge Function est idempotente (colonne push_sent) : pas de doublons.
              if (supabase && typeof supabase.functions?.invoke === 'function') {
                setTimeout(() => {
                  supabase.functions.invoke('send-push-notification', {
                    body: {
                      type: newRow.type_action || 'INSERT',
                      record: {
                        id: newRow.id,
                        order_id: newRow.order_id,
                        store_id: newRow.store_id,
                        titre: newRow.titre,
                        message: newRow.message,
                        metadata: newRow.metadata,
                        ...newRow.metadata
                      }
                    }
                  }).then(res => {
                    if (res?.data?.skipped) {
                      console.log('[Push Fallback] ⏭ Déjà envoyé par le trigger serveur (idempotence OK)');
                    } else if (res?.data) {
                      console.log('[Push Fallback] ✅ Push envoyé (fallback client):', res.data.sent, 'appareil(s)');
                    }
                  }).catch(err => {
                    console.warn('[Push Fallback] Edge Function indisponible:', err?.message || err);
                  });
                }, 2000); // Délai de 2s pour laisser le trigger serveur agir en premier
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

          const isDeleted = eventType === 'DELETE' && (
            (oldRow && (oldRow.id === currentId || (oldRow.email && oldRow.email.toLowerCase() === currentEmail))) ||
            !memoryDb.staff.some(s => s.id === currentId || (s.email && s.email.toLowerCase() === currentEmail))
          );

          const isUpdatedDisabled = eventType === 'UPDATE' && newRow && (
            (newRow.id === currentId || (newRow.email && newRow.email.toLowerCase() === currentEmail)) &&
            (newRow.statut === 'suspendu' || newRow.statut === 'inactif')
          );

          if (isDeleted || isUpdatedDisabled) {
            console.warn("[Auth Realtime] Compte personnel supprimé ou désactivé à distance. Déconnexion immédiate !");
            memoryDb.current_user = null;
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
 * Vérifie si l'utilisateur actuellement connecté a été supprimé, désactivé ou suspendu, et le déconnecte le cas échéant.
 */
export function checkAndEvictDisabledCurrentUser() {
  if (!memoryDb.current_user || !memoryDb.staff) return false;
  const currentId = memoryDb.current_user.id;
  const currentEmail = (memoryDb.current_user.email || '').toLowerCase();

  const foundInStaff = memoryDb.staff.find(s =>
    (s.id && s.id === currentId) ||
    (s.email && s.email.toLowerCase() === currentEmail)
  );

  // Si le compte est absent de la liste du personnel (supprimé) OU si son statut est inactif/suspendu
  if (!foundInStaff || foundInStaff.statut === 'suspendu' || foundInStaff.statut === 'inactif') {
    console.warn("[Auth] Détection d'un compte supprimé, suspendu ou inactif. Déconnexion forcée !");
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
        const id = memoryDb.current_user.id;
        const email = memoryDb.current_user.email;
        if (!id && !email) return;

        let query = supabase.from('staff').select('id, statut');
        if (id) {
          query = query.eq('id', id);
        } else if (email) {
          query = query.ilike('email', email.trim());
        }

        const { data } = await query.maybeSingle();

        // Si la ligne n'existe plus en base (supprimée) OU si le statut est inactif/suspendu
        if (!data || data.statut === 'suspendu' || data.statut === 'inactif') {
          console.warn(`[Security Heartbeat] Compte mobile supprimé ou désactivé (statut: ${data?.statut || 'SUPPRIME'}). Déconnexion forcée immédiate !`);
          memoryDb.current_user = null;
          await persist();
          db.notify();
        }
      } catch (e) {
        // Erreurs réseau temporaires ignorées
      }
    }
  }, 3000);
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