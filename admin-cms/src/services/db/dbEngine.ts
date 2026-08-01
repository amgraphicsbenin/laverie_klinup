import { DEFAULT_ROLES } from './seeds.js';
import { memoryDb, listeners, notifyListeners } from './memoryStore.ts';
import { performMutation, saveSession, removeSession } from './syncEngine.ts';
import { Staff, Customer, Order, CatalogItem, ActivityLog, Store, Role, OrderStatus } from '../../types/index.ts';

export { memoryDb, listeners, notifyListeners };

// ─── Order helpers ─────────────────────────────────────────────────────────

export function normalizeOrderStatus(rawStatus: any): OrderStatus {
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

export function hydrateOrder(order: any): Order {
  if (!order) return order;
  const hydrated: Order = { ...order };
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

export function reconcileOrderStates(): boolean {
  if (!memoryDb || !Array.isArray(memoryDb.orders)) return false;
  let hasChanges = false;
  const now = new Date();
  memoryDb.orders.forEach(order => {
    if (!order) return;
    const normalized = normalizeOrderStatus(order.statut);
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

let orderCronTimerAdmin: any = null;
export function startOrderStateCron(): void {
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

  getStores: (): Store[] => memoryDb.stores ? [...memoryDb.stores] : [],
  getSelectedStoreId: (): string => memoryDb.selected_store_id || 'all',

  getAllStaff: (): Staff[] => [...memoryDb.staff],
  getStaff: (): Staff[] => {
    const sid = memoryDb.selected_store_id || 'all';
    if (sid === 'all') return [...memoryDb.staff];
    const targetStore = memoryDb.stores?.find(st => st.id === sid || st.code === sid);
    const storeCode = targetStore?.code;
    return memoryDb.staff.filter(s => 
      s.role === 'super_admin' || 
      s.store_id === 'all' ||
      s.store_id === sid || 
      (storeCode && s.store_id === storeCode)
    );
  },

  getAllCustomers: (): Customer[] => [...memoryDb.customers],
  getCustomers: (): Customer[] => {
    const sid = memoryDb.selected_store_id || 'all';
    if (sid === 'all') return [...memoryDb.customers];

    const targetStore = memoryDb.stores?.find(st => st.id === sid || st.code === sid);
    const storeCode = targetStore?.code;
    const storeId = targetStore?.id || sid;

    // Staff member IDs belonging to this store
    const storeStaffIds = new Set(
      memoryDb.staff.filter(s => s.store_id === storeId || (storeCode && s.store_id === storeCode)).map(s => s.id)
    );

    return memoryDb.customers.filter((c: any) => {
      if (c.store_id === 'all') return true;
      if (c.store_id === sid) return true;
      if (c.store_id === storeId) return true;
      if (storeCode && c.store_id === storeCode) return true;
      if (c.created_by_id && storeStaffIds.has(c.created_by_id)) return true;
      return false;
    });
  },

  getAllOrders: (): Order[] => [...memoryDb.orders],
  getOrders: (): Order[] => {
    const sid = memoryDb.selected_store_id || 'all';
    if (sid === 'all') return [...memoryDb.orders];
    const targetStore = memoryDb.stores?.find(st => st.id === sid || st.code === sid);
    const storeCode = targetStore?.code;

    return memoryDb.orders.filter(o => {
      if (o.store_id === sid) return true;
      if (storeCode && o.store_id === storeCode) return true;
      return false;
    });
  },

  getAllLogs: (): ActivityLog[] => [...memoryDb.logs],
  getLogs: (): ActivityLog[] => {
    const sid = memoryDb.selected_store_id || 'all';
    if (sid === 'all') return [...memoryDb.logs];
    const targetStore = memoryDb.stores?.find(st => st.id === sid || st.code === sid);
    const storeCode = targetStore?.code;

    return memoryDb.logs.filter((l: any) => {
      if (l.store_id === sid) return true;
      if (storeCode && l.store_id === storeCode) return true;
      return false;
    });
  },

  getCatalog: (): CatalogItem[] => [...memoryDb.catalog],
  getCurrentUser: (): Staff | null => memoryDb.current_user ? { ...memoryDb.current_user } : null,
  getRoles: () => memoryDb.roles || DEFAULT_ROLES,
  getSettings: () => memoryDb.settings || {
    express_hours: 6, express_markup: 50, normal_hours: 48,
    receipt_header: 'KLIN UP - Laverie & Pressing Premium',
    receipt_footer: 'Merci de votre confiance ! A bientot chez KLIN UP.'
  },
  getCashClosures: () => memoryDb.cash_closures ? [...memoryDb.cash_closures] : [],
  getDebtPayments: () => memoryDb.debt_payments ? [...memoryDb.debt_payments] : [],
  getPinResetRequests: () => memoryDb.pin_reset_requests ? [...memoryDb.pin_reset_requests] : [],

  canUserViewCA: (user: Staff | null): boolean => !!(user && (user.role === 'super_admin' || user.role === 'manager')),
  canUserViewDashboard: (user: Staff | null): boolean => !!(user && (user.role === 'super_admin' || user.role === 'manager')),
  canUserManageOrders: (user: Staff | null): boolean => !!user,
  canUserManageCRM: (user: Staff | null): boolean => !!user,
  canUserEditCatalog: (user: Staff | null): boolean => !!(user && (user.role === 'super_admin' || user.role === 'manager')),
  canUserManageStaff: (user: Staff | null): boolean => !!(user && user.role === 'super_admin'),

  // ── Session/preference setters ──

  setCurrentUser: (user: Staff | null): void => {
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

  setSelectedStoreId: (storeId: string): void => {
    memoryDb.selected_store_id = storeId;
    saveSession('klin_up_selected_store', storeId);
    const store = memoryDb.stores?.find(s => s.id === storeId);
    const storeName = store ? store.nom : 'Tous les points (Global)';
    dbEngine.logAction('CHANGEMENT_POINT_LAVERIE', `Changement du point de laverie actif vers : ${storeName}`);
    notifyListeners();
  },

  // ── Activity log ──

  logAction: (action: string, details: string): ActivityLog => {
    const currentUser = dbEngine.getCurrentUser();
    const newLog: ActivityLog = {
      id: 'l_' + Math.random().toString(36).substr(2, 9),
      user_id: currentUser ? currentUser.id : 'u_system',
      user_name: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Système',
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

  // ── Stores ──

  addStore: async (storeData: Partial<Store>): Promise<Store> => {
    const newStore: Store = {
      id: 'store_' + Math.random().toString(36).substr(2, 9),
      nom: storeData.nom || 'Nouveau Point',
      code: storeData.code || ('KLP-' + Math.floor(100 + Math.random() * 900)),
      adresse: storeData.adresse || '',
      ville: storeData.ville || 'Cotonou',
      telephone: storeData.telephone || '',
      responsable_id: storeData.responsable_id || undefined,
      responsable_nom: storeData.responsable_nom || undefined,
      statut: storeData.statut || 'actif',
      created_at: new Date().toISOString()
    };
    await performMutation('insert', 'stores', newStore.id, newStore);
    memoryDb.stores.push(newStore);
    dbEngine.logAction('CREATION_POINT', `Création du point de laverie : ${newStore.nom} (${newStore.code})`);
    notifyListeners();
    return newStore;
  },

  updateStore: async (storeId: string, updatedFields: Partial<Store>): Promise<Store | undefined> => {
    const store = memoryDb.stores.find(s => s.id === storeId);
    if (!store) return;
    const updateData: Partial<Store> = { ...updatedFields };
    delete updateData.id;
    await performMutation('update', 'stores', storeId, updateData);
    Object.assign(store, updateData);
    dbEngine.logAction('MODIFICATION_POINT', `Point de laverie ${store.nom} mis à jour`);
    notifyListeners();
    return store;
  },

  deleteStore: async (storeId: string): Promise<boolean> => {
    const idx = memoryDb.stores.findIndex(s => s.id === storeId);
    if (idx === -1) return false;
    const store = memoryDb.stores[idx];
    await performMutation('delete', 'stores', storeId);
    memoryDb.stores.splice(idx, 1);
    dbEngine.logAction('SUPPRESSION_POINT', `Point de laverie ${store.nom} supprimé`);
    notifyListeners();
    return true;
  },

  // ── Staff ──

  addStaff: async (staffData: Partial<Staff>): Promise<Staff> => {
    const newStaff: Staff = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      nom: staffData.nom || '',
      prenom: staffData.prenom || '',
      role: staffData.role || 'agent_accueil',
      email: staffData.email ? staffData.email.trim().toLowerCase() : '',
      telephone: staffData.telephone || '',
      code_pin: staffData.code_pin || '000000',
      statut: staffData.statut || 'actif',
      store_id: staffData.store_id || 'all',
      permissions: staffData.permissions || {
        can_view_dashboard: staffData.role === 'super_admin' || staffData.role === 'manager',
        can_manage_orders: true,
        can_manage_crm: true,
        can_edit_catalog: staffData.role === 'super_admin' || staffData.role === 'manager',
        can_view_logs: staffData.role === 'super_admin',
        can_manage_staff: staffData.role === 'super_admin'
      },
      created_at: new Date().toISOString()
    };

    await performMutation('insert', 'staff', newStaff.id, newStaff);
    memoryDb.staff.push(newStaff);
    dbEngine.logAction('AJOUT_PERSONNEL', `Membre ajouté : ${newStaff.prenom} ${newStaff.nom} (${newStaff.role})`);
    notifyListeners();
    return newStaff;
  },

  updateStaff: async (staffId: string, updatedFields: Partial<Staff>): Promise<Staff | undefined> => {
    const member = memoryDb.staff.find(s => s.id === staffId);
    if (!member) return;

    const updateData: Partial<Staff> = { ...updatedFields };
    delete updateData.id;

    await performMutation('update', 'staff', staffId, updateData);
    Object.assign(member, updateData);
    if (memoryDb.current_user?.id === staffId) {
      memoryDb.current_user = { ...memoryDb.current_user, ...updateData };
      saveSession('klin_up_current_user', memoryDb.current_user);
    }
    dbEngine.logAction('MODIFICATION_PERSONNEL', `Membre mis à jour : ${member.prenom} ${member.nom}`);
    notifyListeners();
    return member;
  },

  deleteStaff: async (staffId: string): Promise<boolean> => {
    const idx = memoryDb.staff.findIndex(s => s.id === staffId);
    if (idx === -1) return false;
    const member = memoryDb.staff[idx];
    await performMutation('delete', 'staff', staffId);
    memoryDb.staff.splice(idx, 1);
    dbEngine.logAction('SUPPRESSION_PERSONNEL', `Membre supprimé : ${member.prenom} ${member.nom}`);
    notifyListeners();
    return true;
  },

  // ── Customers ──

  addCustomer: async (customerData: Partial<Customer>): Promise<Customer> => {
    const currentUser = dbEngine.getCurrentUser();
    const staffMatch = currentUser ? memoryDb.staff.find(s => s.id === currentUser.id || (s.email && s.email.toLowerCase() === (currentUser.email || '').toLowerCase())) : null;
    const userStoreId = (currentUser && currentUser.store_id && currentUser.store_id !== 'all') ? currentUser.store_id : (staffMatch && staffMatch.store_id && staffMatch.store_id !== 'all' ? staffMatch.store_id : null);

    const currentStoreId = customerData.store_id ||
      userStoreId ||
      (memoryDb.selected_store_id && memoryDb.selected_store_id !== 'all' ? memoryDb.selected_store_id : null) ||
      (memoryDb.stores?.[0]?.id || '');

    const newCustomer: Customer = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      nom: customerData.nom || '',
      prenom: customerData.prenom || '',
      telephone: customerData.telephone ? customerData.telephone.trim() : '',
      adresse: customerData.adresse || '',
      indicatif: customerData.indicatif || '229',
      preferences_pliage: customerData.preferences_pliage || 'Plié',
      points_fidelite: 0,
      solde_dette: 0,
      store_id: currentStoreId,
      created_by_id: currentUser ? currentUser.id : null,
      created_by_name: currentUser ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() : null,
      created_at: new Date().toISOString()
    };

    await performMutation('insert', 'customers', newCustomer.id, newCustomer);
    memoryDb.customers.push(newCustomer);
    dbEngine.logAction('CREATION_CLIENT', `Client créé : ${newCustomer.prenom} ${newCustomer.nom} pour le point ${currentStoreId}`);
    notifyListeners();
    return newCustomer;
  },

  updateCustomer: async (customerId: string, updatedFields: Partial<Customer>): Promise<Customer | undefined> => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (!customer) return;

    const updateData: Partial<Customer> = { ...updatedFields };
    delete updateData.id;

    await performMutation('update', 'customers', customerId, updateData);
    Object.assign(customer, updateData);
    dbEngine.logAction('MODIFICATION_CLIENT', `Client mis à jour : ${customer.prenom} ${customer.nom}`);
    notifyListeners();
    return customer;
  },

  deleteCustomer: async (customerId: string): Promise<boolean> => {
    const idx = memoryDb.customers.findIndex(c => c.id === customerId);
    if (idx === -1) return false;
    const customer = memoryDb.customers[idx];
    await performMutation('delete', 'customers', customerId);
    memoryDb.customers.splice(idx, 1);
    dbEngine.logAction('SUPPRESSION_CLIENT', `Client supprimé : ${customer.prenom} ${customer.nom}`);
    notifyListeners();
    return true;
  },

  // ── Orders ──

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    const currentUser = dbEngine.getCurrentUser();
    const currentStoreId = orderData.store_id ||
      (memoryDb.selected_store_id && memoryDb.selected_store_id !== 'all' ? memoryDb.selected_store_id : null) ||
      (currentUser && currentUser.store_id && currentUser.store_id !== 'all' ? currentUser.store_id : null) ||
      (memoryDb.stores?.[0]?.id || '');

    const newOrder: Order = {
      id: 'o_' + Math.random().toString(36).substr(2, 9),
      customer_id: orderData.customer_id || '',
      statut: orderData.statut || 'en_attente',
      type_article: orderData.type_article || 'Divers',
      type_service: orderData.type_service || 'lavage_simple',
      niveau_urgence: orderData.niveau_urgence || 'Normal',
      mode_reglement: orderData.mode_reglement || 'especes',
      avance_payee: Number(orderData.avance_payee || orderData.avance || 0),
      prix_total: Number(orderData.prix_total || orderData.total || 0),
      identifiant_unique_marquage: orderData.identifiant_unique_marquage || ('KLIN-' + (memoryDb.orders ? memoryDb.orders.length : 0)),
      created_at: new Date().toISOString(),
      due_date: orderData.due_date || new Date(Date.now() + 48 * 3600000).toISOString(),
      items: orderData.items || [],
      created_by_id: currentUser ? currentUser.id : null,
      created_by_name: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : null,
      store_id: currentStoreId
    };

    await performMutation('insert', 'orders', newOrder.id, newOrder);
    memoryDb.orders.unshift(newOrder);
    dbEngine.logAction('CREATION_COMMANDE', `Commande créée : ${newOrder.identifiant_unique_marquage} (${newOrder.prix_total} FCFA)`);
    notifyListeners();
    return newOrder;
  },

  updateOrderStatus: async (orderId: string, newStatus: OrderStatus): Promise<Order | undefined> => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;
    const oldStatus = order.statut;
    const normalized = normalizeOrderStatus(newStatus);

    await performMutation('update', 'orders', orderId, { statut: normalized });
    order.statut = normalized;
    dbEngine.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage || order.id} passée de '${oldStatus}' à '${normalized}'`);
    notifyListeners();
    return order;
  },

  cancelOrder: async (orderId: string, reason: string = ''): Promise<Order | undefined> => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    await performMutation('update', 'orders', orderId, { statut: 'annule', motif_annulation: reason.trim() });
    order.statut = 'annule';
    order.motif_annulation = reason.trim();
    dbEngine.logAction('ANNULATION_COMMANDE', `Commande ${order.identifiant_unique_marquage || order.id} annulée. Motif : ${reason}`);
    notifyListeners();
    return order;
  },

  updateOrderStore: async (orderId: string, newStoreId: string): Promise<Order | undefined> => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;
    const oldStoreId = order.store_id;

    await performMutation('update', 'orders', orderId, { store_id: newStoreId });
    order.store_id = newStoreId;
    const store = memoryDb.stores?.find(s => s.id === newStoreId || s.code === newStoreId);
    const storeName = store ? store.nom : newStoreId;
    dbEngine.logAction('RATTACHEMENT_COMMANDE', `Commande ${order.identifiant_unique_marquage || order.id} rattachée au point : ${storeName}`);
    notifyListeners();
    return order;
  },

  deleteOrder: async (orderId: string): Promise<boolean> => {
    const idx = memoryDb.orders.findIndex(o => o.id === orderId);
    if (idx === -1) return false;
    const order = memoryDb.orders[idx];
    await performMutation('delete', 'orders', orderId);
    memoryDb.orders.splice(idx, 1);
    dbEngine.logAction('SUPPRESSION_COMMANDE', `Commande supprimée : ${order.identifiant_unique_marquage || order.id}`);
    notifyListeners();
    return true;
  },

  // ── Catalog ──

  addCatalogItem: async (itemData: Partial<CatalogItem>): Promise<CatalogItem> => {
    const newItem: CatalogItem = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      article: itemData.article || 'Article',
      service: itemData.service || 'lavage_simple',
      prix: Number(itemData.prix || 0),
      categorie: itemData.categorie || 'individuel',
      description: itemData.description || '',
      is_active: itemData.is_active !== false,
      statut: itemData.is_active !== false ? 'actif' : 'inactif'
    };

    await performMutation('insert', 'catalog', newItem.id, newItem);
    memoryDb.catalog.push(newItem);
    dbEngine.logAction('AJOUT_CATALOGUE', `Article ajouté au catalogue : ${newItem.article} (${newItem.prix} FCFA)`);
    notifyListeners();
    return newItem;
  },

  updateCatalogItem: async (itemId: string, updatedFields: Partial<CatalogItem>): Promise<CatalogItem | undefined> => {
    const item = memoryDb.catalog.find(c => c.id === itemId);
    if (!item) return;

    const updateData: Partial<CatalogItem> = { ...updatedFields };
    delete updateData.id;

    await performMutation('update', 'catalog', itemId, updateData);
    Object.assign(item, updateData);
    dbEngine.logAction('MODIFICATION_CATALOGUE', `Article catalogue mis à jour : ${item.article}`);
    notifyListeners();
    return item;
  },

  deleteCatalogItem: async (itemId: string): Promise<boolean> => {
    const idx = memoryDb.catalog.findIndex(c => c.id === itemId);
    if (idx === -1) return false;
    const item = memoryDb.catalog[idx];
    await performMutation('delete', 'catalog', itemId);
    memoryDb.catalog.splice(idx, 1);
    dbEngine.logAction('SUPPRESSION_CATALOGUE', `Article catalogue supprimé : ${item.article}`);
    notifyListeners();
    return true;
  }
};
