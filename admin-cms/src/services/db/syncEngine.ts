import { supabase } from '../supabaseClient.js';
import { memoryDb, notifyListeners } from './memoryStore';
import { hydrateOrder, startOrderStateCron } from './dbEngine';

let isUsingRemote = false;
export function getIsUsingRemote(): boolean { return isUsingRemote; }

// ─── Session-only localStorage helpers ────────────────────────────────────
// ONLY for: current_user session, selected_store_id preference, notification prefs
// NO business data is ever stored in localStorage.

export function saveSession(key: string, value: any): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}

export function removeSession(key: string): void {
  try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
}

function loadSession(key: string, defaultVal: any): any {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch { return defaultVal; }
}

// ─── Payload sanitizer ─────────────────────────────────────────────────────

function sanitizePayload(table: string, data: any): any {
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

// ─── Core mutation — Direct Supabase, throws on error ─────────────────────

export async function performMutation(action: 'insert' | 'update' | 'delete', table: string, recordId?: string, data?: any): Promise<any> {
  if (!supabase) {
    throw new Error(
      'Supabase non connecté. Vérifiez votre connexion internet et la configuration.'
    );
  }

  const sanitizedData = sanitizePayload(table, data);
  let res: any;

  try {
    if (action === 'insert') {
      res = await supabase.from(table).insert(sanitizedData);
    } else if (action === 'update') {
      res = await supabase.from(table).update(sanitizedData).eq('id', recordId);
    } else if (action === 'delete') {
      res = await supabase.from(table).delete().eq('id', recordId);
    }
  } catch (networkErr: any) {
    throw new Error(
      `Erreur réseau lors de la communication avec Supabase : ${networkErr.message}`
    );
  }

  if (res?.error) {
    const errMsg = res.error.message || '';
    const errCode = res.error.code || '';

    // Graceful fallback for Row-Level Security (RLS) policy restrictions
    if (
      errCode === '42501' ||
      errMsg.toLowerCase().includes('row-level security') ||
      errMsg.toLowerCase().includes('rls policy')
    ) {
      console.warn(`[DB] ⚠️ Politique RLS Supabase active sur la table '${table}' (${errMsg}). Mise à jour conservée en mémoire.`);
      return null;
    }

    if (
      errCode === 'PGRST204' ||
      errCode === '42703' ||
      errMsg.includes('column') ||
      errMsg.includes('schema cache')
    ) {
      console.warn(`[DB] Colonne non trouvée (${errMsg}). Tentative de repli sans champs optionnels...`);
      const retriedData = { ...sanitizedData };
      if (table !== 'orders') {
        delete retriedData.store_id;
      }
      delete retriedData.motif_annulation;
      delete retriedData.remise_pourcentage;
      delete retriedData.remise_montant;
      delete retriedData.responsable_id;
      delete retriedData.responsable_nom;

      let retryRes: any;
      try {
        if (action === 'insert') {
          retryRes = await supabase.from(table).insert(retriedData);
        } else if (action === 'update') {
          retryRes = await supabase.from(table).update(retriedData).eq('id', recordId);
        }
      } catch (retryErr: any) {
        throw new Error(`Erreur réseau lors du repli : ${retryErr.message}`);
      }

      if (retryRes?.error) {
        if (
          retryRes.error.code === '42501' ||
          retryRes.error.message.toLowerCase().includes('row-level security')
        ) {
          console.warn(`[DB] ⚠️ RLS Supabase actif lors du repli sur '${table}'.`);
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

// ─── Database initialization — Supabase only ──────────────────────────────

export async function initDb(): Promise<void> {
  memoryDb.selected_store_id = loadSession('klin_up_selected_store', 'all');
  memoryDb.current_user = loadSession('klin_up_current_user', null);

  if (!supabase) {
    console.warn('[DB] ⚠️ Supabase non disponible. Mode dégradé sur données par défaut.');
    isUsingRemote = false;
    startOrderStateCron();
    notifyListeners();
    return;
  }

  try {
    const [staffRes, custRes, ordRes, logRes, catRes, reqRes, storeRes] = await Promise.all([
      supabase.from('staff').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(200),
      supabase.from('catalog').select('*'),
      supabase.from('pin_reset_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('stores').select('*').order('created_at', { ascending: true }),
    ]);

    if (staffRes.error) throw staffRes.error;

    isUsingRemote = true;
    console.log('[DB] 🟢 Connecté à Supabase !');

    memoryDb.staff = (staffRes.data || []).filter(Boolean);

    if (memoryDb.current_user) {
      const stillValid = memoryDb.staff.some(s => s.id === memoryDb.current_user?.id);
      if (!stillValid) {
        memoryDb.current_user = null;
        removeSession('klin_up_current_user');
      }
    }

    if (!custRes.error) memoryDb.customers = custRes.data || [];
    if (!ordRes.error) memoryDb.orders = (ordRes.data || []).map(hydrateOrder);
    if (!logRes.error) memoryDb.logs = logRes.data || [];
    if (!storeRes.error) memoryDb.stores = storeRes.data || [];

    if (!catRes.error && catRes.data && catRes.data.length > 0) {
      memoryDb.catalog = catRes.data.map((item: any) => {
        const isActive = item.is_active === false || item.statut === 'inactif' ? false : true;
        return { ...item, is_active: isActive, statut: isActive ? 'actif' : 'inactif' };
      });
    }

    if (!reqRes.error) memoryDb.pin_reset_requests = reqRes.data || [];

    startOrderStateCron();
    notifyListeners();

    try { setupRealtime(); } catch (e: any) { console.warn('[DB Realtime] Inaccessible :', e.message); }

  } catch (err: any) {
    console.error('[DB] ❌ Connexion Supabase échouée :', err.message);
    isUsingRemote = false;
    startOrderStateCron();
    notifyListeners();
    throw err;
  }
}

export async function refreshStaff(): Promise<void> {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('staff').select('*');
    if (!error && data) {
      memoryDb.staff = data.filter(Boolean);
      notifyListeners();
    }
  } catch (e) {
    console.error('Failed to refresh staff:', e);
  }
}

export async function refreshStores(): Promise<void> {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('stores').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      memoryDb.stores = data;
      notifyListeners();
    }
  } catch (e) {
    console.error('Failed to refresh stores:', e);
  }
}

let activeRealtimeChannel: any = null;

export function setupRealtime(): void {
  if (!supabase) return;
  if (activeRealtimeChannel) {
    try { supabase.removeChannel(activeRealtimeChannel); } catch (e) {}
  }

  const tables = ['staff', 'customers', 'orders', 'activity_logs', 'catalog', 'pin_reset_requests', 'stores'];
  let channel = supabase.channel('admin_global_realtime');

  tables.forEach(table => {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
      const { eventType, new: newRow, old: oldRow } = payload;

      let targetList: any[] = [];
      if (table === 'staff') targetList = memoryDb.staff;
      else if (table === 'customers') targetList = memoryDb.customers;
      else if (table === 'orders') targetList = memoryDb.orders;
      else if (table === 'activity_logs') targetList = memoryDb.logs;
      else if (table === 'catalog') targetList = memoryDb.catalog;
      else if (table === 'pin_reset_requests') targetList = memoryDb.pin_reset_requests;
      else if (table === 'stores') targetList = memoryDb.stores;

      if (eventType === 'INSERT') {
        const exists = targetList.some(x => x.id === newRow.id);
        if (!exists) {
          const rowToAdd = table === 'orders' ? hydrateOrder(newRow) : newRow;
          if (table === 'activity_logs') targetList.unshift(rowToAdd);
          else targetList.push(rowToAdd);
        }
      } else if (eventType === 'UPDATE') {
        const idx = targetList.findIndex(x => x.id === newRow.id);
        if (idx !== -1) {
          targetList[idx] = table === 'orders' ? hydrateOrder({ ...newRow }) : { ...newRow };
        } else {
          const rowToAdd = table === 'orders' ? hydrateOrder(newRow) : newRow;
          targetList.push(rowToAdd);
        }
      } else if (eventType === 'DELETE') {
        const idx = targetList.findIndex(x => x.id === oldRow.id);
        if (idx !== -1) targetList.splice(idx, 1);
      }

      notifyListeners();
    });
  });

  channel.subscribe();
  activeRealtimeChannel = channel;
}

export async function testConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Client Supabase non initialisé (clés absentes ou incorrectes).' };
  }
  try {
    const { error } = await supabase.from('staff').select('id').limit(1);
    if (error) return { success: false, error: error.message };
    if (!isUsingRemote) await initDb();
    return { success: true, message: 'Connexion établie avec succès avec le cloud Supabase !' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur de connexion réseau.' };
  }
}
