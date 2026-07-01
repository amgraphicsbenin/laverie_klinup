import { supabase } from './supabaseClient';

const STORAGE_KEYS = {
  STAFF: 'klin_up_staff_profiles',
  CUSTOMERS: 'klin_up_customers',
  ORDERS: 'klin_up_orders',
  LOGS: 'klin_up_activity_logs',
  CATALOG: 'klin_up_catalog',
  CURRENT_USER: 'klin_up_current_user'
};

// --- DONNÉES PAR DÉFAUT (SEEDS) ---
const DEFAULT_STAFF = [
  { id: 'u1', nom: 'Gomez', prenom: 'Jean-Luc', role: 'super_admin', email: 'jean-luc.gomez@klinup.com', code_pin: '111111', created_at: new Date().toISOString() },
  { id: 'u2', nom: 'Koffi', prenom: 'Marie-Antoinette', role: 'manager', email: 'marie.koffi@klinup.com', code_pin: '222222', created_at: new Date().toISOString() },
  { id: 'u3', nom: 'Diallo', prenom: 'Pierre', role: 'agent_accueil', email: 'pierre.diallo@klinup.com', code_pin: '333333', created_at: new Date().toISOString() },
  { id: 'u4', nom: 'Koutomi', prenom: 'André', role: 'super_admin', email: 'andre.koutomi98@gmail.com', code_pin: '000000', created_at: new Date().toISOString() }
];

const DEFAULT_CUSTOMERS = [];
const DEFAULT_ORDERS = [];
const DEFAULT_LOGS = [];

const DEFAULT_CATALOG = [
  { id: 'cat1', article: 'Chemise', service: 'lavage_simple', prix: 1500, categorie: 'individuel' },
  { id: 'cat2', article: 'Chemise', service: 'nettoyage_a_sec', prix: 3000, categorie: 'individuel' },
  { id: 'cat3', article: 'Chemise', service: 'repassage', prix: 1000, categorie: 'individuel' },
  { id: 'cat4', article: 'Pantalon', service: 'lavage_simple', prix: 2000, categorie: 'individuel' },
  { id: 'cat5', article: 'Pantalon', service: 'nettoyage_a_sec', prix: 3500, categorie: 'individuel' },
  { id: 'cat6', article: 'Pantalon', service: 'repassage', prix: 1200, categorie: 'individuel' },
  { id: 'cat7', article: 'Robe', service: 'lavage_simple', prix: 2500, categorie: 'individuel' },
  { id: 'cat8', article: 'Robe', service: 'nettoyage_a_sec', prix: 4500, categorie: 'individuel' },
  { id: 'cat9', article: 'Robe', service: 'repassage', prix: 1500, categorie: 'individuel' },
  { id: 'cat10', article: 'Combinaison', service: 'lavage_simple', prix: 3000, categorie: 'individuel' },
  { id: 'cat11', article: 'Combinaison', service: 'nettoyage_a_sec', prix: 5000, categorie: 'individuel' },
  { id: 'cat12', article: 'Combinaison', service: 'repassage', prix: 1800, categorie: 'individuel' },

  // Jupe (Default 0)
  { id: 'cat_jupe_ls', article: 'Jupe', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_jupe_nas', article: 'Jupe', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_jupe_rep', article: 'Jupe', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Pull (Default 0)
  { id: 'cat_pull_ls', article: 'Pull', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_pull_nas', article: 'Pull', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_pull_rep', article: 'Pull', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Culotte (Default 0)
  { id: 'cat_culotte_ls', article: 'Culotte', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_culotte_nas', article: 'Culotte', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_culotte_rep', article: 'Culotte', service: 'repassage', prix: 0, categorie: 'individuel' },

  // T-shirt (Default 0)
  { id: 'cat_tshirt_ls', article: 'T-shirt', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_tshirt_nas', article: 'T-shirt', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_tshirt_rep', article: 'T-shirt', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Polo (Default 0)
  { id: 'cat_polo_ls', article: 'Polo', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_polo_nas', article: 'Polo', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_polo_rep', article: 'Polo', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Blouson (Default 0)
  { id: 'cat_blouson_ls', article: 'Blouson', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_blouson_nas', article: 'Blouson', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_blouson_rep', article: 'Blouson', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Veste (Default 0)
  { id: 'cat_veste_ls', article: 'Veste', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_veste_nas', article: 'Veste', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_veste_rep', article: 'Veste', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Costume (Default 0)
  { id: 'cat_costume_ls', article: 'Costume', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_costume_nas', article: 'Costume', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_costume_rep', article: 'Costume', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Cravate (Default 0)
  { id: 'cat_cravate_ls', article: 'Cravate', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_cravate_nas', article: 'Cravate', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_cravate_rep', article: 'Cravate', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Haut (Default 0)
  { id: 'cat_haut_ls', article: 'Haut', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_haut_nas', article: 'Haut', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_haut_rep', article: 'Haut', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Débardeur (Default 0)
  { id: 'cat_debardeur_ls', article: 'Débardeur', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_debardeur_nas', article: 'Débardeur', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_debardeur_rep', article: 'Débardeur', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Jeans (Default 0)
  { id: 'cat_jeans_ls', article: 'Jeans', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_jeans_nas', article: 'Jeans', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_jeans_rep', article: 'Jeans', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Robe de mariée (Default 0)
  { id: 'cat_robemariee_ls', article: 'Robe de mariée', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_robemariee_nas', article: 'Robe de mariée', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_robemariee_rep', article: 'Robe de mariée', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Couette Legée (Default 0)
  { id: 'cat_couettelegee_ls', article: 'Couette Legée', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_couettelegee_nas', article: 'Couette Legée', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_couettelegee_rep', article: 'Couette Legée', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Couette lourd (Default 0)
  { id: 'cat_couettelourd_ls', article: 'Couette lourd', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_couettelourd_nas', article: 'Couette lourd', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_couettelourd_rep', article: 'Couette lourd', service: 'repassage', prix: 0, categorie: 'individuel' },

  // 1Draps+ 2 taies (Default 0)
  { id: 'cat_1draps2taies_ls', article: '1Draps+ 2 taies', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_1draps2taies_nas', article: '1Draps+ 2 taies', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_1draps2taies_rep', article: '1Draps+ 2 taies', service: 'repassage', prix: 0, categorie: 'individuel' },

  // 2 draps+ 2 taies (Default 0)
  { id: 'cat_2draps2taies_ls', article: '2 draps+ 2 taies', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_2draps2taies_nas', article: '2 draps+ 2 taies', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_2draps2taies_rep', article: '2 draps+ 2 taies', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Taies (Default 0)
  { id: 'cat_taies_ls', article: 'Taies', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_taies_nas', article: 'Taies', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_taies_rep', article: 'Taies', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Petite serviette (Default 0)
  { id: 'cat_petiteserviette_ls', article: 'Petite serviette', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_petiteserviette_nas', article: 'Petite serviette', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_petiteserviette_rep', article: 'Petite serviette', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Grandes serviettes (Default 0)
  { id: 'cat_grandesserviettes_ls', article: 'Grandes serviettes', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_grandesserviettes_nas', article: 'Grandes serviettes', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_grandesserviettes_rep', article: 'Grandes serviettes', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Ensemble 2 pièce (Default 0)
  { id: 'cat_ensemble2piece_ls', article: 'Ensemble 2 pièce', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_ensemble2piece_nas', article: 'Ensemble 2 pièce', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_ensemble2piece_rep', article: 'Ensemble 2 pièce', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Ensemble 3 pièces (Default 0)
  { id: 'cat_ensemble3pieces_ls', article: 'Ensemble 3 pièces', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_ensemble3pieces_nas', article: 'Ensemble 3 pièces', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_ensemble3pieces_rep', article: 'Ensemble 3 pièces', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Chapeau (Default 0)
  { id: 'cat_chapeau_ls', article: 'Chapeau', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_chapeau_nas', article: 'Chapeau', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_chapeau_rep', article: 'Chapeau', service: 'repassage', prix: 0, categorie: 'individuel' },

  // chausette (Default 0)
  { id: 'cat_chausette_ls', article: 'chausette', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_chausette_nas', article: 'chausette', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_chausette_rep', article: 'chausette', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Nappe de table (Default 0)
  { id: 'cat_nappetable_ls', article: 'Nappe de table', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_nappetable_nas', article: 'Nappe de table', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_nappetable_rep', article: 'Nappe de table', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Rideau (Default 0)
  { id: 'cat_rideau_ls', article: 'Rideau', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_rideau_nas', article: 'Rideau', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_rideau_rep', article: 'Rideau', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Robe fantaisiste (Default 0)
  { id: 'cat_robefantaisiste_ls', article: 'Robe fantaisiste', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_robefantaisiste_nas', article: 'Robe fantaisiste', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_robefantaisiste_rep', article: 'Robe fantaisiste', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Serpillière (Default 0)
  { id: 'cat_serpilliere_ls', article: 'Serpillière', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_serpilliere_nas', article: 'Serpillière', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_serpilliere_rep', article: 'Serpillière', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Torchon (Default 0)
  { id: 'cat_torchon_ls', article: 'Torchon', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_torchon_nas', article: 'Torchon', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_torchon_rep', article: 'Torchon', service: 'repassage', prix: 0, categorie: 'individuel' },

  // Foulard (Default 0)
  { id: 'cat_foulard_ls', article: 'Foulard', service: 'lavage_simple', prix: 0, categorie: 'individuel' },
  { id: 'cat_foulard_nas', article: 'Foulard', service: 'nettoyage_a_sec', prix: 0, categorie: 'individuel' },
  { id: 'cat_foulard_rep', article: 'Foulard', service: 'repassage', prix: 0, categorie: 'individuel' },

  { id: 'sub1', article: 'Offre Active', service: 'abonnement', prix: 20000, description: '25 vêtements | Livraison et ramassage gratuits', categorie: 'abonnement' },
  { id: 'sub2', article: 'Abonnement Premium', service: 'abonnement', prix: 35000, description: '50 vêtements max/mois | 2 ramassages max par mois | Ramassage et livraison gratuits', categorie: 'abonnement' },
  { id: 'sub3', article: 'Abonnement Prestige', service: 'abonnement', prix: 60000, description: '100 vêtements max/mois | 4 ramassages max par mois | Ramassage et livraison gratuits', categorie: 'abonnement' },
  { id: 'sub4', article: 'Abonnement VIP', service: 'abonnement', prix: 100000, description: '200 vêtements max/mois | 4 ramassages max par mois | Ramassage et livraison gratuits', categorie: 'abonnement' },
  { id: 'setting_express_hours', article: 'Délai Express (heures)', service: 'system', prix: 6, categorie: 'system_setting', description: 'Configuration système' },
  { id: 'setting_normal_hours', article: 'Délai Normal (heures)', service: 'system', prix: 48, categorie: 'system_setting', description: 'Configuration système' },
  { id: 'setting_express_markup', article: 'Majoration Express (%)', service: 'system', prix: 50, categorie: 'system_setting', description: 'Configuration système' }
];

let memoryDb = {
  staff: DEFAULT_STAFF,
  customers: DEFAULT_CUSTOMERS,
  orders: DEFAULT_ORDERS,
  logs: DEFAULT_LOGS,
  catalog: DEFAULT_CATALOG,
  current_user: null,
  pin_reset_requests: []
};

const listeners = new Set();
let isUsingRemote = false;

// --- PERSISTENCE HELPERS (LOCALSTORAGE FALLBACK) ---
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
    return defaultData;
  }
};

const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

function loadFromLocalStorage() {
  memoryDb.staff = DEFAULT_STAFF;
  memoryDb.customers = DEFAULT_CUSTOMERS;
  memoryDb.orders = DEFAULT_ORDERS;
  memoryDb.logs = DEFAULT_LOGS;
  memoryDb.catalog = DEFAULT_CATALOG;
  memoryDb.current_user = loadData(STORAGE_KEYS.CURRENT_USER, null);
  memoryDb.pin_reset_requests = [];
  db.notify();
}

function persist() {
  saveData(STORAGE_KEYS.CURRENT_USER, memoryDb.current_user);
}

// Helper: ajouter un timeout à une promesse
function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`[TIMEOUT] ${label} dépasse ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Initialisation de la base Supabase — robuste pour Android/Capacitor
async function initDb(isRetry = false) {
  // Toujours charger les données locales en premier pour un démarrage rapide
  if (!isRetry) {
    loadFromLocalStorage();
  }

  if (!supabase) {
    console.warn("[DB] Client Supabase non disponible. Mode hors-ligne.");
    return;
  }

  // Tentatives de connexion avec retry
  let attempt = 0;
  const maxAttempts = isRetry ? 1 : 3; // Réduire à 1 tentative lors d'une reconnexion manuelle ou automatique
  const retryDelayMs = 3000;

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`[DB] Tentative de connexion Supabase ${attempt}/${maxAttempts}...`);

    try {
      // Utiliser Promise.allSettled pour ne pas bloquer si une table échoue
      const TIMEOUT_MS = 15000;
      const [staffRes, custRes, orderRes, logsRes, catalogRes, reqsRes] = await Promise.allSettled([
        withTimeout(supabase.from('staff').select('*'), TIMEOUT_MS, 'staff'),
        withTimeout(supabase.from('customers').select('*'), TIMEOUT_MS, 'customers'),
        withTimeout(supabase.from('orders').select('*'), TIMEOUT_MS, 'orders'),
        withTimeout(supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }), TIMEOUT_MS, 'activity_logs'),
        withTimeout(supabase.from('catalog').select('*'), TIMEOUT_MS, 'catalog'),
        withTimeout(supabase.from('pin_reset_requests').select('*'), TIMEOUT_MS, 'pin_reset_requests'),
      ]);

      // Vérifier si au moins la table principale (staff) a répondu correctement
      const staffOk = staffRes.status === 'fulfilled' && !staffRes.value?.error;
      const custOk = custRes.status === 'fulfilled' && !custRes.value?.error;
      const orderOk = orderRes.status === 'fulfilled' && !orderRes.value?.error;

      if (!staffOk && !custOk && !orderOk) {
        throw new Error("Les tables principales sont inaccessibles.");
      }

      // Appliquer les résultats disponibles (les tables qui ont échoué gardent leurs valeurs locales)
      if (staffRes.status === 'fulfilled' && !staffRes.value?.error && staffRes.value?.data?.length > 0) {
        memoryDb.staff = staffRes.value.data;
      }
      if (custRes.status === 'fulfilled' && !custRes.value?.error) {
        memoryDb.customers = custRes.value.data || [];
      }
      if (orderRes.status === 'fulfilled' && !orderRes.value?.error) {
        memoryDb.orders = orderRes.value.data || [];
      }
      if (logsRes.status === 'fulfilled' && !logsRes.value?.error) {
        memoryDb.logs = logsRes.value.data || [];
      }
      if (catalogRes.status === 'fulfilled' && !catalogRes.value?.error && catalogRes.value?.data?.length > 0) {
        memoryDb.catalog = catalogRes.value.data;
      }
      if (reqsRes.status === 'fulfilled' && !reqsRes.value?.error) {
        memoryDb.pin_reset_requests = reqsRes.value.data || [];
      }

      // Conserver l'utilisateur courant depuis le stockage local
      memoryDb.current_user = loadData(STORAGE_KEYS.CURRENT_USER, null);
      isUsingRemote = true;

      console.log("[DB] ✅ Connecté à Supabase avec succès.");
      db.notify();

      // Démarrage des abonnements temps réel (non-bloquant, erreurs ignorées)
      try { setupRealtime(); } catch (e) { console.warn("[DB] Realtime non disponible:", e.message); }

      // Sync périodique toutes les 60s pour rattraper les mises à jour manquées
      startPeriodicSync();
      return; // Succès, sortir de la boucle

    } catch (err) {
      console.warn(`[DB] Tentative ${attempt} échouée : ${err.message}`);
      if (attempt < maxAttempts) {
        console.log(`[DB] Retry dans ${retryDelayMs / 1000}s...`);
        await new Promise(r => setTimeout(r, retryDelayMs));
      } else {
        console.warn("[DB] Toutes les tentatives ont échoué. Mode hors-ligne (localStorage).");
        // Les données locales déjà chargées, juste notifier
        db.notify();
        startAutoReconnect();
      }
    }
  }
}

// Tentative de reconnexion automatique toutes les 30 secondes si on est hors-ligne
let reconnectInterval = null;
function startAutoReconnect() {
  if (reconnectInterval) return; // Eviter les doublons
  reconnectInterval = setInterval(async () => {
    if (isUsingRemote) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
      return;
    }
    console.log("[DB] Tentative de reconnexion automatique à Supabase...");
    try {
      if (!supabase) return;
      const { error } = await supabase.from('staff').select('id').limit(1);
      if (!error) {
        console.log("[DB] Connexion réseau rétablie avec Supabase. Initialisation...");
        await initDb(true);
        if (isUsingRemote) {
          clearInterval(reconnectInterval);
          reconnectInterval = null;
        }
      }
    } catch (e) {
      // Ignorer les erreurs de connexion temporaires
    }
  }, 30000);
}

// Synchronisation périodique : rafraîchit les données depuis Supabase sans passer hors-ligne
let syncInterval = null;
async function startPeriodicSync() {
  if (syncInterval) return; // Eviter les doublons
  syncInterval = setInterval(async () => {
    if (!supabase || !isUsingRemote) return;
    try {
      const [custRes, orderRes, logsRes, reqsRes] = await Promise.allSettled([
        withTimeout(supabase.from('customers').select('*'), 10000, 'sync-customers'),
        withTimeout(supabase.from('orders').select('*'), 10000, 'sync-orders'),
        withTimeout(supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }), 10000, 'sync-logs'),
        withTimeout(supabase.from('pin_reset_requests').select('*'), 10000, 'sync-reqs'),
      ]);
      let changed = false;
      if (custRes.status === 'fulfilled' && !custRes.value?.error) { memoryDb.customers = custRes.value.data || []; changed = true; }
      if (orderRes.status === 'fulfilled' && !orderRes.value?.error) { memoryDb.orders = orderRes.value.data || []; changed = true; }
      if (logsRes.status === 'fulfilled' && !logsRes.value?.error) { memoryDb.logs = logsRes.value.data || []; changed = true; }
      if (reqsRes.status === 'fulfilled' && !reqsRes.value?.error) { memoryDb.pin_reset_requests = reqsRes.value.data || []; changed = true; }
      if (changed) { persist(); db.notify(); }
    } catch (e) {
      // Sync silencieuse, pas de basculement hors-ligne
    }
  }, 60000); // Toutes les 60 secondes
}

// Abonnements Supabase Realtime
function setupRealtime() {
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
            if (table === 'activity_logs') {
              targetList.unshift(newRow);
            } else {
              targetList.push(newRow);
            }
          }
        } else if (eventType === 'UPDATE') {
          const idx = targetList.findIndex(x => x.id === newRow.id);
          if (idx !== -1) {
            targetList[idx] = newRow;
          } else {
            targetList.push(newRow);
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

initDb();

export const db = {
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  notify: () => {
    listeners.forEach(l => l());
  },

  getStaff: () => [...memoryDb.staff],
  getCustomers: () => [...memoryDb.customers],
  getOrders: () => [...memoryDb.orders],
  getLogs: () => [...memoryDb.logs],
  getCatalog: () => [...memoryDb.catalog],
  getCurrentUser: () => memoryDb.current_user ? { ...memoryDb.current_user } : null,

  setCurrentUser: (user) => {
    memoryDb.current_user = user;
    if (user) {
      db.logAction('CONNEXION', `Connexion de ${user.prenom} ${user.nom} (${user.role})`);
    } else {
      db.logAction('DECONNEXION', `Déconnexion de l'utilisateur`);
    }
    persist();
    db.notify();
  },

  logAction: (action, details) => {
    const currentUser = db.getCurrentUser();
    const newLog = {
      id: 'l_' + Math.random().toString(36).substr(2, 9),
      user_id: currentUser ? currentUser.id : null,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    memoryDb.logs.unshift(newLog);
    persist();
    db.notify();

    if (isUsingRemote) {
      supabase.from('activity_logs').insert(newLog).then(({ error }) => {
        if (error) console.error("Error logging action to Supabase:", error.message);
      });
    }
    return newLog;
  },

  addCustomer: (customer) => {
    if (!isUsingRemote) {
      throw new Error("Erreur de connexion : Impossible de communiquer avec Supabase. Action impossible hors-ligne.");
    }
    const cleanPhone = customer.telephone.trim();
    const phoneExists = memoryDb.customers.some(c => c.telephone.trim() === cleanPhone);
    if (phoneExists) {
      throw new Error("Ce numéro de téléphone est déjà associé à un autre client actif.");
    }
    const newCustomer = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      nom: customer.nom,
      prenom: customer.prenom,
      telephone: cleanPhone,
      adresse: customer.adresse || '',
      indicatif: customer.indicatif || '229',
      preferences_pliage: customer.preferences_pliage || 'Plié',
      points_fidelite: 0,
      solde_dette: 0.00,
      created_at: new Date().toISOString()
    };
    memoryDb.customers.push(newCustomer);
    db.logAction('CREATION_CLIENT', `Client ${newCustomer.prenom} ${newCustomer.nom} ajouté (Tel: ${newCustomer.telephone})`);
    persist();
    db.notify();

    supabase.from('customers').insert(newCustomer).then(({ error }) => {
      if (error) {
        memoryDb.customers = memoryDb.customers.filter(c => c.id !== newCustomer.id);
        db.notify();
        alert("Erreur Supabase lors de la création du client : " + error.message);
      }
    });
    return newCustomer;
  },

  updateCustomer: (id, updatedFields) => {
    if (!isUsingRemote) {
      throw new Error("Erreur de connexion : Impossible de communiquer avec Supabase. Action impossible hors-ligne.");
    }
    const customer = memoryDb.customers.find(c => c.id === id);
    if (customer) {
      if (updatedFields.telephone) {
        const cleanPhone = updatedFields.telephone.trim();
        const phoneExists = memoryDb.customers.some(c => c.id !== id && c.telephone.trim() === cleanPhone);
        if (phoneExists) {
          throw new Error("Ce numéro de téléphone est déjà associé à un autre client actif.");
        }
      }
      const original = { ...customer };

      customer.nom = updatedFields.nom ?? customer.nom;
      customer.prenom = updatedFields.prenom ?? customer.prenom;
      customer.telephone = updatedFields.telephone ? updatedFields.telephone.trim() : customer.telephone;
      customer.adresse = updatedFields.adresse ?? customer.adresse;
      customer.preferences_pliage = updatedFields.preferences_pliage ?? customer.preferences_pliage;
      
      db.logAction('MODIFICATION_CLIENT', `Client ${customer.prenom} ${customer.nom} mis à jour`);
      persist();
      db.notify();

      supabase.from('customers').update({
        nom: customer.nom,
        prenom: customer.prenom,
        telephone: customer.telephone,
        adresse: customer.adresse,
        preferences_pliage: customer.preferences_pliage
      }).eq('id', id).then(({ error }) => {
        if (error) {
          const current = memoryDb.customers.find(c => c.id === id);
          if (current) {
            Object.assign(current, original);
            db.notify();
          }
          alert("Erreur Supabase lors de la modification du client : " + error.message);
        }
      });
      return customer;
    }
    return null;
  },

  deleteCustomer: (id) => {
    if (!isUsingRemote) {
      throw new Error("Erreur de connexion : Impossible de communiquer avec Supabase. Action impossible hors-ligne.");
    }
    const idx = memoryDb.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      const customer = memoryDb.customers[idx];
      memoryDb.customers.splice(idx, 1);
      db.logAction('SUPPRESSION_CLIENT', `Client ${customer.prenom} ${customer.nom} supprimé`);
      persist();
      db.notify();

      supabase.from('customers').delete().eq('id', id).then(({ error }) => {
        if (error) {
          memoryDb.customers.push(customer);
          db.notify();
          alert("Erreur Supabase lors de la suppression du client : " + error.message);
        }
      });
      return true;
    }
    return false;
  },

  updateCustomerDebt: (customerId, amount) => {
    if (!isUsingRemote) {
      throw new Error("Erreur de connexion : Impossible de communiquer avec Supabase. Action impossible hors-ligne.");
    }
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (customer) {
      const originalDebt = customer.solde_dette;
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) + Number(amount));
      db.logAction('MAJ_SOLDE_FINANCIER', `Solde dette de ${customer.prenom} ${customer.nom} modifié de ${amount} FCFA (Nouveau solde: ${customer.solde_dette} FCFA)`);
      persist();
      db.notify();

      supabase.from('customers').update({ solde_dette: customer.solde_dette }).eq('id', customerId).then(({ error }) => {
        if (error) {
          customer.solde_dette = originalDebt;
          db.notify();
          alert("Erreur Supabase lors de la modification de la dette client : " + error.message);
        }
      });
    }
  },

  updateCatalogPrice: (id, newPrice) => {
    const item = memoryDb.catalog.find(i => i.id === id);
    if (item) {
      const oldPrice = item.prix;
      item.prix = Number(newPrice);
      db.logAction('MODIFICATION_TARIF', `Tarif ${item.article} + ${item.service} modifié de ${oldPrice} à ${newPrice} FCFA`);
      persist();
      db.notify();

      if (isUsingRemote) {
        supabase.from('catalog').update({ prix: item.prix }).eq('id', id).then(({ error }) => {
          if (error) console.error("Error updating catalog price on Supabase:", error.message);
        });
      }
    }
  },

  updateCatalogItem: (id, updatedFields) => {
    const item = memoryDb.catalog.find(i => i.id === id);
    if (item) {
      const oldName = item.article;
      const oldPrice = item.prix;
      const oldDesc = item.description || '';
      
      if (updatedFields.article !== undefined) item.article = updatedFields.article;
      if (updatedFields.prix !== undefined) item.prix = Number(updatedFields.prix);
      if (updatedFields.description !== undefined) item.description = updatedFields.description;
      
      db.logAction(
        'MODIFICATION_TARIF', 
        `Item ${oldName} modifié : Formule(${oldName} -> ${item.article}), Prix(${oldPrice} -> ${item.prix} F), Description(${oldDesc} -> ${item.description})`
      );
      persist();
      db.notify();

      if (isUsingRemote) {
        supabase.from('catalog').update({
          article: item.article,
          prix: item.prix,
          description: item.description
        }).eq('id', id).then(({ error }) => {
          if (error) console.error("Error updating catalog item on Supabase:", error.message);
        });
      }
      return item;
    }
  },

  addCatalogItem: (article, service, prix, categorie = 'individuel', description = '') => {
    const newItem = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      article,
      service,
      prix: Number(prix),
      categorie,
      description
    };
    memoryDb.catalog.push(newItem);
    db.logAction('AJOUT_CATALOGUE', `Nouvel article ajouté au catalogue: ${article} (${service}) - ${prix} FCFA`);
    persist();
    db.notify();

    if (isUsingRemote) {
      supabase.from('catalog').insert(newItem).then(({ error }) => {
        if (error) console.error("Error inserting catalog item to Supabase:", error.message);
      });
    }
    return newItem;
  },

  createOrder: (orderData) => {
    if (!isUsingRemote) {
      throw new Error("Erreur de connexion : Impossible de communiquer avec Supabase. Action impossible hors-ligne.");
    }
    const customer = memoryDb.customers.find(c => c.id === orderData.customer_id);
    const originalCustomerState = customer ? JSON.parse(JSON.stringify(customer)) : null;
    
    let subscribedPlan = null;
    if (orderData.subscribe_plan_id && customer) {
      subscribedPlan = memoryDb.catalog.find(c => c.id === orderData.subscribe_plan_id && c.service === 'abonnement');
      if (subscribedPlan) {
        let clothesCount = 25;
        if (subscribedPlan.article.includes('Premium') || subscribedPlan.id === 'sub2') clothesCount = 50;
        else if (subscribedPlan.article.includes('Prestige') || subscribedPlan.id === 'sub3') clothesCount = 100;
        else if (subscribedPlan.article.includes('VIP') || subscribedPlan.id === 'sub4') clothesCount = 200;

        const now = new Date();
        const expires = new Date();
        expires.setMonth(now.getMonth() + 1);

        customer.active_subscription = {
          catalog_item_id: subscribedPlan.id,
          name: subscribedPlan.article,
          total_clothes: clothesCount,
          remaining_clothes: clothesCount,
          subscribed_at: now.toISOString(),
          expires_at: expires.toISOString()
        };

        db.logAction('SOUSCRIPTION_ABONNEMENT', `Client ${customer.prenom} ${customer.nom} a souscrit à l'abonnement ${subscribedPlan.article} (${clothesCount} vêtements, ${subscribedPlan.prix} FCFA) lors de la création de commande`);
      }
    }

    const isSubscriptionOrder = (!!orderData.pay_with_subscription || !!orderData.subscribe_plan_id) && customer && !!customer.active_subscription;
    
    let totalPrice = 0;
    let totalClothes = 0;

    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach(item => {
        totalClothes += Number(item.quantite);
      });
    } else {
      totalClothes = 1;
    }

    if (isSubscriptionOrder) {
      const remaining = customer.active_subscription.remaining_clothes;
      if (remaining < totalClothes) {
        throw new Error(`Solde d'abonnement insuffisant. Requis: ${totalClothes}, Disponible: ${remaining}`);
      }
      customer.active_subscription.remaining_clothes -= totalClothes;
      totalPrice = subscribedPlan ? subscribedPlan.prix : 0;
    } else {
      if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach(item => {
          const catalogItem = memoryDb.catalog.find(c => c.article === item.article && c.service === item.service);
          const itemPrice = catalogItem ? catalogItem.prix : 1500;
          totalPrice += itemPrice * item.quantite;
        });
      } else {
        const catalogItem = memoryDb.catalog.find(item => item.article === orderData.type_article && item.service === orderData.type_service);
        const basePrice = catalogItem ? catalogItem.prix : 1500;
        totalPrice = basePrice;
      }

      if (orderData.niveau_urgence === 'Express') {
        const expressMarkupItem = memoryDb.catalog.find(c => c.id === 'setting_express_markup');
        const expressMarkup = expressMarkupItem ? Number(expressMarkupItem.prix) : 50;
        totalPrice = Math.round(totalPrice * (1 + expressMarkup / 100));
      }
    }

    const advancePaid = (isSubscriptionOrder && !subscribedPlan) ? 0 : Number(orderData.avance_payee || 0);
    const unpaidBalance = totalPrice - advancePaid;

    if (customer && unpaidBalance > 0) {
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) + unpaidBalance);
    }

    if (customer && advancePaid > 0) {
      const newPoints = Math.floor(advancePaid / 1000) * 1;
      customer.points_fidelite = (customer.points_fidelite || 0) + newPoints;
    }

    const codeMarquage = 'KLIN-' + Math.floor(100000 + Math.random() * 900000).toString();
    
    const expressHoursItem = memoryDb.catalog.find(c => c.id === 'setting_express_hours');
    const expressHours = expressHoursItem ? Number(expressHoursItem.prix) : 6;
    const normalHoursItem = memoryDb.catalog.find(c => c.id === 'setting_normal_hours');
    const normalHours = normalHoursItem ? Number(normalHoursItem.prix) : 48;
    const hoursToAdd = orderData.niveau_urgence === 'Express' ? expressHours : normalHours;
    
    const dueDate = new Date(Date.now() + 3600000 * hoursToAdd).toISOString();
    const nowStr = new Date().toISOString();

    const currentUser = db.getCurrentUser();

    const newOrder = {
      id: 'o_' + Math.random().toString(36).substr(2, 9),
      customer_id: orderData.customer_id,
      statut: 'en_attente',
      type_article: orderData.type_article,
      type_service: orderData.type_service,
      niveau_urgence: orderData.niveau_urgence,
      mode_reglement: isSubscriptionOrder ? (subscribedPlan ? orderData.mode_reglement : 'abonnement') : orderData.mode_reglement,
      avance_payee: advancePaid,
      prix_total: totalPrice,
      identifiant_unique_marquage: codeMarquage,
      created_at: nowStr,
      due_date: dueDate,
      acompte_paid_at: advancePaid > 0 ? nowStr : null,
      solde_paid_at: unpaidBalance <= 0 ? nowStr : null,
      items: orderData.items || [],
      // Attribution à l'utilisateur connecté
      created_by_id: currentUser ? currentUser.id : null,
      created_by_name: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : null
    };

    if (isSubscriptionOrder) {
      newOrder.is_subscription_order = true;
      newOrder.subscription_details = {
        name: customer.active_subscription.name,
        previous_balance: customer.active_subscription.remaining_clothes + totalClothes,
        new_balance: customer.active_subscription.remaining_clothes,
        clothes_deducted: totalClothes
      };
      if (subscribedPlan) {
        newOrder.subscription_details.immediate_subscription = {
          id: subscribedPlan.id,
          name: subscribedPlan.article,
          prix: subscribedPlan.prix
        };
      }
    }

    memoryDb.orders.push(newOrder);

    if (isSubscriptionOrder) {
      if (subscribedPlan) {
        db.logAction('COMMANDE_ABONNEMENT', `Commande ${codeMarquage} créée avec souscription immédiate à ${subscribedPlan.article} (${totalClothes} vêtements débités, nouveau solde: ${customer.active_subscription.remaining_clothes} vêtements)`);
      } else {
        db.logAction('COMMANDE_ABONNEMENT', `Commande ${codeMarquage} (${totalClothes} vêtements) débitée de l'abonnement ${customer.active_subscription.name} de ${customer.prenom} ${customer.nom} (Nouveau solde: ${customer.active_subscription.remaining_clothes} vêtements)`);
      }
    } else {
      db.logAction('CREATION_COMMANDE', `Commande ${codeMarquage} créée pour ${customer ? customer.prenom + ' ' + customer.nom : 'Client inconnu'} (${totalPrice} FCFA)`);
    }

    persist();
    db.notify();

    supabase.from('orders').insert(newOrder).then(({ error }) => {
      if (error) {
        memoryDb.orders = memoryDb.orders.filter(o => o.id !== newOrder.id);
        if (customer && originalCustomerState) {
          Object.assign(customer, originalCustomerState);
        }
        db.notify();
        alert("Erreur Supabase lors de la création de la commande : " + error.message);
      }
    });

    if (customer) {
      supabase.from('customers').update({
        solde_dette: customer.solde_dette,
        points_fidelite: customer.points_fidelite,
        active_subscription: customer.active_subscription
      }).eq('id', customer.id).then(({ error }) => {
        if (error) console.error("Error updating customer on Supabase:", error.message);
      });
    }
    return newOrder;
  },

  updateOrderStatus: (orderId, newStatus) => {
    if (!isUsingRemote) {
      throw new Error("Erreur de connexion : Impossible de communiquer avec Supabase. Action impossible hors-ligne.");
    }
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    const originalOrderState = { ...order };
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);
    const originalCustomerState = customer ? { ...customer } : null;

    const oldStatus = order.statut;
    order.statut = newStatus;

    if (newStatus === 'restitue' || newStatus === 'a_livrer' || newStatus === 'a_recuperer') {
      order.solde_paid_at = new Date().toISOString();
      if (customer) {
        const remainingToPay = order.prix_total - order.avance_payee;
        if (remainingToPay > 0) {
          customer.solde_dette = Math.max(0, Number(customer.solde_dette) - remainingToPay);
          const newPoints = Math.floor(remainingToPay / 1000) * 1;
          customer.points_fidelite = (customer.points_fidelite || 0) + newPoints;
          db.logAction('PAIEMENT_FINAL', `Règlement du solde restant (${remainingToPay} FCFA) par le client ${customer.prenom} ${customer.nom} lors de la restitution`);
          
          supabase.from('customers').update({
            solde_dette: customer.solde_dette,
            points_fidelite: customer.points_fidelite
          }).eq('id', customer.id).then(({ error }) => {
            if (error) console.error("Error updating customer on Supabase:", error.message);
          });
        }
      }
    }

    db.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage} passée de '${oldStatus}' à '${newStatus}'`);
    persist();
    db.notify();

    supabase.from('orders').update({
      statut: order.statut,
      solde_paid_at: order.solde_paid_at
    }).eq('id', orderId).then(({ error }) => {
      if (error) {
        Object.assign(order, originalOrderState);
        if (customer && originalCustomerState) {
          Object.assign(customer, originalCustomerState);
        }
        db.notify();
        alert("Erreur Supabase lors du changement de statut : " + error.message);
      }
    });
    return order;
  },

  deliverOrderWithPayment: (orderId, amountPaid, paymentMethod, finalStatus = 'restitue') => {
    if (!isUsingRemote) {
      throw new Error("Erreur de connexion : Impossible de communiquer avec Supabase. Action impossible hors-ligne.");
    }
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    const originalOrderState = { ...order };
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);
    const originalCustomerState = customer ? { ...customer } : null;

    const oldStatus = order.statut;
    order.statut = finalStatus;
    order.mode_reglement = paymentMethod;
    
    order.avance_payee = Number(order.avance_payee) + Number(amountPaid);
    order.solde_paid_at = new Date().toISOString();

    if (customer && amountPaid > 0) {
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) - Number(amountPaid));
      const newPoints = Math.floor(amountPaid / 1000) * 1;
      customer.points_fidelite = (customer.points_fidelite || 0) + newPoints;
      
      supabase.from('customers').update({
        solde_dette: customer.solde_dette,
        points_fidelite: customer.points_fidelite
      }).eq('id', customer.id).then(({ error }) => {
        if (error) console.error("Error updating customer debt on Supabase:", error.message);
      });
    }

    db.logAction(
      'PAIEMENT_FINAL', 
      `Livraison commande ${order.identifiant_unique_marquage}. Paiement reçu : ${amountPaid} FCFA (Méthode: ${paymentMethod === 'especes' ? 'Espèces' : 'Mobile Money'})`
    );
    db.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage} passée de '${oldStatus}' à '${finalStatus}'`);
    persist();
    db.notify();

    supabase.from('orders').update({
      statut: order.statut,
      mode_reglement: order.mode_reglement,
      avance_payee: order.avance_payee,
      solde_paid_at: order.solde_paid_at
    }).eq('id', orderId).then(({ error }) => {
      if (error) {
        Object.assign(order, originalOrderState);
        if (customer && originalCustomerState) {
          Object.assign(customer, originalCustomerState);
        }
        db.notify();
        alert("Erreur Supabase lors du règlement final : " + error.message);
      }
    });
    return order;
  },

  cancelOrder: (orderId) => {
    if (!isUsingRemote) {
      throw new Error("Erreur de connexion : Impossible de communiquer avec Supabase. Action impossible hors-ligne.");
    }
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    const originalOrderState = { ...order };
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);
    const originalCustomerState = customer ? { ...customer } : null;

    const oldStatus = order.statut;
    order.statut = 'annule';

    const unpaid = order.prix_total - order.avance_payee;
    if (unpaid > 0 && customer) {
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) - unpaid);
      
      supabase.from('customers').update({ solde_dette: customer.solde_dette }).eq('id', customer.id).then(({ error }) => {
        if (error) console.error("Error updating customer debt on Supabase:", error.message);
      });
    }

    db.logAction('ANNULATION_COMMANDE', `Commande ${order.identifiant_unique_marquage} annulée par l'administrateur`);
    persist();
    db.notify();

    supabase.from('orders').update({ statut: 'annule' }).eq('id', orderId).then(({ error }) => {
      if (error) {
        Object.assign(order, originalOrderState);
        if (customer && originalCustomerState) {
          Object.assign(customer, originalCustomerState);
        }
        db.notify();
        alert("Erreur Supabase lors de l'annulation de la commande : " + error.message);
      }
    });
    return order;
  },

  addStaff: (member) => {
    const newMember = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      nom: member.nom,
      prenom: member.prenom,
      role: member.role || 'agent_accueil',
      email: member.email || `${member.prenom.toLowerCase()}.${member.nom.toLowerCase()}@klinup.com`,
      telephone: member.telephone || '',
      statut: member.statut || 'actif',
      permissions: member.permissions || {
        can_view_dashboard: member.role === 'super_admin' || member.role === 'manager',
        can_manage_orders: true,
        can_manage_crm: true,
        can_edit_catalog: member.role === 'super_admin' || member.role === 'manager',
        can_view_logs: member.role === 'super_admin',
        can_manage_staff: member.role === 'super_admin'
      },
      created_at: new Date().toISOString()
    };
    memoryDb.staff.push(newMember);
    db.logAction('CREATION_PERSONNEL', `Personnel ${newMember.prenom} ${newMember.nom} ajouté (Rôle: ${newMember.role})`);
    persist();
    db.notify();

    if (isUsingRemote) {
      supabase.from('staff').insert(newMember).then(({ error }) => {
        if (error) console.error("Error inserting staff member to Supabase:", error.message);
      });
    }
    return newMember;
  },

  updateStaff: (id, updatedFields) => {
    const member = memoryDb.staff.find(s => s.id === id);
    if (member) {
      if (updatedFields.nom !== undefined) member.nom = updatedFields.nom;
      if (updatedFields.prenom !== undefined) member.prenom = updatedFields.prenom;
      if (updatedFields.role !== undefined) member.role = updatedFields.role;
      if (updatedFields.email !== undefined) member.email = updatedFields.email;
      if (updatedFields.telephone !== undefined) member.telephone = updatedFields.telephone;
      if (updatedFields.statut !== undefined) member.statut = updatedFields.statut;
      if (updatedFields.permissions !== undefined) member.permissions = { ...member.permissions, ...updatedFields.permissions };
      
      db.logAction('MODIFICATION_PERSONNEL', `Personnel ${member.prenom} ${member.nom} mis à jour`);
      persist();
      db.notify();

      if (isUsingRemote) {
        supabase.from('staff').update({
          nom: member.nom,
          prenom: member.prenom,
          role: member.role,
          email: member.email,
          telephone: member.telephone,
          statut: member.statut,
          permissions: member.permissions
        }).eq('id', id).then(({ error }) => {
          if (error) console.error("Error updating staff member on Supabase:", error.message);
        });
      }
      return member;
    }
  },

  deleteStaff: (id) => {
    const index = memoryDb.staff.findIndex(s => s.id === id);
    if (index !== -1) {
      const member = memoryDb.staff[index];
      memoryDb.staff.splice(index, 1);
      db.logAction('SUPPRESSION_PERSONNEL', `Personnel ${member.prenom} ${member.nom} supprimé`);
      persist();
      db.notify();

      if (isUsingRemote) {
        supabase.from('staff').delete().eq('id', id).then(({ error }) => {
          if (error) console.error("Error deleting staff member from Supabase:", error.message);
        });
      }
      return true;
    }
    return false;
  },

  subscribeCustomer: (customerId, catalogItemId) => {
    if (!isUsingRemote) {
      throw new Error("Erreur de connexion : Impossible de communiquer avec Supabase. Action impossible hors-ligne.");
    }
    const customer = memoryDb.customers.find(c => c.id === customerId);
    const subPlan = memoryDb.catalog.find(c => c.id === catalogItemId && c.service === 'abonnement');
    if (customer && subPlan) {
      const originalSubState = customer.active_subscription ? { ...customer.active_subscription } : null;
      let clothesCount = 25;
      if (subPlan.article.includes('Premium') || subPlan.id === 'sub2') clothesCount = 50;
      else if (subPlan.article.includes('Prestige') || subPlan.id === 'sub3') clothesCount = 100;
      else if (subPlan.article.includes('VIP') || subPlan.id === 'sub4') clothesCount = 200;

      const now = new Date();
      const expires = new Date();
      expires.setMonth(now.getMonth() + 1);

      customer.active_subscription = {
        catalog_item_id: subPlan.id,
        name: subPlan.article,
        total_clothes: clothesCount,
        remaining_clothes: clothesCount,
        subscribed_at: now.toISOString(),
        expires_at: expires.toISOString()
      };

      db.logAction('SOUSCRIPTION_ABONNEMENT', `Client ${customer.prenom} ${customer.nom} a souscrit à l'abonnement ${subPlan.article} (${clothesCount} vêtements, ${subPlan.prix} FCFA)`);
      persist();
      db.notify();

      supabase.from('customers').update({ active_subscription: customer.active_subscription }).eq('id', customerId).then(({ error }) => {
        if (error) {
          customer.active_subscription = originalSubState;
          db.notify();
          alert("Erreur Supabase lors de la souscription : " + error.message);
        }
      });
      return customer;
    }
  },

  unsubscribeCustomer: (customerId) => {
    if (!isUsingRemote) {
      throw new Error("Erreur de connexion : Impossible de communiquer avec Supabase. Action impossible hors-ligne.");
    }
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (customer && customer.active_subscription) {
      const originalSubState = { ...customer.active_subscription };
      const oldName = customer.active_subscription.name;
      delete customer.active_subscription;
      db.logAction('DESABONNEMENT', `Client ${customer.prenom} ${customer.nom} s'est désabonné de ${oldName}`);
      persist();
      db.notify();

      supabase.from('customers').update({ active_subscription: null }).eq('id', customerId).then(({ error }) => {
        if (error) {
          customer.active_subscription = originalSubState;
          db.notify();
          alert("Erreur Supabase lors du désabonnement : " + error.message);
        }
      });
      return customer;
    }
  },

  canUserViewCA: (user) => {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'manager';
  },

  canUserViewDashboard: (user) => {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'manager';
  },

  canUserManageOrders: (user) => {
    if (!user) return false;
    return true;
  },

  canUserManageCRM: (user) => {
    if (!user) return false;
    return true;
  },

  canUserEditCatalog: (user) => {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'manager';
  },

  canUserManageStaff: (user) => {
    if (!user) return false;
    return user.role === 'super_admin';
  },

  getPinResetRequests: () => memoryDb.pin_reset_requests ? [...memoryDb.pin_reset_requests] : [],

  createPinResetRequest: (email) => {
    if (!isUsingRemote) {
      throw new Error("Erreur de connexion : Impossible de communiquer avec Supabase. Action impossible hors-ligne.");
    }
    if (!memoryDb.pin_reset_requests) {
      memoryDb.pin_reset_requests = [];
    }
    const staffMember = memoryDb.staff.find(s => s.email.toLowerCase() === email.toLowerCase());
    const newRequest = {
      id: 'req_' + Math.random().toString(36).substr(2, 9),
      email: email,
      staff_name: staffMember ? `${staffMember.prenom} ${staffMember.nom}` : 'Inconnu',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    memoryDb.pin_reset_requests.unshift(newRequest);
    db.logAction('DEMANDE_RESET_PIN', `Demande de réinitialisation de PIN reçue pour l'email: ${email}`);
    persist();
    db.notify();

    supabase.from('pin_reset_requests').insert(newRequest).then(({ error }) => {
      if (error) {
        memoryDb.pin_reset_requests = memoryDb.pin_reset_requests.filter(r => r.id !== newRequest.id);
        db.notify();
        alert("Erreur Supabase lors de la demande de réinitialisation : " + error.message);
      }
    });
    return newRequest;
  },

  approvePinResetRequest: (requestId) => {
    if (!memoryDb.pin_reset_requests) return null;
    const req = memoryDb.pin_reset_requests.find(r => r.id === requestId);
    if (req) {
      const staffMember = memoryDb.staff.find(s => s.email.toLowerCase() === req.email.toLowerCase());
      if (staffMember) {
        const newPin = Math.floor(100000 + Math.random() * 900000).toString();
        staffMember.code_pin = newPin;
        req.status = 'approved';
        req.resolved_pin = newPin;
        db.logAction('MODIFICATION_PERSONNEL', `Demande de reset PIN approuvée pour ${staffMember.prenom} ${staffMember.nom}. Nouveau PIN : ${newPin} (Envoyé par email)`);
        persist();
        db.notify();

        if (isUsingRemote) {
          supabase.from('staff').update({ code_pin: newPin }).eq('id', staffMember.id).then(({ error }) => {
            if (error) console.error("Error updating staff pin on Supabase:", error.message);
          });
          
          supabase.from('pin_reset_requests').update({ status: 'approved', resolved_pin: newPin }).eq('id', requestId).then(({ error }) => {
            if (error) console.error("Error updating pin reset request on Supabase:", error.message);
          });
        }
        return { req, newPin, staffMember };
      } else {
        req.status = 'rejected';
        db.logAction('MODIFICATION_PERSONNEL', `Demande de reset PIN rejetée : aucun personnel trouvé pour l'email ${req.email}`);
        persist();
        db.notify();

        if (isUsingRemote) {
          supabase.from('pin_reset_requests').update({ status: 'rejected' }).eq('id', requestId).then(({ error }) => {
            if (error) console.error("Error updating pin reset request on Supabase:", error.message);
          });
        }
        return null;
      }
    }
    return null;
  },

  rejectPinResetRequest: (requestId) => {
    if (!memoryDb.pin_reset_requests) return;
    const req = memoryDb.pin_reset_requests.find(r => r.id === requestId);
    if (req) {
      req.status = 'rejected';
      db.logAction('MODIFICATION_PERSONNEL', `Demande de reset PIN rejetée pour l'email ${req.email}`);
      persist();
      db.notify();

      if (isUsingRemote) {
        supabase.from('pin_reset_requests').update({ status: 'rejected' }).eq('id', requestId).then(({ error }) => {
          if (error) console.error("Error updating pin reset request on Supabase:", error.message);
        });
      }
    }
  },

  resetStaffPin: (userId, newPin) => {
    const staffMember = memoryDb.staff.find(s => s.id === userId);
    if (staffMember) {
      staffMember.code_pin = newPin;
      db.logAction('MODIFICATION_PERSONNEL', `Code PIN réinitialisé manuellement par l'admin pour ${staffMember.prenom} ${staffMember.nom}. Nouveau PIN : ${newPin}`);
      persist();
      db.notify();

      if (isUsingRemote) {
        supabase.from('staff').update({ code_pin: newPin }).eq('id', userId).then(({ error }) => {
          if (error) console.error("Error resetting staff pin on Supabase:", error.message);
        });
      }
      return staffMember;
    }
    return null;
  },

  isRemote: () => isUsingRemote,

  testConnection: async () => {
    if (!supabase) {
      return { success: false, error: "Client Supabase non initialisé (clés absentes ou incorrectes)." };
    }
    try {
      const { data, error } = await supabase.from('staff').select('id').limit(1);
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
};
