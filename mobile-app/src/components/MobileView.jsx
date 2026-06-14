import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  User, 
  Phone, 
  Sliders, 
  TriangleAlert,
  RotateCw,
  Printer,
  X,
  Home,
  Layers,
  CreditCard,
  TrendingUp,
  Activity,
  Award,
  Zap,
  Sparkles,
  Smartphone,
  FileText
} from 'lucide-react';

export default function MobileView() {
  const [activeTab, setActiveTab] = useState('accueil'); // accueil, gestion, facturation, profile
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);

  // Formulaire Caisse
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

  // Filtered orders list for the history tab
  const filteredHistoryOrders = orders.filter(o => {
    // Filter by status
    if (historyFilterStatus !== 'all' && o.statut !== historyFilterStatus) return false;

    // Filter by search query
    if (historySearchQuery) {
      const q = historySearchQuery.toLowerCase();
      const client = customers.find(c => c.id === o.customer_id);
      const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
      return (
        o.identifiant_unique_marquage.toLowerCase().includes(q) ||
        o.type_article.toLowerCase().includes(q) ||
        clientName.includes(q)
      );
    }
    return true;
  });

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

  const handleStartDelivery = (order) => {
    const remainingToPay = order.prix_total - order.avance_payee;
    if (remainingToPay <= 0) {
      if (confirm(`Confirmer la livraison de la commande ${order.identifiant_unique_marquage} ?`)) {
        db.updateOrderStatus(order.id, 'restitue');
        refreshData();
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
    refreshData();
    setShowDeliveryPaymentModal(false);
    setDelivOrder(null);
  };
  
  // Nouveau Client
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustNom, setNewCustNom] = useState('');
  const [newCustPrenom, setNewCustPrenom] = useState('');
  const [newCustTel, setNewCustTel] = useState('');
  const [newCustPref, setNewCustPref] = useState('Plié');

  // CRM Search & Debt
  const [crmSearch, setCrmSearch] = useState('');
  const [selectedCrmCustomer, setSelectedCrmCustomer] = useState(null);
  const [showDebtPaymentModal, setShowDebtPaymentModal] = useState(false);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState('');

  // Atelier Filters (Gestion)
  const [atelierFilter, setAtelierFilter] = useState('all'); // all, urgent, retard

  // Search queries on Accueil
  const [homeSearchQuery, setHomeSearchQuery] = useState('');

  // Receipt Modal
  const [createdOrder, setCreatedOrder] = useState(null);

  // Machine occupation simulator states
  const [machineStatus, setMachineStatus] = useState([
    { id: 1, name: 'Machine N°1 (12kg)', status: 'lavage', timeRemaining: '12 min', load: 'Pantalons/Vestes' },
    { id: 2, name: 'Machine N°2 (12kg)', status: 'repassage', timeRemaining: '24 min', load: 'Chemises Premium' },
    { id: 3, name: 'Machine N°3 (8kg)', status: 'disponible', timeRemaining: '-', load: '-' },
    { id: 4, name: 'Machine N°4 (8kg)', status: 'maintenance', timeRemaining: '-', load: 'Détartrage Tambour' }
  ]);

  // Load initial data
  useEffect(() => {
    setCustomers(db.getCustomers());
    setOrders(db.getOrders());
    setCatalog(db.getCatalog());
  }, [activeTab]);

  const refreshData = () => {
    setCustomers(db.getCustomers());
    setOrders(db.getOrders());
  };

  // Extract unique clothes from catalog for Caisses dropdown
  const catalogClothes = catalog.length > 0 
    ? [...new Set(catalog.filter(c => c.categorie !== 'abonnement').map(c => c.article))] 
    : ['Chemise', 'Pantalon', 'Robe', 'Combinaison', 'Jupe', 'Pull', 'Culotte', 'T-shirt', 'Polo', 'Blouson', 'Veste', 'Costume', 'Jeans'];

  // --- LOGIQUE DE CALCUL DU PRIX ---
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
      preferences_pliage: newCustPref
    });
    
    refreshData();
    setSelectedCustomerId(newCustomer.id);
    setShowNewCustomerModal(false);
    setNewCustNom('');
    setNewCustPrenom('');
    setNewCustTel('');
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
    refreshData();
    setCreatedOrder(newOrder);
    setAvancePayee('');
    setArticleQuantities({});
    setShowOrderRegistrationModal(false);
  };

  const handlePayDebt = (e) => {
    e.preventDefault();
    if (!selectedCrmCustomer || !debtPaymentAmount) return;

    db.updateCustomerDebt(selectedCrmCustomer.id, -Number(debtPaymentAmount));
    db.logAction('RÈGLEMENT_DETTE', `Client ${selectedCrmCustomer.prenom} ${selectedCrmCustomer.nom} a réglé ${debtPaymentAmount} FCFA de sa dette`);
    
    refreshData();
    setShowDebtPaymentModal(false);
    setDebtPaymentAmount('');
    
    const updatedCustomers = db.getCustomers();
    setSelectedCrmCustomer(updatedCustomers.find(c => c.id === selectedCrmCustomer.id));
  };

  const handleStatusChange = (orderId, nextStatus) => {
    db.updateOrderStatus(orderId, nextStatus);
    refreshData();
  };

  const handleCancelOrder = (orderId) => {
    if (confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
      db.cancelOrder(orderId);
      refreshData();
    }
  };

  const serviceLabels = {
    lavage_simple: 'Lavage Simple',
    nettoyage_a_sec: 'Nettoyage à sec',
    repassage: 'Repassage',
    abonnement: 'Abonnement'
  };

  const statusLabels = {
    en_attente: 'Reçu / Tri',
    en_cours_lavage: 'En Lavage',
    pret: 'Prêt',
    restitue: 'Livré',
    annule: 'Annulé'
  };

  const isOrderLate = (order) => {
    if (order.statut === 'restitue' || order.statut === 'annule') return false;
    return new Date(order.due_date) < new Date();
  };

  // --- STATS DYNAMIQUE ---
  const activeOrdersCount = orders.filter(o => o.statut !== 'restitue' && o.statut !== 'annule').length;
  const completedOrdersCount = orders.filter(o => o.statut === 'restitue').length;
  const totalRevenue = orders.filter(o => o.statut !== 'annule').reduce((sum, o) => sum + o.avance_payee, 0);

  // Active / Search orders filter on home
  const filteredHomeOrders = orders.filter(o => {
    if (o.statut === 'restitue' || o.statut === 'annule') return false;
    if (homeSearchQuery) {
      const q = homeSearchQuery.toLowerCase();
      const client = customers.find(c => c.id === o.customer_id);
      const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
      return (
        o.type_article.toLowerCase().includes(q) ||
        o.identifiant_unique_marquage.toLowerCase().includes(q) ||
        clientName.includes(q)
      );
    }
    return true;
  });

  // Atelier filters
  const filteredAtelierOrders = orders.filter(o => {
    if (o.statut === 'restitue' || o.statut === 'annule') return false;
    if (atelierFilter === 'urgent') return o.niveau_urgence === 'Express';
    if (atelierFilter === 'retard') return isOrderLate(o);
    return true;
  });

  const activeCustomer = customers.find(c => c.id === selectedCustomerId);
  
  const filteredCrmCustomers = customers.filter(c => 
    c.nom.toLowerCase().includes(crmSearch.toLowerCase()) ||
    c.prenom.toLowerCase().includes(crmSearch.toLowerCase()) ||
    c.telephone.includes(crmSearch)
  );

  const currentUser = db.getCurrentUser() || { prenom: 'Pierre', nom: 'Diallo', role: 'agent_accueil' };

  return (
    <div className="mobile-simulator">
      {/* Centered Notch */}
      <div className="phone-notch"></div>

      {/* Status Bar */}
      <div className="phone-status-bar">
        <span>10:40</span>
        <div className="phone-status-bar-icons">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h.01M7 20v-4M12 20v-8M17 20V4M22 20V2" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
          </svg>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid currentColor', padding: '1px 3px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 900, lineHeight: 1 }}>
            98%
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mobile-content">
        
        {/* ========================================================
           ONGLET : ACCUEIL
           ======================================================== */}
        {activeTab === 'accueil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Welcome banner */}
            <div className="mobile-welcome-section">
              <div className="mobile-welcome-text">
                <p style={{ margin: 0 }}>Bonjour,</p>
                <h2 style={{ margin: 0 }}>{currentUser.prenom} {currentUser.nom}</h2>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
                onClick={() => setShowOrderRegistrationModal(true)}
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Dashboard main stats (Finance-style card) */}
            <div className="dashboard-main-card">
              <div className="dashboard-main-card-header">Chiffre d'Affaires Encaissé</div>
              <div className="dashboard-main-card-value">{totalRevenue.toLocaleString()} F</div>
              
              {/* Premium SVG Activity graph */}
              <div className="activity-svg-container">
                <svg viewBox="0 0 320 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="320" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="320" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="320" y2="80" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                  
                  {/* Curve area */}
                  <path d="M0,80 Q40,65 80,45 T160,55 T240,30 T320,70 L320,100 L0,100 Z" fill="url(#chartGradient)" />
                  
                  {/* Curve line */}
                  <path d="M0,80 Q40,65 80,45 T160,55 T240,30 T320,70" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                  
                  {/* Glowing active point */}
                  <circle cx="240" cy="30" r="4" fill="#ffffff" />
                  <circle cx="240" cy="30" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                  
                  {/* Point label */}
                  <rect x="220" y="5" width="40" height="15" rx="4" fill="#ffffff" />
                  <text x="240" y="15" fill="var(--primary)" fontSize="8" fontWeight="bold" textAnchor="middle">6.85t</text>
                </svg>
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="dashboard-stats-grid">
              <div className="metric-mini-card">
                <h5>Commandes Actives</h5>
                <p style={{ color: 'var(--primary)' }}>{activeOrdersCount}</p>
              </div>
              <div className="metric-mini-card">
                <h5>Livrées (Mois)</h5>
                <p style={{ color: 'var(--status-ready)' }}>{completedOrdersCount}</p>
              </div>
            </div>

            {/* Recent ongoing orders section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Commandes en cours</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mise à jour automatique</span>
              </div>

              {/* Search bar inside home */}
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ paddingLeft: '2.2rem', paddingRight: '1rem', width: '100%', borderRadius: '12px', fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                  placeholder="Rechercher par code, article, client..."
                  value={homeSearchQuery}
                  onChange={(e) => setHomeSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredHomeOrders.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                    Aucune commande active en cours.
                  </p>
                ) : (
                  filteredHomeOrders.map(order => {
                    const client = customers.find(c => c.id === order.customer_id);
                    const clientName = client ? `${client.prenom} ${client.nom}` : 'Client B2B';
                    const isExpress = order.niveau_urgence === 'Express';

                    return (
                      <div className="mobile-order-row" key={order.id}>
                        <div className="mobile-order-icon">
                          <Sparkles size={16} />
                        </div>
                        <div className="mobile-order-info">
                          <div className="mobile-order-title">
                            {order.type_article} • {serviceLabels[order.type_service]}
                          </div>
                          <div className="mobile-order-desc">
                            {clientName} • {order.identifiant_unique_marquage}
                          </div>
                        </div>
                        <div className="mobile-order-right">
                          <span className="mobile-order-price">{order.prix_total} F</span>
                          <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}>
                            {statusLabels[order.statut]}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
           ONGLET : GESTION (ATELIER)
           ======================================================== */}
        {activeTab === 'gestion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="mobile-welcome-text">
                <h2>Gestion de commandes</h2>
                <p>Suivi et traitement</p>
              </div>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => setShowOrderRegistrationModal(true)}
              >
                <Plus size={14} /> Nouvelle commande
              </button>
            </div>

            {/* Atelier sub-filters */}
            <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-card)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <button 
                className={`btn ${atelierFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.4rem', fontSize: '0.72rem', borderRadius: '8px' }}
                onClick={() => setAtelierFilter('all')}
              >
                Tous
              </button>
              <button 
                className={`btn ${atelierFilter === 'urgent' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.4rem', fontSize: '0.72rem', borderRadius: '8px' }}
                onClick={() => setAtelierFilter('urgent')}
              >
                Urgents
              </button>
              <button 
                className={`btn ${atelierFilter === 'retard' ? 'btn-danger' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.4rem', fontSize: '0.72rem', borderRadius: '8px' }}
                onClick={() => setAtelierFilter('retard')}
              >
                Retards
              </button>
            </div>

            {/* Atelier active orders cards list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredAtelierOrders.length === 0 ? (
                <div style={{ textAlignment: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <CheckCircle size={30} color="var(--status-ready)" style={{ marginBottom: '0.5rem' }} />
                  Aucun vêtement en cours de traitement dans cette catégorie.
                </div>
              ) : (
                filteredAtelierOrders.map(order => {
                  const client = customers.find(c => c.id === order.customer_id);
                  const isLate = isOrderLate(order);
                  const isExpress = order.niveau_urgence === 'Express';

                  return (
                    <div 
                      key={order.id} 
                      className={`card ${isExpress ? 'pulse-express' : ''}`}
                      style={{ padding: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderRadius: '16px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {order.identifiant_unique_marquage}
                          </span>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0.1rem 0 0' }}>
                            {order.type_article} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({serviceLabels[order.type_service]})</span>
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Client: {client ? `${client.prenom} ${client.nom}` : 'Inconnu'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.2rem' }}>
                          <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                            {statusLabels[order.statut]}
                          </span>
                          {isLate && (
                            <span className="badge badge-en_retard" style={{ fontSize: '0.55rem', padding: '0.05rem 0.25rem' }}>
                              RETARD
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '0.3rem 0.5rem', borderRadius: '8px' }}>
                        <span>Dépôt: {new Date(order.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <span>Échéance: {new Date(order.due_date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>

                      {/* Action buttons to progress order status */}
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
                        {order.statut === 'en_attente' && (
                          <button 
                            className="btn btn-primary" 
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px' }}
                            onClick={() => handleStatusChange(order.id, 'en_cours_lavage')}
                          >
                            <RotateCw size={12} className="spin-washing" /> Lancer Lavage
                          </button>
                        )}
                        {order.statut === 'en_cours_lavage' && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px' }}
                            onClick={() => handleStatusChange(order.id, 'pret')}
                          >
                            <CheckCircle size={12} /> Marquer Prêt
                          </button>
                        )}
                        {order.statut === 'pret' && (
                          <button 
                            className="btn btn-primary" 
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: 'var(--status-ready)', color: '#fff' }}
                            onClick={() => handleStartDelivery(order)}
                          >
                            <DollarSign size={12} /> Livrer
                          </button>
                        )}
                        
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.45rem', color: 'var(--status-late)', borderRadius: '8px' }}
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Machines Status Grid (like figma target widgets) */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>État des machines</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {machineStatus.map(m => {
                  const isActive = m.status === 'lavage' || m.status === 'respassage' || m.status === 'repassage';
                  let statusColor = 'var(--text-muted)';
                  let statusBg = 'var(--border-color)';
                  let label = 'Inactif';

                  if (m.status === 'lavage') {
                    statusColor = 'var(--status-washing)';
                    statusBg = 'var(--status-washing-light)';
                    label = 'Lavage';
                  } else if (m.status === 'repassage') {
                    statusColor = 'var(--accent)';
                    statusBg = 'rgba(139, 92, 246, 0.15)';
                    label = 'Séchage/Rep';
                  } else if (m.status === 'disponible') {
                    statusColor = 'var(--status-ready)';
                    statusBg = 'var(--status-ready-light)';
                    label = 'Disponible';
                  } else if (m.status === 'maintenance') {
                    statusColor = 'var(--status-pending)';
                    statusBg = 'var(--status-pending-light)';
                    label = 'Maintenance';
                  }

                  return (
                    <div className="metric-mini-card" key={m.id} style={{ opacity: m.status === 'maintenance' ? 0.8 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{m.name}</span>
                        <span style={{ width: '6px', height: '6px', background: statusColor, borderRadius: '50%' }}></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <Activity size={12} color={statusColor} className={m.status === 'lavage' ? 'spin-washing' : ''} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: statusColor }}>{label}</span>
                      </div>
                      {isActive && (
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          Charge: {m.load} • <strong>{m.timeRemaining}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
           ONGLET : FACTURATION (CAISSE & CRM CLIENTS)
           ======================================================== */}
        {activeTab === 'historique' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="mobile-welcome-text">
              <h2>Historique</h2>
              <p>Suivi et archives des commandes</p>
            </div>

            {/* Search and filter tools */}
            <div className="card" style={{ padding: '0.85rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ paddingLeft: '2.2rem', width: '100%', padding: '0.45rem', fontSize: '0.8rem' }}
                  placeholder="Rechercher code, client, linge..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                />
              </div>

              {/* Status filter bar (scrollable horizontal pills) */}
              <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem', scrollbarWidth: 'none' }}>
                {[
                  { id: 'all', label: 'Toutes' },
                  { id: 'en_attente', label: 'Tri' },
                  { id: 'en_cours_lavage', label: 'Lavage' },
                  { id: 'pret', label: 'Prêt' },
                  { id: 'restitue', label: 'Livré' },
                  { id: 'annule', label: 'Annulé' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    type="button"
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.68rem',
                      borderRadius: '20px',
                      whiteSpace: 'nowrap',
                      border: historyFilterStatus === filter.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      background: historyFilterStatus === filter.id ? 'var(--primary)' : 'var(--bg-card)',
                      color: historyFilterStatus === filter.id ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={() => setHistoryFilterStatus(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredHistoryOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Aucune commande dans l'historique.
                </div>
              ) : (
                filteredHistoryOrders.map(order => {
                  const client = customers.find(c => c.id === order.customer_id);
                  const clientName = client ? `${client.prenom} ${client.nom}` : 'Client B2B';
                  const isExpress = order.niveau_urgence === 'Express';
                  const remaining = order.prix_total - order.avance_payee;

                  return (
                    <div 
                      key={order.id} 
                      className="card" 
                      style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderRadius: '16px' }}
                    >
                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>{order.identifiant_unique_marquage}</strong>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            {new Date(order.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.58rem', padding: '0.1rem 0.35rem' }}>
                          {statusLabels[order.statut]}
                        </span>
                      </div>

                      {/* Client Info */}
                      <div style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <div>Client: <strong>{clientName}</strong> {client && <span style={{ color: 'var(--text-muted)' }}>({client.telephone})</span>}</div>
                        <div>Urgence: <span style={{ fontWeight: 800, color: isExpress ? 'var(--status-late)' : 'var(--text-primary)' }}>{order.niveau_urgence}</span></div>
                      </div>

                      {/* Items and Services */}
                      <div style={{ background: 'var(--bg-app)', padding: '0.45rem', borderRadius: '8px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Détails articles :</div>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.25rem' }}>
                              <span>• {it.quantite}x {it.article} ({serviceLabels[it.service]})</span>
                            </div>
                          ))
                        ) : (
                          <div style={{ paddingLeft: '0.25rem' }}>• {order.type_article} ({serviceLabels[order.type_service]})</div>
                        )}
                      </div>

                      {/* Financial info */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.7rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', marginTop: '0.1rem' }}>
                        <div>Total: <strong>{order.prix_total.toLocaleString()} F</strong></div>
                        <div>Acompte: <strong style={{ color: 'var(--status-ready)' }}>{order.avance_payee.toLocaleString()} F</strong></div>
                        <div>Réglement: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{order.mode_reglement.replace(/_/g, ' ')}</span></div>
                        <div style={{ color: remaining > 0 ? 'var(--status-late)' : 'var(--status-ready)' }}>
                          Solde: <strong>{remaining.toLocaleString()} F</strong>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.65rem', fontSize: '0.65rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          onClick={() => setCreatedOrder(order)}
                        >
                          <Printer size={10} /> Voir Ticket
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================
           ONGLET : PROFIL UTILISATEUR
           ======================================================== */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="mobile-welcome-text">
              <h2>Profil Agent</h2>
              <p>Statut & Préférences d'atelier</p>
            </div>

            {/* Profile detail card */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '16px' }}>
              <div className="user-avatar" style={{ background: 'var(--primary)', color: '#fff', width: '48px', height: '48px', fontSize: '1.2rem', fontWeight: 700 }}>
                {currentUser.prenom.charAt(0)}{currentUser.nom.charAt(0)}
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{currentUser.prenom} {currentUser.nom}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', margin: '0.15rem 0 0' }}>
                  Rôle: {currentUser.role.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            {/* Agent Stats */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.65rem' }}>Performance individuelle</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="metric-mini-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Sliders size={12} color="var(--primary)" />
                    <h5>Dépôts du Jour</h5>
                  </div>
                  <p style={{ marginTop: '0.25rem' }}>8 cmd</p>
                </div>
                <div className="metric-mini-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Award size={12} color="var(--secondary)" />
                    <h5>Score Qualité</h5>
                  </div>
                  <p style={{ color: 'var(--secondary)', marginTop: '0.25rem' }}>99.2 %</p>
                </div>
              </div>
            </div>

            {/* General configurations */}
            <div className="card" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                Configuration Simulateur
              </h4>
              
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Version Application:</span>
                  <strong>v1.0.4 B2B</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Port de Service:</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>5174 (Mobile)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Base de Données Locale:</span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>Activée (Synced)</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Glassmorphic Footer Navigation */}
      <div className="mobile-footer-nav">
        <button 
          className={`mobile-nav-btn ${activeTab === 'accueil' ? 'active' : ''}`}
          onClick={() => setActiveTab('accueil')}
        >
          <Home size={18} />
          Accueil
        </button>
        <button 
          className={`mobile-nav-btn ${activeTab === 'gestion' ? 'active' : ''}`}
          onClick={() => setActiveTab('gestion')}
        >
          <Layers size={18} />
          Gestion
        </button>
        <button 
          className={`mobile-nav-btn ${activeTab === 'historique' ? 'active' : ''}`}
          onClick={() => setActiveTab('historique')}
        >
          <FileText size={18} />
          Historique
        </button>
        <button 
          className={`mobile-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} />
          Profile
        </button>
      </div>

      {/* iOS Home Indicator bottom line */}
      <div className="phone-home-indicator"></div>

      {/* ================= MODAL ENREGISTREMENT COMMANDE ================= */}
      {showOrderRegistrationModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <form onSubmit={handleCreateOrder} className="card" style={{ width: '100%', height: '85%', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', gap: '0.85rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0 }}>Nouvelle commande</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowOrderRegistrationModal(false)} />
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '2px' }}>
              
              {/* Client Selection */}
              <div style={{ padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Sélection du Client</label>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.62rem', borderRadius: '6px' }}
                    onClick={() => setShowNewCustomerModal(true)}
                  >
                    + Nouveau
                  </button>
                </div>
                <select 
                  className="input-control" 
                  style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem', borderRadius: '8px' }}
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Choisir un client --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom} ({c.telephone})</option>
                  ))}
                </select>

                {activeCustomer && (
                  <div style={{ marginTop: '0.5rem', padding: '0.45rem', background: 'var(--primary-light)', borderRadius: '8px', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Préférence : <strong>{activeCustomer.preferences_pliage}</strong></span>
                      <span style={{ color: 'var(--secondary)' }}>Points: <strong>{activeCustomer.points_fidelite} pts</strong></span>
                    </div>
                    {activeCustomer.solde_dette > 0 && (
                      <div style={{ color: 'var(--status-late)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <TriangleAlert size={10} /> Dette encours: {activeCustomer.solde_dette} FCFA
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Clothes & Services Selection */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Type de Linge & Services</label>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '0.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
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
                        gap: '0.3rem', 
                        padding: '0.45rem 0.55rem', 
                        background: qty > 0 ? 'var(--primary-light)' : 'var(--bg-card)', 
                        borderRadius: '10px',
                        border: qty > 0 ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        transition: 'all 0.15s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: qty > 0 ? 800 : 600, color: 'var(--text-primary)' }}>{cloth}</span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button 
                              type="button" 
                              style={{ 
                                width: '22px', 
                                height: '22px', 
                                borderRadius: '50%', 
                                border: '1px solid var(--border-color)', 
                                background: 'var(--bg-card)', 
                                color: 'var(--text-primary)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: qty === 0 ? 'not-allowed' : 'pointer', 
                                opacity: qty === 0 ? 0.35 : 1,
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                padding: 0
                              }}
                              disabled={qty === 0}
                              onClick={() => handleUpdateQty(cloth, -1)}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, minWidth: '12px', textAlign: 'center' }}>{qty}</span>
                            <button 
                              type="button" 
                              style={{ 
                                width: '22px', 
                                height: '22px', 
                                borderRadius: '50%', 
                                border: '1px solid var(--primary)', 
                                background: 'var(--primary-light)', 
                                color: 'var(--primary)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer',
                                fontSize: '0.8rem',
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
                            borderTop: '1px dashed rgba(2, 132, 199, 0.2)', 
                            paddingTop: '0.25rem', 
                            marginTop: '0.1rem' 
                          }}>
                            <select 
                              style={{ 
                                padding: '0.15rem 0.3rem', 
                                fontSize: '0.65rem', 
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
                                <option key={s.service} value={s.service}>{serviceLabels[s.service]} ({s.prix} F)</option>
                              ))}
                            </select>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.7rem' }}>Urgence</label>
                  <select 
                    className="input-control" 
                    style={{ padding: '0.45rem', fontSize: '0.78rem', borderRadius: '8px' }}
                    value={niveauUrgence} 
                    onChange={(e) => setNiveauUrgence(e.target.value)}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Express">Express (+50%)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.7rem' }}>Règlement</label>
                  <select 
                    className="input-control" 
                    style={{ padding: '0.45rem', fontSize: '0.78rem', borderRadius: '8px' }}
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
                <label style={{ fontSize: '0.7rem' }}>Acompte Versé (FCFA)</label>
                <input 
                  type="number" 
                  className="input-control" 
                  style={{ padding: '0.45rem', fontSize: '0.78rem', borderRadius: '8px' }}
                  placeholder="Ex: 1000"
                  value={avancePayee}
                  onChange={(e) => setAvancePayee(e.target.value)}
                />
              </div>

            </div>

            {/* Total and Save Actions */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Prix Total:</span>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {getCalculatedPrice().toLocaleString()} FCFA
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', borderRadius: '8px' }}
              >
                Enregistrer
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ================= MODAL CRÉATION CLIENT ================= */}
      {showNewCustomerModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '300px', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0 }}>Ajouter un Client</h3>
              <X size={15} style={{ cursor: 'pointer' }} onClick={() => setShowNewCustomerModal(false)} />
            </div>
            
            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem' }}>Prénom</label>
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                  required
                  value={newCustPrenom} 
                  onChange={(e) => setNewCustPrenom(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem' }}>Nom</label>
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                  required
                  value={newCustNom} 
                  onChange={(e) => setNewCustNom(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem' }}>Téléphone</label>
                <input 
                  type="tel" 
                  className="input-control" 
                  style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                  required
                  placeholder="Ex: 0707..."
                  value={newCustTel} 
                  onChange={(e) => setNewCustTel(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem' }}>Préférence Pliage</label>
                <select 
                  className="input-control"
                  style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                  value={newCustPref} 
                  onChange={(e) => setNewCustPref(e.target.value)}
                >
                  <option value="Plié">Plié</option>
                  <option value="Sur cintre">Sur cintre</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.4rem', padding: '0.45rem', fontSize: '0.78rem', borderRadius: '8px' }}>
                Enregistrer Client
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RÈGLEMENT DETTE CRM ================= */}
      {showDebtPaymentModal && selectedCrmCustomer && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '300px', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0 }}>Régler la Dette</h3>
              <X size={15} style={{ cursor: 'pointer' }} onClick={() => setShowDebtPaymentModal(false)} />
            </div>
            
            <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem' }}>
              Client: <strong>{selectedCrmCustomer.prenom} {selectedCrmCustomer.nom}</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--status-late)', marginTop: '0.2rem' }}>
                Dette: <strong>{selectedCrmCustomer.solde_dette} FCFA</strong>
              </div>
            </div>

            <form onSubmit={handlePayDebt} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem' }}>Montant Reçu (FCFA)</label>
                <input 
                  type="number" 
                  className="input-control" 
                  style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                  max={selectedCrmCustomer.solde_dette}
                  required
                  placeholder="Ex: 1500"
                  value={debtPaymentAmount} 
                  onChange={(e) => setDebtPaymentAmount(e.target.value)} 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem', fontSize: '0.78rem', borderRadius: '8px' }}>
                Encaisser
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RÈGLEMENT LIVRAISON ================= */}
      {showDeliveryPaymentModal && delivOrder && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '320px', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0 }}>Règlement Solde Livraison</h3>
              <X size={15} style={{ cursor: 'pointer' }} onClick={() => setShowDeliveryPaymentModal(false)} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', marginBottom: '0.75rem', padding: '0.5rem', background: 'var(--bg-app)', borderRadius: '8px' }}>
              <div>Client : <strong>{customers.find(c => c.id === delivOrder.customer_id)?.prenom} {customers.find(c => c.id === delivOrder.customer_id)?.nom}</strong></div>
              <div>Commande : <strong>{delivOrder.identifiant_unique_marquage}</strong></div>
              <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '0.35rem', paddingTop: '0.35rem' }}>Total commande : <strong>{delivOrder.prix_total} F</strong></div>
              <div>Acompte déjà payé : <strong style={{ color: 'var(--status-ready)' }}>{delivOrder.avance_payee} F</strong></div>
              <div style={{ fontSize: '0.82rem', color: 'var(--status-late)', marginTop: '0.15rem' }}>
                Reste à payer : <strong>{delivOrder.prix_total - delivOrder.avance_payee} FCFA</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem' }}>Mode de règlement</label>
                <select 
                  className="input-control" 
                  style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                  value={delivPaymentMethod} 
                  onChange={(e) => setDelivPaymentMethod(e.target.value)}
                >
                  <option value="especes">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem' }}>Montant Reçu (FCFA)</label>
                <input 
                  type="number" 
                  className="input-control" 
                  style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                  max={delivOrder.prix_total - delivOrder.avance_payee}
                  required
                  value={delivAmountPaid} 
                  onChange={(e) => setDelivAmountPaid(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.4rem', padding: '0.55rem', fontSize: '0.78rem', borderRadius: '8px', background: 'var(--status-ready)', color: '#fff', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
                Encaisser & Livrer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL REÇU / TICKET DE MARQUAGE ================= */}
      {createdOrder && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '320px', background: '#fff', color: '#000', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.35)', border: '1px solid #ccc' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              <h2 style={{ fontFamily: 'var(--font-title)', color: '#000', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>KLIN UP</h2>
              <p style={{ fontSize: '0.75rem', color: '#555', margin: '0.1rem 0 0' }}>Ticket de Dépôt Client</p>
              <div style={{ background: '#000', color: '#fff', display: 'inline-block', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 800, fontSize: '1rem', marginTop: '0.4rem', letterSpacing: '1px' }}>
                {createdOrder.identifiant_unique_marquage}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', borderBottom: '1px solid #ddd', paddingBottom: '0.75rem', marginBottom: '0.75rem', color: '#000' }}>
              <div><strong>Client :</strong> {customers.find(c => c.id === createdOrder.customer_id)?.prenom} {customers.find(c => c.id === createdOrder.customer_id)?.nom}</div>
              <div><strong>Linge :</strong> {createdOrder.type_article} ({serviceLabels[createdOrder.type_service]})</div>
              <div><strong>Urgence :</strong> {createdOrder.niveau_urgence}</div>
              <div><strong>Mode règlement :</strong> {createdOrder.mode_reglement}</div>
              <div><strong>Dépôt :</strong> {new Date(createdOrder.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
              <div><strong>Échéance :</strong> {new Date(createdOrder.due_date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
              {createdOrder.acompte_paid_at && (
                <div><strong>Règlement Acompte :</strong> {new Date(createdOrder.acompte_paid_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
              )}
              {createdOrder.solde_paid_at && (
                <div><strong>Règlement Solde :</strong> {new Date(createdOrder.solde_paid_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '1rem', color: '#000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Commande :</span>
                <strong>{createdOrder.prix_total} FCFA</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Acompte Payé :</span>
                <strong>{createdOrder.avance_payee} FCFA</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '0.2rem', fontSize: '0.85rem' }}>
                <span>Reste à payer :</span>
                <strong style={{ color: createdOrder.prix_total - createdOrder.avance_payee > 0 ? '#d32f2f' : '#2e7d32' }}>
                  {createdOrder.prix_total - createdOrder.avance_payee} FCFA
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', color: '#000', borderColor: '#000', padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}
                onClick={() => alert("Impression du reçu en cours !")}
              >
                <Printer size={12} /> Imprimer
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, background: '#000', color: '#fff', padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}
                onClick={() => {
                  setCreatedOrder(null);
                  setSelectedCustomerId('');
                }}
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
