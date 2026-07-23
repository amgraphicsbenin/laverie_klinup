import { DEFAULT_STAFF, DEFAULT_CUSTOMERS, DEFAULT_ORDERS, DEFAULT_LOGS, DEFAULT_CATALOG } from './seeds';
import { performMutation, persist } from './syncEngine';

export const memoryDb = {
  staff: DEFAULT_STAFF,
  customers: DEFAULT_CUSTOMERS,
  orders: DEFAULT_ORDERS,
  logs: DEFAULT_LOGS,
  catalog: DEFAULT_CATALOG,
  current_user: null,
  pin_reset_requests: []
};

export const listeners = new Set();

export const notifyListeners = () => {
  listeners.forEach(l => l());
};

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

export const dbEngine = {
  getStaff: () => [...memoryDb.staff],
  getCustomers: () => [...memoryDb.customers],
  getOrders: () => [...memoryDb.orders],
  getLogs: () => [...memoryDb.logs],
  getCatalog: () => [...memoryDb.catalog],
  getCurrentUser: () => memoryDb.current_user ? { ...memoryDb.current_user } : null,

  setCurrentUser: (user) => {
    memoryDb.current_user = user;
    if (user) {
      dbEngine.logAction('CONNEXION', `Connexion de ${user.prenom} ${user.nom} (${user.role})`);
    } else {
      dbEngine.logAction('DECONNEXION', `Déconnexion de l'utilisateur`);
    }
    persist();
    notifyListeners();
  },

  logAction: (action, details) => {
    const currentUser = dbEngine.getCurrentUser();
    const newLog = {
      id: 'l_' + Math.random().toString(36).substr(2, 9),
      user_id: currentUser ? currentUser.id : null,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    memoryDb.logs.unshift(newLog);
    persist();
    notifyListeners();

    performMutation('insert', 'activity_logs', newLog.id, newLog);
    return newLog;
  },

  addCustomer: (customer) => {
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
    dbEngine.logAction('CREATION_CLIENT', `Client ${newCustomer.prenom} ${newCustomer.nom} ajouté (Tel: ${newCustomer.telephone})`);
    persist();
    notifyListeners();

    performMutation('insert', 'customers', newCustomer.id, newCustomer, () => {
      memoryDb.customers = memoryDb.customers.filter(c => c.id !== newCustomer.id);
      persist();
      notifyListeners();
    });
    return newCustomer;
  },

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
      
      dbEngine.logAction('MODIFICATION_CLIENT', `Client ${customer.prenom} ${customer.nom} mis à jour`);
      persist();
      notifyListeners();

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
          notifyListeners();
        }
      });
      return customer;
    }
    return null;
  },

  deleteCustomer: (id) => {
    const idx = memoryDb.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      const customer = memoryDb.customers[idx];
      memoryDb.customers.splice(idx, 1);
      dbEngine.logAction('SUPPRESSION_CLIENT', `Client ${customer.prenom} ${customer.nom} supprimé`);
      persist();
      notifyListeners();

      performMutation('delete', 'customers', id, null, () => {
        memoryDb.customers.push(customer);
        persist();
        notifyListeners();
      });
      return true;
    }
    return false;
  },

  updateCustomerDebt: (customerId, amount) => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (customer) {
      const originalDebt = customer.solde_dette;
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) + Number(amount));
      dbEngine.logAction('MAJ_SOLDE_FINANCIER', `Solde dette de ${customer.prenom} ${customer.nom} modifié de ${amount} FCFA (Nouveau solde: ${customer.solde_dette} FCFA)`);
      persist();
      notifyListeners();

      performMutation('update', 'customers', customerId, { solde_dette: customer.solde_dette }, () => {
        customer.solde_dette = originalDebt;
        persist();
        notifyListeners();
      });
    }
  },

  updateCatalogPrice: (id, newPrice) => {
    const item = memoryDb.catalog.find(i => i.id === id);
    if (item) {
      const oldPrice = item.prix;
      item.prix = Number(newPrice);
      dbEngine.logAction('MODIFICATION_TARIF', `Tarif ${item.article} + ${item.service} modifié de ${oldPrice} à ${newPrice} FCFA`);
      persist();
      notifyListeners();

      performMutation('update', 'catalog', id, { prix: item.prix }, () => {
        item.prix = oldPrice;
        persist();
        notifyListeners();
      });
    }
  },

  updateCatalogItem: (id, updatedFields) => {
    const item = memoryDb.catalog.find(i => i.id === id);
    if (item) {
      const original = { ...item };
      
      if (updatedFields.article !== undefined) item.article = updatedFields.article;
      if (updatedFields.prix !== undefined) item.prix = Number(updatedFields.prix);
      if (updatedFields.description !== undefined) item.description = updatedFields.description;
      if (updatedFields.service !== undefined) item.service = updatedFields.service;
      if (updatedFields.prix_urgent !== undefined) item.prix_urgent = Number(updatedFields.prix_urgent);
      
      if (updatedFields.nombre_vetements !== undefined) {
        item.nombre_vetements = updatedFields.nombre_vetements !== null ? Number(updatedFields.nombre_vetements) : null;
      }
      if (updatedFields.ramassage !== undefined) {
        item.ramassage = updatedFields.ramassage !== null ? Boolean(updatedFields.ramassage) : null;
      }
      if (updatedFields.nombre_ramassages !== undefined) {
        item.nombre_ramassages = updatedFields.nombre_ramassages !== null ? Number(updatedFields.nombre_ramassages) : null;
      }
      if (updatedFields.ramassage_gratuit !== undefined) {
        item.ramassage_gratuit = updatedFields.ramassage_gratuit !== null ? Boolean(updatedFields.ramassage_gratuit) : null;
      }
      if (updatedFields.livraison_gratuite !== undefined) {
        item.livraison_gratuite = updatedFields.livraison_gratuite !== null ? Boolean(updatedFields.livraison_gratuite) : null;
      }
      
      dbEngine.logAction(
        'MODIFICATION_TARIF', 
        `Item ${original.article} modifié : ${JSON.stringify(updatedFields)}`
      );
      persist();
      notifyListeners();

      const updateData = {
        article: item.article,
        prix: item.prix,
        description: item.description,
        service: item.service,
        prix_urgent: item.prix_urgent,
        nombre_vetements: item.nombre_vetements,
        ramassage: item.ramassage,
        nombre_ramassages: item.nombre_ramassages,
        ramassage_gratuit: item.ramassage_gratuit,
        livraison_gratuite: item.livraison_gratuite
      };

      performMutation('update', 'catalog', id, updateData, () => {
        Object.assign(item, original);
        persist();
        notifyListeners();
      });
      return item;
    }
  },

  addCatalogItem: (
    article, 
    service, 
    prix, 
    categorie = 'individuel', 
    description = '', 
    prix_urgent = null,
    nombre_vetements = null,
    ramassage = false,
    nombre_ramassages = null,
    ramassage_gratuit = false,
    livraison_gratuite = false
  ) => {
    const artCode = article.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const srvCode = service === 'lavage_simple' ? 'LAV' :
                    service === 'repassage' ? 'REP' :
                    service === 'nettoyage_a_sec' ? 'SEC' : 'GEN';
    const randomCode = Math.random().toString(36).substr(2, 4).toUpperCase();
    const sku = `KLIN-${artCode}-${srvCode}-${randomCode}`;

    const newItem = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      article,
      service,
      prix: Number(prix),
      categorie,
      description,
      sku,
      prix_urgent: prix_urgent !== null ? Number(prix_urgent) : null,
      nombre_vetements: nombre_vetements !== null ? Number(nombre_vetements) : null,
      ramassage: Boolean(ramassage),
      nombre_ramassages: nombre_ramassages !== null ? Number(nombre_ramassages) : null,
      ramassage_gratuit: Boolean(ramassage_gratuit),
      livraison_gratuite: Boolean(livraison_gratuite),
      is_active: true,
      statut: 'actif'
    };
    memoryDb.catalog.push(newItem);
    dbEngine.logAction('AJOUT_CATALOGUE', `Nouvel article ajouté au catalogue: ${article} (${service}) - SKU: ${sku} - ${prix} FCFA (Urgent: ${prix_urgent})`);
    persist();
    notifyListeners();

    performMutation('insert', 'catalog', newItem.id, newItem, () => {
      memoryDb.catalog = memoryDb.catalog.filter(i => i.id !== newItem.id);
      persist();
      notifyListeners();
    });
    return newItem;
  },

  toggleCatalogItemActive: (idOrArticleName) => {
    const itemsToToggle = memoryDb.catalog.filter(i => 
      i.id === idOrArticleName || 
      (i.article && i.article.trim().toLowerCase() === String(idOrArticleName).trim().toLowerCase())
    );
    if (itemsToToggle.length === 0) return false;

    const isCurrentlyActive = itemsToToggle.some(i => i.is_active !== false && i.statut !== 'inactif');
    const newActive = !isCurrentlyActive;

    itemsToToggle.forEach(item => {
      item.is_active = newActive;
      item.statut = newActive ? 'actif' : 'inactif';
    });

    const articleLabel = itemsToToggle[0].article;
    dbEngine.logAction(
      'MODIFICATION_CATALOGUE', 
      `Produit "${articleLabel}" ${newActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'} sur le catalogue`
    );

    persist();
    notifyListeners();

    itemsToToggle.forEach(item => {
      performMutation('update', 'catalog', item.id, {
        is_active: item.is_active,
        statut: item.statut
      });
    });

    return newActive;
  },

  deleteCatalogItem: (id) => {
    const idx = memoryDb.catalog.findIndex(i => i.id === id);
    if (idx !== -1) {
      const item = memoryDb.catalog[idx];
      memoryDb.catalog.splice(idx, 1);
      dbEngine.logAction('SUPPRESSION_CATALOGUE', `Article supprimé du catalogue: ${item.article} (${item.service})`);
      persist();
      notifyListeners();

      performMutation('delete', 'catalog', id, null);
    }
  },

  deleteCatalogItemsBatch: (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const itemsToDelete = memoryDb.catalog.filter(i => ids.includes(i.id));
    memoryDb.catalog = memoryDb.catalog.filter(i => !ids.includes(i.id));
    const namesList = itemsToDelete.map(item => `${item.article} (${item.service})`).join(', ');
    dbEngine.logAction('SUPPRESSION_CATALOGUE_BATCH', `${itemsToDelete.length} articles supprimés du catalogue: ${namesList}`);
    persist();
    notifyListeners();

    ids.forEach(id => {
      performMutation('delete', 'catalog', id, null);
    });
  },

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

        dbEngine.logAction('SOUSCRIPTION_ABONNEMENT', `Client ${customer.prenom} ${customer.nom} a souscrit à l'abonnement ${subscribedPlan.article} (${clothesCount} vêtements, ${subscribedPlan.prix} FCFA) lors de la création de commande`);
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

    let basePriceBeforeRemise = totalPrice;
    let discountPercent = Number(orderData.remise_pourcentage || 0);
    let discountAmount = 0;
    if (discountPercent > 0 && discountPercent <= 100) {
      discountAmount = Math.round(totalPrice * (discountPercent / 100));
      totalPrice = Math.max(0, totalPrice - discountAmount);
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

    const currentUser = dbEngine.getCurrentUser();

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
      ...(newOrder.subscription_details || {}),
      remise_pourcentage: discountPercent,
      remise_montant: discountAmount,
      prix_base_avant_remise: basePriceBeforeRemise
    };

    memoryDb.orders.push(newOrder);

    if (isSubscriptionOrder) {
      if (subscribedPlan) {
        dbEngine.logAction('COMMANDE_ABONNEMENT', `Commande ${codeMarquage} créée avec souscription immédiate à ${subscribedPlan.article} (${totalClothes} vêtements débités, nouveau solde: ${customer.active_subscription.remaining_clothes} vêtements)`);
      } else {
        dbEngine.logAction('COMMANDE_ABONNEMENT', `Commande ${codeMarquage} (${totalClothes} vêtements) débitée de l'abonnement ${customer.active_subscription.name} de ${customer.prenom} ${customer.nom} (Nouveau solde: ${customer.active_subscription.remaining_clothes} vêtements)`);
      }
    } else {
      dbEngine.logAction('CREATION_COMMANDE', `Commande ${codeMarquage} créée pour ${customer ? customer.prenom + ' ' + customer.nom : 'Client inconnu'} (${totalPrice} FCFA)`);
    }

    persist();
    notifyListeners();

    performMutation('insert', 'orders', newOrder.id, newOrder, () => {
      memoryDb.orders = memoryDb.orders.filter(o => o.id !== newOrder.id);
      if (customer && originalCustomerState) {
        Object.assign(customer, originalCustomerState);
      }
      persist();
      notifyListeners();
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

  updateOrderStatus: (orderId, newStatus) => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    const originalOrderState = { ...order };
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);
    const originalCustomerState = customer ? { ...customer } : null;

    const oldStatus = order.statut;
    order.statut = newStatus;

    let typeLivraison = order.subscription_details?.type_livraison;
    if (newStatus === 'a_recuperer') {
      typeLivraison = 'recuperation';
    } else if (newStatus === 'a_livrer' || newStatus === 'en_cours_livraison') {
      typeLivraison = 'livraison';
    } else if (newStatus === 'restitue') {
      if (oldStatus === 'a_recuperer') {
        typeLivraison = 'recuperation';
      } else if (oldStatus === 'en_cours_livraison' || oldStatus === 'a_livrer') {
        typeLivraison = 'livraison';
      }
    }

    if (typeLivraison) {
      order.subscription_details = {
        ...(order.subscription_details || {}),
        type_livraison: typeLivraison
      };
    }

    if (newStatus === 'restitue' || newStatus === 'a_livrer' || newStatus === 'a_recuperer') {
      order.solde_paid_at = new Date().toISOString();
      if (customer) {
        const remainingToPay = order.prix_total - order.avance_payee;
        if (remainingToPay > 0) {
          customer.solde_dette = Math.max(0, Number(customer.solde_dette) - remainingToPay);
          const newPoints = Math.floor(remainingToPay / 1000) * 1;
          customer.points_fidelite = (customer.points_fidelite || 0) + newPoints;
          dbEngine.logAction('PAIEMENT_FINAL', `Règlement du solde restant (${remainingToPay} FCFA) par le client ${customer.prenom} ${customer.nom} lors de la restitution`);
          
          performMutation('update', 'customers', customer.id, {
            solde_dette: customer.solde_dette,
            points_fidelite: customer.points_fidelite
          });
        }
      }
    }

    dbEngine.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage} passée de '${oldStatus}' à '${newStatus}'`);
    persist();
    notifyListeners();

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
      notifyListeners();
    });
    return order;
  },

  deliverOrderWithPayment: (orderId, amountPaid, paymentMethod, finalStatus = 'restitue', referencePaiement = null) => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    const originalOrderState = { ...order };
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);
    const originalCustomerState = customer ? { ...customer } : null;

    const oldStatus = order.statut;
    order.statut = finalStatus;
    order.mode_reglement = paymentMethod;
    if (referencePaiement) {
      order.reference_momo = referencePaiement;
      order.reference_paiement = referencePaiement;
    }
    
    order.avance_payee = Number(order.avance_payee) + Number(amountPaid);
    order.solde_paid_at = new Date().toISOString();

    let typeLivraison = order.subscription_details?.type_livraison;
    if (finalStatus === 'restitue') {
      if (oldStatus === 'a_recuperer') {
        typeLivraison = 'recuperation';
      } else if (oldStatus === 'en_cours_livraison' || oldStatus === 'a_livrer') {
        typeLivraison = 'livraison';
      }
    }

    if (typeLivraison) {
      order.subscription_details = {
        ...(order.subscription_details || {}),
        type_livraison: typeLivraison
      };
    }

    if (customer && amountPaid > 0) {
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) - Number(amountPaid));
      const newPoints = Math.floor(amountPaid / 1000) * 1;
      customer.points_fidelite = (customer.points_fidelite || 0) + newPoints;
      
      performMutation('update', 'customers', customer.id, {
        solde_dette: customer.solde_dette,
        points_fidelite: customer.points_fidelite
      });
    }

    dbEngine.logAction(
      'PAIEMENT_FINAL', 
      `Livraison commande ${order.identifiant_unique_marquage}. Paiement reçu : ${amountPaid} FCFA (Méthode: ${paymentMethod})` + (referencePaiement ? ` (Réf: ${referencePaiement})` : '')
    );
    dbEngine.logAction('MISE_A_JOUR_STATUT', `Commande ${order.identifiant_unique_marquage} passée de '${oldStatus}' à '${finalStatus}'`);
    persist();
    notifyListeners();

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
      notifyListeners();
    });
    return order;
  },

  cancelOrder: (orderId, reason = '') => {
    const order = memoryDb.orders.find(o => o.id === orderId);
    if (!order) return;

    const originalOrderState = { ...order };
    const customer = memoryDb.customers.find(c => c.id === order.customer_id);
    const originalCustomerState = customer ? { ...customer } : null;

    const oldStatus = order.statut;
    order.statut = 'annule';
    order.motif_annulation = reason;

    const unpaid = order.prix_total - order.avance_payee;
    if (unpaid > 0 && customer) {
      customer.solde_dette = Math.max(0, Number(customer.solde_dette) - unpaid);
      performMutation('update', 'customers', customer.id, { solde_dette: customer.solde_dette });
    }

    dbEngine.logAction('ANNULATION_COMMANDE', `Commande ${order.identifiant_unique_marquage} annulée. Motif : ${reason}`);
    persist();
    notifyListeners();

    performMutation('update', 'orders', orderId, { statut: 'annule', motif_annulation: reason }, () => {
      Object.assign(order, originalOrderState);
      if (customer && originalCustomerState) {
        Object.assign(customer, originalCustomerState);
      }
      persist();
      notifyListeners();
    });
    return order;
  },

  deleteOrder: (id) => {
    const idx = memoryDb.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      memoryDb.orders.splice(idx, 1);
      persist();
      notifyListeners();
      performMutation('delete', 'orders', id, null);
    }
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
    dbEngine.logAction('CREATION_PERSONNEL', `Personnel ${newMember.prenom} ${newMember.nom} ajouté (Rôle: ${newMember.role})`);
    persist();
    notifyListeners();

    performMutation('insert', 'staff', newMember.id, newMember, () => {
      memoryDb.staff = memoryDb.staff.filter(s => s.id !== newMember.id);
      persist();
      notifyListeners();
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
      
      dbEngine.logAction('MODIFICATION_PERSONNEL', `Personnel ${member.prenom} ${member.nom} mis à jour`);
      persist();
      notifyListeners();

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
        notifyListeners();
      });
      return member;
    }
  },

  deleteStaff: (id) => {
    const index = memoryDb.staff.findIndex(s => s.id === id);
    if (index !== -1) {
      const member = memoryDb.staff[index];
      memoryDb.staff.splice(index, 1);
      dbEngine.logAction('SUPPRESSION_PERSONNEL', `Personnel ${member.prenom} ${member.nom} supprimé`);
      persist();
      notifyListeners();

      performMutation('delete', 'staff', id, null, () => {
        memoryDb.staff.push(member);
        persist();
        notifyListeners();
      });
      return true;
    }
    return false;
  },

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

      dbEngine.logAction('SOUSCRIPTION_ABONNEMENT', `Client ${customer.prenom} ${customer.nom} a souscrit à l'abonnement ${subPlan.article} (${clothesCount} vêtements, ${subPlan.prix} FCFA)`);
      persist();
      notifyListeners();

      performMutation('update', 'customers', customerId, { active_subscription: customer.active_subscription }, () => {
        customer.active_subscription = originalSubState;
        persist();
        notifyListeners();
      });
      return customer;
    }
  },

  unsubscribeCustomer: (customerId) => {
    const customer = memoryDb.customers.find(c => c.id === customerId);
    if (customer && customer.active_subscription) {
      const originalSubState = { ...customer.active_subscription };
      const oldName = customer.active_subscription.name;
      delete customer.active_subscription;
      dbEngine.logAction('DESABONNEMENT', `Client ${customer.prenom} ${customer.nom} s'est désabonné de ${oldName}`);
      persist();
      notifyListeners();

      performMutation('update', 'customers', customerId, { active_subscription: null }, () => {
        customer.active_subscription = originalSubState;
        persist();
        notifyListeners();
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
    dbEngine.logAction('DEMANDE_RESET_PIN', `Demande de réinitialisation de PIN reçue pour l'email: ${email}`);
    persist();
    notifyListeners();

    performMutation('insert', 'pin_reset_requests', newRequest.id, newRequest, () => {
      memoryDb.pin_reset_requests = memoryDb.pin_reset_requests.filter(r => r.id !== newRequest.id);
      persist();
      notifyListeners();
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
        dbEngine.logAction('MODIFICATION_PERSONNEL', `Demande de reset PIN approuvée pour ${staffMember.prenom} ${staffMember.nom}. Nouveau PIN : ${newPin} (Envoyé par email)`);
        persist();
        notifyListeners();

        performMutation('update', 'staff', staffMember.id, { code_pin: newPin });
        performMutation('update', 'pin_reset_requests', requestId, { status: 'approved', resolved_pin: newPin });
        return { req, newPin, staffMember };
      } else {
        req.status = 'rejected';
        dbEngine.logAction('MODIFICATION_PERSONNEL', `Demande de reset PIN rejetée : aucun personnel trouvé pour l'email ${req.email}`);
        persist();
        notifyListeners();

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
      dbEngine.logAction('MODIFICATION_PERSONNEL', `Demande de reset PIN rejetée pour l'email ${req.email}`);
      persist();
      notifyListeners();

      performMutation('update', 'pin_reset_requests', requestId, { status: 'rejected' });
    }
  },

  resetStaffPin: (userId, newPin) => {
    const staffMember = memoryDb.staff.find(s => s.id === userId);
    if (staffMember) {
      staffMember.code_pin = newPin;
      dbEngine.logAction('MODIFICATION_PERSONNEL', `Code PIN réinitialisé manuellement par l'admin pour ${staffMember.prenom} ${staffMember.nom}. Nouveau PIN : ${newPin}`);
      persist();
      notifyListeners();

      performMutation('update', 'staff', userId, { code_pin: newPin });
      return staffMember;
    }
    return null;
  }
};
