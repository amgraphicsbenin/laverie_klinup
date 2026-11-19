import {
  clearAuthenticatedSession,
  clearPinLockout,
  friendlyErrorMessage,
  getPinLockoutState,
  isValidEmail,
  isValidPinFormat,
  isWeakPin,
  PIN_SECURITY_CONFIG,
  recordFailedPinAttempt,
  restoreAuthenticatedSession,
  stripSensitiveUserFields,
  verifyPinHash
} from '../../utils/securityUtils.js';
import { supabase } from '../supabaseClient.js';
import { dbEngine, hydrateOrder, startOrderStateCron } from './dbEngine';
import { memoryDb, notifyListeners } from './memoryStore';

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
    'motif_annulation', 'solde_paid_at',
    'reference_paiement', 'reference_momo', 'acompte_paid_at', 'is_subscription_order'],
  catalog: ['sku', 'prix_urgent', 'is_active'],
  customers: ['coordonnees_livraison', 'rewards', 'latitude', 'longitude', 'quartier', 'ville'],
  activity_logs: ['store_id'],
};

// Cache mémoire des colonnes absentes du schéma Supabase distant
const knownMissingCols = new Set<string>();

function sanitizePayload(table: string, data: any): any {
  if (!data) return data;
  const sanitized = { ...data };
  for (const col of STRIP_FROM_ALL) delete sanitized[col];
  for (const col of (STRIP_BY_TABLE[table] || [])) delete sanitized[col];
  for (const key of Object.keys(sanitized)) {
    if (knownMissingCols.has(`${table}:${key}`)) {
      delete sanitized[key];
    }
  }
  return sanitized;
}

// ─── Core mutation — Supabase-STRICT, always throws on any error ─────────────
// Rule: If Supabase does not confirm success, throw.
// The caller (dbEngine) must NOT update memoryDb if this throws.

export async function performMutation(
  action: 'insert' | 'update' | 'delete' | 'upsert',
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
    } else if (action === 'upsert') {
      res = await supabase.from(table).upsert(sanitizedData, { onConflict: 'id' });
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

  // Schema cache / missing column → iterative retry loop
  let currentErrCode = errCode;
  let currentErrMsg = errMsg;
  let retriedData: Record<string, any> = { ...sanitizedData };

  const maxAttempts = Math.min(Math.max(Object.keys(retriedData).length + 2, 10), 25);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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

      if (missingCol) {
        knownMissingCols.add(`${table}:${missingCol}`);
        delete retriedData[missingCol];
        console.warn(`[KLIN UP DB] ⚠️ Colonne '${missingCol}' absente du schéma Supabase — retrait (essai ${attempt}).`);
      } else {
        const optionalCols = ['ville', 'responsable_id', 'responsable_nom', 'created_by_id', 'created_by_name',
          'push_token', 'push_token_updated_at', 'motif_annulation', 'solde_paid_at',
          'reference_paiement', 'reference_momo', 'acompte_paid_at', 'operateur_momo',
          'cree_par_livreur', 'validee_par_caisse', 'created_by_role', 'validated_by_id', 'validated_by_name', 'validated_at'];
        for (const col of optionalCols) {
          knownMissingCols.add(`${table}:${col}`);
          delete retriedData[col];
        }
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

// ─── Database initialization & Authenticated Data Isolation ────────────────

let hasLoadedBusinessData = false;

export function wipeSensitiveMemoryData(): void {
  hasLoadedBusinessData = false;
  memoryDb.staff = [];
  memoryDb.customers = [];
  memoryDb.orders = [];
  memoryDb.logs = [];
  memoryDb.pin_reset_requests = [];
  memoryDb.reward_point_adjustments = [];
  memoryDb.expenses = [];
  memoryDb.support_tickets = [];
  if (activeRealtimeChannel && supabase) {
    try { supabase.removeChannel(activeRealtimeChannel); } catch (_) { }
    activeRealtimeChannel = null;
  }
}

export async function loadAuthenticatedBusinessData(): Promise<void> {
  if (!supabase || !memoryDb.current_user) return;
  try {
    const isSuperAdmin = memoryDb.current_user.role === 'super_admin';
    const [staffRes, custRes, ordRes, logRes, catRes, reqRes, storeRes, rewardRes] = await Promise.all([
      supabase.from('staff').select(
        isSuperAdmin
          ? '*'
          : 'id,nom,prenom,email,role,user_picture,statut,telephone,store_id,permissions,created_at'
      ),
      supabase.from('customers').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(200),
      supabase.from('catalog').select('*'),
      supabase.from('pin_reset_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('stores').select('*').order('created_at', { ascending: true }),
      supabase.from('rewards').select('*').order('created_at', { ascending: true }),
      supabase.from('delivery_zones').select('*').order('min_km', { ascending: true }),
    ]);

    if (staffRes.error) throw new Error(`Erreur chargement staff : ${staffRes.error.message}`);

    isUsingRemote = true;
    hasLoadedBusinessData = true;
    console.log('[KLIN UP DB] 🟢 Données métier chargées après authentification.');

    memoryDb.staff = (staffRes.data || []).filter(Boolean).map((s: any) =>
      isSuperAdmin ? s : stripSensitiveUserFields(s)
    );

    if (memoryDb.current_user) {
      const matched = memoryDb.staff.find(s => s.id === memoryDb.current_user?.id);
      if (!matched || matched.statut === 'suspendu') {
        memoryDb.current_user = null;
        clearAuthenticatedSession();
        wipeSensitiveMemoryData();
        notifyListeners();
        return;
      }
      memoryDb.current_user = stripSensitiveUserFields(matched);
    }

    if (!custRes.error) memoryDb.customers = custRes.data || [];
    else console.warn('[KLIN UP DB] ⚠️ Chargement customers partiel :', custRes.error.message);

    if (!ordRes.error) {
      const loadedOrders = (ordRes.data || []).map(hydrateOrder);
      // Tri chronologique rigoureux selon la date de création
      loadedOrders.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

      // Vérifier si des commandes comportent encore des identifiants non strictement numériques
      const hasLegacyOrderIds = loadedOrders.some(o => !/^\d+$/.test(String(o.id).trim()));
      if (hasLegacyOrderIds) {
        console.log('[KLIN UP DB] 🔄 Réalignement séquentiel strict des commandes (1..N selon ordre de création)...');
        // Réalignement immédiat en mémoire selon l'ordre chronologique
        for (let i = 0; i < loadedOrders.length; i++) {
          const seqId = String(i + 1);
          const oldId = String(loadedOrders[i].id);
          loadedOrders[i].id = seqId;
          loadedOrders[i].identifiant_unique_marquage = seqId;

          if (oldId !== seqId) {
            setTimeout(async () => {
              try {
                await supabase.from('order_notifications').update({ order_id: seqId }).eq('order_id', oldId);
                await supabase.from('orders').update({ id: seqId, identifiant_unique_marquage: seqId }).eq('id', oldId);
              } catch (e) {
                console.warn(`[KLIN UP DB] Synchronisation distante ID commande ${oldId} -> ${seqId} :`, e);
              }
            }, i * 60);
          }
        }
      }

      memoryDb.orders = loadedOrders;
    } else {
      console.warn('[KLIN UP DB] ⚠️ Chargement orders partiel :', ordRes.error.message);
    }

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

    if (!catRes.error) {
      memoryDb.catalog = (catRes.data || []).map((item: any) => {
        const isActive = item.is_active === false || item.statut === 'inactif' ? false : true;
        return { ...item, is_active: isActive, statut: isActive ? 'actif' : 'inactif' };
      });
      sanitizeCatalogIds();
    } else {
      console.warn('[KLIN UP DB] ⚠️ Chargement catalog partiel :', catRes.error.message);
    }

    if (!rewardRes.error && rewardRes.data) {
      memoryDb.rewards = rewardRes.data;
    }

    const deliveryRes = Promise.allSettled ? (await Promise.allSettled([supabase.from('delivery_zones').select('*')])) : null;
    try {
      const { data: dData, error: dErr } = await supabase.from('delivery_zones').select('*').order('min_km', { ascending: true });
      if (!dErr && dData) {
        memoryDb.delivery_zones = dData;
      }
    } catch (e) {
      // Ignorer si la table n'existe pas encore
    }

    try {
      let tableAdjs: any[] = [];
      try {
        const { data: adjData, error: adjErr } = await supabase
          .from('reward_point_adjustments')
          .select('*')
          .order('created_at', { ascending: false });
        if (!adjErr && adjData) {
          tableAdjs = adjData;
        }
      } catch (_) { }

      let logAdjs: any[] = [];
      try {
        const { data: adjLogs, error: logAdjErr } = await supabase
          .from('activity_logs')
          .select('*')
          .in('action', ['REWARD_ADJ_REQ', 'REWARD_ADJ_DECISION'])
          .order('timestamp', { ascending: true });
        if (!logAdjErr && adjLogs) {
          logAdjs = adjLogs;
        }
      } catch (_) { }

      const mergedMap = new Map<string, any>();
      logAdjs.forEach((l: any) => {
        if (l.action === 'REWARD_ADJ_REQ' && l.details) {
          try {
            const parsed = JSON.parse(l.details);
            if (parsed?.id) mergedMap.set(parsed.id, parsed);
          } catch (_) { }
        }
      });
      logAdjs.forEach((l: any) => {
        if (l.action === 'REWARD_ADJ_DECISION' && l.details) {
          try {
            const dec = JSON.parse(l.details);
            if (dec?.id && mergedMap.has(dec.id)) {
              mergedMap.set(dec.id, { ...mergedMap.get(dec.id), ...dec });
            }
          } catch (_) { }
        }
      });
      tableAdjs.forEach((row: any) => {
        const prev = mergedMap.get(row.id);
        mergedMap.set(row.id, prev && row.status === 'pending' && prev.status !== 'pending' ? prev : row);
      });
      memoryDb.reward_point_adjustments = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    } catch (e) {
      // Fallback silencieux
    }

    try {
      const { data: pData, error: pErr } = await supabase.from('pickup_zones').select('*').order('min_km', { ascending: true });
      if (!pErr && pData) {
        memoryDb.pickup_zones = pData;
      }
    } catch (e) {
      // Ignorer si la table n'existe pas encore
    }

    try {
      const { data: tData, error: tErr } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (!tErr && tData) {
        memoryDb.support_tickets = tData;
      }
    } catch (e) {
      // Ignorer si la table n'existe pas encore
    }

    try {
      const { data: expData, error: expErr } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (!expErr && expData) {
        memoryDb.expenses = expData;
      }
    } catch (e) {
      // Ignorer si la table n'existe pas encore
    }

    try {
      const { data: trkData, error: trkErr } = await supabase
        .from('order_tracking_sessions')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      if (!trkErr && trkData) {
        memoryDb.order_tracking_sessions = trkData;
      }
    } catch (e) {
      // Ignorer si la table n'existe pas encore
    }

    try {
      const { data: rData, error: rErr } = await supabase.from('roles').select('*').order('created_at', { ascending: true });
      if (!rErr) {
        memoryDb.roles = (rData || []).map((r: any) => ({
          ...r,
          shortLabel: r.short_label || r.shortLabel || r.label,
          isSystem: r.is_system !== undefined ? r.is_system : (r.isSystem !== undefined ? r.isSystem : false)
        }));
      } else {
        console.warn('[KLIN UP DB] ⚠️ Chargement roles partiel :', rErr.message);
      }
    } catch (e: any) {
      console.warn('[KLIN UP DB] ⚠️ Erreur récupération roles :', e.message);
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

export async function initDb(): Promise<{ lockedUser: any | null; isLocked: boolean }> {
  memoryDb.selected_store_id = loadSession('klin_up_selected_store', 'all');
  const storedSettings = loadSession('klin_up_settings', null);
  if (storedSettings) {
    memoryDb.settings = { ...memoryDb.settings, ...storedSettings };
  }

  // Restauration sécurisée de la session signée (TTL 12h + Auto-Lock)
  const restored = restoreAuthenticatedSession();
  memoryDb.current_user = (!restored.locked && restored.user) ? restored.user : null;

  if (!supabase) {
    console.error('[KLIN UP DB] ❌ Supabase non configuré. Vérifiez les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
    isUsingRemote = false;
    notifyListeners();
    return { lockedUser: restored.locked ? restored.user : null, isLocked: restored.locked };
  }

  try {
    // Vérification légère de connectivité sans télécharger les tables sensibles avant login
    const { data: storeData, error: storeErr } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: true });

    if (storeErr) {
      throw new Error(friendlyErrorMessage(storeErr, 'Impossible de joindre le serveur Supabase.'));
    }

    isUsingRemote = true;
    memoryDb.stores = storeData || [];

    if (memoryDb.current_user && !restored.locked) {
      await loadAuthenticatedBusinessData();
    } else {
      wipeSensitiveMemoryData();
      notifyListeners();
    }

    return {
      lockedUser: restored.locked ? restored.user : null,
      isLocked: restored.locked
    };
  } catch (err: any) {
    console.error('[KLIN UP DB] ❌ Initialisation Supabase échouée :', err.message);
    isUsingRemote = false;
    notifyListeners();
    throw new Error(friendlyErrorMessage(err, 'Impossible de joindre le serveur Supabase.'));
  }
}

/**
 * Étape 1 Auth : Recherche ciblée par email (sans jamais exposer `code_pin`)
 */
export async function lookupStaffForLogin(email: string): Promise<any> {
  if (!supabase) {
    throw new Error('Serveur Supabase non initialisé.');
  }
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Veuillez entrer une adresse email valide.');
  }

  // 1. Priorité à la RPC SECURITY DEFINER (ne retourne jamais code_pin)
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('lookup_staff_login', { p_email: cleanEmail });
    if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
      const candidate = stripSensitiveUserFields(rpcData[0]);
      if (candidate?.statut === 'suspendu') {
        throw new Error('Votre compte a été suspendu par un administrateur.');
      }
      return candidate;
    }
  } catch (e: any) {
    if (e?.message?.includes('suspendu')) throw e;
  }

  // 2. Repli ciblé sur `staff` (projection explicite sans `code_pin`)
  const { data, error } = await supabase
    .from('staff')
    .select('id,nom,prenom,email,role,user_picture,statut,telephone,store_id,permissions,created_at')
    .ilike('email', cleanEmail)
    .limit(5);

  if (error) {
    throw new Error(friendlyErrorMessage(error, 'Erreur lors de la vérification du compte.'));
  }

  const matched = (data || []).find(
    (s: any) => s?.email && s.email.trim().toLowerCase() === cleanEmail
  );

  if (!matched) {
    throw new Error('Aucun employé trouvé avec cette adresse email.');
  }
  if (matched.statut === 'suspendu' || matched.statut === 'inactif') {
    throw new Error('Votre compte a été suspendu par un administrateur.');
  }

  return stripSensitiveUserFields(matched);
}

/**
 * Étape 2 Auth : Vérification atomique du PIN (RPC serveur ou temps constant + anti-bruteforce)
 */
export async function authenticateStaffPin(
  user: any,
  pin: string
): Promise<{ user: any; weakPinWarning: boolean }> {
  if (!supabase) {
    throw new Error('Serveur Supabase non initialisé.');
  }
  const cleanPin = String(pin || '').trim();
  if (!isValidPinFormat(cleanPin)) {
    throw new Error('Le code PIN doit comporter exactement 6 chiffres.');
  }
  const accountKey = user?.id || user?.email;
  const lockState = getPinLockoutState(accountKey);
  if (lockState.isLocked) {
    const err: any = new Error(`Compte temporairement bloqué. Réessayez dans ${lockState.remainingSeconds}s.`);
    err.lockoutState = lockState;
    throw err;
  }

  // 1. Tentative via RPC serveur `authenticate_staff_pin`
  try {
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('authenticate_staff_pin', {
      p_staff_id: user.id,
      p_pin: cleanPin
    });

    if (!rpcErr && rpcRes && typeof rpcRes === 'object') {
      if (rpcRes.authenticated) {
        clearPinLockout(accountKey);
        const verifiedUser = stripSensitiveUserFields(rpcRes.user || user);
        dbEngine.setCurrentUser(verifiedUser);
        await loadAuthenticatedBusinessData();
        return { user: verifiedUser, weakPinWarning: isWeakPin(cleanPin) };
      }

      if (rpcRes.error_code === 'ACCOUNT_LOCKED') {
        const lockRes = recordFailedPinAttempt(accountKey);
        try {
          dbEngine.logAction?.('BLOCAGE_SECURITE_PIN', `Verrouillage serveur après échecs PIN (${user.prenom || ''} ${user.nom || ''})`);
        } catch (_) { }
        const err: any = new Error(rpcRes.message || 'Compte temporairement verrouillé.');
        err.lockoutState = { ...lockRes, isLocked: true, remainingSeconds: rpcRes.remaining_seconds || 900 };
        throw err;
      }

      if (rpcRes.error_code === 'PIN_NOT_CONFIGURED') {
        throw new Error('Aucun code PIN n’est configuré pour ce compte. Contactez l’administrateur.');
      }

      if (rpcRes.error_code === 'INVALID_PIN') {
        const lockRes = recordFailedPinAttempt(accountKey);
        try {
          dbEngine.logAction?.(
            lockRes.isLocked ? 'BLOCAGE_SECURITE_PIN' : 'ALERTE_PIN_INCORRECT',
            `Échec PIN pour ${user.prenom || ''} ${user.nom || ''} (${user.email || ''})`
          );
        } catch (_) { }
        const err: any = new Error('Code PIN incorrect');
        err.lockoutState = lockRes;
        throw err;
      }
    }
  } catch (e: any) {
    if (e?.lockoutState || e?.message?.includes('configuré')) throw e;
    // Sinon RPC non encore déployée -> repli ci-dessous
  }

  // 2. Repli ciblé en temps constant (sans téléchargement massif ni PIN par défaut "000000")
  const { data: freshRows, error: fetchErr } = await supabase
    .from('staff')
    .select('id,nom,prenom,email,role,user_picture,statut,telephone,store_id,permissions,code_pin')
    .eq('id', user.id)
    .limit(1);

  if (fetchErr) {
    throw new Error(friendlyErrorMessage(fetchErr, 'Impossible de vérifier votre identité.'));
  }

  const freshStaff = freshRows?.[0];
  if (!freshStaff || freshStaff.statut === 'suspendu' || freshStaff.statut === 'inactif') {
    throw new Error('Ce compte est introuvable ou suspendu.');
  }

  const cleanStored = String(freshStaff.code_pin || '').trim();
  if (cleanStored.length < 4) {
    throw new Error('Aucun code PIN sécurisé n’est configuré pour ce compte.');
  }

  const pinOk = await verifyPinHash(cleanPin, cleanStored, freshStaff.id);
  if (pinOk) {
    clearPinLockout(accountKey);
    const sanitized = stripSensitiveUserFields(freshStaff);
    dbEngine.setCurrentUser(sanitized);
    await loadAuthenticatedBusinessData();
    return { user: sanitized, weakPinWarning: isWeakPin(cleanPin) };
  }

  const lockRes = recordFailedPinAttempt(accountKey);
  if (lockRes.isLocked) {
    try {
      dbEngine.logAction?.(
        'BLOCAGE_SECURITE_PIN',
        `Compte ${freshStaff.prenom} ${freshStaff.nom} (${freshStaff.email}) bloqué temporairement pour ${lockRes.remainingSeconds}s après ${lockRes.failedAttempts} tentatives.`
      );
    } catch (_) { }
  } else if (lockRes.failedAttempts >= PIN_SECURITY_CONFIG.WARNING_THRESHOLD) {
    try {
      dbEngine.logAction?.(
        'ALERTE_PIN_INCORRECT',
        `Alerte sécurité : ${lockRes.failedAttempts}/5 tentatives échouées pour ${freshStaff.prenom} ${freshStaff.nom} (${freshStaff.email}).`
      );
    } catch (_) { }
  }

  const err: any = new Error('Code PIN incorrect');
  err.lockoutState = lockRes;
  throw err;
}

export async function refreshStaff(): Promise<void> {
  if (!supabase || !memoryDb.current_user) return;
  try {
    const isSuperAdmin = memoryDb.current_user.role === 'super_admin';
    const { data, error } = await supabase
      .from('staff')
      .select(isSuperAdmin ? '*' : 'id,nom,prenom,email,role,user_picture,statut,telephone,store_id,permissions,created_at');
    if (!error && data) {
      memoryDb.staff = data.filter(Boolean).map((s: any) =>
        isSuperAdmin ? s : stripSensitiveUserFields(s)
      );
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
    try { supabase.removeChannel(activeRealtimeChannel); } catch (e) { }
  }

  const tables = ['staff', 'customers', 'orders', 'activity_logs', 'catalog', 'pin_reset_requests', 'stores', 'roles', 'reward_point_adjustments', 'expenses', 'order_tracking_sessions'];
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
      else if (table === 'roles') targetList = memoryDb.roles;
      else if (table === 'order_tracking_sessions') {
        if (!memoryDb.order_tracking_sessions) memoryDb.order_tracking_sessions = [];
        targetList = memoryDb.order_tracking_sessions;
      }
      else if (table === 'reward_point_adjustments') {
        if (!memoryDb.reward_point_adjustments) memoryDb.reward_point_adjustments = [];
        targetList = memoryDb.reward_point_adjustments;
      } else if (table === 'expenses') {
        if (!memoryDb.expenses) memoryDb.expenses = [];
        targetList = memoryDb.expenses;
      }

      const formatRow = (r: any) => {
        if (table === 'orders') return hydrateOrder(r);
        if (table === 'roles') {
          return {
            ...r,
            shortLabel: r.short_label || r.shortLabel || r.label,
            isSystem: r.is_system !== undefined ? r.is_system : (r.isSystem !== undefined ? r.isSystem : false)
          };
        }
        return r;
      };

      if (eventType === 'INSERT') {
        const exists = targetList.some(x => x.id === newRow.id);
        if (!exists) {
          const rowToAdd = formatRow(newRow);
          if (table === 'activity_logs') {
            targetList.unshift(rowToAdd);
            if (!memoryDb.reward_point_adjustments) memoryDb.reward_point_adjustments = [];
            if (newRow.action === 'REWARD_ADJ_REQ' && newRow.details) {
              try {
                const parsed = JSON.parse(newRow.details);
                if (parsed?.id && !memoryDb.reward_point_adjustments.some(a => a.id === parsed.id)) {
                  memoryDb.reward_point_adjustments.unshift(parsed);
                }
              } catch (_) { }
            } else if (newRow.action === 'REWARD_ADJ_DECISION' && newRow.details) {
              try {
                const dec = JSON.parse(newRow.details);
                const idx = memoryDb.reward_point_adjustments.findIndex(a => a.id === dec?.id);
                if (idx !== -1) {
                  memoryDb.reward_point_adjustments[idx] = { ...memoryDb.reward_point_adjustments[idx], ...dec };
                }
              } catch (_) { }
            }
          } else {
            targetList.push(rowToAdd);
          }
        }
      } else if (eventType === 'UPDATE') {
        const idx = targetList.findIndex(x => x.id === newRow.id);
        if (idx !== -1) {
          targetList[idx] = formatRow({ ...newRow });
        } else {
          const rowToAdd = formatRow(newRow);
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

export function sanitizeCatalogIds(): void {
  if (!memoryDb.catalog || memoryDb.catalog.length === 0) return;

  const realItems = memoryDb.catalog.filter(c => {
    if (!c || !c.article) return false;
    const cat = (c.categorie || (c.service === 'abonnement' ? 'abonnement' : 'individuel')).toLowerCase().trim();
    if (cat !== 'individuel' && cat !== 'abonnement') return false;
    if (c.service === 'system_setting' || c.service === 'reward_catalog') return false;
    return true;
  });

  const used = new Set<number>();
  let maxValid = 0;

  // 1. Recenser les IDs valides (entiers positifs <= 500)
  realItems.forEach(c => {
    const rawId = String(c.id || '').trim();
    const isPure = /^\d+$/.test(rawId);
    if (isPure) {
      const n = parseInt(rawId, 10);
      if (!isNaN(n) && n > 0 && n <= 500) {
        used.add(n);
        if (n > maxValid) maxValid = n;
      }
    }
  });

  // 2. Corriger toute anomalie (> 500)
  let nextSeq = 1;
  realItems.forEach(c => {
    const rawId = String(c.id || '').trim();
    const isPure = /^\d+$/.test(rawId);
    const n = isPure ? parseInt(rawId, 10) : 0;

    if (isPure && n > 500) {
      while (used.has(nextSeq)) nextSeq++;
      const oldId = c.id;
      const newId = String(nextSeq);
      c.id = newId;
      used.add(nextSeq);
      console.log(`[KLIN UP DB] 🔄 ID catalogue anormal corrigé : ${oldId} -> ${newId} (${c.article})`);
      if (supabase && isUsingRemote) {
        supabase.from('catalog').update({ id: newId }).eq('id', oldId).catch(() => { });
      }
    }
  });
}



