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
  getSelectedStoreId: (): string => {
    const user = memoryDb.current_user;
    if (user && user.role !== 'super_admin') {
      const userStore = user.store_id || (user as any).laverie_id || (user as any).laverie || 'store_central';
      return userStore;
    }
    return memoryDb.selected_store_id || 'all';
  },

  getAllStaff: (): Staff[] => {
    const user = memoryDb.current_user;
    if (user && user.role !== 'super_admin') {
      return dbEngine.getStaff();
    }
    return [...memoryDb.staff];
  },
  getStaff: (): Staff[] => {
    const user = memoryDb.current_user;
    const isSuperAdmin = user?.role === 'super_admin';
    const sid = (!isSuperAdmin && user)
      ? (user.store_id || (user as any).laverie_id || (user as any).laverie || 'store_central')
      : (memoryDb.selected_store_id || 'all');

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

  getAllCustomers: (): Customer[] => {
    const user = memoryDb.current_user;
    if (user && user.role !== 'super_admin') {
      return dbEngine.getCustomers();
    }
    return [...memoryDb.customers];
  },
  getCustomers: (): Customer[] => {
    const user = memoryDb.current_user;
    const isSuperAdmin = user?.role === 'super_admin';
    const sid = (!isSuperAdmin && user)
      ? (user.store_id || (user as any).laverie_id || (user as any).laverie || 'store_central')
      : (memoryDb.selected_store_id || 'all');

    if (sid === 'all') return [...memoryDb.customers];

    const targetStore = memoryDb.stores?.find(st => st.id === sid || st.code === sid);
    const storeCode = targetStore?.code;
    const storeId = targetStore?.id || sid;

    // Staff member IDs belonging to this store
    const storeStaffIds = new Set(
      memoryDb.staff.filter(s => s.store_id === storeId || (storeCode && s.store_id === storeCode)).map(s => s.id)
    );

    return memoryDb.customers.filter((c: any) => {
      if (c.store_id === sid) return true;
      if (c.store_id === storeId) return true;
      if (storeCode && c.store_id === storeCode) return true;
      if (c.created_by_id && storeStaffIds.has(c.created_by_id)) return true;
      return false;
    });
  },

  getAllOrders: (): Order[] => {
    const user = memoryDb.current_user;
    if (user && user.role !== 'super_admin') {
      return dbEngine.getOrders();
    }
    return [...memoryDb.orders];
  },
  getOrders: (): Order[] => {
    const user = memoryDb.current_user;
    const isSuperAdmin = user?.role === 'super_admin';
    const sid = (!isSuperAdmin && user)
      ? (user.store_id || (user as any).laverie_id || (user as any).laverie || 'store_central')
      : (memoryDb.selected_store_id || 'all');

    if (sid === 'all') return [...memoryDb.orders];
    const targetStore = memoryDb.stores?.find(st => st.id === sid || st.code === sid);
    const storeCode = targetStore?.code;

    return memoryDb.orders.filter(o => {
      if (o.store_id === sid) return true;
      if (storeCode && o.store_id === storeCode) return true;
      return false;
    });
  },

  getAllLogs: (): ActivityLog[] => {
    const user = memoryDb.current_user;
    if (user && user.role !== 'super_admin') {
      return dbEngine.getLogs();
    }
    return [...memoryDb.logs];
  },
  getLogs: (): ActivityLog[] => {
    const user = memoryDb.current_user;
    const isSuperAdmin = user?.role === 'super_admin';
    const sid = (!isSuperAdmin && user)
      ? (user.store_id || (user as any).laverie_id || (user as any).laverie || 'store_central')
      : (memoryDb.selected_store_id || 'all');

    if (sid === 'all') return [...memoryDb.logs];
    const targetStore = memoryDb.stores?.find(st => st.id === sid || st.code === sid);
    const storeCode = targetStore?.code?.toLowerCase();
    const storeName = targetStore?.nom?.toLowerCase();

    return memoryDb.logs.filter((l: any) => {
      const userObj = memoryDb.staff.find(s => s.id === l.user_id);
      const logStore = l.store_id || userObj?.store_id;
      if (logStore === sid || (storeCode && logStore === storeCode)) return true;

      const detailsLower = (l.details || '').toLowerCase();
      if (storeCode && detailsLower.includes(storeCode)) return true;
      if (storeName && detailsLower.includes(storeName)) return true;

      return false;
    });
  },

  getCatalog: (): CatalogItem[] => [...memoryDb.catalog],
  getCurrentUser: (): Staff | null => memoryDb.current_user ? { ...memoryDb.current_user } : null,
  getRoles: () => memoryDb.roles || DEFAULT_ROLES,
  saveRole: (roleData: any): any => {
    if (!memoryDb.roles) {
      memoryDb.roles = [...DEFAULT_ROLES];
    }

    const existingIdx = memoryDb.roles.findIndex(
      (r: any) => (roleData.id && r.id === roleData.id) || (roleData.key && r.key === roleData.key)
    );

    let savedRole: any;

    if (existingIdx !== -1) {
      const current = memoryDb.roles[existingIdx];
      savedRole = {
        ...current,
        ...roleData,
        id: current.id,
        key: current.key || current.id,
        permissions: { ...current.permissions, ...roleData.permissions }
      };
      memoryDb.roles[existingIdx] = savedRole;
      dbEngine.logAction('MODIFICATION_ROLE', `Rôle mis à jour : ${savedRole.label}`);
    } else {
      const key = roleData.key || (roleData.label ? roleData.label.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'role_' + Date.now());
      savedRole = {
        id: roleData.id || key,
        key: key,
        label: roleData.label || 'Nouveau Rôle',
        shortLabel: roleData.shortLabel || roleData.label || 'Rôle',
        color: roleData.color || '#2563eb',
        description: roleData.description || '',
        isSystem: false,
        permissions: roleData.permissions || { can_access_mobile: true }
      };
      memoryDb.roles.push(savedRole);
      dbEngine.logAction('CREATION_ROLE', `Nouveau rôle créé : ${savedRole.label}`);
    }

    // Update staff members' permissions in memory and persist to Supabase
    if (memoryDb.staff) {
      memoryDb.staff.forEach(async (s: any) => {
        if (s.role === savedRole.id || s.role === savedRole.key) {
          s.permissions = { ...savedRole.permissions };
          try {
            await performMutation('update', 'staff', s.id, { permissions: s.permissions });
          } catch (e) {
            console.warn('[KLIN UP DB] ⚠️ Mise à jour permissions staff suite à modification rôle :', e);
          }
        }
      });
    }

    notifyListeners();
    return savedRole;
  },

  deleteRole: (roleId: string): boolean => {
    if (!memoryDb.roles) return false;
    const idx = memoryDb.roles.findIndex((r: any) => r.id === roleId || r.key === roleId);
    if (idx === -1) return false;

    const roleToDelete = memoryDb.roles[idx];
    if (roleToDelete.isSystem) {
      dbEngine.logAction('ATTEMPTE_SUPPRESSION_ROLE_SYSTEME', `Impossible de supprimer le rôle système natif : ${roleToDelete.label}`);
      return false;
    }

    memoryDb.roles.splice(idx, 1);
    dbEngine.logAction('SUPPRESSION_ROLE', `Rôle supprimé : ${roleToDelete.label}`);
    notifyListeners();
    return true;
  },
  getSettings: () => memoryDb.settings || {
    express_hours: 6, express_markup: 50, normal_hours: 48,
    receipt_header: 'KLIN UP - Laverie & Pressing Premium',
    receipt_footer: 'Merci de votre confiance ! A bientot chez KLIN UP.',
    fidelity_active: true,
    fidelity_spend_per_point: 1000,
    fidelity_tier_silver_pts: 50,
    fidelity_tier_gold_pts: 150,
    fidelity_tier_platinum_pts: 300,
    invoice_paper_format: '80mm',
    invoice_paper_width: 80,
    invoice_paper_height: 0,
    invoice_orientation: 'portrait',
    invoice_margin: 5
  },
  updateSettings: (newSettings: Record<string, any>) => {
    memoryDb.settings = {
      ...(memoryDb.settings || {
        express_hours: 6, express_markup: 50, normal_hours: 48,
        receipt_header: 'KLIN UP - Laverie & Pressing Premium',
        receipt_footer: 'Merci de votre confiance ! A bientot chez KLIN UP.',
        fidelity_active: true,
        fidelity_spend_per_point: 1000,
        fidelity_tier_silver_pts: 50,
        fidelity_tier_gold_pts: 150,
        fidelity_tier_platinum_pts: 300,
        invoice_paper_format: '80mm',
        invoice_paper_width: 80,
        invoice_paper_height: 0,
        invoice_orientation: 'portrait',
        invoice_margin: 5
      }),
      ...newSettings
    };
    saveSession('klin_up_settings', memoryDb.settings);

    // ─── Sync fidelity params to Supabase catalog so mobile app can read them ──
    // The mobile app reads from memoryDb.catalog (synced from Supabase), not localStorage.
    const settings = memoryDb.settings;
    const spendPerPoint = Number(settings.fidelity_spend_per_point) || 1000;
    const fidelityActive = settings.fidelity_active !== false ? 1 : 0;

    // Upsert setting_fidelity_spend_per_point in catalog
    const spendItem = (memoryDb.catalog || []).find((c: any) => c.id === 'setting_fidelity_spend_per_point');
    if (spendItem) {
      spendItem.prix = spendPerPoint;
      performMutation('update', 'catalog', 'setting_fidelity_spend_per_point', { prix: spendPerPoint }).catch(() => {});
    } else {
      const newItem = {
        id: 'setting_fidelity_spend_per_point',
        article: 'Tranche Dépense par Point (FCFA)',
        service: 'system',
        prix: spendPerPoint,
        categorie: 'system_setting',
        description: 'Montant en FCFA requis pour gagner 1 point de fidélité',
        is_active: true,
        statut: 'actif'
      };
      (memoryDb.catalog as any[]).push(newItem);
      performMutation('insert', 'catalog', 'setting_fidelity_spend_per_point', newItem).catch(() => {});
    }

    // Upsert setting_fidelity_active in catalog
    const activeItem = (memoryDb.catalog || []).find((c: any) => c.id === 'setting_fidelity_active');
    if (activeItem) {
      activeItem.prix = fidelityActive;
      performMutation('update', 'catalog', 'setting_fidelity_active', { prix: fidelityActive }).catch(() => {});
    } else {
      const newActiveItem = {
        id: 'setting_fidelity_active',
        article: 'Programme Fidélité Actif',
        service: 'system',
        prix: fidelityActive,
        categorie: 'system_setting',
        description: '1 = activé, 0 = désactivé',
        is_active: true,
        statut: 'actif'
      };
      (memoryDb.catalog as any[]).push(newActiveItem);
      performMutation('insert', 'catalog', 'setting_fidelity_active', newActiveItem).catch(() => {});
    }
    // ─── End fidelity sync ───────────────────────────────────────────────────

    dbEngine.logAction('MODIFICATION_PARAMETRES', 'Mise à jour des paramètres système, des dimensions de reçu et du programme de fidélité.');
    notifyListeners();
    return memoryDb.settings;
  },
  getRewardCatalog: () => {
    if (memoryDb.settings && memoryDb.settings.reward_catalog && Array.isArray(memoryDb.settings.reward_catalog) && memoryDb.settings.reward_catalog.length > 0) {
      return memoryDb.settings.reward_catalog;
    }
    return [
      { id: 'remise_1000', title: 'Remise de 1 000 FCFA', cost: 30, discountAmount: 1000, iconName: 'Tag', description: 'Réduction de 1 000 FCFA sur la prochaine commande.' },
      { id: 'lavage_offert', title: 'Lavage 1 Vêtement Offert', cost: 50, discountAmount: 2000, iconName: 'Shirt', description: 'Un lavage gratuit pour une pièce au choix.' },
      { id: 'livraison_offerte', title: 'Livraison Offerte', cost: 60, discountAmount: 1500, iconName: 'Truck', description: 'Frais de livraison 100% offerts.' },
      { id: 'repassage_offert', title: 'Repassage Offert', cost: 100, discountAmount: 4000, iconName: 'Sparkles', description: 'Repassage complet offert sur vos vêtements.' },
      { id: 'remise_5000', title: 'Remise 5 000 FCFA Abonnement', cost: 150, discountAmount: 5000, iconName: 'Gift', description: 'Réduction de 5 000 FCFA lors du renouvellement d\'abonnement.' }
    ];
  },
  updateRewardCatalog: (catalog: any[]) => {
    if (!memoryDb.settings) {
      memoryDb.settings = {} as any;
    }
    memoryDb.settings.reward_catalog = catalog;
    saveSession('klin_up_settings', memoryDb.settings);
    dbEngine.logAction('MODIFICATION_CATALOGUE_RECOMPENSES', `Mise à jour du catalogue des récompenses (${catalog.length} offres).`);
    notifyListeners();
    return memoryDb.settings.reward_catalog;
  },
  getCashClosures: () => {
    const closures = memoryDb.cash_closures ? [...memoryDb.cash_closures] : [];
    const user = memoryDb.current_user;
    const isSuperAdmin = user?.role === 'super_admin';
    const sid = (!isSuperAdmin && user)
      ? (user.store_id || (user as any).laverie_id || (user as any).laverie || 'store_central')
      : (memoryDb.selected_store_id || 'all');

    if (sid === 'all') return closures;
    const targetStore = memoryDb.stores?.find(st => st.id === sid || st.code === sid);
    const storeCode = targetStore?.code;
    return closures.filter((c: any) => c.store_id === sid || (storeCode && c.store_id === storeCode));
  },
  getDebtPayments: () => {
    const debtPayments = memoryDb.debt_payments ? [...memoryDb.debt_payments] : [];
    const user = memoryDb.current_user;
    const isSuperAdmin = user?.role === 'super_admin';
    const sid = (!isSuperAdmin && user)
      ? (user.store_id || (user as any).laverie_id || (user as any).laverie || 'store_central')
      : (memoryDb.selected_store_id || 'all');

    if (sid === 'all') return debtPayments;
    const targetStore = memoryDb.stores?.find(st => st.id === sid || st.code === sid);
    const storeCode = targetStore?.code;
    return debtPayments.filter((d: any) => d.store_id === sid || (storeCode && d.store_id === storeCode));
  },
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
      if (user.role !== 'super_admin') {
        const userStore = user.store_id || (user as any).laverie_id || (user as any).laverie || 'store_central';
        memoryDb.selected_store_id = userStore;
        saveSession('klin_up_selected_store', userStore);
      }
      dbEngine.logAction('CONNEXION', `Connexion de ${user.prenom} ${user.nom} (${user.role})`);
    } else {
      removeSession('klin_up_current_user');
      dbEngine.logAction('DECONNEXION', `Déconnexion de l'utilisateur`);
    }
    notifyListeners();
  },

  setSelectedStoreId: (storeId: string): void => {
    const user = memoryDb.current_user;
    if (user && user.role !== 'super_admin') {
      // Les managers et agents ne peuvent pas changer de laverie ni accéder aux données globales
      return;
    }
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
    const currentStoreId = dbEngine.getSelectedStoreId();
    const logStoreId = currentStoreId !== 'all' ? currentStoreId : (currentUser?.store_id || 'store_central');
    const newLog: ActivityLog = {
      id: 'l_' + Math.random().toString(36).substr(2, 9),
      user_id: currentUser ? currentUser.id : 'u_system',
      user_name: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Système',
      store_id: logStoreId,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    memoryDb.logs.unshift(newLog);
    notifyListeners();

    // Payload Supabase complet avec user_name et store_id
    const dbPayload = {
      id: newLog.id,
      user_id: newLog.user_id,
      user_name: newLog.user_name || (currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Système'),
      store_id: newLog.store_id || 'store_central',
      action: newLog.action,
      details: newLog.details,
      timestamp: newLog.timestamp
    };

    performMutation('insert', 'activity_logs', newLog.id, dbPayload)
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
        can_edit_catalog: staffData.role === 'super_admin' || staffData.role === 'manager' || staffData.role === 'editeur_catalogue',
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

  adjustCustomerPoints: async (customerId: string, pointsDelta: number, reason?: string): Promise<Customer | undefined> => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (!customer) return;

    const currentPts = customer.points_fidelite || 0;
    const newPts = Math.max(0, currentPts + pointsDelta);
    
    await performMutation('update', 'customers', customerId, { points_fidelite: newPts });
    customer.points_fidelite = newPts;

    const actionText = pointsDelta >= 0 ? `+${pointsDelta} pts` : `${pointsDelta} pts`;
    dbEngine.logAction(
      'AJUSTEMENT_POINTS_FIDELITE',
      `Points de fidélité ajustés pour ${customer.prenom} ${customer.nom} (${actionText}, NOUVEAU SOLDE: ${newPts} pts). Motif: ${reason || 'Ajustement Admin'}`
    );
    notifyListeners();
    return customer;
  },

  redeemCustomerReward: async (customerId: string, rewardId: string, rewardTitle: string, pointsCost: number): Promise<Customer | undefined> => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (!customer) return;

    const currentPts = customer.points_fidelite || 0;
    if (currentPts < pointsCost) {
      throw new Error(`Solde de points insuffisant (${currentPts} pts vs ${pointsCost} pts requis).`);
    }

    const newPts = currentPts - pointsCost;
    await performMutation('update', 'customers', customerId, { points_fidelite: newPts });
    customer.points_fidelite = newPts;

    dbEngine.logAction(
      'UTILISATION_RECOMPENSE',
      `Récompense '${rewardTitle}' débloquée pour ${customer.prenom} ${customer.nom} (-${pointsCost} pts, NOUVEAU SOLDE: ${newPts} pts)`
    );
    notifyListeners();
    return customer;
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

    const customer = memoryDb.customers.find(c => c.id === newOrder.customer_id);
    if (customer) {
      const unpaidBalance = newOrder.prix_total - newOrder.avance_payee;
      if (unpaidBalance > 0) {
        customer.solde_dette = Math.max(0, Number(customer.solde_dette || 0) + unpaidBalance);
      }

      const sysSettings = dbEngine.getSettings();
      const fidelityActive = sysSettings.fidelity_active ?? true;
      const spendPerPoint = Number(sysSettings.fidelity_spend_per_point) || 1000;
      if (fidelityActive && newOrder.avance_payee > 0) {
        const earnedPoints = Math.floor(newOrder.avance_payee / spendPerPoint);
        if (earnedPoints > 0) {
          customer.points_fidelite = (Number(customer.points_fidelite) || 0) + earnedPoints;
        }
      }

      await performMutation('update', 'customers', customer.id, {
        solde_dette: customer.solde_dette,
        points_fidelite: customer.points_fidelite
      }).catch(e => console.warn('[DB] Customer update error on createOrder:', e));
    }

    await performMutation('insert', 'orders', newOrder.id, newOrder);
    memoryDb.orders.unshift(newOrder);
    dbEngine.logAction('CREATION_COMMANDE', `Commande créée : ${newOrder.identifiant_unique_marquage} (${newOrder.prix_total} FCFA)`);
    notifyListeners();
    return newOrder;
  },

  deliverOrderWithPayment: async (
    orderId: string,
    amountPaid: number,
    paymentMethod: string,
    finalStatus: string = 'restitue',
    referencePaiement: string | null = null,
    operateurMomo: string | null = null
  ): Promise<Order | undefined> => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    const normalizedFinalStatus = (finalStatus === 'livre' ? 'restitue' : finalStatus) as OrderStatus;
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);

    const totalVal = Number(order.prix_total || 0);
    const avanceVal = Number(order.avance_payee || 0);
    const cleanAmountPaid = isNaN(Number(amountPaid)) ? Math.max(0, totalVal - avanceVal) : Math.max(0, Number(amountPaid));

    order.statut = normalizedFinalStatus;
    order.mode_reglement = paymentMethod || order.mode_reglement || 'especes';
    order.avance_payee = avanceVal + cleanAmountPaid;
    order.solde_paid_at = new Date().toISOString();
    if (referencePaiement) (order as any).reference_momo = referencePaiement;
    if (operateurMomo) (order as any).operateur_momo = operateurMomo;

    if (customer && cleanAmountPaid > 0) {
      const currentDette = Number(customer.solde_dette) || 0;
      customer.solde_dette = Math.max(0, currentDette - cleanAmountPaid);

      const sysSettings = dbEngine.getSettings();
      const fidelityActive = sysSettings.fidelity_active ?? true;
      const spendPerPoint = Number(sysSettings.fidelity_spend_per_point) || 1000;
      if (fidelityActive) {
        const earnedPoints = Math.floor(cleanAmountPaid / spendPerPoint);
        if (earnedPoints > 0) {
          customer.points_fidelite = (Number(customer.points_fidelite) || 0) + earnedPoints;
        }
      }

      await performMutation('update', 'customers', customer.id, {
        solde_dette: customer.solde_dette,
        points_fidelite: customer.points_fidelite
      }).catch(e => console.warn('[DB] Customer update error on deliverOrderWithPayment:', e));
    }

    await performMutation('update', 'orders', orderId, {
      statut: order.statut,
      mode_reglement: order.mode_reglement,
      avance_payee: order.avance_payee,
      solde_paid_at: order.solde_paid_at
    });

    dbEngine.logAction('PAIEMENT_FINAL', `Livraison commande ${order.identifiant_unique_marquage || order.id}. Règlement solde: ${cleanAmountPaid} FCFA`);
    notifyListeners();
    return order;
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

  addCatalogItem: async (
    itemDataOrArticle: Partial<CatalogItem> | string,
    service?: string,
    prix?: number,
    categorie?: 'individuel' | 'abonnement' | 'exclusif',
    description?: string,
    prix_urgent?: number,
    nombre_vetements?: number,
    ramassage?: boolean,
    nombre_ramassages?: number,
    ramassage_gratuit?: boolean,
    livraison_gratuite?: boolean,
    store_id?: string | null
  ): Promise<CatalogItem> => {
    let itemData: Partial<CatalogItem>;
    if (typeof itemDataOrArticle === 'string') {
      itemData = {
        article: itemDataOrArticle,
        service: service || 'lavage_simple',
        prix: Number(prix || 0),
        categorie: categorie || 'individuel',
        description: description || '',
        store_id: store_id !== undefined ? store_id : (memoryDb.selected_store_id !== 'all' ? memoryDb.selected_store_id : null)
      };
    } else {
      itemData = itemDataOrArticle || {};
    }

    const effectiveStoreId = itemData.store_id !== undefined 
      ? itemData.store_id 
      : (memoryDb.selected_store_id !== 'all' ? memoryDb.selected_store_id : null);

    const newItem: CatalogItem = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      article: itemData.article || 'Article',
      service: itemData.service || 'lavage_simple',
      prix: Number(itemData.prix || 0),
      categorie: itemData.categorie || 'individuel',
      description: itemData.description || '',
      is_active: itemData.is_active !== false,
      statut: itemData.is_active !== false ? 'actif' : 'inactif',
      store_id: effectiveStoreId
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
