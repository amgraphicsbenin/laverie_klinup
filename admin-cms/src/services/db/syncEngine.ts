import { supabase } from '../supabaseClient.js';
import { memoryDb, notifyListeners } from './memoryStore';
import { hydrateOrder, startOrderStateCron } from './dbEngine';

let isUsingRemote = false;
export function getIsUsingRemote(): boolean { return isUsingRemote; }

// ─── Session-only localStorage helpers ────────────────────────────────────
// ONLY for: current_user session, selected_store_id preference
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

// ─── Known columns to strip before sending to Supabase ─────────────────────
// These are fields used only in-memory and not yet in the DB schema.
const STRIP_FROM_ALL = ['est_en_retard'];
const STRIP_BY_TABLE: Record<string, string[]> = {
  orders: ['remise_pourcentage', 'remise_montant', 'prix_base_avant_remise',
           'motif_annulation', 'solde_paid_at', 'subscription_details',
           'reference_paiement', 'reference_momo', 'acompte_paid_at', 'is_subscription_order'],
  catalog: ['sku', 'prix_urgent', 'is_active'],
};

function sanitizePayload(table: string, data: any): any {
  if (!data) return data;
  const sanitized = { ...data };
  for (const col of STRIP_FROM_ALL) delete sanitized[col];
  for (const col of (STRIP_BY_TABLE[table] || [])) delete sanitized[col];
  return sanitized;
}

// ─── Core mutation — Supabase-STRICT, always throws on any error ─────────────
// Rule: If Supabase does not confirm success, throw.
// The caller (dbEngine) must NOT update memoryDb if this throws.

export async function performMutation(
  action: 'insert' | 'update' | 'delete',
  table: string,
  recordId?: string,
  data?: any
): Promise<any> {
  if (!supabase) {
    throw new Error(
      `[KLIN UP DB] Supabase non connecté. Vérifiez votre connexion internet et la configuration Supabase.`
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
      `[KLIN UP DB] Erreur réseau lors de la communication avec Supabase (table: ${table}) : ${networkErr.message}`
    );
  }

  if (!res?.error) {
    return res?.data ?? null;
  }

  // ── Error handling ───────────────────────────────────────────────────────
  const errCode = res.error.code || '';
  const errMsg = res.error.message || '';

  console.error(`[KLIN UP DB] ❌ Erreur Supabase sur table '${table}' [${action}] :`, errCode, errMsg);

  // Schema cache / missing column → iterative retry loop (up to 5 attempts)
  let currentErrCode = errCode;
  let currentErrMsg = errMsg;
  let retriedData: Record<string, any> = { ...sanitizedData };

  for (let attempt = 1; attempt <= 5; attempt++) {
    if (
      currentErrCode === 'PGRST204' ||
      currentErrCode === '42703' ||
      currentErrMsg.includes('column') ||
      currentErrMsg.includes('schema cache')
    ) {
      const match = currentErrMsg.match(/Could not find the '([^']+)' column/i)
                  || currentErrMsg.match(/column "([^"]+)"/i)
                  || currentErrMsg.match(/column '([^']+)'/i)
                  || currentErrMsg.match(/column ([a-z0-9_]+)/i);
      const missingCol = match?.[1];

      if (missingCol && Object.prototype.hasOwnProperty.call(retriedData, missingCol)) {
        console.warn(`[KLIN UP DB] ⚠️ Colonne '${missingCol}' absente du schéma Supabase — retrait (essai ${attempt}).`);
        delete retriedData[missingCol];
      } else {
        const optionalCols = ['ville', 'responsable_id', 'responsable_nom', 'created_by_id', 'created_by_name',
                              'push_token', 'push_token_updated_at', 'motif_annulation', 'solde_paid_at',
                              'reference_paiement', 'reference_momo', 'acompte_paid_at', 'operateur_momo'];
        for (const col of optionalCols) delete retriedData[col];
      }

      let retryRes: any;
      try {
        if (action === 'insert') retryRes = await supabase.from(table).insert(retriedData);
        else if (action === 'update') retryRes = await supabase.from(table).update(retriedData).eq('id', recordId);
        else if (action === 'delete') retryRes = await supabase.from(table).delete().eq('id', recordId);
      } catch (retryErr: any) {
        throw new Error(`[KLIN UP DB] Erreur réseau lors du repli (table: ${table}) : ${retryErr.message}`);
      }

      if (!retryRes?.error) {
        console.info(`[KLIN UP DB] ✅ Repli de schéma réussi pour table '${table}' après ${attempt} essai(s).`);
        return retryRes?.data ?? null;
      }

      currentErrCode = retryRes.error.code || '';
      currentErrMsg = retryRes.error.message || '';
    } else {
      break;
    }
  }

  throw new Error(
    `[KLIN UP DB] Échec persistant sur '${table}' même après repli de schéma. Erreur Supabase : ${currentErrMsg} (code: ${currentErrCode})`
  );

  // RLS or any other error → ALWAYS throw (never silently succeed)
  if (errCode === '42501' || errMsg.toLowerCase().includes('row-level security')) {
    throw new Error(
      `[KLIN UP DB] Accès refusé par Supabase (RLS) sur la table '${table}'. ` +
      `Exécutez le script de migration SQL dans Supabase pour activer les politiques d'accès. ` +
      `Détail : ${errMsg}`
    );
  }

  // Any other Supabase error → throw
  throw new Error(`[KLIN UP DB] Supabase a rejeté l'opération sur '${table}' : ${errMsg} (code: ${errCode})`);
}

// ─── Database initialization — Supabase-only ──────────────────────────────

export async function initDb(): Promise<void> {
  memoryDb.selected_store_id = loadSession('klin_up_selected_store', 'all');
  memoryDb.current_user = loadSession('klin_up_current_user', null);

  if (!supabase) {
    console.error('[KLIN UP DB] ❌ Supabase non configuré. Vérifiez les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
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

    if (staffRes.error) throw new Error(`Erreur chargement staff : ${staffRes.error.message}`);

    isUsingRemote = true;
    console.log('[KLIN UP DB] 🟢 Connecté à Supabase — mode données réelles activé.');

    memoryDb.staff = (staffRes.data || []).filter(Boolean);

    if (memoryDb.current_user) {
      const stillValid = memoryDb.staff.some(s => s.id === memoryDb.current_user?.id);
      if (!stillValid) {
        memoryDb.current_user = null;
        removeSession('klin_up_current_user');
      }
    }

    if (!custRes.error) memoryDb.customers = custRes.data || [];
    else console.warn('[KLIN UP DB] ⚠️ Chargement customers partiel :', custRes.error.message);

    if (!ordRes.error) memoryDb.orders = (ordRes.data || []).map(hydrateOrder);
    else console.warn('[KLIN UP DB] ⚠️ Chargement orders partiel :', ordRes.error.message);

    if (!logRes.error) {
      const staffList = memoryDb.staff || [];
      memoryDb.logs = (logRes.data || []).map((l: any) => {
        if (!l.user_name || l.user_name === 'NULL' || l.user_name === 'null') {
          const foundStaff = staffList.find((s: any) => s.id === l.user_id);
          return {
            ...l,
            user_name: foundStaff ? `${foundStaff.prenom} ${foundStaff.nom}` : (l.user_id === 'u_system' || !l.user_id ? 'Automate / Système' : 'Utilisateur Caisse')
          };
        }
        return l;
      });
    }
    if (!storeRes.error) memoryDb.stores = storeRes.data || [];
    else console.warn('[KLIN UP DB] ⚠️ Chargement stores partiel :', storeRes.error.message);

    if (!catRes.error && catRes.data && catRes.data.length > 0) {
      memoryDb.catalog = catRes.data.map((item: any) => {
        const isActive = item.is_active === false || item.statut === 'inactif' ? false : true;
        return { ...item, is_active: isActive, statut: isActive ? 'actif' : 'inactif' };
      });
    }

    if (!reqRes.error) memoryDb.pin_reset_requests = reqRes.data || [];

    startOrderStateCron();
    notifyListeners();

    try { setupRealtime(); } catch (e: any) { console.warn('[KLIN UP DB Realtime] Inaccessible :', e.message); }

  } catch (err: any) {
    console.error('[KLIN UP DB] ❌ Connexion Supabase échouée :', err.message);
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
    } else if (error) {
      console.error('[KLIN UP DB] Erreur refresh staff :', error.message);
    }
  } catch (e: any) {
    console.error('[KLIN UP DB] Erreur réseau refresh staff :', e.message);
  }
}

export async function refreshStores(): Promise<void> {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('stores').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      memoryDb.stores = data;
      notifyListeners();
    } else if (error) {
      console.error('[KLIN UP DB] Erreur refresh stores :', error.message);
    }
  } catch (e: any) {
    console.error('[KLIN UP DB] Erreur réseau refresh stores :', e.message);
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


