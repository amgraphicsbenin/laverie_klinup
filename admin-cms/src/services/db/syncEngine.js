import { supabase } from '../supabaseClient.js';
import { STORAGE_KEYS, DEFAULT_STAFF, DEFAULT_CUSTOMERS, DEFAULT_ORDERS, DEFAULT_LOGS, DEFAULT_CATALOG, DEFAULT_STORES, DEFAULT_ROLES } from './seeds.js';
import { memoryDb, notifyListeners } from './memoryStore.js';
import { hydrateOrder, startOrderStateCron } from './dbEngine.js';

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
      const hasZeroPriceClothes = parsed.some(item => item.categorie === 'individuel' && (!item.prix || Number(item.prix) === 0));
      const hasMissingActiveKeys = parsed.some(item => item.categorie === 'individuel' && item.is_active === undefined && item.statut === 'inactif');
      const needsMigration = parsed.length < defaultData.length || !parsed[0].hasOwnProperty('categorie') || hasZeroPriceClothes || hasMissingActiveKeys;
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
  memoryDb.stores = loadData(STORAGE_KEYS.STORES, DEFAULT_STORES);
  memoryDb.selected_store_id = loadData(STORAGE_KEYS.SELECTED_STORE, 'all');
  memoryDb.roles = loadData(STORAGE_KEYS.ROLES, DEFAULT_ROLES);
  
  const rawStaff = loadData(STORAGE_KEYS.STAFF, DEFAULT_STAFF);
  const validStaff = Array.isArray(rawStaff) && rawStaff.length > 0 ? rawStaff : [...DEFAULT_STAFF];
  memoryDb.staff = validStaff;

  memoryDb.customers = loadData(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
  const loadedOrders = loadData(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  memoryDb.orders = (loadedOrders || []).map(hydrateOrder);
  memoryDb.logs = loadData(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
  
  // Clear any legacy local storage cache key for catalog to enforce direct DB querying
  try {
    localStorage.removeItem(STORAGE_KEYS.CATALOG);
  } catch (e) {}

  // Direct in-memory catalog initialization (no local storage caching)
  memoryDb.catalog = DEFAULT_CATALOG;
  
  const currentUser = loadData(STORAGE_KEYS.CURRENT_USER, null);
  // Ensure current user is valid, otherwise default to super admin Koutomi André
  if (!currentUser || (currentUser.email !== 'andre.koutomi98@gmail.com' && !validStaff.some(s => s.id === currentUser.id))) {
    memoryDb.current_user = DEFAULT_STAFF[0];
  } else {
    memoryDb.current_user = currentUser;
  }
  
  memoryDb.pin_reset_requests = loadData('klin_up_pin_reset_requests', []);
  memoryDb.settings = loadData('klin_up_app_settings', {
    express_hours: 6,
    express_markup: 50,
    normal_hours: 48,
    receipt_header: "KLIN UP - Laverie & Pressing Premium",
    receipt_footer: "Merci de votre confiance ! A bientot chez KLIN UP."
  });
  memoryDb.cash_closures = loadData('klin_up_cash_closures', []);
  memoryDb.debt_payments = loadData('klin_up_debt_payments', []);

  startOrderStateCron();
  notifyListeners();
}

export function persist() {
  saveData(STORAGE_KEYS.STORES, memoryDb.stores);
  saveData(STORAGE_KEYS.SELECTED_STORE, memoryDb.selected_store_id);
  saveData(STORAGE_KEYS.ROLES, memoryDb.roles);
  saveData(STORAGE_KEYS.STAFF, memoryDb.staff);
  saveData(STORAGE_KEYS.CUSTOMERS, memoryDb.customers);
  saveData(STORAGE_KEYS.ORDERS, memoryDb.orders);
  saveData(STORAGE_KEYS.LOGS, memoryDb.logs);
  // Catalog is NOT stored locally (direct DB query mode)
  saveData(STORAGE_KEYS.CURRENT_USER, memoryDb.current_user);
  saveData('klin_up_pin_reset_requests', memoryDb.pin_reset_requests);
  saveData('klin_up_app_settings', memoryDb.settings);
  saveData('klin_up_cash_closures', memoryDb.cash_closures);
  saveData('klin_up_debt_payments', memoryDb.debt_payments);
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
    
    // Merge remote staff with local memoryDb.staff so locally created staff accounts are never wiped out on reload
    if (staffData) {
      const mergedStaff = [...(staffData || [])];
      (memoryDb.staff || []).forEach(localItem => {
        if (localItem && localItem.id && !mergedStaff.some(r => r.id === localItem.id)) {
          mergedStaff.push(localItem);
        }
      });
      memoryDb.staff = mergedStaff;
    }
    
    const { data: custData, error: custErr } = await supabase.from('customers').select('*');
    if (!custErr) memoryDb.customers = custData || [];
    
    const { data: ordData, error: ordErr } = await supabase.from('orders').select('*');
    if (!ordErr) memoryDb.orders = (ordData || []).map(hydrateOrder);
    
    const { data: logData, error: logErr } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(200);
    if (!logErr) memoryDb.logs = logData || [];
    
    const { data: catData } = await supabase.from('catalog').select('*');
    if (catData && catData.length > 0) {
      const merged = DEFAULT_CATALOG.map(defItem => {
        const remote = catData.find(r => 
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
      catData.forEach(remoteItem => {
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
    
    const { data: reqData, error: reqErr } = await supabase.from('pin_reset_requests').select('*').order('created_at', { ascending: false });
    if (!reqErr) memoryDb.pin_reset_requests = reqData || [];
    
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
    if (!error && data) {
      const mergedStaff = [...(data || [])];
      (memoryDb.staff || []).forEach(localItem => {
        if (localItem && localItem.id && !mergedStaff.some(r => r.id === localItem.id)) {
          mergedStaff.push(localItem);
        }
      });
      memoryDb.staff = mergedStaff;
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
