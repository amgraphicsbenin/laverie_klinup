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

const DEFAULT_STAFF = [
  { id: 'u1', nom: 'Gomez', prenom: 'Jean-Luc', role: 'super_admin', created_at: new Date().toISOString() },
  { id: 'u2', nom: 'Koffi', prenom: 'Marie-Antoinette', role: 'manager', created_at: new Date().toISOString() },
  { id: 'u3', nom: 'Diallo', prenom: 'Pierre', role: 'agent_accueil', created_at: new Date().toISOString() }
];

const DEFAULT_CUSTOMERS = [
  { id: 'c1', nom: 'Touré', prenom: 'Amadou', telephone: '0707894512', preferences_pliage: 'Sur cintre', points_fidelite: 120, solde_dette: 2500, created_at: new Date().toISOString() },
  { id: 'c2', nom: 'Dubois', prenom: 'Sophie', telephone: '0612345678', preferences_pliage: 'Plié', points_fidelite: 45, solde_dette: 0, created_at: new Date().toISOString() },
  { id: 'c3', nom: 'Diop', prenom: 'Fatou', telephone: '0777553311', preferences_pliage: 'Sur cintre', points_fidelite: 350, solde_dette: 0, created_at: new Date().toISOString() }
];

const DEFAULT_CATALOG = [
  // Chemise
  { id: 'cat1', article: 'Chemise', service: 'lavage_simple', prix: 1500 },
  { id: 'cat2', article: 'Chemise', service: 'nettoyage_a_sec', prix: 3000 },
  { id: 'cat3', article: 'Chemise', service: 'repassage', prix: 1000 },
  // Costume
  { id: 'cat4', article: 'Costume', service: 'lavage_simple', prix: 4000 },
  { id: 'cat5', article: 'Costume', service: 'nettoyage_a_sec', prix: 7000 },
  { id: 'cat6', article: 'Costume', service: 'repassage', prix: 3000 },
  // Pantalon
  { id: 'cat7', article: 'Pantalon', service: 'lavage_simple', prix: 2000 },
  { id: 'cat8', article: 'Pantalon', service: 'nettoyage_a_sec', prix: 3500 },
  { id: 'cat9', article: 'Pantalon', service: 'repassage', prix: 1200 },
  // Robe
  { id: 'cat10', article: 'Robe', service: 'lavage_simple', prix: 2500 },
  { id: 'cat11', article: 'Robe', service: 'nettoyage_a_sec', prix: 4500 },
  { id: 'cat12', article: 'Robe', service: 'repassage', prix: 1500 },
  // Couette
  { id: 'cat13', article: 'Couette', service: 'lavage_simple', prix: 5000 },
  { id: 'cat14', article: 'Couette', service: 'nettoyage_a_sec', prix: 9000 },
  { id: 'cat15', article: 'Couette', service: 'repassage', prix: 3500 }
];

const DEFAULT_ORDERS = [
  {
    id: 'o1',
    customer_id: 'c1',
    statut: 'en_cours_lavage',
    type_article: 'Costume',
    type_service: 'nettoyage_a_sec',
    niveau_urgence: 'Express',
    mode_reglement: 'mobile_money',
    avance_payee: 7000,
    prix_total: 10500,
    identifiant_unique_marquage: 'KLIN-092813',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    due_date: new Date(Date.now() + 3600000 * 4).toISOString()
  },
  {
    id: 'o2',
    customer_id: 'c2',
    statut: 'pret',
    type_article: 'Chemise',
    type_service: 'repassage',
    niveau_urgence: 'Normal',
    mode_reglement: 'especes',
    avance_payee: 1000,
    prix_total: 1000,
    identifiant_unique_marquage: 'KLIN-482015',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    due_date: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'o3',
    customer_id: 'c3',
    statut: 'restitue',
    type_article: 'Couette',
    type_service: 'lavage_simple',
    niveau_urgence: 'Normal',
    mode_reglement: 'avance_solde',
    avance_payee: 5000,
    prix_total: 5000,
    identifiant_unique_marquage: 'KLIN-392810',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    due_date: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const DEFAULT_LOGS = [
  { id: 'l1', user_id: 'u1', action: 'CONNEXION', details: 'Connexion de Gomez Jean-Luc (Super Admin)', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: 'l2', user_id: 'u2', action: 'MODIFICATION_TARIF', details: 'Modification tarif Costume + nettoyage_a_sec à 7000 FCFA', timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: 'l3', user_id: 'u3', action: 'CREATION_COMMANDE', details: 'Commande KLIN-092813 créée pour client Touré Amadou', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
];

const loadData = (key, defaultData) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultData;
  }
};

const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  getStaff: () => loadData(STORAGE_KEYS.STAFF, DEFAULT_STAFF),
  getCustomers: () => loadData(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS),
  getOrders: () => loadData(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS),
  getLogs: () => loadData(STORAGE_KEYS.LOGS, DEFAULT_LOGS),
  getCatalog: () => loadData(STORAGE_KEYS.CATALOG, DEFAULT_CATALOG),
  getCurrentUser: () => loadData(STORAGE_KEYS.CURRENT_USER, DEFAULT_STAFF[2]), // Default to Pierre Diallo (agent)

  setCurrentUser: (user) => {
    saveData(STORAGE_KEYS.CURRENT_USER, user);
    db.logAction('CONNEXION', `Connexion de ${user.prenom} ${user.nom} (${user.role})`);
  },

  logAction: (action, details) => {
    const logs = db.getLogs();
    const currentUser = db.getCurrentUser();
    const newLog = {
      id: 'l_' + Math.random().toString(36).substr(2, 9),
      user_id: currentUser ? currentUser.id : null,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    saveData(STORAGE_KEYS.LOGS, logs);
    return newLog;
  },

  addCustomer: (customer) => {
    const customers = db.getCustomers();
    const newCustomer = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      nom: customer.nom,
      prenom: customer.prenom,
      telephone: customer.telephone,
      preferences_pliage: customer.preferences_pliage || 'Plié',
      points_fidelite: 0,
      solde_dette: 0.00,
      created_at: new Date().toISOString()
    };
    customers.push(newCustomer);
    saveData(STORAGE_KEYS.CUSTOMERS, customers);
    db.logAction('CREATION_CLIENT', `Client ${newCustomer.prenom} ${newCustomer.nom} ajouté (Tel: ${newCustomer.telephone})`);
    return newCustomer;
  },

  updateCustomerDebt: (customerId, amount) => {
    const customers = db.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) + Number(amount));
      saveData(STORAGE_KEYS.CUSTOMERS, customers);
      db.logAction('MAJ_SOLDE_FINANCIER', `Solde dette de ${customer.prenom} ${customer.nom} modifié de ${amount} FCFA (Nouveau solde: ${customer.solde_dette} FCFA)`);
    }
  },

  updateCatalogPrice: (id, newPrice) => {
    const catalog = db.getCatalog();
    const item = catalog.find(i => i.id === id);
    if (item) {
      const oldPrice = item.prix;
      item.prix = Number(newPrice);
      saveData(STORAGE_KEYS.CATALOG, catalog);
      db.logAction('MODIFICATION_TARIF', `Tarif ${item.article} + ${item.service} modifié de ${oldPrice} à ${newPrice} FCFA`);
    }
  },

  addCatalogItem: (article, service, prix) => {
    const catalog = db.getCatalog();
    const newItem = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      article,
      service,
      prix: Number(prix)
    };
    catalog.push(newItem);
    saveData(STORAGE_KEYS.CATALOG, catalog);
    db.logAction('AJOUT_CATALOGUE', `Nouvel article ajouté au catalogue: ${article} (${service}) - ${prix} FCFA`);
    return newItem;
  },

  createOrder: (orderData) => {
    const orders = db.getOrders();
    const customers = db.getCustomers();

    const catalog = db.getCatalog();
    const catalogItem = catalog.find(item => item.article === orderData.type_article && item.service === orderData.type_service);
    const basePrice = catalogItem ? catalogItem.prix : 1500;

    let totalPrice = basePrice;
    if (orderData.niveau_urgence === 'Express') {
      totalPrice = Math.round(basePrice * 1.5);
    }

    const customer = customers.find(c => c.id === orderData.customer_id);
    const advancePaid = Number(orderData.avance_payee || 0);
    const unpaidBalance = totalPrice - advancePaid;

    if (customer && unpaidBalance > 0) {
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) + unpaidBalance);
    }

    if (customer && advancePaid > 0) {
      const newPoints = Math.floor(advancePaid / 1000) * 1;
      customer.points_fidelite = (customer.points_fidelite || 0) + newPoints;
    }

    if (customer) {
      saveData(STORAGE_KEYS.CUSTOMERS, customers);
    }

    const codeMarquage = 'KLIN-' + Math.floor(100000 + Math.random() * 900000).toString();
    const hoursToAdd = orderData.niveau_urgence === 'Express' ? 6 : 48;
    const dueDate = new Date(Date.now() + 3600000 * hoursToAdd).toISOString();

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
      created_at: new Date().toISOString(),
      due_date: dueDate
    };

    orders.push(newOrder);
    saveData(STORAGE_KEYS.ORDERS, orders);

    db.logAction('CREATION_COMMANDE', `Commande ${codeMarquage} créée pour ${customer ? customer.prenom + ' ' + customer.nom : 'Client inconnu'} (${totalPrice} FCFA)`);
    return newOrder;
  },

  updateOrderStatus: (orderId, newStatus) => {
    const orders = db.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const oldStatus = order.statut;
    order.statut = newStatus;

    if (newStatus === 'restitue') {
      const customers = db.getCustomers();
      const customer = customers.find(c => c.id === order.customer_id);
      if (customer) {
        const remainingToPay = order.prix_total - order.avance_payee;
        if (remainingToPay > 0) {
          customer.solde_dette = Math.max(0, Number(customer.solde_dette) - remainingToPay);
          const newPoints = Math.floor(remainingToPay / 1000) * 1;
          customer.points_fidelite = (customer.points_fidelite || 0) + newPoints;
          saveData(STORAGE_KEYS.CUSTOMERS, customers);
          db.logAction('PAIEMENT_FINAL', `Règlement du solde restant (${remainingToPay} FCFA) par le client ${customer.prenom} ${customer.nom} lors de la restitution`);
        }
      }
    }

    saveData(STORAGE_KEYS.ORDERS, orders);
    db.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage} passée de '${oldStatus}' à '${newStatus}'`);
    return order;
  },

  cancelOrder: (orderId) => {
    const orders = db.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const oldStatus = order.statut;
    order.statut = 'annule';

    const unpaid = order.prix_total - order.avance_payee;
    if (unpaid > 0) {
      const customers = db.getCustomers();
      const customer = customers.find(c => c.id === order.customer_id);
      if (customer) {
        customer.solde_dette = Math.max(0, Number(customer.solde_dette) - unpaid);
        saveData(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    saveData(STORAGE_KEYS.ORDERS, orders);
    db.logAction('ANNULATION_COMMANDE', `Commande ${order.identifiant_unique_marquage} annulée par l'administrateur`);
    return order;
  }
};
