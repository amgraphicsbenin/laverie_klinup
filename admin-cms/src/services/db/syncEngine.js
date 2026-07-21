import { supabase } from '../supabaseClient';
import { STORAGE_KEYS, DEFAULT_STAFF, DEFAULT_CUSTOMERS, DEFAULT_ORDERS, DEFAULT_LOGS, DEFAULT_CATALOG } from './seeds';
import { memoryDb, notifyListeners, hydrateOrder } from './dbEngine';

let isUsingRemote = false;
export function getIsUsingRemote() {
  return isUsingRemote;
}
let autoReconnectInterval = null;

const loadData = (key, defaultData) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    const parsed = JSON.parse(data);
    if (key === STORAGE_KEYS.CATALOG) {
      const needsMigration = parsed.length < defaultData.length || !parsed[0].hasOwnProperty('categorie');
      if (needsMigration) {
        localStorage.setItem(key, JSON.stringify(defaultData));
        return defaultData;
      }
    }
    return parsed;
  } catch (e) {
    console.warn("[DB] Failed to parse localStorage data for key " + key + ":", e);
    return defaultData;
  }
};

const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export function loadFromLocalStorage() {
  memoryDb.staff = loadData(STORAGE_KEYS.STAFF, DEFAULT_STAFF);
  memoryDb.customers = loadData(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
  const loadedOrders = loadData(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  memoryDb.orders = (loadedOrders || []).map(hydrateOrder);
  memoryDb.logs = loadData(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
  memoryDb.catalog = loadData(STORAGE_KEYS.CATALOG, DEFAULT_CATALOG);
  memoryDb.current_user = loadData(STORAGE_KEYS.CURRENT_USER, null);
  memoryDb.pin_reset_requests = loadData('klin_up_pin_reset_requests', []);
  notifyListeners();
}

export function persist() {
  saveData(STORAGE_KEYS.STAFF, memoryDb.staff);
  saveData(STORAGE_KEYS.CUSTOMERS, memoryDb.customers);
  saveData(STORAGE_KEYS.ORDERS, memoryDb.orders);
  saveData(STORAGE_KEYS.LOGS, memoryDb.logs);
  saveData(STORAGE_KEYS.CATALOG, memoryDb.catalog);
  saveData(STORAGE_KEYS.CURRENT_USER, memoryDb.current_user);
  saveData('klin_up_pin_reset_requests', memoryDb.pin_reset_requests);
}

function addToSyncQueue(action, table, recordId, data) {
  const queue = loadData('klin_up_sync_queue', []);
  queue.push({
    id: 'sq_' + Math.random().toString(36).substr(2, 9),
    action,
    table,
    recordId,
    data,
    timestamp: new Date().toISOString()
  });
  saveData('klin_up_sync_queue', queue);
}

function sanitizePayload(table, data) {
  if (!data) return data;
  if (table === 'orders') {
    const sanitized = { ...data };
    delete sanitized.remise_pourcentage;
    delete sanitized.remise_montant;
    delete sanitized.prix_base_avant_remise;
    return sanitized;
  }
  if (table === 'catalog') {
    const sanitized = { ...data };
    delete sanitized.sku;
    delete sanitized.prix_urgent;
    return sanitized;
  }
  return data;
}

export async function syncOfflineQueue() {
  if (!supabase) return;
  const queue = loadData('klin_up_sync_queue', []);
  if (queue.length === 0) return;
  
  console.log(`[DB] 🔄 Début de synchronisation de la file d'attente hors-ligne (${queue.length} opérations)...`);
  
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
        console.warn(`[DB] Erreur lors de la sync hors-ligne de l'opération ${item.id}:`, res.error.message);
        if (res.error.message.includes('network') || res.error.message.includes('Fetch')) {
          throw new Error("Réseau indisponible lors de la sync");
        }
      }
      successCount++;
    } catch (err) {
      console.warn(`[DB] Interruption de la synchronisation de la file d'attente : ${err.message}`);
      const remaining = queue.slice(successCount);
      saveData('klin_up_sync_queue', remaining);
      return;
    }
  }
  
  saveData('klin_up_sync_queue', []);
  console.log(`[DB] ✅ Synchronisation de la file d'attente terminée.`);
}

export async function performMutation(action, table, recordId, data, rollbackFn) {
  if (!isUsingRemote) {
    addToSyncQueue(action, table, recordId, data);
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
        console.warn(`[DB] Mutation échouée pour raison réseau, mise en file d'attente.`);
        isUsingRemote = false;
        notifyListeners();
        addToSyncQueue(action, table, recordId, data);
        startAutoReconnect();
      } else if (errCode === '42703' || (errMsg.includes('column') && errMsg.includes('does not exist'))) {
        console.warn(`[DB] La colonne n'existe pas dans Supabase. Tentative de repli sans motif_annulation.`);
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
            console.error(`[DB] Échec du repli de la mutation :`, retryRes.error.message);
            if (rollbackFn) rollbackFn(retryRes.error);
          } else {
            console.log(`[DB] ✅ Repli de la mutation réussi (sans motif_annulation).`);
          }
        } else {
          if (rollbackFn) rollbackFn(res.error);
        }
      } else {
        console.error(`[DB] Erreur de validation de base de données :`, res.error.message);
        if (rollbackFn) rollbackFn(res.error);
      }
    }
  } catch (err) {
    console.error(`[DB] Mutation crash :`, err.message);
    isUsingRemote = false;
    notifyListeners();
    addToSyncQueue(action, table, recordId, data);
    startAutoReconnect();
  }
}

function startAutoReconnect() {
  if (autoReconnectInterval) return;
  autoReconnectInterval = setInterval(async () => {
    console.log("[DB] 🔄 Tentative de reconnexion automatique à Supabase...");
    try {
      const { error } = await supabase.from('staff').select('id').limit(1);
      if (!error) {
        console.log("[DB] 🟢 Connexion Supabase rétablie !");
        clearInterval(autoReconnectInterval);
        autoReconnectInterval = null;
        isUsingRemote = true;
        await syncOfflineQueue();
        await initDb(true);
      }
    } catch (e) {
      console.error("[DB] 🔴 Reconnexion échouée, nouvelle tentative dans 30s.", e);
    }
  }, 30000);
}

export async function initDb(forceSync = false) {
  if (!supabase) {
    console.log("[DB] Supabase non disponible. Utilisation du mode LocalStorage uniquement.");
    isUsingRemote = false;
    return;
  }
  
  try {
    const { data: staffData, error: staffErr } = await supabase.from('staff').select('*');
    if (staffErr) throw staffErr;
    
    isUsingRemote = true;
    console.log("[DB] 🟢 Connecté avec succès à Supabase !");
    
    await syncOfflineQueue();
    
    if (staffData && staffData.length > 0) memoryDb.staff = staffData;
    
    const { data: custData } = await supabase.from('customers').select('*');
    if (custData && custData.length > 0) memoryDb.customers = custData;
    
    const { data: ordData } = await supabase.from('orders').select('*');
    if (ordData && ordData.length > 0) memoryDb.orders = ordData.map(hydrateOrder);
    
    const { data: logData } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(200);
    if (logData && logData.length > 0) memoryDb.logs = logData;
    
    const { data: catData } = await supabase.from('catalog').select('*');
    if (catData && catData.length > 0) {
      const merged = DEFAULT_CATALOG.map(defItem => {
        const remote = catData.find(r => r.id === defItem.id || (r.article === defItem.article && r.service === defItem.service));
        return remote ? { ...defItem, ...remote } : defItem;
      });
      catData.forEach(remoteItem => {
        const exists = merged.some(m => m.id === remoteItem.id);
        if (!exists) merged.push(remoteItem);
      });
      memoryDb.catalog = merged;
    }
    
    const { data: reqData } = await supabase.from('pin_reset_requests').select('*').order('created_at', { ascending: false });
    if (reqData && reqData.length > 0) memoryDb.pin_reset_requests = reqData;
    
    persist();
    notifyListeners();
  } catch (err) {
    console.warn("[DB] ⚠️ Impossible de joindre Supabase, bascule en local persistant. Erreur :", err.message);
    isUsingRemote = false;
    notifyListeners();
    startAutoReconnect();
  }
}

export async function refreshStaff() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('staff').select('*');
    if (!error && data && data.length > 0) {
      memoryDb.staff = data;
      persist();
      notifyListeners();
    }
  } catch (e) {
    console.error("Failed to refresh staff:", e);
  }
}

export async function testConnection() {
  if (!supabase) {
    return { success: false, error: "Client Supabase non initialisé (clés absentes ou incorrectes)." };
  }
  try {
    const { error } = await supabase.from('staff').select('id').limit(1);
    if (error) {
      return { success: false, error: error.message };
    }
    if (!isUsingRemote) {
      await initDb(true);
    }
    return { success: true, message: "Connexion établie avec succès avec le cloud Supabase !" };
  } catch (e) {
    return { success: false, error: e.message || "Erreur de connexion réseau." };
  }
}
