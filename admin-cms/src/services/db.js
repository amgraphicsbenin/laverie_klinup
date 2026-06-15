// ========================================================
// SERVICES DE BASE DE DONNÉES - SIMULATION SUPABASE (LOCAL)
// ========================================================

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
  { id: 'u1', nom: 'Gomez', prenom: 'Jean-Luc', role: 'super_admin', created_at: new Date().toISOString() },
  { id: 'u2', nom: 'Koffi', prenom: 'Marie-Antoinette', role: 'manager', created_at: new Date().toISOString() },
  { id: 'u3', nom: 'Diallo', prenom: 'Pierre', role: 'agent_accueil', created_at: new Date().toISOString() }
];

// Nettoyage complet des données de test
const DEFAULT_CUSTOMERS = [];
const DEFAULT_ORDERS = [];
const DEFAULT_LOGS = [];

const DEFAULT_CATALOG = [
  // --- VÊTEMENTS INDIVIDUELS ---
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

  { id: 'cat13', article: 'Jupe', service: 'lavage_simple', prix: 1800, categorie: 'individuel' },
  { id: 'cat14', article: 'Jupe', service: 'nettoyage_a_sec', prix: 3000, categorie: 'individuel' },
  { id: 'cat15', article: 'Jupe', service: 'repassage', prix: 1000, categorie: 'individuel' },

  { id: 'cat16', article: 'Pull', service: 'lavage_simple', prix: 2000, categorie: 'individuel' },
  { id: 'cat17', article: 'Pull', service: 'nettoyage_a_sec', prix: 3500, categorie: 'individuel' },
  { id: 'cat18', article: 'Pull', service: 'repassage', prix: 1200, categorie: 'individuel' },

  { id: 'cat19', article: 'Culotte', service: 'lavage_simple', prix: 1000, categorie: 'individuel' },
  { id: 'cat20', article: 'Culotte', service: 'nettoyage_a_sec', prix: 2000, categorie: 'individuel' },
  { id: 'cat21', article: 'Culotte', service: 'repassage', prix: 500, categorie: 'individuel' },

  { id: 'cat22', article: 'T-shirt', service: 'lavage_simple', prix: 1200, categorie: 'individuel' },
  { id: 'cat23', article: 'T-shirt', service: 'nettoyage_a_sec', prix: 2200, categorie: 'individuel' },
  { id: 'cat24', article: 'T-shirt', service: 'repassage', prix: 800, categorie: 'individuel' },

  { id: 'cat25', article: 'Polo', service: 'lavage_simple', prix: 1200, categorie: 'individuel' },
  { id: 'cat26', article: 'Polo', service: 'nettoyage_a_sec', prix: 2200, categorie: 'individuel' },
  { id: 'cat27', article: 'Polo', service: 'repassage', prix: 800, categorie: 'individuel' },

  { id: 'cat28', article: 'Blouson', service: 'lavage_simple', prix: 3500, categorie: 'individuel' },
  { id: 'cat29', article: 'Blouson', service: 'nettoyage_a_sec', prix: 6000, categorie: 'individuel' },
  { id: 'cat30', article: 'Blouson', service: 'repassage', prix: 2000, categorie: 'individuel' },

  { id: 'cat31', article: 'Veste', service: 'lavage_simple', prix: 3000, categorie: 'individuel' },
  { id: 'cat32', article: 'Veste', service: 'nettoyage_a_sec', prix: 5500, categorie: 'individuel' },
  { id: 'cat33', article: 'Veste', service: 'repassage', prix: 1800, categorie: 'individuel' },

  { id: 'cat34', article: 'Costume', service: 'lavage_simple', prix: 4000, categorie: 'individuel' },
  { id: 'cat35', article: 'Costume', service: 'nettoyage_a_sec', prix: 7000, categorie: 'individuel' },
  { id: 'cat36', article: 'Costume', service: 'repassage', prix: 3000, categorie: 'individuel' },

  { id: 'cat37', article: 'Cravate', service: 'lavage_simple', prix: 1000, categorie: 'individuel' },
  { id: 'cat38', article: 'Cravate', service: 'nettoyage_a_sec', prix: 1500, categorie: 'individuel' },
  { id: 'cat39', article: 'Cravate', service: 'repassage', prix: 500, categorie: 'individuel' },

  { id: 'cat40', article: 'Haut', service: 'lavage_simple', prix: 1200, categorie: 'individuel' },
  { id: 'cat41', article: 'Haut', service: 'nettoyage_a_sec', prix: 2200, categorie: 'individuel' },
  { id: 'cat42', article: 'Haut', service: 'repassage', prix: 800, categorie: 'individuel' },

  { id: 'cat43', article: 'Débardeur', service: 'lavage_simple', prix: 1000, categorie: 'individuel' },
  { id: 'cat44', article: 'Débardeur', service: 'nettoyage_a_sec', prix: 1800, categorie: 'individuel' },
  { id: 'cat45', article: 'Débardeur', service: 'repassage', prix: 600, categorie: 'individuel' },

  { id: 'cat46', article: 'Jeans', service: 'lavage_simple', prix: 2000, categorie: 'individuel' },
  { id: 'cat47', article: 'Jeans', service: 'nettoyage_a_sec', prix: 3500, categorie: 'individuel' },
  { id: 'cat48', article: 'Jeans', service: 'repassage', prix: 1200, categorie: 'individuel' },

  { id: 'cat49', article: 'Robe de mariée', service: 'lavage_simple', prix: 15000, categorie: 'individuel' },
  { id: 'cat50', article: 'Robe de mariée', service: 'nettoyage_a_sec', prix: 25000, categorie: 'individuel' },
  { id: 'cat51', article: 'Robe de mariée', service: 'repassage', prix: 10000, categorie: 'individuel' },

  { id: 'cat52', article: 'Couette Légère', service: 'lavage_simple', prix: 5000, categorie: 'individuel' },
  { id: 'cat53', article: 'Couette Légère', service: 'nettoyage_a_sec', prix: 8000, categorie: 'individuel' },
  { id: 'cat54', article: 'Couette Légère', service: 'repassage', prix: 3500, categorie: 'individuel' },

  { id: 'cat55', article: 'Couette lourde', service: 'lavage_simple', prix: 8000, categorie: 'individuel' },
  { id: 'cat56', article: 'Couette lourde', service: 'nettoyage_a_sec', prix: 12000, categorie: 'individuel' },
  { id: 'cat57', article: 'Couette lourde', service: 'repassage', prix: 4000, categorie: 'individuel' },

  { id: 'cat58', article: '1 Drap + 2 taies', service: 'lavage_simple', prix: 3000, categorie: 'individuel' },
  { id: 'cat59', article: '1 Drap + 2 taies', service: 'nettoyage_a_sec', prix: 5000, categorie: 'individuel' },
  { id: 'cat60', article: '1 Drap + 2 taies', service: 'repassage', prix: 2000, categorie: 'individuel' },

  { id: 'cat61', article: '2 draps + 2 taies', service: 'lavage_simple', prix: 5000, categorie: 'individuel' },
  { id: 'cat62', article: '2 draps + 2 taies', service: 'nettoyage_a_sec', prix: 8000, categorie: 'individuel' },
  { id: 'cat63', article: '2 draps + 2 taies', service: 'repassage', prix: 3500, categorie: 'individuel' },

  { id: 'cat64', article: 'Taies', service: 'lavage_simple', prix: 500, categorie: 'individuel' },
  { id: 'cat65', article: 'Taies', service: 'nettoyage_a_sec', prix: 1000, categorie: 'individuel' },
  { id: 'cat66', article: 'Taies', service: 'repassage', prix: 300, categorie: 'individuel' },

  { id: 'cat67', article: 'Petite serviette', service: 'lavage_simple', prix: 800, categorie: 'individuel' },
  { id: 'cat68', article: 'Petite serviette', service: 'nettoyage_a_sec', prix: 1200, categorie: 'individuel' },
  { id: 'cat69', article: 'Petite serviette', service: 'repassage', prix: 500, categorie: 'individuel' },

  { id: 'cat70', article: 'Grande serviette', service: 'lavage_simple', prix: 1500, categorie: 'individuel' },
  { id: 'cat71', article: 'Grande serviette', service: 'nettoyage_a_sec', prix: 2500, categorie: 'individuel' },
  { id: 'cat72', article: 'Grande serviette', service: 'repassage', prix: 1000, categorie: 'individuel' },

  { id: 'cat73', article: 'Ensemble 2 pièces', service: 'lavage_simple', prix: 3500, categorie: 'individuel' },
  { id: 'cat74', article: 'Ensemble 2 pièces', service: 'nettoyage_a_sec', prix: 6000, categorie: 'individuel' },
  { id: 'cat75', article: 'Ensemble 2 pièces', service: 'repassage', prix: 2500, categorie: 'individuel' },

  { id: 'cat76', article: 'Ensemble 3 pièces', service: 'lavage_simple', prix: 5000, categorie: 'individuel' },
  { id: 'cat77', article: 'Ensemble 3 pièces', service: 'nettoyage_a_sec', prix: 8000, categorie: 'individuel' },
  { id: 'cat78', article: 'Ensemble 3 pièces', service: 'repassage', prix: 3500, categorie: 'individuel' },

  { id: 'cat79', article: 'Chapeau', service: 'lavage_simple', prix: 1500, categorie: 'individuel' },
  { id: 'cat80', article: 'Chapeau', service: 'nettoyage_a_sec', prix: 2500, categorie: 'individuel' },
  { id: 'cat81', article: 'Chapeau', service: 'repassage', prix: 1000, categorie: 'individuel' },

  { id: 'cat82', article: 'Chaussette', service: 'lavage_simple', prix: 500, categorie: 'individuel' },
  { id: 'cat83', article: 'Chaussette', service: 'nettoyage_a_sec', prix: 800, categorie: 'individuel' },
  { id: 'cat84', article: 'Chaussette', service: 'repassage', prix: 300, categorie: 'individuel' },

  { id: 'cat85', article: 'Nappe de table', service: 'lavage_simple', prix: 2500, categorie: 'individuel' },
  { id: 'cat86', article: 'Nappe de table', service: 'nettoyage_a_sec', prix: 4000, categorie: 'individuel' },
  { id: 'cat87', article: 'Nappe de table', service: 'repassage', prix: 1500, categorie: 'individuel' },

  { id: 'cat88', article: 'Rideau', service: 'lavage_simple', prix: 6000, categorie: 'individuel' },
  { id: 'cat89', article: 'Rideau', service: 'nettoyage_a_sec', prix: 10000, categorie: 'individuel' },
  { id: 'cat90', article: 'Rideau', service: 'repassage', prix: 4000, categorie: 'individuel' },

  { id: 'cat91', article: 'Robe fantaisiste', service: 'lavage_simple', prix: 5000, categorie: 'individuel' },
  { id: 'cat92', article: 'Robe fantaisiste', service: 'nettoyage_a_sec', prix: 8000, categorie: 'individuel' },
  { id: 'cat93', article: 'Robe fantaisiste', service: 'repassage', prix: 3500, categorie: 'individuel' },

  { id: 'cat94', article: 'Serpillière', service: 'lavage_simple', prix: 1000, categorie: 'individuel' },
  { id: 'cat95', article: 'Serpillière', service: 'nettoyage_a_sec', prix: 1500, categorie: 'individuel' },
  { id: 'cat96', article: 'Serpillière', service: 'repassage', prix: 500, categorie: 'individuel' },

  { id: 'cat97', article: 'Torchon', service: 'lavage_simple', prix: 500, categorie: 'individuel' },
  { id: 'cat98', article: 'Torchon', service: 'nettoyage_a_sec', prix: 800, categorie: 'individuel' },
  { id: 'cat99', article: 'Torchon', service: 'repassage', prix: 300, categorie: 'individuel' },

  { id: 'cat100', article: 'Foulard', service: 'lavage_simple', prix: 1000, categorie: 'individuel' },
  { id: 'cat101', article: 'Foulard', service: 'nettoyage_a_sec', prix: 1800, categorie: 'individuel' },
  { id: 'cat102', article: 'Foulard', service: 'repassage', prix: 600, categorie: 'individuel' },

  // --- ABONNEMENTS ---
  { id: 'sub1', article: 'Offre Active', service: 'abonnement', prix: 20000, description: '25 vêtements | Livraison et ramassage gratuits', categorie: 'abonnement' },
  { id: 'sub2', article: 'Abonnement Premium', service: 'abonnement', prix: 35000, description: '50 vêtements max/mois | 2 ramassages max par mois | Ramassage et livraison gratuits', categorie: 'abonnement' },
  { id: 'sub3', article: 'Abonnement Prestige', service: 'abonnement', prix: 60000, description: '100 vêtements max/mois | 4 ramassages max par mois | Ramassage et livraison gratuits', categorie: 'abonnement' },
  { id: 'sub4', article: 'Abonnement VIP', service: 'abonnement', prix: 100000, description: '200 vêtements max/mois | 4 ramassages max par mois | Ramassage et livraison gratuits', categorie: 'abonnement' }
];

const API_URL = typeof window !== 'undefined' ? `http://${window.location.hostname}:5050/api/db` : 'http://localhost:5050/api/db';

let memoryDb = {
  staff: DEFAULT_STAFF,
  customers: DEFAULT_CUSTOMERS,
  orders: DEFAULT_ORDERS,
  logs: DEFAULT_LOGS,
  catalog: DEFAULT_CATALOG,
  current_user: DEFAULT_STAFF[0]
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
      const needsMigration = parsed.length === 0 || !parsed[0].hasOwnProperty('categorie');
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
  memoryDb.staff = loadData(STORAGE_KEYS.STAFF, DEFAULT_STAFF);
  memoryDb.customers = loadData(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
  memoryDb.orders = loadData(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  memoryDb.logs = loadData(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
  memoryDb.catalog = loadData(STORAGE_KEYS.CATALOG, DEFAULT_CATALOG);
  memoryDb.current_user = loadData(STORAGE_KEYS.CURRENT_USER, DEFAULT_STAFF[0]);
  db.notify();
}

async function initDb() {
  try {
    const res = await fetch(API_URL);
    if (res.ok) {
      const data = await res.json();
      memoryDb = data;
      isUsingRemote = true;
      db.notify();
    } else if (res.status === 404) {
      const defaultState = {
        staff: DEFAULT_STAFF,
        customers: DEFAULT_CUSTOMERS,
        orders: DEFAULT_ORDERS,
        logs: DEFAULT_LOGS,
        catalog: DEFAULT_CATALOG,
        current_user: DEFAULT_STAFF[0]
      };
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultState)
      });
      memoryDb = defaultState;
      isUsingRemote = true;
      db.notify();
    }
  } catch (err) {
    console.warn("[DB] Remote database server offline, falling back to localStorage:", err.message);
    loadFromLocalStorage();
  }
}

async function persist() {
  if (isUsingRemote) {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryDb)
      });
    } catch (err) {
      console.error("[DB] Failed to persist to remote database:", err);
    }
  } else {
    saveData(STORAGE_KEYS.STAFF, memoryDb.staff);
    saveData(STORAGE_KEYS.CUSTOMERS, memoryDb.customers);
    saveData(STORAGE_KEYS.ORDERS, memoryDb.orders);
    saveData(STORAGE_KEYS.LOGS, memoryDb.logs);
    saveData(STORAGE_KEYS.CATALOG, memoryDb.catalog);
    saveData(STORAGE_KEYS.CURRENT_USER, memoryDb.current_user);
  }
}

// Background sync loop (1 second polling)
setInterval(async () => {
  if (isUsingRemote) {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        if (JSON.stringify(data) !== JSON.stringify(memoryDb)) {
          memoryDb = data;
          db.notify();
        }
      }
    } catch (err) {
      console.warn("[DB] Remote database offline during poll.");
    }
  }
}, 1000);

initDb();

export const db = {
  // PubSub listeners
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  notify: () => {
    listeners.forEach(l => l());
  },

  getStaff: () => memoryDb.staff,
  getCustomers: () => memoryDb.customers,
  getOrders: () => memoryDb.orders,
  getLogs: () => memoryDb.logs,
  getCatalog: () => memoryDb.catalog,
  getCurrentUser: () => memoryDb.current_user,

  setCurrentUser: (user) => {
    memoryDb.current_user = user;
    db.logAction('CONNEXION', `Connexion de ${user.prenom} ${user.nom} (${user.role})`);
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
    return newLog;
  },

  addCustomer: (customer) => {
    const newCustomer = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      nom: customer.nom,
      prenom: customer.prenom,
      telephone: customer.telephone,
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
    return newCustomer;
  },

  updateCustomerDebt: (customerId, amount) => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (customer) {
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) + Number(amount));
      db.logAction('MAJ_SOLDE_FINANCIER', `Solde dette de ${customer.prenom} ${customer.nom} modifié de ${amount} FCFA (Nouveau solde: ${customer.solde_dette} FCFA)`);
      persist();
      db.notify();
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
    return newItem;
  },

  createOrder: (orderData) => {
    let totalPrice = 0;
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
      totalPrice = Math.round(totalPrice * 1.5);
    }

    const customer = memoryDb.customers.find(c => c.id === orderData.customer_id);
    const advancePaid = Number(orderData.avance_payee || 0);
    const unpaidBalance = totalPrice - advancePaid;

    if (customer && unpaidBalance > 0) {
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) + unpaidBalance);
    }

    if (customer && advancePaid > 0) {
      const newPoints = Math.floor(advancePaid / 1000) * 1;
      customer.points_fidelite = (customer.points_fidelite || 0) + newPoints;
    }

    const codeMarquage = 'KLIN-' + Math.floor(100000 + Math.random() * 900000).toString();
    const hoursToAdd = orderData.niveau_urgence === 'Express' ? 6 : 48;
    const dueDate = new Date(Date.now() + 3600000 * hoursToAdd).toISOString();
    const nowStr = new Date().toISOString();

    const newOrder = {
      id: 'o_' + Math.random().toString(36).substr(2, 9),
      customer_id: orderData.customer_id,
      statut: 'en_attente',
      type_article: orderData.type_article,
      type_service: orderData.type_service,
      niveau_urgence: orderData.niveau_urgence,
      mode_reglement: orderData.mode_reglement,
      avance_payee: advancePaid,
      prix_total: totalPrice,
      identifiant_unique_marquage: codeMarquage,
      created_at: nowStr,
      due_date: dueDate,
      acompte_paid_at: advancePaid > 0 ? nowStr : null,
      solde_paid_at: unpaidBalance <= 0 ? nowStr : null,
      items: orderData.items || []
    };

    memoryDb.orders.push(newOrder);
    db.logAction('CREATION_COMMANDE', `Commande ${codeMarquage} créée pour ${customer ? customer.prenom + ' ' + customer.nom : 'Client inconnu'} (${totalPrice} FCFA)`);
    persist();
    db.notify();
    return newOrder;
  },

  updateOrderStatus: (orderId, newStatus) => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    const oldStatus = order.statut;
    order.statut = newStatus;

    if (newStatus === 'restitue') {
      order.solde_paid_at = new Date().toISOString();
      const customer = memoryDb.customers.find(c => c.id === order.customer_id);
      if (customer) {
        const remainingToPay = order.prix_total - order.avance_payee;
        if (remainingToPay > 0) {
          customer.solde_dette = Math.max(0, Number(customer.solde_dette) - remainingToPay);
          const newPoints = Math.floor(remainingToPay / 1000) * 1;
          customer.points_fidelite = (customer.points_fidelite || 0) + newPoints;
          db.logAction('PAIEMENT_FINAL', `Règlement du solde restant (${remainingToPay} FCFA) par le client ${customer.prenom} ${customer.nom} lors de la restitution`);
        }
      }
    }

    db.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage} passée de '${oldStatus}' à '${newStatus}'`);
    persist();
    db.notify();
    return order;
  },

  deliverOrderWithPayment: (orderId, amountPaid, paymentMethod) => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    const oldStatus = order.statut;
    order.statut = 'restitue';
    order.mode_reglement = paymentMethod;
    
    order.avance_payee = Number(order.avance_payee) + Number(amountPaid);
    order.solde_paid_at = new Date().toISOString();

    const customer = memoryDb.customers.find(c => c.id === order.customer_id);
    if (customer && amountPaid > 0) {
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) - Number(amountPaid));
      const newPoints = Math.floor(amountPaid / 1000) * 1;
      customer.points_fidelite = (customer.points_fidelite || 0) + newPoints;
    }

    db.logAction(
      'PAIEMENT_FINAL', 
      `Livraison commande ${order.identifiant_unique_marquage}. Paiement reçu : ${amountPaid} FCFA (Méthode: ${paymentMethod === 'especes' ? 'Espèces' : 'Mobile Money'})`
    );
    db.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage} passée de '${oldStatus}' à 'restitue'`);
    persist();
    db.notify();
    return order;
  },

  cancelOrder: (orderId) => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    const oldStatus = order.statut;
    order.statut = 'annule';

    const unpaid = order.prix_total - order.avance_payee;
    if (unpaid > 0) {
      const customer = memoryDb.customers.find(c => c.id === order.customer_id);
      if (customer) {
        customer.solde_dette = Math.max(0, Number(customer.solde_dette) - unpaid);
      }
    }

    db.logAction('ANNULATION_COMMANDE', `Commande ${order.identifiant_unique_marquage} annulée par l'administrateur`);
    persist();
    db.notify();
    return order;
  }
};
