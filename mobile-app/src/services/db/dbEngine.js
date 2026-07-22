/**
 * @file dbEngine.js
 * @description Moteur de base de données local (en mémoire) avec persistance via AsyncStorage.
 * Gère les opérations CRUD locales pour le personnel, les clients, les commandes, les tarifs et les logs d'activité.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  DEFAULT_STAFF, 
  DEFAULT_CUSTOMERS, 
  DEFAULT_ORDERS, 
  DEFAULT_LOGS, 
  DEFAULT_CATALOG
} from './seeds';
import { performMutation, initDb, persist } from './syncEngine';
import { supabase } from '../supabaseClient';

// Base de données locale en mémoire
export const memoryDb = {
  staff: DEFAULT_STAFF,
  customers: DEFAULT_CUSTOMERS,
  orders: DEFAULT_ORDERS,
  logs: DEFAULT_LOGS,
  notifications: [],
  catalog: DEFAULT_CATALOG,
  current_user: null,
  pin_reset_requests: [],
  sync_queue: [],
  dark_mode: false
};

// Ensemble d'écouteurs de changement d'état (Pattern Observateur)
export const listeners = new Set();

/**
 * Notifie tous les écouteurs qu'un changement a eu lieu dans memoryDb.
 * Permet aux composants React de se rafraîchir automatiquement.
 */
export const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

/**
 * Hydrate une commande avec les détails d'abonnements calculés pour l'affichage.
 * @param {Object} order - La commande brute à hydrater.
 * @returns {Object} La commande hydratée avec les valeurs numériques typées.
 */
export function hydrateOrder(order) {
  if (!order) return order;
  const hydrated = { ...order };
  if (order.subscription_details) {
    if (order.subscription_details.remise_pourcentage !== undefined) {
      hydrated.remise_pourcentage = Number(order.subscription_details.remise_pourcentage) || 0;
    }
    if (order.subscription_details.remise_montant !== undefined) {
      hydrated.remise_montant = Number(order.subscription_details.remise_montant) || 0;
    }
    if (order.subscription_details.prix_base_avant_remise !== undefined) {
      hydrated.prix_base_avant_remise = Number(order.subscription_details.prix_base_avant_remise) || 0;
    }
  }
  return hydrated;
}

// Interface publique de la base de données (l'objet db original)
export const db = {
  /**
   * S'abonne aux modifications de la base de données.
   * @param {Function} listener - Fonction de rappel déclenchée à chaque modification.
   * @returns {Function} Fonction pour annuler l'abonnement.
   */
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * Déclenche manuellement la notification de changement d'état.
   */
  notify: () => {
    notifyListeners();
  },

  /**
   * Force un rafraîchissement complet des données depuis Supabase.
   */
  refreshData: async () => {
    await initDb(true);
  },

  /**
   * Vérifie si le mode sombre est activé.
   * @returns {Boolean}
   */
  isDarkMode: () => memoryDb.dark_mode || false,

  /**
   * Active ou désactive le mode sombre et le persiste localement.
   * @param {Boolean} val
   */
  setDarkMode: (val) => {
    memoryDb.dark_mode = val;
    AsyncStorage.setItem('klin_up_dark_mode', JSON.stringify(val))
      .catch(e => console.error("Mode sombre non sauvegardé :", e));
    db.notify();
  },

  // --- LECTURE DES DONNÉES LOCALES (GETTERS) ---
  getStaff: () => [...memoryDb.staff],
  getCustomers: () => [...memoryDb.customers],
  getOrders: () => [...memoryDb.orders],
  getLogs: () => [...memoryDb.logs],
  getNotifications: () => {
    if (!memoryDb.notifications || memoryDb.notifications.length === 0) {
      if (memoryDb.logs && memoryDb.logs.length > 0) {
        memoryDb.notifications = memoryDb.logs.map(log => ({
          id: 'n_' + log.id,
          action: log.action,
          details: log.details,
          timestamp: log.timestamp,
          read: false
        }));
      } else {
        memoryDb.notifications = [];
      }
    }
    return [...memoryDb.notifications];
  },
  markNotificationRead: (id) => {
    if (!memoryDb.notifications) return;
    const item = memoryDb.notifications.find(n => n.id === id);
    if (item) {
      item.read = true;
      persist();
      db.notify();
    }
  },
  markAllNotificationsRead: () => {
    if (!memoryDb.notifications) return;
    memoryDb.notifications.forEach(n => { n.read = true; });
    persist();
    db.notify();
  },
  deleteNotification: (id) => {
    if (!memoryDb.notifications) return;
    memoryDb.notifications = memoryDb.notifications.filter(n => n.id !== id);
    persist();
    db.notify();
  },
  clearAllNotifications: () => {
    memoryDb.notifications = [];
    persist();
    db.notify();
  },
  getCatalog: () => [...memoryDb.catalog],
  getCurrentUser: () => memoryDb.current_user ? { ...memoryDb.current_user } : null,

  /**
   * Met à jour la liste des employés depuis Supabase.
   */
  refreshStaff: async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('staff').select('*');
      if (!error && data && data.length > 0) {
        memoryDb.staff = data;
        await persist();
        db.notify();
      }
    } catch (e) {
      console.error("Échec de la récupération du personnel :", e);
    }
  },

  /**
   * Définit l'utilisateur actuellement connecté et log l'action.
   * @param {Object|null} user - Données de l'utilisateur ou null pour déconnecter.
   */
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

  /**
   * Enregistre une action utilisateur dans les journaux d'activité et la synchronise.
   * @param {String} action - Le type d'action (ex: 'CREATION_COMMANDE').
   * @param {String} details - Description détaillée en français.
   * @returns {Object} Le journal d'activité créé.
   */
  logAction: (action, details) => {
    const currentUser = db.getCurrentUser();
    const newLog = {
      id: 'l_' + Math.random().toString(36).substring(2, 11),
      user_id: currentUser ? currentUser.id : null,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    memoryDb.logs.unshift(newLog);

    if (!memoryDb.notifications) memoryDb.notifications = [];
    memoryDb.notifications.unshift({
      id: 'n_' + newLog.id,
      action: newLog.action,
      details: newLog.details,
      timestamp: newLog.timestamp,
      read: false
    });

    persist();
    db.notify();

    performMutation('insert', 'activity_logs', newLog.id, newLog);
    return newLog;
  },

  // --- GESTION DU CUSTOMER / CLIENTS ---

  /**
   * Ajoute un nouveau client en local et le pousse vers Supabase.
   * @param {Object} customer - Les informations de base du client (nom, prenom, telephone, adresse, indicatif).
   * @returns {Object} Le client créé.
   */
  addCustomer: (customer) => {
    const cleanPhone = customer.telephone.trim();
    const phoneExists = memoryDb.customers.some(c => c.telephone.trim() === cleanPhone);
    if (phoneExists) {
      throw new Error("Ce numéro de téléphone est déjà associé à un autre client actif.");
    }
    const newCustomer = {
      id: 'c_' + Math.random().toString(36).substring(2, 11),
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

    performMutation('insert', 'customers', newCustomer.id, newCustomer, () => {
      memoryDb.customers = memoryDb.customers.filter(c => c.id !== newCustomer.id);
      persist();
      db.notify();
    });
    return newCustomer;
  },

  /**
   * Modifie un client existant et applique les mutations réseau.
   */
  updateCustomer: (id, updatedFields) => {
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

      const updateData = {
        nom: customer.nom,
        prenom: customer.prenom,
        telephone: customer.telephone,
        adresse: customer.adresse,
        preferences_pliage: customer.preferences_pliage
      };

      performMutation('update', 'customers', id, updateData, () => {
        const current = memoryDb.customers.find(c => c.id === id);
        if (current) {
          Object.assign(current, original);
          persist();
          db.notify();
        }
      });
      return customer;
    }
    return null;
  },

  /**
   * Supprime définitivement un client.
   */
  deleteCustomer: (id) => {
    const idx = memoryDb.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      const customer = memoryDb.customers[idx];
      memoryDb.customers.splice(idx, 1);
      db.logAction('SUPPRESSION_CLIENT', `Client ${customer.prenom} ${customer.nom} supprimé`);
      persist();
      db.notify();

      performMutation('delete', 'customers', id, null, () => {
        memoryDb.customers.push(customer);
        persist();
        db.notify();
      });
      return true;
    }
    return false;
  },

  /**
   * Ajuste la dette d'un client.
   */
  updateCustomerDebt: (customerId, amount) => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (customer) {
      const originalDebt = customer.solde_dette;
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) + Number(amount));
      db.logAction('MAJ_SOLDE_FINANCIER', `Solde dette de ${customer.prenom} ${customer.nom} modifié de ${amount} FCFA (Nouveau solde: ${customer.solde_dette} FCFA)`);
      persist();
      db.notify();

      performMutation('update', 'customers', customerId, { solde_dette: customer.solde_dette }, () => {
        customer.solde_dette = originalDebt;
        persist();
        db.notify();
      });
    }
  },

  // --- CONFIGURATION CATALOGUE / TARIFS ---

  updateCatalogPrice: (id, newPrice) => {
    const item = memoryDb.catalog.find(i => i.id === id);
    if (item) {
      const oldPrice = item.prix;
      item.prix = Number(newPrice);
      db.logAction('MODIFICATION_TARIF', `Tarif ${item.article} + ${item.service} modifié de ${oldPrice} à ${newPrice} FCFA`);
      persist();
      db.notify();

      performMutation('update', 'catalog', id, { prix: item.prix }, () => {
        item.prix = oldPrice;
        persist();
        db.notify();
      });
    }
  },

  updateCatalogItem: (id, updatedFields) => {
    const item = memoryDb.catalog.find(i => i.id === id);
    if (item) {
      const oldName = item.article;
      const oldPrice = item.prix;
      const oldDesc = item.description || '';
      const original = { ...item };
      
      if (updatedFields.article !== undefined) item.article = updatedFields.article;
      if (updatedFields.prix !== undefined) item.prix = Number(updatedFields.prix);
      if (updatedFields.description !== undefined) item.description = updatedFields.description;
      
      db.logAction(
        'MODIFICATION_TARIF', 
        `Item ${oldName} modifié : Formule(${oldName} -> ${item.article}), Prix(${oldPrice} -> ${item.prix} F), Description(${oldDesc} -> ${item.description})`
      );
      persist();
      db.notify();

      const updateData = {
        article: item.article,
        prix: item.prix,
        description: item.description
      };

      performMutation('update', 'catalog', id, updateData, () => {
        Object.assign(item, original);
        persist();
        db.notify();
      });
      return item;
    }
  },

  addCatalogItem: (article, service, prix, categorie = 'individuel', description = '') => {
    const newItem = {
      id: 'cat_' + Math.random().toString(36).substring(2, 11),
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

    performMutation('insert', 'catalog', newItem.id, newItem, () => {
      memoryDb.catalog = memoryDb.catalog.filter(i => i.id !== newItem.id);
      persist();
      db.notify();
    });
    return newItem;
  },

  // --- GESTION DES COMMANDES (ORDERS) ---

  /**
   * Crée une commande, calcule les tarifs/abonnements, et applique les fidélités.
   */
  createOrder: (orderData) => {
    const customer = memoryDb.customers.find(c => c.id === orderData.customer_id);
    const originalCustomerState = customer ? structuredClone(customer) : null;
    
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

    const inputItems = (orderData.items || orderData.articles || []).map(item => ({
      article: item.article,
      service: item.service,
      quantite: Number(item.quantite || item.quantity || 1),
      prix: Number(item.prix || item.price || 0)
    }));

    if (inputItems.length > 0) {
      inputItems.forEach(item => {
        totalClothes += item.quantite;
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
      if (inputItems.length > 0) {
        inputItems.forEach(item => {
          const catalogItem = memoryDb.catalog.find(c => c.article === item.article && c.service === item.service);
          const itemPrice = catalogItem ? catalogItem.prix : (item.prix || 1500);
          totalPrice += itemPrice * item.quantite;
        });
      } else {
        const typeArticle = orderData.type_article || '';
        const typeService = orderData.type_service || '';
        const catalogItem = memoryDb.catalog.find(item => item.article === typeArticle && item.service === typeService);
        const basePrice = catalogItem ? catalogItem.prix : 1500;
        totalPrice = basePrice;
      }

      const urgency = orderData.niveau_urgence || 'Normal';
      if (urgency === 'Express') {
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

    const avanceInput = orderData.avance_payee !== undefined ? orderData.avance_payee : (orderData.avance !== undefined ? orderData.avance : 0);
    const advancePaid = (isSubscriptionOrder && !subscribedPlan) ? 0 : Number(avanceInput);
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
    const urgencyVal = orderData.niveau_urgence || 'Normal';
    const hoursToAdd = urgencyVal === 'Express' ? expressHours : normalHours;
    
    const dueDate = orderData.due_date || (orderData.date_retrait_prevue ? new Date(orderData.date_retrait_prevue).toISOString() : new Date(Date.now() + 3600000 * hoursToAdd).toISOString());
    const nowStr = new Date().toISOString();

    const currentUser = db.getCurrentUser();
    const modeReglementVal = orderData.mode_reglement || orderData.mode_paiement || 'Espèces';
    const initialStatus = orderData.statut === 'attente' ? 'en_attente' : (orderData.statut || 'en_attente');

    const newOrder = {
      id: (() => {
        const numericIds = memoryDb.orders.map(o => {
          const num = Number.parseInt(o.id, 10);
          return Number.isNaN(num) ? 0 : num;
        });
        const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
        return String(Math.max(1001, maxId + 1));
      })(),
      customer_id: orderData.customer_id,
      statut: initialStatus,
      type_article: orderData.type_article || (inputItems[0] ? inputItems[0].article : 'Divers'),
      type_service: orderData.type_service || (inputItems[0] ? inputItems[0].service : 'lavage_simple'),
      niveau_urgence: urgencyVal,
      mode_reglement: isSubscriptionOrder ? (subscribedPlan ? modeReglementVal : 'abonnement') : modeReglementVal,
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
      items: inputItems,
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

    newOrder.subscription_details = {
      ...newOrder.subscription_details,
      remise_pourcentage: discountPercent,
      remise_montant: discountAmount,
      prix_base_avant_remise: basePriceBeforeRemise
    };

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

    performMutation('insert', 'orders', newOrder.id, newOrder, () => {
      memoryDb.orders = memoryDb.orders.filter(o => o.id !== newOrder.id);
      if (customer && originalCustomerState) {
        Object.assign(customer, originalCustomerState);
      }
      persist();
      db.notify();
    });

    if (customer) {
      const updateData = {
        solde_dette: customer.solde_dette,
        points_fidelite: customer.points_fidelite,
        active_subscription: customer.active_subscription
      };
      performMutation('update', 'customers', customer.id, updateData);
    }
    return newOrder;
  },

  /**
   * Met à jour le statut d'une commande.
   */
  updateOrderStatus: (orderId, newStatus) => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    let normalizedStatus = newStatus;
    if (newStatus === 'livre') normalizedStatus = 'restitue';
    else if (newStatus === 'lavage_cours') normalizedStatus = 'en_cours_lavage';
    else if (newStatus === 'repassage_cours') normalizedStatus = 'en_cours_repassage';
    else if (newStatus === 'attente') normalizedStatus = 'en_attente';
    else if (!normalizedStatus) normalizedStatus = 'restitue';

    const originalOrderState = { ...order };
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);
    const originalCustomerState = customer ? { ...customer } : null;

    const oldStatus = order.statut;
    order.statut = normalizedStatus;

    let typeLivraison = order.subscription_details?.type_livraison;
    if (normalizedStatus === 'a_recuperer') {
      typeLivraison = 'recuperation';
    } else if (normalizedStatus === 'a_livrer' || normalizedStatus === 'en_cours_livraison') {
      typeLivraison = 'livraison';
    } else if (normalizedStatus === 'restitue') {
      if (oldStatus === 'a_recuperer') {
        typeLivraison = 'recuperation';
      } else if (oldStatus === 'en_cours_livraison' || oldStatus === 'a_livrer') {
        typeLivraison = 'livraison';
      }
    }

    if (typeLivraison) {
      order.subscription_details = {
        ...order.subscription_details,
        type_livraison: typeLivraison
      };
    }

    if (normalizedStatus === 'restitue' || normalizedStatus === 'a_livrer' || normalizedStatus === 'a_recuperer') {
      order.solde_paid_at = new Date().toISOString();
      if (customer) {
        const totalVal = Number(order.prix_total || order.total || 0);
        const avanceVal = Number(order.avance_payee || order.avance || 0);
        const remainingToPay = Math.max(0, totalVal - avanceVal);
        if (remainingToPay > 0) {
          const currentDette = Number(customer.solde_dette) || 0;
          customer.solde_dette = Math.max(0, currentDette - remainingToPay);
          const newPoints = Math.floor(remainingToPay / 1000) * 1;
          customer.points_fidelite = (Number(customer.points_fidelite) || 0) + newPoints;
          db.logAction('PAIEMENT_FINAL', `Règlement du solde restant (${remainingToPay} FCFA) par le client ${customer.prenom} ${customer.nom} lors de la restitution`);
          
          performMutation('update', 'customers', customer.id, {
            solde_dette: customer.solde_dette,
            points_fidelite: customer.points_fidelite
          });
        }
      }
    }

    db.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage || order.id} passée de '${oldStatus}' à '${newStatus}'`);
    persist();
    db.notify();

    const updateData = {
      statut: order.statut,
      solde_paid_at: order.solde_paid_at,
      subscription_details: order.subscription_details
    };

    performMutation('update', 'orders', orderId, updateData, () => {
      Object.assign(order, originalOrderState);
      if (customer && originalCustomerState) {
        Object.assign(customer, originalCustomerState);
      }
      persist();
      db.notify();
    });
    return order;
  },

  /**
   * Finalise une commande en validant le paiement final et en restituant les vêtements.
   */
  deliverOrderWithPayment: (orderId, amountPaid, paymentMethod, finalStatus = 'restitue', referencePaiement = null) => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    let normalizedFinalStatus = 'restitue';
    if (finalStatus && typeof finalStatus === 'string' && finalStatus.trim()) {
      normalizedFinalStatus = finalStatus === 'livre' ? 'restitue' : finalStatus;
    }

    const originalOrderState = { ...order };
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);
    const originalCustomerState = customer ? { ...customer } : null;

    const oldStatus = order.statut;

    const totalVal = Number(order.prix_total || order.total || 0);
    const avanceVal = Number(order.avance_payee || order.avance || 0);
    const cleanAmountPaid = isNaN(Number(amountPaid)) ? Math.max(0, totalVal - avanceVal) : Math.max(0, Number(amountPaid));

    order.statut = normalizedFinalStatus;
    order.mode_reglement = paymentMethod || order.mode_reglement || 'Espèces';
    if (referencePaiement) {
      order.reference_momo = referencePaiement;
      order.reference_paiement = referencePaiement;
    }
    
    order.avance_payee = avanceVal + cleanAmountPaid;
    order.prix_total = totalVal;
    order.total = totalVal;
    order.solde_paid_at = new Date().toISOString();

    let typeLivraison = order.subscription_details?.type_livraison;
    if (normalizedFinalStatus === 'restitue') {
      if (oldStatus === 'a_recuperer') {
        typeLivraison = 'recuperation';
      } else if (oldStatus === 'en_cours_livraison' || oldStatus === 'a_livrer') {
        typeLivraison = 'livraison';
      }
    }

    if (typeLivraison) {
      order.subscription_details = {
        ...order.subscription_details,
        type_livraison: typeLivraison
      };
    }

    if (customer && cleanAmountPaid > 0) {
      const currentDette = Number(customer.solde_dette) || 0;
      customer.solde_dette = Math.max(0, currentDette - cleanAmountPaid);
      const newPoints = Math.floor(cleanAmountPaid / 1000) * 1;
      customer.points_fidelite = (Number(customer.points_fidelite) || 0) + newPoints;
      
      performMutation('update', 'customers', customer.id, {
        solde_dette: customer.solde_dette,
        points_fidelite: customer.points_fidelite
      });
    }

    db.logAction(
      'PAIEMENT_FINAL', 
      `Livraison commande ${order.identifiant_unique_marquage || order.id}. Paiement reçu : ${cleanAmountPaid} FCFA (Méthode: ${paymentMethod})` + (referencePaiement ? ` (Réf: ${referencePaiement})` : '')
    );
    db.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage || order.id} passée de '${oldStatus}' à '${normalizedFinalStatus}'`);
    persist();
    db.notify();

    const updateData = {
      statut: order.statut,
      mode_reglement: order.mode_reglement,
      avance_payee: order.avance_payee,
      solde_paid_at: order.solde_paid_at,
      subscription_details: order.subscription_details,
      reference_momo: order.reference_momo,
      reference_paiement: order.reference_paiement
    };

    performMutation('update', 'orders', orderId, updateData, () => {
      Object.assign(order, originalOrderState);
      if (customer && originalCustomerState) {
        Object.assign(customer, originalCustomerState);
      }
      persist();
      db.notify();
    });
    return order;
  },

  /**
   * Annule une commande et ajuste les soldes débiteurs en conséquence.
   */
  cancelOrder: (orderId, reason = '') => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    const originalOrderState = { ...order };
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);
    const originalCustomerState = customer ? { ...customer } : null;

    order.statut = 'annule';
    order.motif_annulation = reason;

    const unpaid = order.prix_total - order.avance_payee;
    if (unpaid > 0 && customer) {
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) - unpaid);
      performMutation('update', 'customers', customer.id, { solde_dette: customer.solde_dette });
    }

    db.logAction('ANNULATION_COMMANDE', `Commande ${order.identifiant_unique_marquage} annulée. Motif : ${reason}`);
    persist();
    db.notify();

    performMutation('update', 'orders', orderId, { statut: 'annule', motif_annulation: reason }, () => {
      Object.assign(order, originalOrderState);
      if (customer && originalCustomerState) {
        Object.assign(customer, originalCustomerState);
      }
      persist();
      db.notify();
    });
    return order;
  },

  deleteOrder: (id) => {
    const idx = memoryDb.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      memoryDb.orders.splice(idx, 1);
      performMutation('delete', 'orders', id, null);
      persist();
      db.notify();
    }
  },

  // --- GESTION DU PERSONNEL (STAFF) ---

  addStaff: (member) => {
    const newMember = {
      id: 'u_' + Math.random().toString(36).substring(2, 11),
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

    performMutation('insert', 'staff', newMember.id, newMember, () => {
      memoryDb.staff = memoryDb.staff.filter(s => s.id !== newMember.id);
      persist();
      db.notify();
    });
    return newMember;
  },

  updateStaff: (id, updatedFields) => {
    const member = memoryDb.staff.find(s => s.id === id);
    if (member) {
      const original = { ...member };
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

      const updateData = {
        nom: member.nom,
        prenom: member.prenom,
        role: member.role,
        email: member.email,
        telephone: member.telephone,
        statut: member.statut,
        permissions: member.permissions
      };

      performMutation('update', 'staff', id, updateData, () => {
        Object.assign(member, original);
        persist();
        db.notify();
      });
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

      performMutation('delete', 'staff', id, null, () => {
        memoryDb.staff.push(member);
        persist();
        db.notify();
      });
      return true;
    }
    return false;
  },

  // --- GESTION DES ABONNEMENTS CLIENTS ---

  subscribeCustomer: (customerId, catalogItemId) => {
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

      performMutation('update', 'customers', customerId, { active_subscription: customer.active_subscription }, () => {
        customer.active_subscription = originalSubState;
        persist();
        db.notify();
      });
      return customer;
    }
  },

  unsubscribeCustomer: (customerId) => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (customer?.active_subscription) {
      const originalSubState = { ...customer.active_subscription };
      const oldName = customer.active_subscription.name;
      delete customer.active_subscription;
      db.logAction('DESABONNEMENT', `Client ${customer.prenom} ${customer.nom} s'est désabonné de ${oldName}`);
      persist();
      db.notify();

      performMutation('update', 'customers', customerId, { active_subscription: null }, () => {
        customer.active_subscription = originalSubState;
        persist();
        db.notify();
      });
      return customer;
    }
  },

  // --- PERMISSIONS ET SECURISE ---

  canUserViewCA: (user) => {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'manager';
  },

  canUserViewDashboard: (user) => {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'manager';
  },

  canUserManageOrders: (user) => !!user,

  canUserManageCRM: (user) => !!user,

  canUserEditCatalog: (user) => {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'manager';
  },

  canUserManageStaff: (user) => {
    if (!user) return false;
    return user.role === 'super_admin';
  },

  // --- REINITIALISATION DE PIN ---

  getPinResetRequests: () => memoryDb.pin_reset_requests ? [...memoryDb.pin_reset_requests] : [],

  createPinResetRequest: (email) => {
    if (!memoryDb.pin_reset_requests) {
      memoryDb.pin_reset_requests = [];
    }
    const staffMember = memoryDb.staff.find(s => s.email.toLowerCase() === email.toLowerCase());
    const newRequest = {
      id: 'req_' + Math.random().toString(36).substring(2, 11),
      email: email,
      staff_name: staffMember ? `${staffMember.prenom} ${staffMember.nom}` : 'Inconnu',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    memoryDb.pin_reset_requests.unshift(newRequest);
    db.logAction('DEMANDE_RESET_PIN', `Demande de réinitialisation de PIN reçue pour l'email: ${email}`);
    persist();
    db.notify();

    performMutation('insert', 'pin_reset_requests', newRequest.id, newRequest, () => {
      memoryDb.pin_reset_requests = memoryDb.pin_reset_requests.filter(r => r.id !== newRequest.id);
      persist();
      db.notify();
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

        performMutation('update', 'staff', staffMember.id, { code_pin: newPin });
        performMutation('update', 'pin_reset_requests', requestId, { status: 'approved', resolved_pin: newPin });
        return { req, newPin, staffMember };
      } else {
        req.status = 'rejected';
        db.logAction('MODIFICATION_PERSONNEL', `Demande de reset PIN rejetée : aucun personnel trouvé pour l'email ${req.email}`);
        persist();
        db.notify();

        performMutation('update', 'pin_reset_requests', requestId, { status: 'rejected' });
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

      performMutation('update', 'pin_reset_requests', requestId, { status: 'rejected' });
    }
  },

  resetStaffPin: (userId, newPin) => {
    const staffMember = memoryDb.staff.find(s => s.id === userId);
    if (staffMember) {
      staffMember.code_pin = newPin;
      db.logAction('MODIFICATION_PERSONNEL', `Code PIN réinitialisé manuellement par l'admin pour ${staffMember.prenom} ${staffMember.nom}. Nouveau PIN : ${newPin}`);
      persist();
      db.notify();

      performMutation('update', 'staff', userId, { code_pin: newPin });
      return staffMember;
    }
    return null;
  },

  isRemote: () => {
    try {
      const { getIsUsingRemote } = require('./syncEngine');
      return getIsUsingRemote();
    } catch(e) {
      console.warn("Could not load connection state from syncEngine:", e);
      return false;
    }
  },
  
  getSyncQueue: () => [...memoryDb.sync_queue],
  updateStaffPin: (userId, newPin) => db.resetStaffPin(userId, newPin),

  testConnection: async () => {
    if (!supabase) {
      return { success: false, error: "Client Supabase non initialisé (clés absentes ou incorrectes)." };
    }
    try {
      const { error } = await supabase.from('staff').select('id').limit(1);
      if (error) {
        return { success: false, error: error.message };
      }
      const { initDb: syncInitDb, getIsUsingRemote } = require('./syncEngine');
      if (!getIsUsingRemote()) {
        await syncInitDb(true);
      }
      return { success: true, message: "Connexion établie avec succès avec le cloud Supabase !" };
    } catch (e) {
      return { success: false, error: e.message || "Erreur de connexion réseau." };
    }
  }
};
