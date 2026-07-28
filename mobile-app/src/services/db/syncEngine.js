/**
 * @file syncEngine.js
 * @description Moteur de synchronisation bidirectionnelle en temps réel avec Supabase.
 * Gère la persistance locale (AsyncStorage), les files d'attente hors-ligne, les tentatives de reconnexion
 * automatique et l'abonnement aux événements Postgres en temps réel.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';
import { memoryDb, db, hydrateOrder, startOrderStateCron } from './dbEngine';
import { 
  DEFAULT_STAFF, 
  DEFAULT_CUSTOMERS, 
  DEFAULT_ORDERS, 
  DEFAULT_LOGS, 
  DEFAULT_CATALOG,
  STORAGE_KEYS 
} from './seeds';

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
export async function loadFromLocalStorage() {
  const rawStaff = await loadData(STORAGE_KEYS.STAFF, DEFAULT_STAFF);
  // Keep only super admin or custom staff
  memoryDb.staff = (rawStaff || []).filter(s => s.email === 'andre.koutomi98@gmail.com' || (s.id && !['u1','u2','u3','u5','u6'].includes(s.id)));
  if (memoryDb.staff.length === 0) memoryDb.staff = DEFAULT_STAFF;

  memoryDb.customers = await loadData(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
  
  const loadedOrders = await loadData(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  // Filter out stale demo orders (o1 through o10) from old sessions
  const demoOrderIds = ['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8', 'o9', 'o10'];
  const cleanedOrders = (loadedOrders || []).filter(o => !demoOrderIds.includes(o.id));
  memoryDb.orders = cleanedOrders.map(hydrateOrder);
  
  // If demo orders were purged, save the clean list immediately to AsyncStorage
  if (cleanedOrders.length !== (loadedOrders || []).length) {
    await saveData(STORAGE_KEYS.ORDERS, cleanedOrders);
  }

  memoryDb.logs = await loadData(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
  
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.CATALOG);
  } catch (e) {}

  memoryDb.catalog = DEFAULT_CATALOG;
  
  const currentUser = await loadData(STORAGE_KEYS.CURRENT_USER, null);
  if (!currentUser || (currentUser.email !== 'andre.koutomi98@gmail.com' && !memoryDb.staff.some(s => s.id === currentUser.id))) {
    memoryDb.current_user = DEFAULT_STAFF[0];
  } else {
    memoryDb.current_user = currentUser;
  }

  memoryDb.pin_reset_requests = await loadData('klin_up_pin_reset_requests', []);
  memoryDb.sync_queue = await loadData('klin_up_sync_queue', []);
  memoryDb.dark_mode = await loadData('klin_up_dark_mode', false);
  db.notify();
}

/**
 * Persiste l'état actuel de memoryDb dans le stockage permanent de l'appareil.
 */
export async function persist() {
  await saveData(STORAGE_KEYS.STAFF, memoryDb.staff);
  await saveData(STORAGE_KEYS.CUSTOMERS, memoryDb.customers);
  await saveData(STORAGE_KEYS.ORDERS, memoryDb.orders);
  await saveData(STORAGE_KEYS.LOGS, memoryDb.logs);
  // Catalog is NOT stored locally (direct DB query mode)
  await saveData(STORAGE_KEYS.CURRENT_USER, memoryDb.current_user);
  await saveData('klin_up_pin_reset_requests', memoryDb.pin_reset_requests);
  await saveData('klin_up_sync_queue', memoryDb.sync_queue);
}

// --- NETWORK SYNC LAYER ---

/**
 * Filtre les données pour éviter d'envoyer des propriétés calculées localement à Supabase.
 */
function sanitizePayload(table, data) {
  if (!data) return data;
  const sanitized = { ...data };
  // store_id est désormais un champ obligatoire transmis à Supabase
  if (table === 'orders') {
    delete sanitized.remise_pourcentage;
    delete sanitized.remise_montant;
    delete sanitized.prix_base_avant_remise;
  } else if (table === 'catalog') {
    delete sanitized.sku;
    delete sanitized.prix_urgent;
  }
  return sanitized;
}

/**
 * Ajoute une mutation échouée ou effectuée hors-ligne à la file d'attente de synchronisation.
 */
async function addToSyncQueue(action, table, recordId, data) {
  memoryDb.sync_queue.push({
    id: 'sq_' + Math.random().toString(36).substr(2, 9),
    action,
    table,
    recordId,
    data,
    timestamp: new Date().toISOString()
  });
  await saveData('klin_up_sync_queue', memoryDb.sync_queue);
}

/**
 * Dépile et synchronise toutes les opérations en attente dans la file d'attente hors-ligne.
 */
export async function syncOfflineQueue() {
  if (!supabase) return;
  const queue = memoryDb.sync_queue;
  if (queue.length === 0) return;
  
  console.log(`[DB Sync] 🔄 Synchronisation de la file d'attente hors-ligne (${queue.length} opérations)...`);
  
  let successCount = 0;
  for (const item of queue) {
    try {
      let res;
      const sanitizedData = sanitizePayload(item.table, item.data);
      if (item.action === 'insert') {
        res = await supabase.from(item.table).insert(sanitizedData);
      } else if (item.action === 'update') {
        res = await supabase.from(item.table).update(sanitizedData).eq('id', item.recordId);
      } else if (item.action === 'delete') {
        res = await supabase.from(item.table).delete().eq('id', item.recordId);
      }
      
      if (res && res.error) {
        console.warn(`[DB Sync] Erreur lors de la sync hors-ligne de l'opération ${item.id}:`, res.error.message);
        if (res.error.message.includes('network') || res.error.message.includes('Fetch')) {
          throw new Error("Réseau indisponible lors de la sync");
        }
      }
      successCount++;
    } catch (err) {
      console.warn(`[DB Sync] Interruption de la synchronisation : ${err.message}`);
      const remaining = queue.slice(successCount);
      memoryDb.sync_queue = remaining;
      await saveData('klin_up_sync_queue', remaining);
      return;
    }
  }
  
  memoryDb.sync_queue = [];
  await saveData('klin_up_sync_queue', []);
  console.log(`[DB Sync] ✅ File d'attente hors-ligne vidée.`);
}

/**
 * Exécute une mutation réseau (insert/update/delete) immédiatement ou en mode hors-ligne différé.
 */
export async function performMutation(action, table, recordId, data, rollbackFn) {
  if (!isUsingRemote) {
    await addToSyncQueue(action, table, recordId, data);
    return;
  }
  
  try {
    let res;
    const sanitizedData = sanitizePayload(table, data);
    if (action === 'insert') {
      res = await supabase.from(table).insert(sanitizedData);
    } else if (action === 'update') {
      res = await supabase.from(table).update(sanitizedData).eq('id', recordId);
    } else if (action === 'delete') {
      res = await supabase.from(table).delete().eq('id', recordId);
    }
    
    if (res && res.error) {
      const errMsg = res.error.message || '';
      const errCode = res.error.code || '';
      const isNetworkError = errMsg.includes('Failed to fetch') || errMsg.includes('network') || errMsg.includes('load');
      if (isNetworkError) {
        console.warn(`[DB Sync] Mutation réseau échouée, mise en file d'attente hors-ligne.`);
        isUsingRemote = false;
        db.notify();
        await addToSyncQueue(action, table, recordId, data);
        startAutoReconnect();
      } else if (errCode === '42703' || (errMsg.includes('column') && errMsg.includes('does not exist'))) {
        console.warn(`[DB Sync] Colonne inexistante dans Supabase. Repli sans motif_annulation.`);
        if (table === 'orders' && sanitizedData.motif_annulation !== undefined) {
          const retriedData = { ...sanitizedData };
          delete retriedData.motif_annulation;
          
          let retryRes;
          if (action === 'insert') {
            retryRes = await supabase.from(table).insert(retriedData);
          } else if (action === 'update') {
            retryRes = await supabase.from(table).update(retriedData).eq('id', recordId);
          }
          
          if (retryRes && retryRes.error) {
            console.error(`[DB Sync] Échec du repli de la mutation :`, retryRes.error.message);
            if (rollbackFn) rollbackFn(retryRes.error);
          } else {
            console.log(`[DB Sync] ✅ Mutation de repli réussie.`);
          }
        } else {
          if (rollbackFn) rollbackFn(res.error);
        }
      } else {
        console.error(`[DB Sync] Erreur de base de données :`, res.error.message);
        if (rollbackFn) rollbackFn(res.error);
      }
    }
  } catch (err) {
    console.warn(`[DB Sync] Exception réseau, mutation mise en attente :`, err.message);
    isUsingRemote = false;
    db.notify();
    await addToSyncQueue(action, table, recordId, data);
    startAutoReconnect();
  }
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
        memoryDb.orders = remoteOrders.map(ro => {
          const localOrder = memoryDb.orders.find(lo => lo.id === ro.id);
          let merged = { ...ro };
          if (localOrder && localOrder.motif_annulation && !ro.motif_annulation) {
            merged.motif_annulation = localOrder.motif_annulation;
          }
          return hydrateOrder(merged);
        });
      }
      if (logsRes.status === 'fulfilled' && !logsRes.value?.error) {
        memoryDb.logs = logsRes.value.data || [];
      }
      if (catalogRes.status === 'fulfilled' && !catalogRes.value?.error && catalogRes.value?.data?.length > 0) {
        const remoteCat = catalogRes.value.data;
        const merged = DEFAULT_CATALOG.map(defItem => {
          const remote = remoteCat.find(r => 
            r.id === defItem.id || 
            (r.article && defItem.article && r.article.trim().toLowerCase() === defItem.article.trim().toLowerCase() && r.service === defItem.service)
          );
          if (remote) {
            const prix = (remote.prix && Number(remote.prix) > 0) ? Number(remote.prix) : defItem.prix;
            const isActive = remote.is_active === false || remote.statut === 'inactif' ? false : true;
            return {
              ...defItem,
              ...remote,
              prix,
              is_active: isActive,
              statut: isActive ? 'actif' : 'inactif'
            };
          }
          return defItem;
        });

        remoteCat.forEach(remoteItem => {
          const exists = merged.some(m => m.id === remoteItem.id);
          if (!exists) {
            const isActive = remoteItem.is_active === false || remoteItem.statut === 'inactif' ? false : true;
            merged.push({
              ...remoteItem,
              is_active: isActive,
              statut: isActive ? 'actif' : 'inactif'
            });
          }
        });

        memoryDb.catalog = merged;
      }
      if (reqsRes.status === 'fulfilled' && !reqsRes.value?.error) {
        memoryDb.pin_reset_requests = reqsRes.value.data || [];
      }

      memoryDb.current_user = await loadData(STORAGE_KEYS.CURRENT_USER, null);
      isUsingRemote = true;

      console.log("[DB Sync] ✅ Connecté à Supabase.");
      await syncOfflineQueue();
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

// Sync périodique continue haute fréquence (toutes les 3s)
let syncInterval = null;
export async function startPeriodicSync() {
  if (syncInterval) return;
  syncInterval = setInterval(async () => {
    if (!supabase) return;
    try {
      const [staffRes, custRes, orderRes, logsRes, reqsRes] = await Promise.allSettled([
        withTimeout(supabase.from('staff').select('*'), 5000, 'sync-staff'),
        withTimeout(supabase.from('customers').select('*'), 5000, 'sync-customers'),
        withTimeout(supabase.from('orders').select('*'), 5000, 'sync-orders'),
        withTimeout(supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }), 5000, 'sync-logs'),
        withTimeout(supabase.from('pin_reset_requests').select('*'), 5000, 'sync-reqs'),
      ]);
      let changed = false;
      if (staffRes.status === 'fulfilled' && !staffRes.value?.error && staffRes.value?.data?.length > 0) {
        const remoteStaff = staffRes.value.data || [];
        const mergedStaff = [...remoteStaff];
        (memoryDb.staff || []).forEach(localItem => {
          if (localItem && localItem.id && !mergedStaff.some(r => r.id === localItem.id)) {
            mergedStaff.push(localItem);
          }
        });
        memoryDb.staff = mergedStaff;
        changed = true;
      }
      if (custRes.status === 'fulfilled' && !custRes.value?.error) { memoryDb.customers = custRes.value.data || []; changed = true; }
      if (orderRes.status === 'fulfilled' && !orderRes.value?.error) {
        const remoteOrders = orderRes.value.data || [];
        memoryDb.orders = remoteOrders.map(ro => {
          const localOrder = memoryDb.orders.find(lo => lo.id === ro.id);
          let merged = { ...ro };
          if (localOrder && localOrder.motif_annulation && !ro.motif_annulation) {
            merged.motif_annulation = localOrder.motif_annulation;
          }
          return hydrateOrder(merged);
        });
        changed = true;
      }
      if (logsRes.status === 'fulfilled' && !logsRes.value?.error) { memoryDb.logs = logsRes.value.data || []; changed = true; }
      if (reqsRes.status === 'fulfilled' && !reqsRes.value?.error) { memoryDb.pin_reset_requests = reqsRes.value.data || []; changed = true; }
      if (changed) { 
        await persist(); 
        db.notify(); 
      }
    } catch (e) {
      // Sync silencieuse
    }
  }, 3000);
}

// Abonnements en temps réel
export function setupRealtime() {
  const tables = ['staff', 'customers', 'orders', 'activity_logs', 'catalog', 'pin_reset_requests'];
  
  tables.forEach(table => {
    supabase
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

        persist();
        db.notify();
      })
      .subscribe();
  });
}

/**
 * Initialise l'ensemble de la base de données.
 */
export async function initializeDatabase() {
  await loadFromLocalStorage();
  await initDb();
  startOrderStateCron();
}
