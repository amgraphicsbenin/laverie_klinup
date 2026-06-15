import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import {
  TrendingUp,
  ShoppingBag,
  Activity,
  Percent,
  Edit,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  TriangleAlert,
  Sparkles,
  MapPin,
  User,
  ChevronRight,
  AlertCircle,
  Play,
  Pause,
  Square,
  Video,
  X,
  Printer,
  RotateCw,
  Phone,
  Sliders,
  Award,
  FileText,
  Layers,
  Zap,
  DollarSign,
  Trash2,
  UserPlus
} from 'lucide-react';

export default function AdminView({ activeTab, searchQuery }) {
  const [catalog, setCatalog] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Formulaire Caisse / Order registration
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [articleQuantities, setArticleQuantities] = useState({});
  const [articleServices, setArticleServices] = useState({});
  const [niveauUrgence, setNiveauUrgence] = useState('Normal');
  const [modeReglement, setModeReglement] = useState('especes');
  const [avancePayee, setAvancePayee] = useState('');

  // Flow de Livraison / Paiement Final
  const [showDeliveryPaymentModal, setShowDeliveryPaymentModal] = useState(false);
  const [delivOrder, setDelivOrder] = useState(null);
  const [delivPaymentMethod, setDelivPaymentMethod] = useState('especes');
  const [delivAmountPaid, setDelivAmountPaid] = useState('');

  // Modale de création de commande
  const [showOrderRegistrationModal, setShowOrderRegistrationModal] = useState(false);

  // Filtres Historique
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState('all');

  // Atelier Filters (Gestion)
  const [atelierFilter, setAtelierFilter] = useState('all'); // all, urgent, retard

  // Nouveau Client
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustNom, setNewCustNom] = useState('');
  const [newCustPrenom, setNewCustPrenom] = useState('');
  const [newCustTel, setNewCustTel] = useState('');
  const [newCustPref, setNewCustPref] = useState('Plié');
  const [newCustIndicatif, setNewCustIndicatif] = useState('229');

  // CRM Search & Debt
  const [crmSearch, setCrmSearch] = useState('');
  const [selectedCrmCustomer, setSelectedCrmCustomer] = useState(null);
  const [showDebtPaymentModal, setShowDebtPaymentModal] = useState(false);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState('');

  // Receipt Modal
  const [createdOrder, setCreatedOrder] = useState(null);

  // Category sub-tab for catalog
  const [catalogCategory, setCatalogCategory] = useState('individuel'); // 'individuel' or 'abonnement'

  // Stopwatch/Time Tracker state
  const [timerSeconds, setTimerSeconds] = useState(5048); // 01:24:08 by default
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Catalog edit state
  const [editingItem, setEditingItem] = useState(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [showEditSubModal, setShowEditSubModal] = useState(false);
  const [editSubName, setEditSubName] = useState('');
  const [editSubPrice, setEditSubPrice] = useState('');
  const [editSubDescription, setEditSubDescription] = useState('');


  // Catalog add state
  const [showAddCatalogModal, setShowAddCatalogModal] = useState(false);
  const [newArtCategory, setNewArtCategory] = useState('individuel'); // 'individuel' or 'abonnement'
  const [newArtName, setNewArtName] = useState('');
  const [newArtService, setNewArtService] = useState('lavage_simple');
  const [newArtPrice, setNewArtPrice] = useState('');
  const [newArtDescription, setNewArtDescription] = useState('');

  // Logs filters
  const [logFilterAction, setLogFilterAction] = useState('all');
  const [logSearchText, setLogSearchText] = useState('');

  useEffect(() => {
    setCatalog(db.getCatalog());
    setOrders(db.getOrders());
    setLogs(db.getLogs());
    setStaff(db.getStaff());
    setCustomers(db.getCustomers());

    const unsubscribe = db.subscribe(() => {
      setCatalog(db.getCatalog());
      setOrders(db.getOrders());
      setLogs(db.getLogs());
      setStaff(db.getStaff());
      setCustomers(db.getCustomers());
    });
    return () => unsubscribe();
  }, []);

  // Time Tracker Stopwatch Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const refreshAdminData = () => {
    setCatalog(db.getCatalog());
    setOrders(db.getOrders());
    setLogs(db.getLogs());
    setCustomers(db.getCustomers());
  };

  const formatStopwatch = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // --- STATISTIQUES & ANALYTICS ---
  const nonCancelledOrders = orders.filter(o => o.statut !== 'annule');
  const earnedRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.prix_total, 0);

  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter(o => o.statut !== 'restitue' && o.statut !== 'annule').length;

  const completedOrdersCount = orders.filter(o => o.statut === 'restitue').length;
  const pendingOrdersCount = orders.filter(o => o.statut === 'en_attente').length;

  const serviceLabels = {
    lavage_simple: 'Lavage Simple',
    nettoyage_a_sec: 'Nettoyage à sec',
    repassage: 'Repassage',
    abonnement: 'Abonnement'
  };

  // --- CALCUL DU RESTITUTION RATE DYNAMIQUE ---
  const restitutionRate = totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 0;
  const strokeDashoffset = 188.5 - (restitutionRate / 100) * 188.5;

  // --- CALCUL DU CHART METIER (VOLUME DE LINGE TRAITE) ---
  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const baseLavage = [4, 14, 22, 12, 5, 8, 3];
  const baseRepassage = [2, 8, 12, 6, 3, 5, 1];

  orders.forEach((o, index) => {
    const day = new Date(o.created_at || Date.now()).getDay();
    if (o.type_service === 'lavage_simple') {
      baseLavage[day] += 2;
    } else if (o.type_service === 'repassage') {
      baseRepassage[day] += 2;
    }
  });

  // --- FILTRES CATALOGUE ---
  const filteredCatalog = catalog.filter(item => {
    // Filter by active category tab
    if (item.categorie !== catalogCategory) return false;

    // Filter by topbar search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.article.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        serviceLabels[item.service].toLowerCase().includes(q)
      );
    }
    return true;
  });

  // --- FILTRES LOGS ---
  const filteredLogs = logs.filter(log => {
    if (logFilterAction !== 'all' && log.action !== logFilterAction) return false;

    const activeSearch = searchQuery || logSearchText;
    if (activeSearch) {
      const searchLower = activeSearch.toLowerCase();
      const user = staff.find(s => s.id === log.user_id);
      const userName = user ? `${user.prenom} ${user.nom}`.toLowerCase() : 'système';
      return (
        log.details.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        userName.includes(searchLower)
      );
    }
    return true;
  });

  // --- ACTIONS CATALOGUE ---
  const handleStartEditPrice = (item) => {
    setEditingItem(item);
    setEditingPrice(item.prix.toString());
  };

  const handleSavePrice = (e) => {
    e.preventDefault();
    if (!editingItem || !editingPrice) return;

    db.updateCatalogPrice(editingItem.id, Number(editingPrice));
    setEditingItem(null);
    refreshAdminData();
  };

  const handleStartEditSub = (item) => {
    setEditingItem(item);
    setEditSubName(item.article);
    setEditSubPrice(item.prix.toString());
    setEditSubDescription(item.description || '');
    setShowEditSubModal(true);
  };

  const handleSaveSub = (e) => {
    e.preventDefault();
    if (!editingItem || !editSubName || !editSubPrice) return;

    db.updateCatalogItem(editingItem.id, {
      article: editSubName,
      prix: Number(editSubPrice),
      description: editSubDescription
    });
    setEditingItem(null);
    setShowEditSubModal(false);
    refreshAdminData();
  };


  const handleAddCatalogItem = (e) => {
    e.preventDefault();
    if (!newArtName || !newArtPrice) return;

    db.addCatalogItem(
      newArtName,
      newArtCategory === 'individuel' ? newArtService : 'abonnement',
      Number(newArtPrice),
      newArtCategory,
      newArtCategory === 'abonnement' ? newArtDescription : ''
    );
    refreshAdminData();
    setShowAddCatalogModal(false);
    setNewArtName('');
    setNewArtPrice('');
    setNewArtDescription('');
  };

  const renderArrowBtn = () => (
    <button className="kpi-arrow-btn" type="button" onClick={() => alert('Détails de la statistique')}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    </button>
  );

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString('fr-FR');
    const timePart = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} à ${timePart}`;
  };

  const formatPhoneForWhatsApp = (phoneStr, indicatif = '229') => {
    if (!phoneStr) return '';
    let cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith(indicatif) && cleaned.length > indicatif.length + 5) {
      return cleaned;
    }
    return indicatif + cleaned;
  };

  const sendWhatsAppMessage = (phone, text, indicatif = '229') => {
    if (!phone) return;
    const formattedPhone = formatPhoneForWhatsApp(phone, indicatif);
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const isOrderLate = (order) => {
    if (order.statut === 'restitue' || order.statut === 'annule') return false;
    return new Date(order.due_date) < new Date();
  };

  const handleUpdateQty = (cloth, delta) => {
    setArticleQuantities(prev => {
      const current = prev[cloth] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [cloth]: next };
    });
  };

  const handleUpdateService = (cloth, service) => {
    setArticleServices(prev => ({ ...prev, [cloth]: service }));
  };

  const getCalculatedPrice = () => {
    let total = 0;
    Object.keys(articleQuantities).forEach(cloth => {
      const qty = articleQuantities[cloth];
      if (qty > 0) {
        const svc = articleServices[cloth] || 'lavage_simple';
        const item = catalog.find(c => c.article === cloth && c.service === svc);
        const price = item ? item.prix : 1500;
        total += price * qty;
      }
    });
    return niveauUrgence === 'Express' ? Math.round(total * 1.5) : total;
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustNom || !newCustPrenom || !newCustTel) return;
    
    const newCustomer = db.addCustomer({
      nom: newCustNom,
      prenom: newCustPrenom,
      telephone: newCustTel,
      indicatif: newCustIndicatif,
      preferences_pliage: newCustPref
    });
    
    refreshAdminData();
    setSelectedCustomerId(newCustomer.id);
    setShowNewCustomerModal(false);
    setNewCustNom('');
    setNewCustPrenom('');
    setNewCustTel('');
    setNewCustIndicatif('229');
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert("Veuillez sélectionner ou créer un client");
      return;
    }

    const selectedItems = [];
    Object.keys(articleQuantities).forEach(cloth => {
      const qty = articleQuantities[cloth];
      if (qty > 0) {
        selectedItems.push({
          article: cloth,
          quantite: qty,
          service: articleServices[cloth] || 'lavage_simple'
        });
      }
    });

    if (selectedItems.length === 0) {
      alert("Veuillez sélectionner au moins un article avec une quantité supérieure à 0");
      return;
    }

    const typeArticleSummary = selectedItems.map(item => `${item.quantite}x ${item.article}`).join(', ');
    const primaryService = selectedItems[0].service;

    const orderData = {
      customer_id: selectedCustomerId,
      type_article: typeArticleSummary,
      type_service: primaryService,
      niveau_urgence: niveauUrgence,
      mode_reglement: modeReglement,
      avance_payee: Number(avancePayee || 0),
      items: selectedItems
    };

    const newOrder = db.createOrder(orderData);
    refreshAdminData();
    setCreatedOrder(newOrder);
    setAvancePayee('');
    setArticleQuantities({});
    setShowOrderRegistrationModal(false);

    // Notification WhatsApp à l'enregistrement
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (customer) {
      const remaining = newOrder.prix_total - newOrder.avance_payee;
      const formattedDueDate = formatDateTime(newOrder.due_date);
      const text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${newOrder.identifiant_unique_marquage} (${newOrder.type_article}) a bien été enregistrée chez KLIN UP.\nTotal: ${newOrder.prix_total.toLocaleString()} FCFA\nAcompte payé: ${newOrder.avance_payee.toLocaleString()} FCFA\nReste à payer: ${remaining.toLocaleString()} FCFA\nDate de livraison prévue: ${formattedDueDate}\nMerci pour votre confiance !`;
      sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
    }
  };

  const handleStartDelivery = (order) => {
    const remainingToPay = order.prix_total - order.avance_payee;
    if (remainingToPay <= 0) {
      if (confirm(`Confirmer la livraison de la commande ${order.identifiant_unique_marquage} ?`)) {
        db.updateOrderStatus(order.id, 'restitue');
        refreshAdminData();

        // Notification WhatsApp livraison directe (déjà payé)
        const customer = customers.find(c => c.id === order.customer_id);
        if (customer) {
          const text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} vous a été livrée avec succès. Merci pour votre confiance et à bientôt chez KLIN UP !`;
          sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
        }
      }
    } else {
      setDelivOrder(order);
      setDelivPaymentMethod('especes');
      setDelivAmountPaid(remainingToPay.toString());
      setShowDeliveryPaymentModal(true);
    }
  };

  const handleConfirmDelivery = (e) => {
    e.preventDefault();
    if (!delivOrder) return;
    
    db.deliverOrderWithPayment(delivOrder.id, Number(delivAmountPaid || 0), delivPaymentMethod);
    refreshAdminData();
    setShowDeliveryPaymentModal(false);

    // Notification WhatsApp solde livraison
    const customer = customers.find(c => c.id === delivOrder.customer_id);
    if (customer) {
      const text = `Bonjour ${customer.prenom} ${customer.nom}, nous confirmons la livraison de votre commande ${delivOrder.identifiant_unique_marquage} et le règlement du solde de ${Number(delivAmountPaid).toLocaleString()} FCFA.\nVotre commande est entièrement soldée. Merci pour votre fidélité !`;
      sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
    }

    setDelivOrder(null);
  };

  const handlePayDebt = (e) => {
    e.preventDefault();
    if (!selectedCrmCustomer || !debtPaymentAmount) return;

    db.updateCustomerDebt(selectedCrmCustomer.id, -Number(debtPaymentAmount));
    db.logAction('RÈGLEMENT_DETTE', `Client ${selectedCrmCustomer.prenom} ${selectedCrmCustomer.nom} a réglé ${debtPaymentAmount} FCFA de sa dette`);
    
    refreshAdminData();
    setShowDebtPaymentModal(false);
    
    const updatedCustomers = db.getCustomers();
    const updatedCustomer = updatedCustomers.find(c => c.id === selectedCrmCustomer.id);
    setSelectedCrmCustomer(updatedCustomer);

    // Notification WhatsApp règlement dette
    if (updatedCustomer) {
      const text = `Bonjour ${updatedCustomer.prenom} ${updatedCustomer.nom}, nous confirmons le paiement de ${Number(debtPaymentAmount).toLocaleString()} FCFA pour le règlement de votre dette chez KLIN UP.\nVotre nouveau solde débiteur est de ${updatedCustomer.solde_dette.toLocaleString()} FCFA.\nMerci et à bientôt !`;
      sendWhatsAppMessage(updatedCustomer.telephone, text, updatedCustomer.indicatif);
    }

    setDebtPaymentAmount('');
  };

  const handleStatusChange = (orderId, nextStatus) => {
    const order = orders.find(o => o.id === orderId);
    db.updateOrderStatus(orderId, nextStatus);
    refreshAdminData();

    // Notification WhatsApp changement statut
    if (order) {
      const customer = customers.find(c => c.id === order.customer_id);
      if (customer) {
        let text = '';
        if (nextStatus === 'en_cours_lavage') {
          text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} est maintenant en cours de traitement (Lavage/Séchage) chez KLIN UP.`;
        } else if (nextStatus === 'pret') {
          const remaining = order.prix_total - order.avance_payee;
          text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} est prête ! Vous pouvez passer la récupérer.\nReste à payer: ${remaining.toLocaleString()} FCFA.\nÀ bientôt chez KLIN UP !`;
        } else if (nextStatus === 'restitue') {
          text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} vous a été livrée avec succès. Merci pour votre confiance et à bientôt chez KLIN UP !`;
        } else if (nextStatus === 'annule') {
          text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} a été annulée.`;
        }
        if (text) {
          sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
        }
      }
    }
  };

  const handleCancelOrder = (orderId) => {
    if (confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
      const order = orders.find(o => o.id === orderId);
      db.cancelOrder(orderId);
      refreshAdminData();

      // Notification WhatsApp annulation
      if (order) {
        const customer = customers.find(c => c.id === order.customer_id);
        if (customer) {
          const text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} a été annulée.`;
          sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
        }
      }
    }
  };

  const catalogClothes = catalog.length > 0 
    ? [...new Set(catalog.filter(c => c.categorie !== 'abonnement').map(c => c.article))] 
    : ['Chemise', 'Pantalon', 'Robe', 'Combinaison', 'Jupe', 'Pull', 'Culotte', 'T-shirt', 'Polo', 'Blouson', 'Veste', 'Costume', 'Jeans'];

  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ========================================================
         ONGLET : DASHBOARD (VUE D'ENSEMBLE)
         ======================================================== */}
      {activeTab === 'dashboard' && (
        <>
          {/* Cartes KPI Donezo Style */}
          <div className="kpi-container">

            {/* Chiffre d'Affaires - Forest Green Theme */}
            <div className="card kpi-card green-theme">
              <div className="kpi-card-header">
                <span>Chiffre d'Affaires (CA)</span>
                {renderArrowBtn()}
              </div>
              <div className="kpi-card-body">
                <h3>{earnedRevenue.toLocaleString()} F</h3>
                <p>
                  <TrendingUp size={12} />
                  +12.5% par rapport au mois dernier
                </p>
              </div>
            </div>

            {/* Commandes Livrées - White Theme */}
            <div className="card kpi-card white-theme">
              <div className="kpi-card-header">
                <span>Commandes Livrées</span>
                {renderArrowBtn()}
              </div>
              <div className="kpi-card-body">
                <h3>{completedOrdersCount}</h3>
                <p>
                  <TrendingUp size={12} color="var(--primary)" />
                  +6.2% par rapport au mois dernier
                </p>
              </div>
            </div>

            {/* Commandes Actives - White Theme */}
            <div className="card kpi-card white-theme">
              <div className="kpi-card-header">
                <span>Commandes Actives</span>
                {renderArrowBtn()}
              </div>
              <div className="kpi-card-body">
                <h3>{activeOrdersCount}</h3>
                <p>
                  <TrendingUp size={12} color="var(--primary)" />
                  Traitement en cours en atelier
                </p>
              </div>
            </div>

            {/* Commandes en Attente - White Theme */}
            <div className="card kpi-card white-theme">
              <div className="kpi-card-header">
                <span>Commandes en Attente</span>
                {renderArrowBtn()}
              </div>
              <div className="kpi-card-body">
                <h3>{pendingOrdersCount}</h3>
                <p style={{ color: 'var(--status-pending)' }}>
                  Nouvelles arrivées à trier
                </p>
              </div>
            </div>

          </div>

          {/* Grille Principale */}
          <div className="grid-2">

            {/* Project Analytics Weekly Bar Chart (Volume de linge) */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Volume de Linge Traité</h3>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }}></span> Lavage
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '8px', height: '8px', background: '#20b885', borderRadius: '50%' }}></span> Repassage
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '8px', height: '8px', background: '#e2e8e2', border: '1px solid var(--border-color)', borderRadius: '50%' }}></span> Attente
                  </div>
                </div>
              </div>

              <div className="column-chart-container" style={{ marginTop: '0.75rem' }}>
                {daysOfWeek.map((day, idx) => {
                  const maxVal = Math.max(...baseLavage, ...baseRepassage, 30);
                  const lavageHeight = (baseLavage[idx] / maxVal) * 100;
                  const repassageHeight = (baseRepassage[idx] / maxVal) * 100;

                  // Dimanche, Jeudi, Vendredi, Samedi hachurés (rest / low volume)
                  const isLowVolume = idx === 0 || idx === 4 || idx === 5 || idx === 6;

                  return (
                    <div className="column-chart-bar-group" key={day}>
                      <div className="column-chart-bars">
                        {isLowVolume ? (
                          <>
                            <div className="column-bar striped" style={{ height: `${lavageHeight}%` }} data-value="Basse charge" />
                            <div className="column-bar striped" style={{ height: `${repassageHeight}%` }} data-value="Basse charge" />
                          </>
                        ) : (
                          <>
                            {idx === 2 ? (
                              <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'end' }}>
                                <div className="column-bar filled-secondary" style={{ height: `${lavageHeight}%` }} data-value={`${baseLavage[idx]} Lavages`}>
                                  <div style={{
                                    position: 'absolute',
                                    top: '-26px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#20b885',
                                    color: '#fff',
                                    fontSize: '0.65rem',
                                    fontWeight: '700',
                                    padding: '2px 5px',
                                    borderRadius: '8px',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                  }}>{restitutionRate}%</div>
                                </div>
                              </div>
                            ) : (
                              <div className="column-bar filled-primary" style={{ height: `${lavageHeight}%` }} data-value={`${baseLavage[idx]} Lavages`} />
                            )}
                            <div className="column-bar filled-secondary" style={{ height: `${repassageHeight}%` }} data-value={`${baseRepassage[idx]} Repassages`} />
                          </>
                        )}
                      </div>
                      <div className="column-label">{day}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reminders widget / Machine tambour maintenance card */}
            <div className="card reminder-card">
              <div>
                <span className="reminder-title">Rappels & Maintenance</span>
                <h4 className="reminder-text">Maintenance Tambour - Machine N°2</h4>
                <p className="reminder-time">Horaire: 14h00 - 16h00 (Aujourd'hui)</p>
              </div>
              <button
                className="btn btn-primary"
                style={{ background: '#0e6245', display: 'flex', gap: '0.5rem' }}
                onClick={() => alert('Cycle de maintenance démarré sur la Machine N°2.')}
              >
                <Video size={16} />
                Lancer la Maintenance
              </button>
            </div>

          </div>

          <div className="grid-2">

            {/* Personnel & Roles (replaces general team collaboration) */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Personnel de Service</h3>
                <button
                  className="btn btn-outline"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '10px' }}
                  onClick={() => alert('Le personnel est géré via la base de données principale.')}
                >
                  Gérer
                </button>
              </div>

              <div className="team-list">
                {staff.map(s => {
                  const isSuper = s.role === 'super_admin';
                  const isMgr = s.role === 'manager';
                  const roleLabel = isSuper ? 'Super Admin' : isMgr ? 'Manager' : "Agent d'accueil";
                  const taskLabel = isSuper ? "Supervision générale d'atelier" : isMgr ? "Gestion Caisse & Tarifs" : "Accueil & Marquage";
                  const isOnline = s.role !== 'agent_accueil'; // simulate Pierre Diallo offline/mobile active

                  return (
                    <div className="team-item" key={s.id}>
                      <div className="team-item-left">
                        <div className="user-avatar" style={{ background: isSuper ? '#0e6245' : isMgr ? '#20b885' : '#64748b', width: '32px', height: '32px', fontSize: '0.75rem' }}>
                          {s.prenom.charAt(0)}{s.nom.charAt(0)}
                        </div>
                        <div className="team-item-info">
                          <h5>{s.prenom} {s.nom}</h5>
                          <p>{roleLabel} | <strong>{taskLabel}</strong></p>
                        </div>
                      </div>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.65rem',
                          borderRadius: '6px',
                          background: isOnline ? 'var(--success-light)' : 'var(--warning-light)',
                          color: isOnline ? 'var(--success)' : 'var(--warning)'
                        }}
                      >
                        {isOnline ? 'En ligne' : 'Terrain (5174)'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid 2-column for SVG semi-circle Gauge & Time Tracker */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

              {/* Taux de Livraison (Semi-circle Gauge) */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Taux de Livraison</h3>

                <div className="gauge-container">
                  <svg className="gauge-svg" viewBox="0 0 160 100">
                    <path d="M20 90 A 60 60 0 0 1 140 90" fill="none" stroke="var(--border-color)" strokeWidth="12" strokeLinecap="round" />

                    <path
                      d="M20 90 A 60 60 0 0 1 140 90"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="188.5"
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>

                  <div className="gauge-center-text">
                    <h4>{restitutionRate}%</h4>
                    <span>Livrées</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 600, borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></span> Livrées
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span style={{ width: '6px', height: '6px', background: '#20b885', borderRadius: '50%' }}></span> Prêtes
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span style={{ width: '6px', height: '6px', background: '#e2e8e2', border: '1px solid var(--border-color)', borderRadius: '50%' }}></span> Tri
                  </div>
                </div>
              </div>

              {/* Time Tracker Stopwatch widget (Chronomètre d'Atelier) */}
              <div className="time-tracker-card">
                <span className="time-tracker-title">Chronomètre d'Atelier</span>
                <div className="time-tracker-display">{formatStopwatch(timerSeconds)}</div>

                <div className="time-tracker-controls">
                  <button
                    className={`time-tracker-btn ${isTimerRunning ? 'active' : ''}`}
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    title={isTimerRunning ? 'Pause' : 'Play'}
                  >
                    {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button
                    className="time-tracker-btn"
                    onClick={() => {
                      setIsTimerRunning(false);
                      setTimerSeconds(0);
                    }}
                    title="Stop/Reset"
                  >
                    <Square size={12} fill="currentColor" />
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Active / Client Projects list (replaces by real active orders) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Commandes Récentes</h3>
              <button type="button" className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '10px' }} onClick={() => setShowOrderRegistrationModal(true)}>
                + Nouvelle
              </button>
            </div>

            <div className="project-list">
              {orders.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4).map(order => {
                const customer = customers.find(c => c.id === order.customer_id);
                const clientName = customer ? `${customer.prenom} ${customer.nom}` : 'Client B2B';
                const serviceName = serviceLabels[order.type_service] || order.type_service;
                const isExpress = order.niveau_urgence === 'Express';

                // Status Bullet Color mapping
                let bulletBg = '#f59e0b'; // pending/en_attente
                if (order.statut === 'en_cours_lavage') bulletBg = '#00d2c4';
                if (order.statut === 'pret') bulletBg = '#10b981';
                if (order.statut === 'restitue') bulletBg = '#64748b';
                if (order.statut === 'annule') bulletBg = '#ef4444';

                return (
                  <div className="project-item" key={order.id}>
                    <div className="project-item-left">
                      <span className="project-item-bullet" style={{ background: bulletBg }}></span>
                      <div className="project-details">
                        <span className="project-item-title">
                          {order.type_article} | {serviceName} ({clientName})
                        </span>
                        <div className="project-item-date">
                          Code : <strong>{order.identifiant_unique_marquage}</strong> | Échéance : {new Date(order.due_date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isExpress && <span className="badge badge-en_retard" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Express</span>}
                      <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.65rem' }}>
                        {order.statut.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ========================================================
         ONGLET : GESTION DES COMMANDES (ORDERS MANAGEMENT)
         ======================================================== */}
      {activeTab === 'orders_management' && (
        <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* COLONNE GAUCHE : SUIVI D'ATELIER (WORKSHOP TRACKING) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Suivi d'Atelier & Caisse Terrain
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button"
                  className={`btn ${atelierFilter === 'all' ? 'btn-primary' : 'btn-outline'}`} 
                  onClick={() => setAtelierFilter('all')}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', borderRadius: '8px' }}
                >
                  Tous
                </button>
                <button 
                  type="button"
                  className={`btn ${atelierFilter === 'urgent' ? 'btn-primary' : 'btn-outline'}`} 
                  onClick={() => setAtelierFilter('urgent')}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', borderRadius: '8px' }}
                >
                  Urgent
                </button>
                <button 
                  type="button"
                  className={`btn ${atelierFilter === 'retard' ? 'btn-primary' : 'btn-outline'}`} 
                  onClick={() => setAtelierFilter('retard')}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', borderRadius: '8px' }}
                >
                  En Retard
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {(() => {
                const filteredAtelierOrders = orders.filter(o => {
                  if (o.statut === 'restitue' || o.statut === 'annule') return false;
                  if (atelierFilter === 'urgent') return o.niveau_urgence === 'Express';
                  if (atelierFilter === 'retard') return isOrderLate(o);
                  return true;
                }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                if (filteredAtelierOrders.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem' }}>
                      <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
                      <p>Aucune commande active en atelier.</p>
                    </div>
                  );
                }

                const statusLabels = {
                  en_attente: 'En attente de tri',
                  en_cours_lavage: 'Lavage / Séchage',
                  pret: 'Prêt à livrer'
                };

                return filteredAtelierOrders.map(order => {
                  const customer = customers.find(c => c.id === order.customer_id);
                  const clientName = customer ? `${customer.prenom} ${customer.nom}` : 'Client B2B';
                  const clientPhone = customer ? customer.telephone : '-';
                  const isExpress = order.niveau_urgence === 'Express';
                  const isLate = isOrderLate(order);
                  const remainingToPay = order.prix_total - order.avance_payee;

                  return (
                    <div 
                      key={order.id} 
                      className={`card ${isExpress ? 'pulse-express' : ''}`} 
                      style={{ 
                        padding: '1rem', 
                        borderRadius: '16px', 
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        background: 'var(--bg-card)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {order.identifiant_unique_marquage}
                            </span>
                            {isExpress && (
                              <span className="badge badge-en_retard" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                                Express
                              </span>
                            )}
                          </div>
                          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0.2rem 0 0', color: 'var(--text-primary)' }}>
                            {order.type_article} ({serviceLabels[order.type_service] || order.type_service})
                          </h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.1rem 0 0' }}>
                            Client: <strong>{clientName}</strong> ({clientPhone})
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.2rem' }}>
                          <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.65rem' }}>
                            {statusLabels[order.statut] || order.statut.replace(/_/g, ' ')}
                          </span>
                          {isLate && (
                            <span className="badge badge-en_retard" style={{ fontSize: '0.55rem', padding: '0.05rem 0.25rem' }}>
                              RETARD
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '0.35rem 0.6rem', borderRadius: '8px' }}>
                        <span>Dépôt: {formatDateTime(order.created_at)}</span>
                        <span>Échéance: {formatDateTime(order.due_date)}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                        <div>
                          <span>Total: <strong>{order.prix_total.toLocaleString()} F</strong></span>
                          <span style={{ marginLeft: '0.75rem' }}>Acompte: <strong style={{ color: 'var(--primary)' }}>{order.avance_payee.toLocaleString()} F</strong></span>
                        </div>
                        <div>
                          {remainingToPay > 0 ? (
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Reste: {remainingToPay.toLocaleString()} F</span>
                          ) : (
                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>Réglé</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {order.statut === 'en_attente' && (
                          <button 
                            type="button"
                            className="btn btn-primary" 
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                            onClick={() => handleStatusChange(order.id, 'en_cours_lavage')}
                          >
                            <RotateCw size={12} className="spin-washing" /> Lancer Lavage
                          </button>
                        )}
                        {order.statut === 'en_cours_lavage' && (
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                            onClick={() => handleStatusChange(order.id, 'pret')}
                          >
                            <CheckCircle size={12} /> Marquer Prêt
                          </button>
                        )}
                        {order.statut === 'pret' && (
                          <button 
                            type="button"
                            className="btn btn-primary" 
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                            onClick={() => handleStartDelivery(order)}
                          >
                            <DollarSign size={12} /> Livrer
                          </button>
                        )}
                        
                        <button 
                          type="button"
                          className="btn btn-outline" 
                          style={{ padding: '0.45rem', color: 'var(--danger)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                          title="Annuler la commande"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* COLONNE DROITE : HISTORIQUE DE TOUTES LES COMMANDES */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Historique des Commandes
              </h3>
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={() => setShowOrderRegistrationModal(true)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px' }}
              >
                + Nouvelle
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ flexGrow: 1, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: '2.2rem', width: '100%', borderRadius: '10px', fontSize: '0.8rem' }}
                  placeholder="Rechercher par Code/Client..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                />
              </div>
              <select
                className="input-control"
                style={{ borderRadius: '10px', fontSize: '0.8rem', width: '120px', padding: '0.25rem 0.5rem' }}
                value={historyFilterStatus}
                onChange={(e) => setHistoryFilterStatus(e.target.value)}
              >
                <option value="all">Tous statuts</option>
                <option value="en_attente">En attente</option>
                <option value="en_cours_lavage">En cours</option>
                <option value="pret">Prêt</option>
                <option value="restitue">Livré</option>
                <option value="annule">Annulé</option>
              </select>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '550px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(() => {
                const query = historySearchQuery.toLowerCase();
                const filteredHistory = orders.filter(o => {
                  const customer = customers.find(c => c.id === o.customer_id);
                  const clientName = customer ? `${customer.prenom} ${customer.nom}`.toLowerCase() : '';
                  const code = o.identifiant_unique_marquage.toLowerCase();
                  
                  const matchesSearch = clientName.includes(query) || code.includes(query);
                  const matchesStatus = historyFilterStatus === 'all' || o.statut === historyFilterStatus;
                  
                  return matchesSearch && matchesStatus;
                }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                if (filteredHistory.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      Aucune commande dans l'historique.
                    </div>
                  );
                }

                return filteredHistory.map(order => {
                  const customer = customers.find(c => c.id === order.customer_id);
                  const clientName = customer ? `${customer.prenom} ${customer.nom}` : 'Client B2B';
                  const serviceName = serviceLabels[order.type_service] || order.type_service;

                  return (
                    <div 
                      key={order.id} 
                      style={{ 
                        padding: '0.75rem', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border-color)', 
                        background: 'var(--bg-app)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => setCreatedOrder(order)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{order.identifiant_unique_marquage}</span>
                        <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                          {order.statut.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {order.type_article} | {serviceName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Client: {clientName}</span>
                        <span>Total: <strong>{order.prix_total.toLocaleString()} F</strong></span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '0.25rem' }}>
                        Cliquer pour Voir Ticket
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
         ONGLET : CLIENTS CRM (CRM MANAGEMENT)
         ======================================================== */}
      {activeTab === 'crm_management' && (
        <div className="grid-2" style={{ gridTemplateColumns: '0.8fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* COLONNE GAUCHE : LISTE DES CLIENTS + RECHERCHE */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Fiches Clients
              </h3>
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={() => setShowNewCustomerModal(true)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <UserPlus size={14} /> Nouveau
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: '2.2rem', width: '100%', borderRadius: '10px', fontSize: '0.8rem' }}
                placeholder="Nom, prénom ou téléphone..."
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
              />
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '550px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(() => {
                const query = crmSearch.toLowerCase();
                const filteredCrm = customers.filter(c => 
                  c.nom.toLowerCase().includes(query) ||
                  c.prenom.toLowerCase().includes(query) ||
                  c.telephone.includes(query)
                );

                if (filteredCrm.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      Aucun client correspondant.
                    </div>
                  );
                }

                return filteredCrm.map(c => {
                  const isSelected = selectedCrmCustomer?.id === c.id;
                  return (
                    <div 
                      key={c.id} 
                      style={{ 
                        padding: '0.85rem', 
                        borderRadius: '12px', 
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)', 
                        background: isSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => setSelectedCrmCustomer(c)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {c.prenom} {c.nom}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {c.points_fidelite} pts
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                        <span>Tel: {c.telephone}</span>
                        {c.solde_dette > 0 && (
                          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Dette: {c.solde_dette.toLocaleString()} F</span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* COLONNE DROITE : PROFIL CLIENT SÉLECTIONNÉ & HISTORIQUE PERSONNEL */}
          <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            {selectedCrmCustomer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
                
                {/* Header profil */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div className="user-avatar" style={{ background: 'var(--primary)', color: '#fff', width: '48px', height: '48px', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    {selectedCrmCustomer.prenom.charAt(0)}{selectedCrmCustomer.nom.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {selectedCrmCustomer.prenom} {selectedCrmCustomer.nom}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                      Téléphone : <strong>{selectedCrmCustomer.telephone}</strong>
                    </p>
                  </div>
                </div>

                {/* KPI mini-cards client */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'var(--bg-app)', border: 'none', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Points Fidélité</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>{selectedCrmCustomer.points_fidelite} pts</strong>
                  </div>

                  <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'var(--bg-app)', border: 'none', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Dette Restante</span>
                    <strong style={{ fontSize: '1.15rem', color: selectedCrmCustomer.solde_dette > 0 ? 'var(--accent)' : 'var(--success)' }}>
                      {selectedCrmCustomer.solde_dette.toLocaleString()} F
                    </strong>
                    {selectedCrmCustomer.solde_dette > 0 && (
                      <button 
                        type="button"
                        className="btn btn-primary" 
                        onClick={() => {
                          setDebtPaymentAmount(selectedCrmCustomer.solde_dette.toString());
                          setShowDebtPaymentModal(true);
                        }}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', borderRadius: '6px', marginTop: '0.4rem' }}
                      >
                        Régler dette
                      </button>
                    )}
                  </div>

                  <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'var(--bg-app)', border: 'none', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Préférence Pliage</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{selectedCrmCustomer.preferences_pliage}</strong>
                  </div>
                </div>

                {/* Historique individuel */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Historique des Commandes</h4>
                  
                  <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Article / Service</th>
                          <th>Total</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const clientOrders = orders.filter(o => o.customer_id === selectedCrmCustomer.id)
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                          if (clientOrders.length === 0) {
                            return (
                              <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                                  Aucune commande enregistrée pour ce client.
                                </td>
                              </tr>
                            );
                          }

                          return clientOrders.map(o => (
                            <tr key={o.id}>
                              <td><strong>{o.identifiant_unique_marquage}</strong></td>
                              <td style={{ fontSize: '0.8rem' }}>
                                {o.type_article}
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{serviceLabels[o.type_service] || o.type_service}</div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{o.prix_total.toLocaleString()} F</td>
                              <td>
                                <span className={`badge badge-${o.statut}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                                  {o.statut.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td>
                                <button 
                                  type="button"
                                  className="btn btn-outline" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem', borderRadius: '6px' }}
                                  onClick={() => setCreatedOrder(o)}
                                >
                                  Reçu
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '0.5rem' }}>
                <User size={48} style={{ color: 'var(--text-muted)' }} />
                <span>Sélectionnez un client dans la liste pour voir sa fiche détaillée.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================
         ONGLET : CATALOGUE TARIFS (CATALOG)
         ======================================================== */}
      {activeTab === 'catalog' && (
        <div className="card" id="catalog-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Sparkles size={18} color="var(--primary)" />
              Grille Tarifaire
            </h3>
            <button className="btn btn-primary" onClick={() => setShowAddCatalogModal(true)}>
              <Plus size={16} /> Nouveau tarif
            </button>
          </div>

          {/* Sub-tabs for Individual Clothes vs Subscriptions */}
          <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <button
              className={`btn ${catalogCategory === 'individuel' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCatalogCategory('individuel')}
              style={{ padding: '0.4rem 1rem', borderRadius: '8px' }}
            >
              Vêtements individuels
            </button>
            <button
              className={`btn ${catalogCategory === 'abonnement' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCatalogCategory('abonnement')}
              style={{ padding: '0.4rem 1rem', borderRadius: '8px' }}
            >
              Abonnements
            </button>
          </div>

          <div className="table-container">
            {catalogCategory === 'individuel' ? (
              // Table of Individual Clothing Prices
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Service</th>
                    <th>Tarif Base (FCFA)</th>
                    <th>Tarif Urgent (Express +50%)</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
                        Aucun article trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalog.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.article}</strong></td>
                        <td>
                          <span style={{ fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                            {serviceLabels[item.service]}
                          </span>
                        </td>
                        <td>
                          {editingItem?.id === item.id ? (
                            <form onSubmit={handleSavePrice} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              <input
                                type="number"
                                className="input-control"
                                style={{ width: '90px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                value={editingPrice}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                autoFocus
                              />
                              <button type="submit" className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}>OK</button>
                              <button type="button" className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }} onClick={() => setEditingItem(null)}>X</button>
                            </form>
                          ) : (
                            <span style={{ fontWeight: 600 }}>{item.prix.toLocaleString()} F</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--accent)', fontWeight: 600 }}>
                          {Math.round(item.prix * 1.5).toLocaleString()} F
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-outline" style={{ padding: '0.35rem', borderRadius: '8px' }} onClick={() => handleStartEditPrice(item)}>
                            <Edit size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              // Table of Subscription Packages
              <table>
                <thead>
                  <tr>
                    <th>Formule</th>
                    <th>Tarif Mensuel</th>
                    <th>Avantages & Conditions de service</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
                        Aucun abonnement trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalog.map(item => (
                      <tr key={item.id}>
                        <td><strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>{item.article}</strong></td>
                        <td>
                          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{item.prix.toLocaleString()} FCFA / mois</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                            {item.description.split('|').map((adv, aIdx) => (
                              <li key={aIdx}>{adv.trim()}</li>
                            ))}
                          </ul>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-outline" style={{ padding: '0.35rem', borderRadius: '8px' }} onClick={() => handleStartEditSub(item)}>
                            <Edit size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
         ONGLET : JOURNAL D'AUDIT (LOGS)
         ======================================================== */}
      {activeTab === 'logs' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 className="chart-title" style={{ margin: 0 }}>Traces d'Audit & Sécurité Opérationnelle</h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flexGrow: 1, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: '12px' }}
                placeholder="Filtrer localement par description, employé..."
                value={logSearchText}
                onChange={(e) => setLogSearchText(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={15} color="var(--text-muted)" />
              <select
                className="input-control"
                style={{ borderRadius: '12px', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
              >
                <option value="all">Toutes les actions</option>
                <option value="CONNEXION">Connexion</option>
                <option value="CREATION_COMMANDE">Création Commande</option>
                <option value="MISE_A_JOUR_STATUT">Changements Statuts</option>
                <option value="ANNULATION_COMMANDE">Annulations</option>
                <option value="RÈGLEMENT_DETTE">Règlements Dette</option>
                <option value="MODIFICATION_TARIF">Changements Tarifs</option>
              </select>
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: '450px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Horodatage</th>
                  <th>Employé</th>
                  <th>Action</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
                      Aucune ligne de log correspondante.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const user = staff.find(s => s.id === log.user_id);
                    const userName = user ? `${user.prenom} ${user.nom}` : 'Système';
                    const userRole = user ? user.role : 'Automate';

                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td>
                          <div><strong>{userName}</strong></div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{userRole}</div>
                        </td>
                        <td>
                          <span className="badge text-uppercase" style={{
                            background: log.action.includes('ANNULATION') || log.action.includes('SUPPR') ? 'var(--status-late-light)' : 'var(--primary-light)',
                            color: log.action.includes('ANNULATION') || log.action.includes('SUPPR') ? 'var(--status-late)' : 'var(--primary)',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {log.details}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL D'AJOUT D'ARTICLE OU ABONNEMENT AU CATALOGUE
         ======================================================== */}
      {showAddCatalogModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Ajouter au Catalogue
            </h3>

            <form onSubmit={handleAddCatalogItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Category choice */}
              <div className="form-group">
                <label>Catégorie de tarif</label>
                <select
                  className="input-control"
                  value={newArtCategory}
                  onChange={(e) => setNewArtCategory(e.target.value)}
                >
                  <option value="individuel">Vêtement individuel</option>
                  <option value="abonnement">Formule d'abonnement</option>
                </select>
              </div>

              <div className="form-group">
                <label>{newArtCategory === 'individuel' ? "Nom de l'article" : "Nom de la formule d'abonnement"}</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder={newArtCategory === 'individuel' ? "Ex: Chemise, Pull, Jeans" : "Ex: Offre Spéciale, Abonnement Prestige"}
                  required
                  value={newArtName}
                  onChange={(e) => setNewArtName(e.target.value)}
                />
              </div>

              {newArtCategory === 'individuel' ? (
                // Input elements for Clothing items
                <div className="form-group">
                  <label>Service requis</label>
                  <select
                    className="input-control"
                    value={newArtService}
                    onChange={(e) => setNewArtService(e.target.value)}
                  >
                    <option value="lavage_simple">Lavage Simple</option>
                    <option value="nettoyage_a_sec">Nettoyage à sec</option>
                    <option value="repassage">Repassage</option>
                  </select>
                </div>
              ) : (
                // Input elements for Subscriptions
                <div className="form-group">
                  <label>Avantages & Conditions (séparés par un | )</label>
                  <textarea
                    className="input-control"
                    rows="3"
                    placeholder="Ex: 50 vêtements max/mois | 2 ramassages max | Livraison gratuite"
                    required
                    value={newArtDescription}
                    onChange={(e) => setNewArtDescription(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label>{newArtCategory === 'individuel' ? "Prix de base (FCFA)" : "Tarif mensuel (FCFA)"}</label>
                <input
                  type="number"
                  className="input-control"
                  placeholder="Ex: 2500"
                  required
                  value={newArtPrice}
                  onChange={(e) => setNewArtPrice(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Ajouter</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddCatalogModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL DE MODIFICATION D'ABONNEMENT
         ======================================================== */}
      {showEditSubModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Modifier l'Abonnement
            </h3>
            
            <form onSubmit={handleSaveSub} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Nom de la formule d'abonnement</label>
                <input 
                  type="text" 
                  className="input-control" 
                  required
                  value={editSubName} 
                  onChange={(e) => setEditSubName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Avantages & Conditions (séparés par un | )</label>
                <textarea 
                  className="input-control" 
                  rows="3"
                  required
                  value={editSubDescription}
                  onChange={(e) => setEditSubDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Tarif mensuel (FCFA)</label>
                <input 
                  type="number" 
                  className="input-control" 
                  required
                  value={editSubPrice} 
                  onChange={(e) => setEditSubPrice(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Enregistrer</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowEditSubModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL : ENREGISTREMENT COMMANDE (CAISSE ADMIN)
         ======================================================== */}
      {showOrderRegistrationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', overflow: 'hidden', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0 }}>
                Enregistrer une Commande
              </h3>
              <button 
                type="button"
                className="btn btn-outline" 
                style={{ padding: '0.25rem', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setShowOrderRegistrationModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flexGrow: 1, paddingRight: '0.25rem' }}>
              
              {/* Client Selection */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Sélection du Client</label>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderRadius: '6px' }}
                    onClick={() => setShowNewCustomerModal(true)}
                  >
                    + Nouveau Client
                  </button>
                </div>
                <select 
                  className="input-control" 
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', borderRadius: '8px' }}
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                >
                  <option value="">-- Choisir un client --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom} ({c.telephone})</option>
                  ))}
                </select>

                {activeCustomer && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--primary-light)', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Préférence pliage: <strong>{activeCustomer.preferences_pliage}</strong></span>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Points: {activeCustomer.points_fidelite} pts</span>
                    </div>
                    {activeCustomer.solde_dette > 0 && (
                      <div style={{ color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.1rem' }}>
                        <TriangleAlert size={12} /> Dette encours: {activeCustomer.solde_dette.toLocaleString()} FCFA
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Clothes & Services Selection */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Type de Linge & Services</label>
                <div style={{ 
                  maxHeight: '220px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  background: 'var(--bg-app)',
                  marginTop: '0.3rem'
                }}>
                  {catalogClothes.map(cloth => {
                    const qty = articleQuantities[cloth] || 0;
                    const selectedSvc = articleServices[cloth] || 'lavage_simple';
                    
                    const servicesForCloth = catalog.filter(c => c.categorie !== 'abonnement' && c.article === cloth);
                    const activeServices = servicesForCloth.length > 0 ? servicesForCloth : [
                      { service: 'lavage_simple', prix: 1500 },
                      { service: 'nettoyage_a_sec', prix: 3000 },
                      { service: 'repassage', prix: 1000 }
                    ];

                    const activeServiceObj = activeServices.find(s => s.service === selectedSvc) || activeServices[0];
                    const unitPrice = activeServiceObj ? activeServiceObj.prix : 1500;
                    
                    return (
                      <div key={cloth} style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.35rem', 
                        padding: '0.5rem 0.75rem', 
                        background: qty > 0 ? 'var(--primary-light)' : 'var(--bg-card)', 
                        borderRadius: '10px',
                        border: qty > 0 ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        transition: 'all 0.15s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: qty > 0 ? 800 : 600, color: 'var(--text-primary)' }}>{cloth}</span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button 
                              type="button" 
                              style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '50%', 
                                border: '1px solid var(--border-color)', 
                                background: 'var(--bg-card)', 
                                color: 'var(--text-primary)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: qty === 0 ? 'not-allowed' : 'pointer', 
                                opacity: qty === 0 ? 0.35 : 1,
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                padding: 0
                              }}
                              disabled={qty === 0}
                              onClick={() => handleUpdateQty(cloth, -1)}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, minWidth: '15px', textAlign: 'center' }}>{qty}</span>
                            <button 
                              type="button" 
                              style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '50%', 
                                border: '1px solid var(--primary)', 
                                background: 'var(--primary-light)', 
                                color: 'var(--primary)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                padding: 0
                              }}
                              onClick={() => handleUpdateQty(cloth, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {qty > 0 && (
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: '0.4rem', 
                            borderTop: '1px dashed rgba(14, 98, 69, 0.2)', 
                            paddingTop: '0.3rem', 
                            marginTop: '0.1rem' 
                          }}>
                            <select 
                              style={{ 
                                padding: '0.2rem 0.4rem', 
                                fontSize: '0.72rem', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '6px', 
                                width: '60%', 
                                background: 'var(--bg-card)', 
                                color: 'var(--text-primary)',
                                outline: 'none'
                              }}
                              value={selectedSvc}
                              onChange={(e) => handleUpdateService(cloth, e.target.value)}
                            >
                              {activeServices.map(s => (
                                <option key={s.service} value={s.service}>{serviceLabels[s.service] || s.service} ({s.prix} F)</option>
                              ))}
                            </select>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                              {(unitPrice * qty).toLocaleString()} F
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Settings Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem' }}>Urgence</label>
                  <select 
                    className="input-control" 
                    style={{ padding: '0.45rem', fontSize: '0.8rem', borderRadius: '8px' }}
                    value={niveauUrgence} 
                    onChange={(e) => setNiveauUrgence(e.target.value)}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Express">Express (+50%)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem' }}>Règlement</label>
                  <select 
                    className="input-control" 
                    style={{ padding: '0.45rem', fontSize: '0.8rem', borderRadius: '8px' }}
                    value={modeReglement} 
                    onChange={(e) => setModeReglement(e.target.value)}
                  >
                    <option value="especes">Espèces</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="avance_solde">Avance/Crédit</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem' }}>Acompte Versé (FCFA)</label>
                <input 
                  type="number" 
                  className="input-control" 
                  style={{ padding: '0.45rem', fontSize: '0.8rem', borderRadius: '8px' }}
                  placeholder="Ex: 2000"
                  value={avancePayee}
                  onChange={(e) => setAvancePayee(e.target.value)}
                />
              </div>

              {/* Total and Actions */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Prix Total:</span>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {getCalculatedPrice().toLocaleString()} FCFA
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setShowOrderRegistrationModal(false)}
                    style={{ padding: '0.45rem 1rem', fontSize: '0.78rem', borderRadius: '8px' }}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ padding: '0.45rem 1.25rem', fontSize: '0.78rem', borderRadius: '8px' }}
                  >
                    Enregistrer
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL : CRÉATION CLIENT (Nouveau Client CRM)
         ======================================================== */}
      {showNewCustomerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Nouveau Client
            </h3>
            
            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Nom</label>
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Nom de famille" 
                  required
                  value={newCustNom} 
                  onChange={(e) => setNewCustNom(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Prénom</label>
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Prénom" 
                  required
                  value={newCustPrenom} 
                  onChange={(e) => setNewCustPrenom(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Pays (Indicatif)</label>
                <select 
                  className="input-control"
                  value={newCustIndicatif} 
                  onChange={(e) => setNewCustIndicatif(e.target.value)}
                >
                  <option value="229">Bénin (+229)</option>
                  <option value="225">Côte d'Ivoire (+225)</option>
                  <option value="228">Togo (+228)</option>
                  <option value="227">Niger (+227)</option>
                  <option value="226">Burkina Faso (+226)</option>
                  <option value="223">Mali (+223)</option>
                  <option value="221">Sénégal (+221)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Téléphone</label>
                <input 
                  type="tel" 
                  className="input-control" 
                  placeholder="Ex: 97979797" 
                  required
                  value={newCustTel} 
                  onChange={(e) => setNewCustTel(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Préférence pliage</label>
                <select 
                  className="input-control"
                  value={newCustPref} 
                  onChange={(e) => setNewCustPref(e.target.value)}
                >
                  <option value="Plié">Plié</option>
                  <option value="Sur cintre">Sur cintre</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Créer</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowNewCustomerModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL : RÈGLEMENT DETTE CLIENT (CRM)
         ======================================================== */}
      {showDebtPaymentModal && selectedCrmCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Règlement Dette
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Client: <strong>{selectedCrmCustomer.prenom} {selectedCrmCustomer.nom}</strong>
            </p>
            <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Dette totale :</span>
              <strong>{selectedCrmCustomer.solde_dette.toLocaleString()} F</strong>
            </div>
            
            <form onSubmit={handlePayDebt} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Montant payé (FCFA)</label>
                <input 
                  type="number" 
                  className="input-control" 
                  max={selectedCrmCustomer.solde_dette}
                  required
                  value={debtPaymentAmount} 
                  onChange={(e) => setDebtPaymentAmount(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirmer</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDebtPaymentModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL : CONFIRMATION LIVRAISON & RÈGLEMENT D'ACCOMPTE
         ======================================================== */}
      {showDeliveryPaymentModal && delivOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Livrer & Encaisser
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', background: 'var(--bg-app)', padding: '0.75rem', borderRadius: '10px' }}>
              <div>Code: <strong>{delivOrder.identifiant_unique_marquage}</strong></div>
              <div>Prix Total: <strong>{delivOrder.prix_total} F</strong></div>
              <div>Acompte déjà payé: <strong style={{ color: 'var(--success)' }}>{delivOrder.avance_payee} F</strong></div>
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Reste à payer:</span>
                <strong style={{ color: 'var(--accent)' }}>{delivOrder.prix_total - delivOrder.avance_payee} FCFA</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Mode de Règlement</label>
                <select 
                  className="input-control"
                  value={delivPaymentMethod} 
                  onChange={(e) => setDelivPaymentMethod(e.target.value)}
                >
                  <option value="especes">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              <div className="form-group">
                <label>Montant encaissé (FCFA)</label>
                <input 
                  type="number" 
                  className="input-control" 
                  max={delivOrder.prix_total - delivOrder.avance_payee}
                  required
                  value={delivAmountPaid} 
                  onChange={(e) => setDelivAmountPaid(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--success)', border: 'none' }}>Confirmer la Livraison</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDeliveryPaymentModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL : TICKET DE DÉPÔT / REÇU CLIENT (TICKET POPUP)
         ======================================================== */}
      {createdOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '340px', background: '#fff', color: '#000', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #ddd', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontFamily: 'var(--font-title)', color: '#000', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>KLIN UP</h2>
              <p style={{ fontSize: '0.75rem', color: '#555', margin: '0.1rem 0 0' }}>Ticket de Dépôt Client (Admin)</p>
              <div style={{ background: '#000', color: '#fff', display: 'inline-block', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 800, fontSize: '1rem', marginTop: '0.4rem', letterSpacing: '1px' }}>
                {createdOrder.identifiant_unique_marquage}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', borderBottom: '1px dashed #ddd', paddingBottom: '0.75rem', color: '#000' }}>
              <div><strong>Client :</strong> {customers.find(c => c.id === createdOrder.customer_id)?.prenom} {customers.find(c => c.id === createdOrder.customer_id)?.nom}</div>
              <div><strong>Linge :</strong> {createdOrder.type_article} ({serviceLabels[createdOrder.type_service] || createdOrder.type_service})</div>
              <div><strong>Urgence :</strong> {createdOrder.niveau_urgence}</div>
              <div><strong>Mode règlement :</strong> {createdOrder.mode_reglement}</div>
              <div><strong>Dépôt :</strong> {formatDateTime(createdOrder.created_at)}</div>
              <div><strong>Échéance :</strong> {formatDateTime(createdOrder.due_date)}</div>
              {createdOrder.acompte_paid_at && (
                <div><strong>Règlement Acompte :</strong> {formatDateTime(createdOrder.acompte_paid_at)}</div>
              )}
              {createdOrder.solde_paid_at && (
                <div><strong>Règlement Solde :</strong> {formatDateTime(createdOrder.solde_paid_at)}</div>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.5rem', color: '#000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Commande :</span>
                <strong>{createdOrder.prix_total.toLocaleString()} F</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Acompte Payé :</span>
                <strong>{createdOrder.avance_payee.toLocaleString()} F</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ddd', paddingTop: '0.2rem', fontSize: '0.85rem' }}>
                <span>Reste à payer :</span>
                <strong style={{ color: createdOrder.prix_total - createdOrder.avance_payee > 0 ? '#d32f2f' : '#2e7d32' }}>
                  {(createdOrder.prix_total - createdOrder.avance_payee).toLocaleString()} FCFA
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
              <button 
                type="button"
                className="btn btn-outline" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#000', borderColor: '#000', padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}
                onClick={() => alert("Impression du reçu en cours !")}
              >
                <Printer size={12} /> Imprimer
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ flex: 1, background: '#000', color: '#fff', border: 'none', padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}
                onClick={() => setCreatedOrder(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
