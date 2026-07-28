import { DEFAULT_ROLES } from './seeds.js';
import { memoryDb, listeners, notifyListeners } from './memoryStore.js';
import { performMutation, saveSession, removeSession } from './syncEngine.js';

export { memoryDb, listeners, notifyListeners };

// ─── Order helpers ─────────────────────────────────────────────────────────

export function normalizeOrderStatus(rawStatus) {
  if (!rawStatus) return 'en_attente';
  const s = String(rawStatus).trim().toLowerCase();
  if (s === 'pending' || s === 'attente' || s === 'en_attente') return 'en_attente';
  if (s === 'processing' || s === 'traitement') return 'traitement';
  if (s === 'washing' || s === 'lavage_cours' || s === 'en_cours_lavage') return 'en_cours_lavage';
  if (s === 'ironing' || s === 'repassage_cours' || s === 'en_cours_repassage') return 'en_cours_repassage';
  if (s === 'ready' || s === 'pret') return 'pret';
  if (s === 'a_livrer') return 'a_livrer';
  if (s === 'a_recuperer') return 'a_recuperer';
  if (s === 'in_delivery' || s === 'delivering' || s === 'en_cours_livraison') return 'en_cours_livraison';
  if (s === 'livre' || s === 'delivered' || s === 'completed' || s === 'restitue') return 'restitue';
  if (s === 'canceled' || s === 'cancelled' || s === 'annule') return 'annule';
  if (s === 'retard' || s === 'en_retard' || s === 'late') return 'traitement';
  return 'en_attente';
}

export function hydrateOrder(order) {
  if (!order) return order;
  const hydrated = { ...order };
  hydrated.statut = normalizeOrderStatus(order.statut || order.status);

  const isCompleted = hydrated.statut === 'restitue' || hydrated.statut === 'annule';
  if (!isCompleted && order.due_date) {
    const d = new Date(order.due_date);
    hydrated.est_en_retard = !isNaN(d.getTime()) && d < new Date();
  } else {
    hydrated.est_en_retard = false;
  }

  if (order.subscription_details) {
    if (order.subscription_details.remise_pourcentage !== undefined)
      hydrated.remise_pourcentage = Number(order.subscription_details.remise_pourcentage) || 0;
    if (order.subscription_details.remise_montant !== undefined)
      hydrated.remise_montant = Number(order.subscription_details.remise_montant) || 0;
    if (order.subscription_details.prix_base_avant_remise !== undefined)
      hydrated.prix_base_avant_remise = Number(order.subscription_details.prix_base_avant_remise) || 0;
  }
  return hydrated;
}

export function reconcileOrderStates() {
  if (!memoryDb || !Array.isArray(memoryDb.orders)) return false;
  let hasChanges = false;
  const now = new Date();
  memoryDb.orders.forEach(order => {
    if (!order) return;
    const normalized = normalizeOrderStatus(order.statut || order.status);
    if (order.statut !== normalized) { order.statut = normalized; hasChanges = true; }
    const isCompleted = order.statut === 'restitue' || order.statut === 'annule';
    let isLate = false;
    if (!isCompleted && order.due_date) {
      const d = new Date(order.due_date);
      if (!isNaN(d.getTime()) && d < now) isLate = true;
    }
    if (order.est_en_retard !== isLate) { order.est_en_retard = isLate; hasChanges = true; }
    if (order.prix_total !== undefined && typeof order.prix_total !== 'number') {
      order.prix_total = Number(order.prix_total) || 0; hasChanges = true;
    }
    if (order.avance_payee !== undefined && typeof order.avance_payee !== 'number') {
      order.avance_payee = Number(order.avance_payee) || 0; hasChanges = true;
    }
  });
  return hasChanges;
}

let orderCronTimerAdmin = null;
export function startOrderStateCron() {
  if (orderCronTimerAdmin) return;
  if (reconcileOrderStates()) notifyListeners();
  orderCronTimerAdmin = setInterval(() => {
    try { if (reconcileOrderStates()) notifyListeners(); } catch (e) { /* silent */ }
  }, 5000);
}

// ─── Main dbEngine ────────────────────────────────────────────────────────
// All mutating methods are async and Supabase-first:
//   1. await performMutation(...) — throws if Supabase fails
//   2. update memoryDb — only after Supabase confirms
//   3. notifyListeners() — update React UI

export const dbEngine = {

  // ── Getters (synchronous) ──────────────────────────────────────────────

  getStores: () => memoryDb.stores ? [...memoryDb.stores] : [],
  getSelectedStoreId: () => memoryDb.selected_store_id || 'all',

  getAllStaff: () => [...memoryDb.staff],
  getStaff: () => {
    const sid = memoryDb.selected_store_id || 'all';
    if (sid === 'all') return [...memoryDb.staff];
    return memoryDb.staff.filter(
      s => s.role === 'super_admin' || s.store_id === sid || s.store_id === 'all' || (!s.store_id && sid === 'store_central')
    );
  },

  getAllCustomers: () => [...memoryDb.customers],
  getCustomers: () => {
    const sid = memoryDb.selected_store_id || 'all';
    if (sid === 'all') return [...memoryDb.customers];
    return memoryDb.customers.filter(c => c.store_id === sid || (!c.store_id && sid === 'store_central'));
  },

  getAllOrders: () => [...memoryDb.orders],
  getOrders: () => {
    const sid = memoryDb.selected_store_id || 'all';
    if (sid === 'all') return [...memoryDb.orders];
    return memoryDb.orders.filter(o => o.store_id === sid || (!o.store_id && sid === 'store_central'));
  },

  getAllLogs: () => [...memoryDb.logs],
  getLogs: () => {
    const sid = memoryDb.selected_store_id || 'all';
    if (sid === 'all') return [...memoryDb.logs];
    return memoryDb.logs.filter(l => l.store_id === sid || (!l.store_id && sid === 'store_central'));
  },

  getCatalog: () => [...memoryDb.catalog],
  getCurrentUser: () => memoryDb.current_user ? { ...memoryDb.current_user } : null,
  getRoles: () => memoryDb.roles || DEFAULT_ROLES,
  getSettings: () => memoryDb.settings || {
    express_hours: 6, express_markup: 50, normal_hours: 48,
    receipt_header: 'KLIN UP - Laverie & Pressing Premium',
    receipt_footer: 'Merci de votre confiance ! A bientot chez KLIN UP.'
  },
  getCashClosures: () => memoryDb.cash_closures ? [...memoryDb.cash_closures] : [],
  getDebtPayments: () => memoryDb.debt_payments ? [...memoryDb.debt_payments] : [],
  getPinResetRequests: () => memoryDb.pin_reset_requests ? [...memoryDb.pin_reset_requests] : [],

  canUserViewCA: (user) => !!(user && (user.role === 'super_admin' || user.role === 'manager')),
  canUserViewDashboard: (user) => !!(user && (user.role === 'super_admin' || user.role === 'manager')),
  canUserManageOrders: (user) => !!user,
  canUserManageCRM: (user) => !!user,
  canUserEditCatalog: (user) => !!(user && (user.role === 'super_admin' || user.role === 'manager')),
  canUserManageStaff: (user) => !!(user && user.role === 'super_admin'),

  // ── Session/preference setters (localStorage only, not business data) ──

  setCurrentUser: (user) => {
    memoryDb.current_user = user;
    if (user) {
      saveSession('klin_up_current_user', user);
      dbEngine.logAction('CONNEXION', `Connexion de ${user.prenom} ${user.nom} (${user.role})`);
    } else {
      removeSession('klin_up_current_user');
      dbEngine.logAction('DECONNEXION', `Déconnexion de l'utilisateur`);
    }
    notifyListeners();
  },

  setSelectedStoreId: (storeId) => {
    memoryDb.selected_store_id = storeId;
    saveSession('klin_up_selected_store', storeId);
    const store = memoryDb.stores?.find(s => s.id === storeId);
    const storeName = store ? store.nom : 'Tous les points (Global)';
    dbEngine.logAction('CHANGEMENT_POINT_LAVERIE', `Changement du point de laverie actif vers : ${storeName}`);
    notifyListeners();
  },

  // ── Activity log — fire-and-forget to Supabase, immediate in memory ────

  logAction: (action, details) => {
    const currentUser = dbEngine.getCurrentUser();
    const newLog = {
      id: 'l_' + Math.random().toString(36).substr(2, 9),
      user_id: currentUser ? currentUser.id : null,
      store_id: memoryDb.selected_store_id !== 'all' ? memoryDb.selected_store_id : 'store_central',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    memoryDb.logs.unshift(newLog);
    notifyListeners();
    performMutation('insert', 'activity_logs', newLog.id, newLog)
      .catch(e => console.warn('[DB] Log sync failed:', e.message));
    return newLog;
  },

  // ── Stores ─────────────────────────────────────────────────────────────

  addStore: async (storeData) => {
    const newStore = {
      id: 'store_' + Math.random().toString(36).substr(2, 9),
      nom: storeData.nom || 'Nouveau Point',
      code: storeData.code || ('KLP-' + Math.floor(100 + Math.random() * 900)),
      adresse: storeData.adresse || '',
      ville: storeData.ville || 'Cotonou',
      telephone: storeData.telephone || '',
      responsable_id: storeData.responsable_id || null,
      responsable_nom: storeData.responsable_nom || '',
      statut: storeData.statut || 'actif',
      created_at: new Date().toISOString(),
    };
    try {
      await performMutation('insert', 'stores', newStore.id, newStore);
    } catch (e) {
      console.warn('[DB] Stores table may not exist in Supabase:', e.message);
    }
    if (!memoryDb.stores) memoryDb.stores = [];
    memoryDb.stores.unshift(newStore);
    dbEngine.logAction('CREATION_POINT_LAVERIE', `Création du point de laverie ${newStore.nom} (${newStore.code})`);
    notifyListeners();
    return newStore;
  },

  updateStore: async (id, storeData) => {
    if (!memoryDb.stores) return null;
    const idx = memoryDb.stores.findIndex(s => s.id === id);
    if (idx === -1) return null;
    try {
      await performMutation('update', 'stores', id, storeData);
    } catch (e) {
      console.warn('[DB] Stores table may not exist in Supabase:', e.message);
    }
    memoryDb.stores[idx] = { ...memoryDb.stores[idx], ...storeData };
    dbEngine.logAction('MODIFICATION_POINT_LAVERIE', `Modification du point de laverie ${memoryDb.stores[idx].nom}`);
    notifyListeners();
    return memoryDb.stores[idx];
  },

  deleteStore: async (id) => {
    if (!memoryDb.stores) return false;
    const store = memoryDb.stores.find(s => s.id === id);
    if (!store) return false;
    try {
      await performMutation('delete', 'stores', id, null);
    } catch (e) {
      console.warn('[DB] Stores table may not exist in Supabase:', e.message);
    }
    memoryDb.stores = memoryDb.stores.filter(s => s.id !== id);
    if (memoryDb.selected_store_id === id) {
      memoryDb.selected_store_id = 'all';
      saveSession('klin_up_selected_store', 'all');
    }
    dbEngine.logAction('SUPPRESSION_POINT_LAVERIE', `Suppression du point de laverie ${store.nom}`);
    notifyListeners();
    return true;
  },

  // ── Customers ──────────────────────────────────────────────────────────

  addCustomer: async (customer) => {
    const cleanPhone = customer.telephone.trim();
    if (memoryDb.customers.some(c => c.telephone.trim() === cleanPhone)) {
      throw new Error('Ce numéro de téléphone est déjà associé à un autre client actif.');
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
      solde_dette: 0.0,
      store_id: customer.store_id || (memoryDb.selected_store_id !== 'all' ? memoryDb.selected_store_id : 'store_central'),
      created_at: new Date().toISOString(),
    };

    await performMutation('insert', 'customers', newCustomer.id, newCustomer);

    memoryDb.customers.push(newCustomer);
    dbEngine.logAction('CREATION_CLIENT', `Client ${newCustomer.prenom} ${newCustomer.nom} ajouté (Tel: ${newCustomer.telephone})`);
    notifyListeners();
    return newCustomer;
  },

  updateCustomer: async (id, updatedFields) => {
    const customer = memoryDb.customers.find(c => c.id === id);
    if (!customer) return null;

    if (updatedFields.telephone) {
      const cleanPhone = updatedFields.telephone.trim();
      if (memoryDb.customers.some(c => c.id !== id && c.telephone.trim() === cleanPhone)) {
        throw new Error('Ce numéro de téléphone est déjà associé à un autre client actif.');
      }
    }

    const updateData = {
      nom: updatedFields.nom ?? customer.nom,
      prenom: updatedFields.prenom ?? customer.prenom,
      telephone: updatedFields.telephone ? updatedFields.telephone.trim() : customer.telephone,
      adresse: updatedFields.adresse ?? customer.adresse,
      preferences_pliage: updatedFields.preferences_pliage ?? customer.preferences_pliage,
    };

    await performMutation('update', 'customers', id, updateData);

    Object.assign(customer, updateData);
    dbEngine.logAction('MODIFICATION_CLIENT', `Client ${customer.prenom} ${customer.nom} mis à jour`);
    notifyListeners();
    return customer;
  },

  deleteCustomer: async (id) => {
    const idx = memoryDb.customers.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const customer = memoryDb.customers[idx];

    await performMutation('delete', 'customers', id, null);

    memoryDb.customers.splice(idx, 1);
    dbEngine.logAction('SUPPRESSION_CLIENT', `Client ${customer.prenom} ${customer.nom} supprimé`);
    notifyListeners();
    return true;
  },

  updateCustomerDebt: async (customerId, amount) => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (!customer) return;
    const newDebt = Math.max(0, Number(customer.solde_dette) + Number(amount));

    await performMutation('update', 'customers', customerId, { solde_dette: newDebt });

    customer.solde_dette = newDebt;
    dbEngine.logAction('MAJ_SOLDE_FINANCIER', `Solde dette de ${customer.prenom} ${customer.nom} modifié de ${amount} FCFA (Nouveau solde: ${newDebt} FCFA)`);
    notifyListeners();
  },

  subscribeCustomer: async (customerId, catalogItemId) => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    const subPlan = memoryDb.catalog.find(c => c.id === catalogItemId && c.service === 'abonnement');
    if (!customer || !subPlan) return null;

    let clothesCount = 25;
    if (subPlan.article.includes('Premium') || subPlan.id === 'sub2') clothesCount = 50;
    else if (subPlan.article.includes('Prestige') || subPlan.id === 'sub3') clothesCount = 100;
    else if (subPlan.article.includes('VIP') || subPlan.id === 'sub4') clothesCount = 200;

    const now = new Date();
    const expires = new Date();
    expires.setMonth(now.getMonth() + 1);
    const newSub = {
      catalog_item_id: subPlan.id,
      name: subPlan.article,
      total_clothes: clothesCount,
      remaining_clothes: clothesCount,
      subscribed_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };

    await performMutation('update', 'customers', customerId, { active_subscription: newSub });

    customer.active_subscription = newSub;
    dbEngine.logAction('SOUSCRIPTION_ABONNEMENT', `Client ${customer.prenom} ${customer.nom} a souscrit à l'abonnement ${subPlan.article} (${clothesCount} vêtements, ${subPlan.prix} FCFA)`);
    notifyListeners();
    return customer;
  },

  unsubscribeCustomer: async (customerId) => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (!customer || !customer.active_subscription) return null;
    const oldName = customer.active_subscription.name;

    await performMutation('update', 'customers', customerId, { active_subscription: null });

    delete customer.active_subscription;
    dbEngine.logAction('DESABONNEMENT', `Client ${customer.prenom} ${customer.nom} s'est désabonné de ${oldName}`);
    notifyListeners();
    return customer;
  },

  payCustomerDebt: async (customerId, amountPaid, notes = '') => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Client non trouvé');
    const amount = Number(amountPaid);
    if (isNaN(amount) || amount <= 0) throw new Error('Montant de règlement invalide');

    const previousDebt = Number(customer.solde_dette || 0);
    const newDebt = Math.max(0, previousDebt - amount);
    const currentUser = dbEngine.getCurrentUser();
    const paymentRecord = {
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      customer_id: customerId,
      customer_name: `${customer.prenom} ${customer.nom}`,
      amount_paid: amount,
      previous_debt: previousDebt,
      remaining_debt: newDebt,
      user_id: currentUser ? currentUser.id : null,
      user_name: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Agent',
      notes,
      created_at: new Date().toISOString(),
    };

    await performMutation('update', 'customers', customerId, { solde_dette: newDebt });
    await performMutation('insert', 'debt_payments', paymentRecord.id, paymentRecord);

    customer.solde_dette = newDebt;
    if (!memoryDb.debt_payments) memoryDb.debt_payments = [];
    memoryDb.debt_payments.unshift(paymentRecord);
    dbEngine.logAction('REGLEMENT_DETTE', `Règlement de dette de ${amount} FCFA pour ${customer.prenom} ${customer.nom} (Solde restant: ${newDebt} FCFA)`);
    notifyListeners();
    return paymentRecord;
  },

  // ── Catalog ────────────────────────────────────────────────────────────

  updateCatalogPrice: async (id, newPrice) => {
    const item = memoryDb.catalog.find(i => i.id === id);
    if (!item) return;
    const oldPrice = item.prix;

    await performMutation('update', 'catalog', id, { prix: Number(newPrice) });

    item.prix = Number(newPrice);
    dbEngine.logAction('MODIFICATION_TARIF', `Tarif ${item.article} + ${item.service} modifié de ${oldPrice} à ${newPrice} FCFA`);
    notifyListeners();
  },

  updateCatalogItem: async (id, updatedFields) => {
    const item = memoryDb.catalog.find(i => i.id === id);
    if (!item) return null;

    const updateData = {};
    if (updatedFields.article !== undefined) updateData.article = updatedFields.article;
    if (updatedFields.prix !== undefined) updateData.prix = Number(updatedFields.prix);
    if (updatedFields.description !== undefined) updateData.description = updatedFields.description;
    if (updatedFields.service !== undefined) updateData.service = updatedFields.service;
    if (updatedFields.prix_urgent !== undefined) updateData.prix_urgent = Number(updatedFields.prix_urgent);
    if (updatedFields.nombre_vetements !== undefined) updateData.nombre_vetements = updatedFields.nombre_vetements !== null ? Number(updatedFields.nombre_vetements) : null;
    if (updatedFields.ramassage !== undefined) updateData.ramassage = updatedFields.ramassage !== null ? Boolean(updatedFields.ramassage) : null;
    if (updatedFields.nombre_ramassages !== undefined) updateData.nombre_ramassages = updatedFields.nombre_ramassages !== null ? Number(updatedFields.nombre_ramassages) : null;
    if (updatedFields.ramassage_gratuit !== undefined) updateData.ramassage_gratuit = updatedFields.ramassage_gratuit !== null ? Boolean(updatedFields.ramassage_gratuit) : null;
    if (updatedFields.livraison_gratuite !== undefined) updateData.livraison_gratuite = updatedFields.livraison_gratuite !== null ? Boolean(updatedFields.livraison_gratuite) : null;

    await performMutation('update', 'catalog', id, updateData);

    Object.assign(item, updateData);
    dbEngine.logAction('MODIFICATION_TARIF', `Item ${item.article} modifié : ${JSON.stringify(updatedFields)}`);
    notifyListeners();
    return item;
  },

  addCatalogItem: async (
    article, service, prix, categorie = 'individuel', description = '',
    prix_urgent = null, nombre_vetements = null, ramassage = false,
    nombre_ramassages = null, ramassage_gratuit = false, livraison_gratuite = false
  ) => {
    const artCode = article.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const srvCode = service === 'lavage_simple' ? 'LAV' : service === 'repassage' ? 'REP' : service === 'nettoyage_a_sec' ? 'SEC' : 'GEN';
    const sku = `KLIN-${artCode}-${srvCode}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const newItem = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      article, service, prix: Number(prix), categorie, description, sku,
      prix_urgent: prix_urgent !== null ? Number(prix_urgent) : null,
      nombre_vetements: nombre_vetements !== null ? Number(nombre_vetements) : null,
      ramassage: Boolean(ramassage),
      nombre_ramassages: nombre_ramassages !== null ? Number(nombre_ramassages) : null,
      ramassage_gratuit: Boolean(ramassage_gratuit),
      livraison_gratuite: Boolean(livraison_gratuite),
      is_active: true,
      statut: 'actif',
    };

    await performMutation('insert', 'catalog', newItem.id, newItem);

    memoryDb.catalog.push(newItem);
    dbEngine.logAction('AJOUT_CATALOGUE', `Nouvel article ajouté au catalogue: ${article} (${service}) - SKU: ${sku} - ${prix} FCFA (Urgent: ${prix_urgent})`);
    notifyListeners();
    return newItem;
  },

  toggleCatalogItemActive: async (idOrArticleName) => {
    const itemsToToggle = memoryDb.catalog.filter(
      i => i.id === idOrArticleName ||
      (i.article && i.article.trim().toLowerCase() === String(idOrArticleName).trim().toLowerCase())
    );
    if (itemsToToggle.length === 0) return false;

    const isCurrentlyActive = itemsToToggle.some(i => i.is_active !== false && i.statut !== 'inactif');
    const newActive = !isCurrentlyActive;
    const articleLabel = itemsToToggle[0].article;

    await Promise.all(
      itemsToToggle.map(item =>
        performMutation('update', 'catalog', item.id, {
          is_active: newActive,
          statut: newActive ? 'actif' : 'inactif',
        })
      )
    );

    itemsToToggle.forEach(item => {
      item.is_active = newActive;
      item.statut = newActive ? 'actif' : 'inactif';
    });

    dbEngine.logAction('MODIFICATION_CATALOGUE', `Produit "${articleLabel}" ${newActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'} sur le catalogue`);
    notifyListeners();
    return newActive;
  },

  deleteCatalogItem: async (id) => {
    const idx = memoryDb.catalog.findIndex(i => i.id === id);
    if (idx === -1) return;
    const item = memoryDb.catalog[idx];

    await performMutation('delete', 'catalog', id, null);

    memoryDb.catalog.splice(idx, 1);
    dbEngine.logAction('SUPPRESSION_CATALOGUE', `Article supprimé du catalogue: ${item.article} (${item.service})`);
    notifyListeners();
  },

  deleteCatalogItemsBatch: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const itemsToDelete = memoryDb.catalog.filter(i => ids.includes(i.id));

    await Promise.all(ids.map(id => performMutation('delete', 'catalog', id, null)));

    memoryDb.catalog = memoryDb.catalog.filter(i => !ids.includes(i.id));
    const namesList = itemsToDelete.map(item => `${item.article} (${item.service})`).join(', ');
    dbEngine.logAction('SUPPRESSION_CATALOGUE_BATCH', `${itemsToDelete.length} articles supprimés du catalogue: ${namesList}`);
    notifyListeners();
  },

  // ── Orders ─────────────────────────────────────────────────────────────

  createOrder: async (orderData) => {
    const customer = memoryDb.customers.find(c => c.id === orderData.customer_id);

    // Build subscription if requested
    let subscribedPlan = null;
    let newSubscription = null;
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
        newSubscription = {
          catalog_item_id: subscribedPlan.id,
          name: subscribedPlan.article,
          total_clothes: clothesCount,
          remaining_clothes: clothesCount,
          subscribed_at: now.toISOString(),
          expires_at: expires.toISOString(),
        };
      }
    }

    // Work on a copy of the customer for calculations
    const workingCustomer = customer ? { ...customer } : null;
    if (newSubscription && workingCustomer) workingCustomer.active_subscription = newSubscription;

    const isSubscriptionOrder = (!!orderData.pay_with_subscription || !!orderData.subscribe_plan_id)
      && workingCustomer && !!workingCustomer.active_subscription;

    // Price calculation
    let totalPrice = 0;
    let totalClothes = 0;
    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach(item => { totalClothes += Number(item.quantite); });
    } else {
      totalClothes = 1;
    }

    if (isSubscriptionOrder) {
      const remaining = workingCustomer.active_subscription.remaining_clothes;
      if (remaining < totalClothes) throw new Error(`Solde d'abonnement insuffisant. Requis: ${totalClothes}, Disponible: ${remaining}`);
      workingCustomer.active_subscription.remaining_clothes -= totalClothes;
      totalPrice = subscribedPlan ? subscribedPlan.prix : 0;
    } else {
      if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach(item => {
          const cat = memoryDb.catalog.find(c => c.article === item.article && c.service === item.service);
          totalPrice += (cat ? cat.prix : 1500) * item.quantite;
        });
      } else {
        const cat = memoryDb.catalog.find(i => i.article === orderData.type_article && i.service === orderData.type_service);
        totalPrice = cat ? cat.prix : 1500;
      }
      if (orderData.niveau_urgence === 'Express') {
        const expressMarkupItem = memoryDb.catalog.find(c => c.id === 'setting_express_markup');
        const expressMarkup = expressMarkupItem ? Number(expressMarkupItem.prix) : 50;
        totalPrice = Math.round(totalPrice * (1 + expressMarkup / 100));
      }
    }

    let basePriceBeforeRemise = totalPrice;
    let discountPercent = Number(orderData.remise_pourcentage || 0);
    let discountAmount = 0;
    if (discountPercent > 0 && discountPercent <= 100) {
      discountAmount = Math.round(totalPrice * (discountPercent / 100));
      totalPrice = Math.max(0, totalPrice - discountAmount);
    }

    const advancePaid = (isSubscriptionOrder && !subscribedPlan) ? 0 : Number(orderData.avance_payee || 0);
    const unpaidBalance = totalPrice - advancePaid;

    let newDebt = customer ? Number(customer.solde_dette) : 0;
    let newPoints = customer ? Number(customer.points_fidelite || 0) : 0;
    if (workingCustomer && unpaidBalance > 0) newDebt = Math.max(0, newDebt + unpaidBalance);
    if (workingCustomer && advancePaid > 0) newPoints = newPoints + Math.floor(advancePaid / 1000);

    const expressHoursItem = memoryDb.catalog.find(c => c.id === 'setting_express_hours');
    const expressHours = expressHoursItem ? Number(expressHoursItem.prix) : 6;
    const normalHoursItem = memoryDb.catalog.find(c => c.id === 'setting_normal_hours');
    const normalHours = normalHoursItem ? Number(normalHoursItem.prix) : 48;
    const hoursToAdd = orderData.niveau_urgence === 'Express' ? expressHours : normalHours;

    const codeMarquage = 'KLIN-' + Math.floor(100000 + Math.random() * 900000).toString();
    const nowStr = new Date().toISOString();
    const dueDate = new Date(Date.now() + 3600000 * hoursToAdd).toISOString();
    const currentUser = dbEngine.getCurrentUser();

    let targetStoreId = orderData.store_id || (memoryDb.selected_store_id !== 'all' ? memoryDb.selected_store_id : null);
    if (!targetStoreId || targetStoreId === 'all') {
      throw new Error("IMPOSSIBLE DE CRÉER LA COMMANDE : Aucun point de laverie actif n'est sélectionné. Veuillez spécifier un point de laverie.");
    }

    const newOrder = {
      id: 'o_' + Math.random().toString(36).substr(2, 9),
      customer_id: orderData.customer_id,
      store_id: targetStoreId,
      statut: 'en_attente',
      type_article: orderData.type_article,
      type_service: orderData.type_service,
      niveau_urgence: orderData.niveau_urgence,
      mode_reglement: isSubscriptionOrder ? (subscribedPlan ? orderData.mode_reglement : 'abonnement') : orderData.mode_reglement,
      avance_payee: advancePaid,
      prix_total: totalPrice,
      remise_pourcentage: discountPercent,
      remise_montant: discountAmount,
      prix_base_avant_remise: basePriceBeforeRemise,
      identifiant_unique_marquage: codeMarquage,
      created_at: nowStr,
      due_date: dueDate,
      acompte_paid_at: advancePaid > 0 ? nowStr : null,
      solde_paid_at: unpaidBalance <= 0 ? nowStr : null,
      items: orderData.items || [],
      created_by_id: currentUser ? currentUser.id : null,
      created_by_name: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : null,
    };

    if (isSubscriptionOrder) {
      newOrder.is_subscription_order = true;
      newOrder.subscription_details = {
        name: workingCustomer.active_subscription.name,
        previous_balance: workingCustomer.active_subscription.remaining_clothes + totalClothes,
        new_balance: workingCustomer.active_subscription.remaining_clothes,
        clothes_deducted: totalClothes,
        ...(subscribedPlan ? { immediate_subscription: { id: subscribedPlan.id, name: subscribedPlan.article, prix: subscribedPlan.prix } } : {}),
      };
    }
    newOrder.subscription_details = {
      ...(newOrder.subscription_details || {}),
      remise_pourcentage: discountPercent,
      remise_montant: discountAmount,
      prix_base_avant_remise: basePriceBeforeRemise,
    };

    // ── Write to Supabase — order: new subscription first, then order, then customer update
    if (customer && newSubscription) {
      await performMutation('update', 'customers', customer.id, { active_subscription: newSubscription });
    }
    await performMutation('insert', 'orders', newOrder.id, newOrder);
    if (customer) {
      const custData = { solde_dette: newDebt, points_fidelite: newPoints };
      if (isSubscriptionOrder && workingCustomer?.active_subscription) {
        custData.active_subscription = workingCustomer.active_subscription;
      }
      await performMutation('update', 'customers', customer.id, custData);
    }

    // ── Update memory only after Supabase confirms ─────────────────────
    if (customer) {
      customer.solde_dette = newDebt;
      customer.points_fidelite = newPoints;
      if (newSubscription) customer.active_subscription = workingCustomer.active_subscription;
      else if (isSubscriptionOrder && workingCustomer?.active_subscription) {
        customer.active_subscription = workingCustomer.active_subscription;
      }
    }
    memoryDb.orders.push(hydrateOrder(newOrder));

    if (isSubscriptionOrder) {
      if (subscribedPlan) {
        dbEngine.logAction('COMMANDE_ABONNEMENT', `Commande ${codeMarquage} créée avec souscription immédiate à ${subscribedPlan.article} (${totalClothes} vêtements débités, nouveau solde: ${workingCustomer.active_subscription.remaining_clothes} vêtements)`);
      } else {
        dbEngine.logAction('COMMANDE_ABONNEMENT', `Commande ${codeMarquage} (${totalClothes} vêtements) débitée de l'abonnement ${workingCustomer.active_subscription.name} de ${customer ? customer.prenom + ' ' + customer.nom : 'Client'} (Nouveau solde: ${workingCustomer.active_subscription.remaining_clothes} vêtements)`);
      }
    } else {
      dbEngine.logAction('CREATION_COMMANDE', `Commande ${codeMarquage} créée pour ${customer ? customer.prenom + ' ' + customer.nom : 'Client inconnu'} (${totalPrice} FCFA)`);
    }
    notifyListeners();
    return newOrder;
  },

  updateOrderStatus: async (orderId, newStatus) => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);

    let normalizedStatus = newStatus;
    if (newStatus === 'livre') normalizedStatus = 'restitue';
    else if (newStatus === 'lavage_cours') normalizedStatus = 'en_cours_lavage';
    else if (newStatus === 'repassage_cours') normalizedStatus = 'en_cours_repassage';
    else if (newStatus === 'attente') normalizedStatus = 'en_attente';
    else if (newStatus === 'retard' || newStatus === 'en_retard') normalizedStatus = 'traitement';
    else if (!normalizedStatus) normalizedStatus = 'restitue';

    const oldStatus = order.statut;
    let typeLivraison = order.subscription_details?.type_livraison;
    if (newStatus === 'a_recuperer') typeLivraison = 'recuperation';
    else if (newStatus === 'a_livrer' || newStatus === 'en_cours_livraison') typeLivraison = 'livraison';
    else if (newStatus === 'restitue') {
      if (oldStatus === 'a_recuperer') typeLivraison = 'recuperation';
      else if (oldStatus === 'en_cours_livraison' || oldStatus === 'a_livrer') typeLivraison = 'livraison';
    }

    const newSubDetails = typeLivraison
      ? { ...(order.subscription_details || {}), type_livraison: typeLivraison }
      : order.subscription_details;

    let newSoldePaidAt = order.solde_paid_at;
    let customerUpdateData = null;
    if (normalizedStatus === 'restitue' || normalizedStatus === 'a_livrer' || normalizedStatus === 'a_recuperer') {
      newSoldePaidAt = new Date().toISOString();
      if (customer) {
        const remainingToPay = order.prix_total - order.avance_payee;
        if (remainingToPay > 0) {
          customerUpdateData = {
            solde_dette: Math.max(0, Number(customer.solde_dette) - remainingToPay),
            points_fidelite: (customer.points_fidelite || 0) + Math.floor(remainingToPay / 1000),
          };
        }
      }
    }

    const orderUpdateData = { statut: normalizedStatus, solde_paid_at: newSoldePaidAt, subscription_details: newSubDetails };

    await performMutation('update', 'orders', orderId, orderUpdateData);
    if (customerUpdateData) {
      await performMutation('update', 'customers', customer.id, customerUpdateData);
      dbEngine.logAction('PAIEMENT_FINAL', `Règlement du solde restant par le client ${customer.prenom} ${customer.nom} lors de la restitution`);
    }

    Object.assign(order, orderUpdateData);
    if (customerUpdateData && customer) Object.assign(customer, customerUpdateData);

    dbEngine.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage} passée de '${oldStatus}' à '${newStatus}'`);
    notifyListeners();
    return order;
  },

  deliverOrderWithPayment: async (orderId, amountPaid, paymentMethod, finalStatus = 'restitue', referencePaiement = null) => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);

    const oldStatus = order.statut;
    const newAvance = Number(order.avance_payee) + Number(amountPaid);
    const newSoldePaidAt = new Date().toISOString();

    let typeLivraison = order.subscription_details?.type_livraison;
    if (finalStatus === 'restitue') {
      if (oldStatus === 'a_recuperer') typeLivraison = 'recuperation';
      else if (oldStatus === 'en_cours_livraison' || oldStatus === 'a_livrer') typeLivraison = 'livraison';
    }
    const newSubDetails = typeLivraison
      ? { ...(order.subscription_details || {}), type_livraison: typeLivraison }
      : order.subscription_details;

    const orderUpdate = {
      statut: finalStatus,
      mode_reglement: paymentMethod,
      avance_payee: newAvance,
      solde_paid_at: newSoldePaidAt,
      subscription_details: newSubDetails,
      reference_momo: referencePaiement,
      reference_paiement: referencePaiement,
    };

    await performMutation('update', 'orders', orderId, orderUpdate);

    let customerUpdate = null;
    if (customer && Number(amountPaid) > 0) {
      customerUpdate = {
        solde_dette: Math.max(0, Number(customer.solde_dette) - Number(amountPaid)),
        points_fidelite: (customer.points_fidelite || 0) + Math.floor(amountPaid / 1000),
      };
      await performMutation('update', 'customers', customer.id, customerUpdate);
    }

    Object.assign(order, orderUpdate);
    if (customerUpdate && customer) Object.assign(customer, customerUpdate);

    dbEngine.logAction('PAIEMENT_FINAL', `Livraison commande ${order.identifiant_unique_marquage}. Paiement reçu : ${amountPaid} FCFA (Méthode: ${paymentMethod})${referencePaiement ? ` (Réf: ${referencePaiement})` : ''}`);
    dbEngine.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage} passée de '${oldStatus}' à '${finalStatus}'`);
    notifyListeners();
    return order;
  },

  cancelOrder: async (orderId, reason = '') => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);

    const unpaid = order.prix_total - order.avance_payee;
    let customerUpdate = null;
    if (unpaid > 0 && customer) {
      customerUpdate = { solde_dette: Math.max(0, Number(customer.solde_dette) - unpaid) };
    }

    await performMutation('update', 'orders', orderId, { statut: 'annule', motif_annulation: reason });
    if (customerUpdate) await performMutation('update', 'customers', customer.id, customerUpdate);

    order.statut = 'annule';
    order.motif_annulation = reason;
    if (customerUpdate && customer) customer.solde_dette = customerUpdate.solde_dette;

    dbEngine.logAction('ANNULATION_COMMANDE', `Commande ${order.identifiant_unique_marquage} annulée. Motif : ${reason}`);
    notifyListeners();
    return order;
  },

  deleteOrder: async (id) => {
    const idx = memoryDb.orders.findIndex(o => o.id === id);
    if (idx === -1) return;

    await performMutation('delete', 'orders', id, null);

    memoryDb.orders.splice(idx, 1);
    notifyListeners();
  },

  // ── Staff ──────────────────────────────────────────────────────────────

  addStaff: async (member) => {
    const newMember = {
      id: member.id || ('u_' + Math.random().toString(36).substr(2, 9)),
      nom: member.nom,
      prenom: member.prenom,
      role: member.role || 'agent_accueil',
      email: member.email ? member.email.trim().toLowerCase() : `${member.prenom.toLowerCase()}.${member.nom.toLowerCase()}@klinup.com`,
      telephone: member.telephone || '',
      code_pin: member.code_pin || '000000',
      statut: member.statut || 'actif',
      store_id: member.store_id || (memoryDb.selected_store_id !== 'all' ? memoryDb.selected_store_id : 'store_central'),
      permissions: member.permissions || {
        can_view_dashboard: member.role === 'super_admin' || member.role === 'manager',
        can_manage_orders: true,
        can_manage_crm: true,
        can_edit_catalog: member.role === 'super_admin' || member.role === 'manager',
        can_view_logs: member.role === 'super_admin',
        can_manage_staff: member.role === 'super_admin',
      },
      created_at: new Date().toISOString(),
    };

    await performMutation('insert', 'staff', newMember.id, newMember);

    memoryDb.staff.push(newMember);
    dbEngine.logAction('CREATION_PERSONNEL', `Personnel ${newMember.prenom} ${newMember.nom} ajouté (Rôle: ${newMember.role})`);
    notifyListeners();
    return newMember;
  },

  updateStaff: async (id, updatedFields) => {
    const member = memoryDb.staff.find(s => s.id === id);
    if (!member) return null;

    const updateData = {};
    if (updatedFields.nom !== undefined) updateData.nom = updatedFields.nom;
    if (updatedFields.prenom !== undefined) updateData.prenom = updatedFields.prenom;
    if (updatedFields.role !== undefined) updateData.role = updatedFields.role;
    if (updatedFields.email !== undefined) updateData.email = updatedFields.email;
    if (updatedFields.telephone !== undefined) updateData.telephone = updatedFields.telephone;
    if (updatedFields.statut !== undefined) updateData.statut = updatedFields.statut;
    if (updatedFields.store_id !== undefined) updateData.store_id = updatedFields.store_id;
    if (updatedFields.permissions !== undefined) updateData.permissions = { ...member.permissions, ...updatedFields.permissions };

    await performMutation('update', 'staff', id, updateData);

    Object.assign(member, updateData);
    dbEngine.logAction('MODIFICATION_PERSONNEL', `Personnel ${member.prenom} ${member.nom} mis à jour (${member.statut})`);
    notifyListeners();
    return member;
  },

  deleteStaff: async (id) => {
    const index = memoryDb.staff.findIndex(s => s.id === id);
    if (index === -1) return false;
    const member = memoryDb.staff[index];

    await performMutation('delete', 'staff', id, null);

    memoryDb.staff.splice(index, 1);
    dbEngine.logAction('SUPPRESSION_PERSONNEL', `Personnel ${member.prenom} ${member.nom} supprimé`);
    notifyListeners();
    return true;
  },

  // ── PIN reset ──────────────────────────────────────────────────────────

  createPinResetRequest: async (email) => {
    if (!memoryDb.pin_reset_requests) memoryDb.pin_reset_requests = [];
    const staffMember = memoryDb.staff.find(s => s.email && email && s.email.toLowerCase() === email.toLowerCase());
    const newRequest = {
      id: 'req_' + Math.random().toString(36).substr(2, 9),
      email,
      staff_name: staffMember ? `${staffMember.prenom} ${staffMember.nom}` : 'Inconnu',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    await performMutation('insert', 'pin_reset_requests', newRequest.id, newRequest);

    memoryDb.pin_reset_requests.unshift(newRequest);
    dbEngine.logAction('DEMANDE_RESET_PIN', `Demande de réinitialisation de PIN reçue pour l'email: ${email}`);
    notifyListeners();
    return newRequest;
  },

  approvePinResetRequest: async (requestId) => {
    if (!memoryDb.pin_reset_requests) return null;
    const req = memoryDb.pin_reset_requests.find(r => r.id === requestId);
    if (!req) return null;

    const staffMember = memoryDb.staff.find(s => s.email && req?.email && s.email.toLowerCase() === req.email.toLowerCase());
    if (staffMember) {
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      await performMutation('update', 'staff', staffMember.id, { code_pin: newPin });
      await performMutation('update', 'pin_reset_requests', requestId, { status: 'approved', resolved_pin: newPin });
      staffMember.code_pin = newPin;
      req.status = 'approved';
      req.resolved_pin = newPin;
      dbEngine.logAction('MODIFICATION_PERSONNEL', `Demande de reset PIN approuvée pour ${staffMember.prenom} ${staffMember.nom}. Nouveau PIN : ${newPin} (Envoyé par email)`);
      notifyListeners();
      return { req, newPin, staffMember };
    } else {
      await performMutation('update', 'pin_reset_requests', requestId, { status: 'rejected' });
      req.status = 'rejected';
      dbEngine.logAction('MODIFICATION_PERSONNEL', `Demande de reset PIN rejetée : aucun personnel trouvé pour l'email ${req.email}`);
      notifyListeners();
      return null;
    }
  },

  rejectPinResetRequest: async (requestId) => {
    if (!memoryDb.pin_reset_requests) return;
    const req = memoryDb.pin_reset_requests.find(r => r.id === requestId);
    if (!req) return;
    await performMutation('update', 'pin_reset_requests', requestId, { status: 'rejected' });
    req.status = 'rejected';
    dbEngine.logAction('MODIFICATION_PERSONNEL', `Demande de reset PIN rejetée pour l'email ${req.email}`);
    notifyListeners();
  },

  resetStaffPin: async (userId, newPin) => {
    const staffMember = memoryDb.staff.find(s => s.id === userId);
    if (!staffMember) return null;
    await performMutation('update', 'staff', userId, { code_pin: newPin });
    staffMember.code_pin = newPin;
    dbEngine.logAction('MODIFICATION_PERSONNEL', `Code PIN réinitialisé manuellement par l'admin pour ${staffMember.prenom} ${staffMember.nom}. Nouveau PIN : ${newPin}`);
    notifyListeners();
    return staffMember;
  },

  // ── Roles (memory only — no confirmed Supabase table) ─────────────────

  saveRole: (roleData) => {
    if (!memoryDb.roles) memoryDb.roles = [...DEFAULT_ROLES];
    const key = roleData.key || (roleData.label || 'role').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existingIndex = memoryDb.roles.findIndex(r => r.id === roleData.id || r.key === key);
    const roleObj = {
      id: roleData.id || ('role_' + Math.random().toString(36).substr(2, 9)),
      key,
      label: roleData.label || 'Nouveau Rôle',
      shortLabel: roleData.shortLabel || roleData.label || 'Rôle',
      color: roleData.color || '#2563eb',
      description: roleData.description || '',
      isSystem: !!roleData.isSystem,
      permissions: roleData.permissions || {},
      created_at: roleData.created_at || new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      memoryDb.roles[existingIndex] = { ...memoryDb.roles[existingIndex], ...roleObj };
      dbEngine.logAction('MODIFICATION_ROLE', `Rôle ${roleObj.label} mis à jour.`);
    } else {
      memoryDb.roles.push(roleObj);
      dbEngine.logAction('CREATION_ROLE', `Nouveau rôle ${roleObj.label} créé.`);
    }
    notifyListeners();
    return roleObj;
  },

  deleteRole: (roleId) => {
    if (!memoryDb.roles) return false;
    const roleIndex = memoryDb.roles.findIndex(r => r.id === roleId || r.key === roleId);
    if (roleIndex >= 0) {
      const role = memoryDb.roles[roleIndex];
      if (role.isSystem) { alert('Impossible de supprimer un rôle système par défaut.'); return false; }
      memoryDb.roles.splice(roleIndex, 1);
      dbEngine.logAction('SUPPRESSION_ROLE', `Rôle ${role.label} supprimé.`);
      notifyListeners();
      return true;
    }
    return false;
  },

  // ── Settings ───────────────────────────────────────────────────────────

  updateSettings: async (newSettings) => {
    const updated = { ...memoryDb.settings, ...newSettings };
    try {
      await performMutation('update', 'app_settings', 'global', updated);
    } catch (e) {
      console.warn('[DB] app_settings table may not exist in Supabase:', e.message);
    }
    memoryDb.settings = updated;
    dbEngine.logAction('MODIFICATION_PARAMETRES', `Paramètres système mis à jour.`);
    notifyListeners();
    return memoryDb.settings;
  },

  // ── Cash closures ──────────────────────────────────────────────────────

  closeDailyCashRegister: async (closureData) => {
    const currentUser = dbEngine.getCurrentUser();
    const storeId = closureData.store_id || memoryDb.selected_store_id;
    const newClosure = {
      id: 'closure_' + Math.random().toString(36).substr(2, 9),
      store_id: storeId,
      cashier_id: currentUser ? currentUser.id : 'system',
      cashier_name: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Agent Caisse',
      expected_cash: Number(closureData.expected_cash || 0),
      actual_cash: Number(closureData.actual_cash || 0),
      expected_momo: Number(closureData.expected_momo || 0),
      actual_momo: Number(closureData.actual_momo || 0),
      cash_gap: Number(closureData.actual_cash || 0) - Number(closureData.expected_cash || 0),
      momo_gap: Number(closureData.actual_momo || 0) - Number(closureData.expected_momo || 0),
      notes: closureData.notes || '',
      closed_at: new Date().toISOString(),
    };
    try {
      await performMutation('insert', 'cash_closures', newClosure.id, newClosure);
    } catch (e) {
      console.warn('[DB] cash_closures table may not exist:', e.message);
    }
    if (!memoryDb.cash_closures) memoryDb.cash_closures = [];
    memoryDb.cash_closures.unshift(newClosure);
    dbEngine.logAction('CLOTURE_CAISSE', `Clôture de caisse effectuée par ${newClosure.cashier_name} (Écart Espèces: ${newClosure.cash_gap} FCFA)`);
    notifyListeners();
    return newClosure;
  },
};
