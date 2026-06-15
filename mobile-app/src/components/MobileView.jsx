import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { countries } from '../utils/countriesData';
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
  FileText,
  Bell,
  Settings
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
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
    refreshData();
    setShowDeliveryPaymentModal(false);

    // Notification WhatsApp solde livraison
    const customer = customers.find(c => c.id === delivOrder.customer_id);
    if (customer) {
      const text = `Bonjour ${customer.prenom} ${customer.nom}, nous confirmons la livraison de votre commande ${delivOrder.identifiant_unique_marquage} et le règlement du solde de ${Number(delivAmountPaid).toLocaleString()} FCFA.\nVotre commande est entièrement soldée. Merci pour votre fidélité !`;
      sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
    }

    setDelivOrder(null);
  };
  
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

  // Atelier Filters (Gestion)
  const [atelierFilter, setAtelierFilter] = useState('all'); // all, urgent, retard

  // Search queries on Accueil
  const [homeSearchQuery, setHomeSearchQuery] = useState('');

  // Receipt Modal
  const [createdOrder, setCreatedOrder] = useState(null);

  // Settings Modal & custom Server IP
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempServerIp, setTempServerIp] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('server_ip') || window.location.hostname;
    }
    return 'localhost';
  });

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

    const unsubscribe = db.subscribe(() => {
      setCustomers(db.getCustomers());
      setOrders(db.getOrders());
      setCatalog(db.getCatalog());
    });
    return () => unsubscribe();
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
      indicatif: newCustIndicatif,
      preferences_pliage: newCustPref
    });
    
    refreshData();
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
    refreshData();
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

  const handlePayDebt = (e) => {
    e.preventDefault();
    if (!selectedCrmCustomer || !debtPaymentAmount) return;

    db.updateCustomerDebt(selectedCrmCustomer.id, -Number(debtPaymentAmount));
    db.logAction('RÈGLEMENT_DETTE', `Client ${selectedCrmCustomer.prenom} ${selectedCrmCustomer.nom} a réglé ${debtPaymentAmount} FCFA de sa dette`);
    
    refreshData();
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
    refreshData();

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
      refreshData();

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
    if (cleaned.startsWith('0') && indicatif !== '229') {
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
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Atelier filters
  const filteredAtelierOrders = orders.filter(o => {
    if (o.statut === 'restitue' || o.statut === 'annule') return false;
    if (atelierFilter === 'urgent') return o.niveau_urgence === 'Express';
    if (atelierFilter === 'retard') return isOrderLate(o);
    return true;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
        <span style={{ fontSize: "0.78rem", fontWeight: 800 }}>9:41</span>
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
        {activeTab === 'accueil' && (() => {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const activeOrders = orders.filter(o => o.statut !== 'restitue' && o.statut !== 'annule');
          const completedThisMonth = orders.filter(o => o.statut === 'restitue' && new Date(o.updated_at || o.created_at) >= startOfMonth);
          const lateOrders = activeOrders.filter(o => isOrderLate(o));
          const expressOrders = activeOrders.filter(o => o.niveau_urgence === 'Express');
          const revenueTotal = orders.filter(o => o.statut !== 'annule').reduce((s, o) => s + (o.prix_total || 0), 0);
          const encaisseTotal = orders.filter(o => o.statut !== 'annule').reduce((s, o) => s + (o.avance_payee || 0), 0);
          const resteTotal = revenueTotal - encaisseTotal;
          const revenueMonth = orders.filter(o => o.statut !== 'annule' && new Date(o.created_at) >= startOfMonth).reduce((s, o) => s + (o.prix_total || 0), 0);
          const pipeline = [
            { label: 'Reçu / Tri', key: 'en_attente', color: '#6366f1', icon: '📥' },
            { label: 'En Lavage', key: 'en_cours_lavage', color: '#3b82f6', icon: '🫧' },
            { label: 'Prêt', key: 'pret', color: '#10b981', icon: '✅' },
          ];
          const pipelineCounts = pipeline.map(s => ({ ...s, count: activeOrders.filter(o => o.statut === s.key).length }));
          const pipelineMax = Math.max(...pipelineCounts.map(p => p.count), 1);
          const last7 = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === d.toDateString());
            return { label: d.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2), count: dayOrders.length };
          });
          const maxBarCount = Math.max(...last7.map(d => d.count), 1);
          const topCustomers = customers.map(c => ({
            ...c,
            orderCount: orders.filter(o => o.customer_id === c.id && o.statut !== 'annule').length,
            totalSpent: orders.filter(o => o.customer_id === c.id && o.statut !== 'annule').reduce((s, o) => s + (o.prix_total || 0), 0)
          })).sort((a, b) => b.orderCount - a.orderCount).slice(0, 3);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* HEADER — Style image: avatar + name + actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div className="user-avatar">
                    {currentUser.prenom?.[0]}{currentUser.nom?.[0]}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bienvenue</p>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>{currentUser.prenom} {currentUser.nom}</h2>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
                    <Bell size={15} />
                    {lateOrders.length > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', background: '#ef4444', borderRadius: '50%', border: '1.5px solid #fff' }} />}
                  </button>
                  <button 
                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}
                    onClick={() => setShowSettingsModal(true)}
                  >
                    <Settings size={15} />
                  </button>
                </div>
              </div>

              {/* ALERTE RETARDS */}
              {lateOrders.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TriangleAlert size={15} color="#d97706" />
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#92400e' }}>{lateOrders.length} commande{lateOrders.length > 1 ? 's' : ''} en retard de livraison !</span>
                </div>
              )}

              {/* CA PRINCIPAL */}
              <div className="dashboard-main-card" style={{ borderRadius: '20px', padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: '0.2rem' }}>Chiffre d'Affaires Total</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, fontFamily: 'var(--font-title)', letterSpacing: '-1px', lineHeight: 1.1 }}>{revenueTotal.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>FCFA</span></div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.67rem', opacity: 0.88 }}>
                  <span>✅ Encaissé : <strong>{encaisseTotal.toLocaleString()} F</strong></span>
                  <span>⏳ Reste : <strong>{resteTotal.toLocaleString()} F</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '38px', marginTop: '0.8rem' }}>
                  {last7.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ width: '100%', background: i === 6 ? '#fff' : 'rgba(255,255,255,0.35)', borderRadius: '3px 3px 0 0', height: `${Math.max(3, (d.count / maxBarCount) * 34)}px` }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                  {last7.map((d, i) => (<div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.48rem', opacity: 0.7 }}>{d.label}</div>))}
                </div>
              </div>

              {/* KPI GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {[
                  { label: 'Actives', value: activeOrders.length, color: 'var(--primary)', bg: 'var(--primary-light)', icon: <Activity size={15} color="var(--primary)" />, sub: 'commandes en cours' },
                  { label: 'Livrées / Mois', value: completedThisMonth.length, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={15} color="#10b981" />, sub: 'ce mois-ci' },
                  { label: 'Express', value: expressOrders.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <Zap size={15} color="#f59e0b" />, sub: 'commandes urgentes' },
                  { label: 'CA Mois', value: revenueMonth >= 1000 ? `${(revenueMonth/1000).toFixed(1)}k` : revenueMonth, color: 'var(--secondary)', bg: 'var(--secondary-light)', icon: <TrendingUp size={15} color="var(--secondary)" />, sub: 'FCFA ce mois' },
                ].map((kpi, i) => (
                  <div key={i} className="card" style={{ padding: '0.8rem', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{kpi.label}</p>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '1.55rem', fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
                      </div>
                      <div style={{ background: kpi.bg, borderRadius: '8px', padding: '0.38rem' }}>{kpi.icon}</div>
                    </div>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* PIPELINE ATELIER */}
              <div className="card" style={{ padding: '0.9rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>Pipeline Atelier</h4>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Temps réel</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pipelineCounts.map(p => (
                    <div key={p.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.18rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.icon} {p.label}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: p.color }}>{p.count}</span>
                      </div>
                      <div style={{ height: '7px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.max(p.count > 0 ? 6 : 0, (p.count / pipelineMax) * 100)}%`, background: p.color, borderRadius: '10px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIVITÉ 7 JOURS */}
              <div className="card" style={{ padding: '0.9rem', borderRadius: '16px' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>Activité — 7 derniers jours</h4>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '55px' }}>
                  {last7.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <div style={{ width: '100%', background: i === 6 ? 'var(--primary)' : 'var(--primary-light)', borderRadius: '4px 4px 0 0', height: `${Math.max(d.count > 0 ? 5 : 2, (d.count / maxBarCount) * 50)}px`, transition: 'height 0.5s ease', position: 'relative' }}>
                        {d.count > 0 && i >= 5 && <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.52rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{d.count}</div>}
                      </div>
                      <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)' }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP CLIENTS */}
              {topCustomers.length > 0 && (
                <div className="card" style={{ padding: '0.9rem', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>🏆 Top Clients</h4>
                    <Award size={14} color="var(--secondary)" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {topCustomers.map((c, idx) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.4rem 0.5rem', background: idx === 0 ? 'var(--primary-light)' : 'transparent', borderRadius: '10px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: idx === 0 ? 'var(--primary)' : 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: idx === 0 ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.73rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.prenom} {c.nom}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{c.orderCount} commande{c.orderCount > 1 ? 's' : ''}</div>
                        </div>
                        <span style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{c.totalSpent.toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COMMANDES EN COURS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>Commandes en cours</h4>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Mise à jour auto</span>
                </div>
                <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="input-control" style={{ paddingLeft: '2rem', width: '100%', borderRadius: '12px', fontSize: '0.77rem', padding: '0.38rem 1rem 0.38rem 2rem' }} placeholder="Code, article, client..." value={homeSearchQuery} onChange={(e) => setHomeSearchQuery(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredHomeOrders.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.77rem', textAlign: 'center', padding: '1rem' }}>Aucune commande active.</p>
                  ) : filteredHomeOrders.map(order => {
                    const client = customers.find(c => c.id === order.customer_id);
                    const clientName = client ? `${client.prenom} ${client.nom}` : 'Client';
                    const isLate = isOrderLate(order);
                    return (
                      <div className="mobile-order-row" key={order.id} style={{ borderLeft: isLate ? '3px solid #f59e0b' : undefined }}>
                        <div className="mobile-order-icon"><Sparkles size={15} /></div>
                        <div className="mobile-order-info">
                          <div className="mobile-order-title">{order.type_article} • {serviceLabels[order.type_service]}</div>
                          <div className="mobile-order-desc">{clientName} • {order.identifiant_unique_marquage}</div>
                        </div>
                        <div className="mobile-order-right">
                          <span className="mobile-order-price">{order.prix_total.toLocaleString()} F</span>
                          <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.52rem', padding: '0.1rem 0.3rem' }}>{statusLabels[order.statut]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })()}


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
                        <span>Dépôt: {formatDateTime(order.created_at)}</span>
                        <span>Échéance: {formatDateTime(order.due_date)}</span>
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
                            {formatDateTime(order.created_at)}
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
                <label style={{ fontSize: '0.7rem' }}>Pays (Indicatif)</label>
                <select 
                  className="input-control"
                  style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                  value={newCustIndicatif} 
                  onChange={(e) => setNewCustIndicatif(e.target.value)}
                >
                  {countries.map((c) => (
                    <option key={`${c.code}-${c.name}`} value={c.code}>
                      {c.flag} {c.name} (+{c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem' }}>Téléphone</label>
                <input 
                  type="tel" 
                  className="input-control" 
                  style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                  required
                  placeholder="Ex: 97979797"
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
            <div id="receipt-print-area" style={{
              background: '#ffffff',
              padding: '24px 20px',
              borderRadius: '8px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#1a1a1a',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {/* ---- EN-TÊTE ---- */}
              <div style={{ textAlign: 'center', paddingBottom: '16px', marginBottom: '16px', borderBottom: '2px dashed #cccccc' }}>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#000000', letterSpacing: '1px', fontFamily: 'Arial, Helvetica, sans-serif' }}>KLIN UP</h1>
                <p style={{ margin: '4px 0 12px', fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>Ticket de Dépôt Client</p>
                <div style={{
                  display: 'inline-block',
                  background: '#000000',
                  color: '#ffffff',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  fontSize: '16px',
                  letterSpacing: '2px'
                }}>
                  {createdOrder.identifiant_unique_marquage}
                </div>
              </div>

              {/* ---- DÉTAILS ---- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '12px', paddingBottom: '14px', marginBottom: '14px', borderBottom: '1px solid #e5e5e5' }}>
                <div><span style={{ fontWeight: '700' }}>Client :</span> {customers.find(c => c.id === createdOrder.customer_id)?.prenom} {customers.find(c => c.id === createdOrder.customer_id)?.nom}</div>
                <div>
                  <span style={{ fontWeight: '700' }}>Linge :</span>{' '}
                  <span style={{ color: '#f59e0b', fontWeight: '600' }}>{createdOrder.type_article} ({serviceLabels[createdOrder.type_service] || createdOrder.type_service})</span>
                </div>
                <div><span style={{ fontWeight: '700' }}>Urgence :</span> {createdOrder.niveau_urgence}</div>
                <div><span style={{ fontWeight: '700' }}>Mode règlement :</span> {createdOrder.mode_reglement}</div>
                <div><span style={{ fontWeight: '700' }}>Dépôt :</span> {formatDateTime(createdOrder.created_at)}</div>
                <div><span style={{ fontWeight: '700' }}>Échéance :</span> {formatDateTime(createdOrder.due_date)}</div>
                {createdOrder.acompte_paid_at && (
                  <div><span style={{ fontWeight: '700' }}>Règlement Acompte :</span> {formatDateTime(createdOrder.acompte_paid_at)}</div>
                )}
                {createdOrder.solde_paid_at && (
                  <div><span style={{ fontWeight: '700' }}>Règlement Solde :</span> {formatDateTime(createdOrder.solde_paid_at)}</div>
                )}
              </div>

              {/* ---- TOTAUX ---- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#555555' }}>Total Commande :</span>
                  <span style={{ fontWeight: '700', color: '#000000' }}>{(createdOrder.prix_total || 0).toLocaleString()} FCFA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#555555' }}>Acompte Payé :</span>
                  <span style={{ fontWeight: '700', color: '#000000' }}>{(createdOrder.avance_payee || 0).toLocaleString()} FCFA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e5e5e5' }}>
                  <span style={{ color: '#555555', fontWeight: '600' }}>Reste à payer :</span>
                  <span style={{ fontWeight: '800', fontSize: '14px', color: (createdOrder.prix_total - createdOrder.avance_payee) > 0 ? '#d32f2f' : '#16a34a' }}>
                    {((createdOrder.prix_total || 0) - (createdOrder.avance_payee || 0)).toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', color: '#000', borderColor: '#000', padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}
                  onClick={() => alert("Impression du reçu en cours !")}
                >
                  <Printer size={12} /> Imprimer
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', color: '#000', borderColor: '#000', padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}
                  onClick={() => {
                    const element = document.getElementById('receipt-print-area');
                    if (element && window.html2pdf) {
                      const opt = {
                        margin:       0.3,
                        filename:     `Facture_${createdOrder.identifiant_unique_marquage}.pdf`,
                        image:        { type: 'jpeg', quality: 0.98 },
                        html2canvas:  { scale: 2, useCORS: true, logging: false },
                        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                      };
                      window.html2pdf().set(opt).from(element).save();
                    } else {
                      alert("Le module PDF est en cours de chargement. Veuillez réessayer.");
                    }
                  }}
                >
                  ↓ Télécharger
                </button>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', background: '#000', color: '#fff', border: 'none', padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}
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

      {/* ================= MODAL PARAMÈTRES (CONFIG IP SERVEUR) ================= */}
      {showSettingsModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '300px', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0 }}>Configuration Serveur</h3>
              <X size={15} style={{ cursor: 'pointer' }} onClick={() => setShowSettingsModal(false)} />
            </div>
            
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0', lineHeight: '1.3' }}>
              Renseignez l'adresse IP de votre ordinateur exécutant la base de données (ex: <code>192.168.1.100</code>).
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (tempServerIp.trim()) {
                localStorage.setItem('server_ip', tempServerIp.trim());
              } else {
                localStorage.removeItem('server_ip');
              }
              setShowSettingsModal(false);
              window.location.reload();
            }} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem' }}>Adresse IP du Serveur</label>
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                  required
                  placeholder="Ex: 192.168.1.50"
                  value={tempServerIp} 
                  onChange={(e) => setTempServerIp(e.target.value)} 
                />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}
                  onClick={() => {
                    localStorage.removeItem('server_ip');
                    setShowSettingsModal(false);
                    window.location.reload();
                  }}
                >
                  Réinitialiser
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
