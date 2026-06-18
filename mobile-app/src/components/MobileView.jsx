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
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Inbox,
  Waves,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function MobileView() {
  const [activeTab, setActiveTab] = useState('accueil'); // accueil, gestion, facturation, profile
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => db.getCurrentUser() || { prenom: 'Pierre', nom: 'Diallo', role: 'agent_accueil' });
  const [showCAValues, setShowCAValues] = useState(true);

  // Détermine si l'utilisateur peut voir le CA en fonction de son rôle
  const isCAAccessible = currentUser.role === 'super_admin' || currentUser.role === 'manager';
  const canViewCA = isCAAccessible;

  // Formulaire Caisse
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [articleQuantities, setArticleQuantities] = useState({});
  const [articleServices, setArticleServices] = useState({});
  const [niveauUrgence, setNiveauUrgence] = useState('Normal');
  const [modeReglement, setModeReglement] = useState('especes');
  const [avancePayee, setAvancePayee] = useState('');
  const [payWithSubscription, setPayWithSubscription] = useState(false);
  const [subscribePlanId, setSubscribePlanId] = useState('');

  useEffect(() => {
    const cust = customers.find(c => c.id === selectedCustomerId);
    if (subscribePlanId) {
      setPayWithSubscription(true);
    } else if (cust && cust.active_subscription) {
      setPayWithSubscription(true);
    } else {
      setPayWithSubscription(false);
    }
  }, [selectedCustomerId, customers, subscribePlanId]);

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
  const [selectedCrmSubId, setSelectedCrmSubId] = useState('');

  const handleSubscribeCrm = (customerId, catalogItemId) => {
    if (!catalogItemId) {
      alert("Veuillez sélectionner un forfait d'abonnement.");
      return;
    }
    const updated = db.subscribeCustomer(customerId, catalogItemId);
    if (updated) {
      refreshData();
      const updatedCustomers = db.getCustomers();
      const updatedCust = updatedCustomers.find(c => c.id === customerId);
      setSelectedCrmCustomer(updatedCust);
      setSelectedCrmSubId('');
      alert(`Abonnement souscrit avec succès !`);
    }
  };

  const handleUnsubscribeCrm = (customerId) => {
    if (confirm("Êtes-vous sûr de vouloir résilier cet abonnement ?")) {
      const updated = db.unsubscribeCustomer(customerId);
      if (updated) {
        refreshData();
        const updatedCustomers = db.getCustomers();
        const updatedCust = updatedCustomers.find(c => c.id === customerId);
        setSelectedCrmCustomer(updatedCust);
        alert("Abonnement résilié avec succès !");
      }
    }
  };

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
    setCurrentUser(db.getCurrentUser() || { prenom: 'Pierre', nom: 'Diallo', role: 'agent_accueil' });

    const unsubscribe = db.subscribe(() => {
      setCustomers(db.getCustomers());
      setOrders(db.getOrders());
      setCatalog(db.getCatalog());
      setCurrentUser(db.getCurrentUser() || { prenom: 'Pierre', nom: 'Diallo', role: 'agent_accueil' });
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

  const getTotalClothesCount = () => {
    let total = 0;
    Object.keys(articleQuantities).forEach(cloth => {
      total += articleQuantities[cloth] || 0;
    });
    return total;
  };

  // --- LOGIQUE DE CALCUL DU PRIX ---
  const getCalculatedPrice = () => {
    if (subscribePlanId) {
      const subPlan = catalog.find(c => c.id === subscribePlanId && c.service === 'abonnement');
      return subPlan ? subPlan.prix : 0;
    }
    if (payWithSubscription) return 0;
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

    const activeCustomerObj = customers.find(c => c.id === selectedCustomerId);
    if (payWithSubscription && !subscribePlanId && activeCustomerObj && activeCustomerObj.active_subscription) {
      const remaining = activeCustomerObj.active_subscription.remaining_clothes;
      const totalClothes = selectedItems.reduce((sum, item) => sum + Number(item.quantite), 0);
      if (remaining < totalClothes) {
        alert(`Solde d'abonnement insuffisant. Requis: ${totalClothes}, Disponible: ${remaining}. Veuillez souscrire à un abonnement/renouvellement immédiat ou payer par un autre mode de règlement.`);
        return;
      }
    }

    const orderData = {
      customer_id: selectedCustomerId,
      type_article: typeArticleSummary,
      type_service: primaryService,
      niveau_urgence: niveauUrgence,
      mode_reglement: payWithSubscription ? (subscribePlanId ? modeReglement : 'abonnement') : modeReglement,
      avance_payee: (payWithSubscription && !subscribePlanId) ? 0 : Number(avancePayee || 0),
      pay_with_subscription: payWithSubscription,
      subscribe_plan_id: subscribePlanId,
      items: selectedItems
    };

    try {
      const newOrder = db.createOrder(orderData);
      refreshData();
      setCreatedOrder(newOrder);
      setAvancePayee('');
      setSubscribePlanId('');
      setArticleQuantities({});
      setShowOrderRegistrationModal(false);

      // Notification WhatsApp à l'enregistrement
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        let text = '';
        const formattedDueDate = formatDateTime(newOrder.due_date);
        
        if (newOrder.is_subscription_order && newOrder.subscription_details) {
          const det = newOrder.subscription_details;
          if (det.immediate_subscription) {
            const remaining = newOrder.prix_total - newOrder.avance_payee;
            text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${newOrder.identifiant_unique_marquage} (${newOrder.type_article}) a bien été enregistrée chez KLIN UP avec souscription immédiate au forfait ${det.immediate_subscription.name} (${det.immediate_subscription.prix.toLocaleString()} FCFA).\nArticles déposés: ${det.clothes_deducted} vêtements\nNouveau solde restant: ${det.new_balance} vêt.\nAcompte payé: ${newOrder.avance_payee.toLocaleString()} FCFA\nReste à payer sur l'abonnement: ${remaining.toLocaleString()} FCFA\nDate de livraison prévue: ${formattedDueDate}\nMerci pour votre confiance !`;
          } else {
            text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${newOrder.identifiant_unique_marquage} (${newOrder.type_article}) a bien été enregistrée chez KLIN UP via votre forfait ${det.name}.\nArticles déposés: ${det.clothes_deducted} vêtements\nSolde précédent: ${det.previous_balance} vêt.\nNouveau solde restant: ${det.new_balance} vêt.\nDate de livraison prévue: ${formattedDueDate}\nMerci pour votre confiance !`;
          }
        } else {
          const remaining = newOrder.prix_total - newOrder.avance_payee;
          text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${newOrder.identifiant_unique_marquage} (${newOrder.type_article}) a bien été enregistrée chez KLIN UP.\nTotal: ${newOrder.prix_total.toLocaleString()} FCFA\nAcompte payé: ${newOrder.avance_payee.toLocaleString()} FCFA\nReste à payer: ${remaining.toLocaleString()} FCFA\nDate de livraison prévue: ${formattedDueDate}\nMerci pour votre confiance !`;
        }
        sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
      }
    } catch (err) {
      alert("Erreur d'enregistrement : " + err.message);
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

  // canViewCA defined at the top of the component

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
           ONGLET : ACCUEIL — Style Finance App
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
            { label: 'Reçu / Tri', key: 'en_attente', color: 'var(--status-pending)', colorLight: 'var(--status-pending-light)', icon: 'inbox' },
            { label: 'En Lavage', key: 'en_cours_lavage', color: 'var(--status-washing)', colorLight: 'var(--status-washing-light)', icon: 'waves' },
            { label: 'Prêt', key: 'pret', color: 'var(--status-ready)', colorLight: 'var(--status-ready-light)', icon: 'check' },
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* HEADER — Style Finance: Title + Circle Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '8px' }}>
                <div>
                  <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.1, margin: 0 }}>KLIN UP</h1>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>Gérez votre atelier<br /><span style={{ color: 'var(--text-secondary)' }}>en toute simplicité.</span></p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button className="action-circle-btn filled" onClick={() => setShowSettingsModal(true)}>
                    <Settings size={15} />
                  </button>
                  <button className="action-circle-btn" style={{ position: 'relative' }}>
                    <Bell size={15} />
                    {lateOrders.length > 0 && <span style={{ position: 'absolute', top: '7px', right: '7px', width: '6px', height: '6px', background: 'var(--status-late)', borderRadius: '50%', border: '1.5px solid #fff' }} />}
                  </button>
                </div>
              </div>

              {/* ALERTE RETARDS */}
              {lateOrders.length > 0 && (
                <div className="alert-banner warning">
                  <TriangleAlert size={14} />
                  <span>{lateOrders.length} commande{lateOrders.length > 1 ? 's' : ''} en retard de livraison !</span>
                </div>
              )}

              {/* TOTAL SPEND — Style Finance Card (Adaptive) */}
              <div className="dashboard-main-card" style={{ borderRadius: '20px', padding: '1.2rem 1.1rem' }}>
                {isCAAccessible ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>Chiffre d'Affaires Total</div>
                      {!isCAAccessible && (
                        <div style={{ fontSize: '0.6rem', color: 'var(--status-late)', fontWeight: 600 }}>Accès limité</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-title)', letterSpacing: '-1px', lineHeight: 1.1, color: isCAAccessible ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {isCAAccessible ? (showCAValues ? `${revenueTotal.toLocaleString()} ` : '•••••• ') : '── Non autorisé '}
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>FCFA</span>
                        </div>
                      </div>
                      {isCAAccessible && (
                        <button
                          type="button"
                          className="eye-toggle-btn"
                          onClick={() => setShowCAValues(!showCAValues)}
                          title={showCAValues ? 'Masquer le CA' : 'Afficher le CA'}
                        >
                          {showCAValues ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.15rem' }}>Activité de l'Atelier</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-title)', letterSpacing: '-1px', lineHeight: 1.1, color: 'var(--text-primary)' }}>{activeOrders.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>active{activeOrders.length > 1 ? 's' : ''}</span></div>
                  </>
                )}
                
                {/* Mini line chart area */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '42px', marginTop: '0.8rem' }}>
                  {last7.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ 
                        width: '100%', 
                        background: i === 6 ? 'var(--primary)' : 'var(--border-color)', 
                        borderRadius: '3px 3px 0 0', 
                        height: `${Math.max(3, (d.count / maxBarCount) * 38)}px`,
                        transition: 'height 0.4s ease'
                      }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
                  {last7.map((d, i) => (<div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.46rem', color: 'var(--text-muted)', fontWeight: 500 }}>{d.label}</div>))}
                </div>

                {/* Income / Expenses row */}
                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem', paddingTop: '0.7rem', borderTop: '1px solid var(--border-color)' }}>
                  {isCAAccessible ? (
                    <>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--status-ready-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowUpRight size={13} color="var(--status-ready)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600 }}>Encaissé</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                            {showCAValues ? encaisseTotal.toLocaleString() : '••••••'}
                          </div>
                        </div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--status-late-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowDownRight size={13} color="var(--status-late)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reste dû</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                            {showCAValues ? resteTotal.toLocaleString() : '••••••'}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--status-pending-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Zap size={13} color="var(--status-pending)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600 }}>Urgentes</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>{expressOrders.length}</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--status-late-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TriangleAlert size={13} color="var(--status-late)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600 }}>En retard</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>{lateOrders.length}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* KPI GRID — Style Income/Expenses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                {[
                  { label: 'Actives', value: activeOrders.length, color: 'var(--primary)', bg: 'var(--primary-light)', icon: <Activity size={14} color="var(--primary)" />, sub: 'commandes en cours' },
                  { label: 'Livrées', value: completedThisMonth.length, color: 'var(--status-ready)', bg: 'var(--status-ready-light)', icon: <CheckCircle size={14} color="var(--status-ready)" />, sub: 'ce mois-ci' },
                  { label: 'Express', value: expressOrders.length, color: 'var(--status-pending)', bg: 'var(--status-pending-light)', icon: <Zap size={14} color="var(--status-pending)" />, sub: 'urgentes' },
                  isCAAccessible ? {
                    label: 'CA Mois',
                    value: showCAValues ? (revenueMonth >= 1000 ? `${(revenueMonth/1000).toFixed(0)}k` : revenueMonth) : '••••••',
                    color: 'var(--secondary)',
                    bg: 'var(--secondary-light)',
                    icon: <TrendingUp size={14} color="var(--secondary)" />,
                    sub: 'FCFA'
                  } : { 
                    label: 'En Retard', 
                    value: lateOrders.length, 
                    color: 'var(--status-late)', 
                    bg: 'var(--status-late-light)', 
                    icon: <TriangleAlert size={14} color="var(--status-late)" />, 
                    sub: 'à livrer' 
                  },
                ].map((kpi, i) => (
                  <div key={i} className="kpi-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="kpi-label">{kpi.label}</div>
                        <div className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
                      </div>
                      <div className="kpi-icon" style={{ background: kpi.bg }}>{kpi.icon}</div>
                    </div>
                    <div className="kpi-sub">{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* PIPELINE ATELIER — Premium Style */}
              <div style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(238, 238, 248, 0.4) 100%)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.1rem', backdropFilter: 'blur(10px)' }}>
                <div className="section-header">
                  <h4>Pipeline Atelier</h4>
                  <span className="see-all">Temps réel</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pipelineCounts.map(p => {
                    const Icon = p.icon === 'inbox' ? Inbox : p.icon === 'waves' ? Waves : CheckCircle2;
                    return (
                      <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: p.colorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={18} color={p.color} strokeWidth={1.5} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{p.label}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: p.color, background: p.colorLight, padding: '0.25rem 0.5rem', borderRadius: '8px', minWidth: '24px', textAlign: 'center' }}>{p.count}</span>
                          </div>
                          <div className="progress-bar-track" style={{ height: '5px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div className="progress-bar-fill" style={{ height: '100%', width: `${Math.max(p.count > 0 ? 8 : 0, (p.count / pipelineMax) * 100)}%`, background: p.color, borderRadius: '10px' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVITÉ 7 JOURS */}
              <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.85rem' }}>
                <div className="section-header">
                  <h4>Activité — 7 jours</h4>
                  <span className="see-all">Voir tout</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '55px' }}>
                  {last7.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <div style={{ 
                        width: '100%', 
                        background: i === 6 ? 'var(--primary)' : 'var(--primary-light)', 
                        borderRadius: '4px 4px 0 0', 
                        height: `${Math.max(d.count > 0 ? 5 : 2, (d.count / maxBarCount) * 50)}px`, 
                        transition: 'height 0.5s ease', 
                        position: 'relative' 
                      }}>
                        {d.count > 0 && i >= 5 && <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.5rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{d.count}</div>}
                      </div>
                      <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP CLIENTS */}
              {topCustomers.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.85rem' }}>
                  <div className="section-header">
                    <h4>Top Clients</h4>
                    <span className="see-all">Voir tout</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {topCustomers.map((c, idx) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.4rem 0.5rem', background: idx === 0 ? 'var(--primary-light)' : 'transparent', borderRadius: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: idx === 0 ? 'var(--primary)' : 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: idx === 0 ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.prenom} {c.nom}</div>
                          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                            {canViewCA ? `${c.orderCount} commande${c.orderCount > 1 ? 's' : ''}` : 'Client Top'}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                          {canViewCA ? (showCAValues ? `${c.totalSpent.toLocaleString()} F` : '•••••• F') : `${c.orderCount} cmd`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COMMANDES EN COURS — Style Transaction List */}
              <div>
                <div className="section-header">
                  <h4>Commandes en cours</h4>
                  <span className="see-all">Voir tout</span>
                </div>
                <div style={{ position: 'relative', marginBottom: '0.55rem' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="input-control" style={{ paddingLeft: '2rem', width: '100%', borderRadius: '12px', fontSize: '0.75rem', padding: '0.4rem 1rem 0.4rem 2rem' }} placeholder="Code, article, client..." value={homeSearchQuery} onChange={(e) => setHomeSearchQuery(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {filteredHomeOrders.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '1.5rem' }}>Aucune commande active.</p>
                  ) : filteredHomeOrders.map(order => {
                    const client = customers.find(c => c.id === order.customer_id);
                    const clientName = client ? `${client.prenom} ${client.nom}` : 'Client';
                    const clientInitials = client ? `${client.prenom?.[0] || ''}${client.nom?.[0] || ''}` : 'CL';
                    const isLate = isOrderLate(order);
                    return (
                      <div className="mobile-order-row" key={order.id} style={{ borderLeft: isLate ? '3px solid var(--status-pending)' : undefined }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.65rem', flexShrink: 0 }}>
                          {clientInitials}
                        </div>
                        <div className="mobile-order-info">
                          <div className="mobile-order-title">{order.type_article}</div>
                          <div className="mobile-order-desc">{clientName} · {order.identifiant_unique_marquage}</div>
                        </div>
                        <div className="mobile-order-right">
                          <span className="mobile-order-price">+{order.prix_total.toLocaleString()} F</span>
                          <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.5rem', padding: '0.1rem 0.3rem' }}>{statusLabels[order.statut]}</span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>Gestion</h1>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Suivi et traitement</p>
              </div>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.72rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => setShowOrderRegistrationModal(true)}
              >
                <Plus size={14} /> Nouvelle
              </button>
            </div>

            {/* Atelier sub-filters */}
            <div style={{ display: 'flex', gap: '0.35rem', background: '#fff', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <button 
                className={`btn ${atelierFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.35rem', fontSize: '0.7rem', borderRadius: '8px' }}
                onClick={() => setAtelierFilter('all')}
              >
                Tous
              </button>
              <button 
                className={`btn ${atelierFilter === 'urgent' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.35rem', fontSize: '0.7rem', borderRadius: '8px' }}
                onClick={() => setAtelierFilter('urgent')}
              >
                Urgents
              </button>
              <button 
                className={`btn ${atelierFilter === 'retard' ? 'btn-danger' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.35rem', fontSize: '0.7rem', borderRadius: '8px' }}
                onClick={() => setAtelierFilter('retard')}
              >
                Retards
              </button>
            </div>

            {/* Atelier active orders cards list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredAtelierOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <CheckCircle size={28} color="var(--status-ready)" style={{ marginBottom: '0.5rem' }} />
                  Aucun vêtement en traitement.
                </div>
              ) : (
                filteredAtelierOrders.map(order => {
                  const client = customers.find(c => c.id === order.customer_id);
                  const isLate = isOrderLate(order);
                  const isExpress = order.niveau_urgence === 'Express';

                  return (
                    <div 
                      key={order.id} 
                      className={`${isExpress ? 'pulse-express' : ''}`}
                      style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', borderRadius: '16px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {order.identifiant_unique_marquage}
                          </span>
                          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0.1rem 0 0' }}>
                            {order.type_article} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.7rem' }}>({serviceLabels[order.type_service]})</span>
                          </h4>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {client ? `${client.prenom} ${client.nom}` : 'Inconnu'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.2rem' }}>
                          <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}>
                            {statusLabels[order.statut]}
                          </span>
                          {isLate && (
                            <span className="badge badge-en_retard" style={{ fontSize: '0.52rem', padding: '0.05rem 0.25rem' }}>
                              RETARD
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '0.3rem 0.5rem', borderRadius: '8px' }}>
                        <span>Dépôt: {formatDateTime(order.created_at)}</span>
                        <span>Éch: {formatDateTime(order.due_date)}</span>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.15rem' }}>
                        {order.statut === 'en_attente' && (
                          <button 
                            className="btn btn-primary" 
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', borderRadius: '8px' }}
                            onClick={() => handleStatusChange(order.id, 'en_cours_lavage')}
                          >
                            <RotateCw size={11} className="spin-washing" /> Lancer Lavage
                          </button>
                        )}
                        {order.statut === 'en_cours_lavage' && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', borderRadius: '8px' }}
                            onClick={() => handleStatusChange(order.id, 'pret')}
                          >
                            <CheckCircle size={11} /> Marquer Prêt
                          </button>
                        )}
                        {order.statut === 'pret' && (
                          <button 
                            className="btn btn-primary" 
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', borderRadius: '8px', background: 'var(--status-ready)', color: '#fff' }}
                            onClick={() => handleStartDelivery(order)}
                          >
                            <DollarSign size={11} /> Livrer
                          </button>
                        )}
                        
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.4rem', color: 'var(--status-late)', borderRadius: '8px' }}
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Machines Status Grid */}
            <div>
              <div className="section-header">
                <h4>État des machines</h4>
                <span className="see-all">Voir tout</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
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
                    statusBg = 'rgba(108, 106, 208, 0.1)';
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
                        <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>{m.name}</span>
                        <span style={{ width: '6px', height: '6px', background: statusColor, borderRadius: '50%' }}></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                        <Activity size={11} color={statusColor} className={m.status === 'lavage' ? 'spin-washing' : ''} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: statusColor }}>{label}</span>
                      </div>
                      {isActive && (
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.08rem' }}>
                          {m.load} · <strong>{m.timeRemaining}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CRM Abonnements */}
            <div style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                <Award size={14} color="var(--primary)" />
                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>Abonnements Clients</h4>
              </div>
              
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ paddingLeft: '2rem', width: '100%', borderRadius: '12px', fontSize: '0.72rem', padding: '0.35rem 1rem 0.35rem 2rem' }} 
                  placeholder="Rechercher client..." 
                  value={crmSearch} 
                  onChange={(e) => {
                    setCrmSearch(e.target.value);
                    setSelectedCrmCustomer(null);
                  }} 
                />
              </div>

              {crmSearch && !selectedCrmCustomer && (
                <div style={{ 
                  maxHeight: '120px', overflowY: 'auto', 
                  border: '1px solid var(--border-color)', borderRadius: '10px',
                  background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px'
                }}>
                  {filteredCrmCustomers.slice(0, 5).map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => { setSelectedCrmCustomer(c); setCrmSearch(''); }}
                      style={{ padding: '0.4rem 0.55rem', fontSize: '0.7rem', borderRadius: '6px', cursor: 'pointer', background: '#fff', border: '1px solid var(--border-color)' }}
                    >
                      {c.prenom} {c.nom} ({c.telephone})
                    </div>
                  ))}
                  {filteredCrmCustomers.length === 0 && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0.5rem', textAlign: 'center' }}>Aucun client trouvé</div>
                  )}
                </div>
              )}

              {selectedCrmCustomer && (
                <div style={{ background: 'var(--bg-app)', padding: '0.7rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.45rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>{selectedCrmCustomer.prenom} {selectedCrmCustomer.nom}</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedCrmCustomer(null)}
                      style={{ border: 'none', background: 'transparent', fontSize: '0.65rem', color: 'var(--status-late)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Fermer
                    </button>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Tél : {selectedCrmCustomer.telephone}</div>
                  
                  {selectedCrmCustomer.active_subscription ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                        <strong style={{ color: 'var(--primary)' }}>{selectedCrmCustomer.active_subscription.name}</strong>
                        <span style={{ fontWeight: 600 }}>{selectedCrmCustomer.active_subscription.remaining_clothes} / {selectedCrmCustomer.active_subscription.total_clothes} vêt.</span>
                      </div>
                      
                      {(() => {
                        const remaining = selectedCrmCustomer.active_subscription.remaining_clothes;
                        const total = selectedCrmCustomer.active_subscription.total_clothes;
                        const percentUsed = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
                        return (
                          <div className="progress-bar-track">
                            <div className="progress-bar-fill" style={{ width: `${percentUsed}%`, background: 'var(--primary)' }}></div>
                          </div>
                        );
                      })()}
                      
                      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                        Expire le : {new Date(selectedCrmCustomer.active_subscription.expires_at).toLocaleDateString('fr-FR')}
                      </div>

                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={() => handleUnsubscribeCrm(selectedCrmCustomer.id)}
                        style={{ padding: '0.25rem', fontSize: '0.65rem', color: 'var(--status-late)', borderColor: '#f5c6c6', background: 'var(--status-late-light)', borderRadius: '6px', marginTop: '0.15rem' }}
                      >
                        Résilier l'abonnement
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Aucun forfait actif.</div>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <select 
                          className="input-control" 
                          style={{ flex: 1, padding: '0.28rem', fontSize: '0.68rem', borderRadius: '6px' }}
                          value={selectedCrmSubId}
                          onChange={(e) => setSelectedCrmSubId(e.target.value)}
                        >
                          <option value="">-- Choisir --</option>
                          {catalog.filter(i => i.service === 'abonnement').map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.article} ({sub.prix} F)</option>
                          ))}
                        </select>
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          onClick={() => handleSubscribeCrm(selectedCrmCustomer.id, selectedCrmSubId)}
                          style={{ padding: '0.28rem 0.55rem', fontSize: '0.68rem', borderRadius: '6px' }}
                        >
                          Souscrire
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
           ONGLET : HISTORIQUE
           ======================================================== */}
        {activeTab === 'historique' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ paddingTop: '8px' }}>
              <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>Historique</h1>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Archives des commandes</p>
            </div>

            {/* Search and filter */}
            <div style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ paddingLeft: '2.2rem', width: '100%', padding: '0.4rem', fontSize: '0.75rem' }}
                  placeholder="Rechercher code, client, linge..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                />
              </div>

              {/* Status filter pills */}
              <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.15rem', scrollbarWidth: 'none' }}>
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
                      padding: '0.28rem 0.6rem',
                      fontSize: '0.65rem',
                      borderRadius: '20px',
                      whiteSpace: 'nowrap',
                      border: historyFilterStatus === filter.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      background: historyFilterStatus === filter.id ? 'var(--primary)' : '#fff',
                      color: historyFilterStatus === filter.id ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setHistoryFilterStatus(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredHistoryOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Aucune commande dans l'historique.
                </div>
              ) : (
                filteredHistoryOrders.map(order => {
                  const client = customers.find(c => c.id === order.customer_id);
                  const clientName = client ? `${client.prenom} ${client.nom}` : 'Client B2B';
                  const clientInitials = client ? `${client.prenom?.[0] || ''}${client.nom?.[0] || ''}` : 'CB';
                  const isExpress = order.niveau_urgence === 'Express';
                  const remaining = order.prix_total - order.avance_payee;

                  return (
                    <div 
                      key={order.id} 
                      style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', borderRadius: '16px' }}
                    >
                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.58rem' }}>
                            {clientInitials}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>{order.identifiant_unique_marquage}</strong>
                            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{formatDateTime(order.created_at)}</div>
                          </div>
                        </div>
                        <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.52rem', padding: '0.1rem 0.35rem' }}>
                          {statusLabels[order.statut]}
                        </span>
                      </div>

                      {/* Client Info */}
                      <div style={{ fontSize: '0.68rem', display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                        <div>Client: <strong>{clientName}</strong> {client && <span style={{ color: 'var(--text-muted)' }}>({client.telephone})</span>}</div>
                        <div>Urgence: <span style={{ fontWeight: 700, color: isExpress ? 'var(--status-late)' : 'var(--text-primary)' }}>{order.niveau_urgence}</span></div>
                      </div>

                      {/* Items and Services */}
                      <div style={{ background: 'var(--bg-app)', padding: '0.4rem', borderRadius: '8px', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.6rem' }}>Détails articles :</div>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.65rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.35rem' }}>
                        <div>Total: <strong>{order.prix_total.toLocaleString()} F</strong></div>
                        <div>Acompte: <strong style={{ color: 'var(--status-ready)' }}>{order.avance_payee.toLocaleString()} F</strong></div>
                        <div>Réglement: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{order.mode_reglement.replace(/_/g, ' ')}</span></div>
                        <div style={{ color: remaining > 0 ? 'var(--status-late)' : 'var(--status-ready)' }}>
                          Solde: <strong>{remaining.toLocaleString()} F</strong>
                        </div>
                      </div>

                      {/* Footer */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem', marginTop: '0.1rem' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.22rem 0.55rem', fontSize: '0.62rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ paddingTop: '8px' }}>
              <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>Compte</h1>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Profil & Préférences</p>
            </div>

            {/* Profile card — finance style */}
            <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.9rem' }}>
              <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>
                {currentUser.prenom.charAt(0)}{currentUser.nom.charAt(0)}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>{currentUser.prenom} {currentUser.nom}</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize', margin: '0.1rem 0 0' }}>
                  {currentUser.role.replace(/_/g, ' ')}
                </p>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
            </div>

            {/* Stats Grid */}
            <div>
              <div className="section-header">
                <h4>Vos Stats</h4>
                <span className="see-all">Voir tout</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                <div className="kpi-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
                    <div className="kpi-icon" style={{ background: 'var(--primary-light)', width: '28px', height: '28px', borderRadius: '8px' }}>
                      <Sliders size={13} color="var(--primary)" />
                    </div>
                    <span className="kpi-label">Dépôts du Jour</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: '1.2rem' }}>8 cmd</div>
                </div>
                <div className="kpi-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
                    <div className="kpi-icon" style={{ background: 'var(--status-ready-light)', width: '28px', height: '28px', borderRadius: '8px' }}>
                      <Award size={13} color="var(--status-ready)" />
                    </div>
                    <span className="kpi-label">Score Qualité</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: '1.2rem', color: 'var(--status-ready)' }}>99.2 %</div>
                </div>
              </div>
            </div>



            {/* Configuration */}
            <div style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', fontFamily: 'var(--font-title)' }}>
                Configuration
              </h4>
              
              <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Version</span>
                  <strong>v1.0.4 B2B</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Port</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>5174</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Base de Données</span>
                  <span style={{ color: 'var(--status-ready)', fontWeight: 700 }}>Synced</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Navigation — Style Finance App */}
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
          Compte
        </button>
      </div>

      {/* iOS Home Indicator bottom line */}
      <div className="phone-home-indicator"></div>

      {/* ================= MODAL ENREGISTREMENT COMMANDE ================= */}
      {showOrderRegistrationModal && (
        <div className="modal-overlay bottom-align" style={{ zIndex: 999 }}>
          <form onSubmit={handleCreateOrder} className="modal-sheet">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0 }}>Nouvelle commande</h3>
              <button type="button" onClick={() => setShowOrderRegistrationModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={18} color="var(--text-muted)" />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '2px' }}>
              
              {/* Client Selection */}
              <div style={{ padding: '0.4rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Client</label>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    style={{ padding: '0.18rem 0.45rem', fontSize: '0.6rem', borderRadius: '6px' }}
                    onClick={() => setShowNewCustomerModal(true)}
                  >
                    + Nouveau
                  </button>
                </div>
                <select 
                  className="input-control" 
                  style={{ width: '100%', padding: '0.42rem', fontSize: '0.78rem', borderRadius: '8px' }}
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Choisir un client --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom} ({c.telephone})</option>
                  ))}
                </select>

                {activeCustomer && (
                  <div style={{ marginTop: '0.45rem', padding: '0.4rem', background: 'var(--primary-light)', borderRadius: '8px', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Préférence : <strong>{activeCustomer.preferences_pliage}</strong></span>
                      <span style={{ color: 'var(--secondary)' }}>Points: <strong>{activeCustomer.points_fidelite} pts</strong></span>
                    </div>
                    {activeCustomer.solde_dette > 0 && (
                      <div style={{ color: 'var(--status-late)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <TriangleAlert size={10} /> Dette: {activeCustomer.solde_dette} FCFA
                      </div>
                    )}
                    {/* Zone d'abonnement dynamique */}
                    {activeCustomer.active_subscription ? (
                      <div style={{ marginTop: '0.3rem', borderTop: '1px dashed rgba(26, 26, 94, 0.15)', paddingTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: subscribePlanId ? 'not-allowed' : 'pointer', fontWeight: 700, color: 'var(--primary)' }}>
                            <input 
                              type="checkbox"
                              checked={payWithSubscription}
                              disabled={!!subscribePlanId}
                              onChange={(e) => setPayWithSubscription(e.target.checked)}
                            />
                            Régler avec l'abonnement
                          </label>
                          <span style={{ fontWeight: 700, fontSize: '0.62rem' }}>
                            ({activeCustomer.active_subscription.remaining_clothes} vêt.)
                          </span>
                        </div>

                        {payWithSubscription && !subscribePlanId && getTotalClothesCount() > activeCustomer.active_subscription.remaining_clothes && (
                          <div style={{ color: 'var(--status-late)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.62rem' }}>
                            <TriangleAlert size={10} /> Solde insuffisant ({getTotalClothesCount()} requis)
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Renouveler :</span>
                          <select 
                            className="input-control"
                            style={{ padding: '0.18rem 0.35rem', fontSize: '0.7rem', borderRadius: '6px', width: '100%', background: '#fff' }}
                            value={subscribePlanId}
                            onChange={(e) => setSubscribePlanId(e.target.value)}
                          >
                            <option value="">-- Conserver l'abonnement --</option>
                            {catalog.filter(c => c.categorie === 'abonnement').map(p => (
                              <option key={p.id} value={p.id}>{p.article} ({p.prix.toLocaleString()} F)</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.3rem', borderTop: '1px dashed rgba(26, 26, 94, 0.15)', paddingTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.62rem' }}>Souscrire un abonnement :</span>
                          <select 
                            className="input-control"
                            style={{ padding: '0.18rem 0.35rem', fontSize: '0.7rem', borderRadius: '6px', width: '100%', background: '#fff' }}
                            value={subscribePlanId}
                            onChange={(e) => setSubscribePlanId(e.target.value)}
                          >
                            <option value="">-- Pas d'abonnement --</option>
                            {catalog.filter(c => c.categorie === 'abonnement').map(p => (
                              <option key={p.id} value={p.id}>{p.article} ({p.prix.toLocaleString()} F)</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Clothes & Services Selection */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Linge & Services</label>
                <div style={{ 
                  maxHeight: '200px', overflowY: 'auto', 
                  border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.35rem',
                  display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--bg-app)', marginTop: '0.25rem'
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
                        display: 'flex', flexDirection: 'column', gap: '0.25rem', 
                        padding: '0.4rem 0.5rem', 
                        background: qty > 0 ? 'var(--primary-light)' : '#fff', 
                        borderRadius: '10px',
                        border: qty > 0 ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        transition: 'all 0.15s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: qty > 0 ? 800 : 600 }}>{cloth}</span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <button 
                              type="button" 
                              style={{ 
                                width: '22px', height: '22px', borderRadius: '50%', 
                                border: '1px solid var(--border-color)', background: '#fff', 
                                color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                cursor: qty === 0 ? 'not-allowed' : 'pointer', opacity: qty === 0 ? 0.3 : 1,
                                fontSize: '0.8rem', fontWeight: 'bold', padding: 0
                              }}
                              disabled={qty === 0}
                              onClick={() => handleUpdateQty(cloth, -1)}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, minWidth: '12px', textAlign: 'center' }}>{qty}</span>
                            <button 
                              type="button" 
                              style={{ 
                                width: '22px', height: '22px', borderRadius: '50%', 
                                border: '1px solid var(--primary)', background: 'var(--primary-light)', 
                                color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: 0
                              }}
                              onClick={() => handleUpdateQty(cloth, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {qty > 0 && (
                          <div style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem', 
                            borderTop: '1px dashed rgba(26, 26, 94, 0.12)', paddingTop: '0.2rem'
                          }}>
                            <select 
                              style={{ 
                                padding: '0.12rem 0.25rem', fontSize: '0.62rem', 
                                border: '1px solid var(--border-color)', borderRadius: '6px', 
                                width: '60%', background: '#fff', color: 'var(--text-primary)', outline: 'none'
                              }}
                              value={selectedSvc}
                              onChange={(e) => handleUpdateService(cloth, e.target.value)}
                            >
                              {activeServices.map(s => (
                                <option key={s.service} value={s.service}>{serviceLabels[s.service]} ({s.prix} F)</option>
                              ))}
                            </select>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                  <label style={{ fontSize: '0.68rem' }}>Urgence</label>
                  <select 
                    className="input-control" 
                    style={{ padding: '0.42rem', fontSize: '0.75rem', borderRadius: '8px' }}
                    value={niveauUrgence} 
                    onChange={(e) => setNiveauUrgence(e.target.value)}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Express">Express (+50%)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                  <label style={{ fontSize: '0.68rem' }}>Règlement</label>
                  <select 
                    className="input-control" 
                    style={{ padding: '0.42rem', fontSize: '0.75rem', borderRadius: '8px' }}
                    value={(payWithSubscription && !subscribePlanId) ? 'abonnement' : modeReglement} 
                    disabled={payWithSubscription && !subscribePlanId}
                    onChange={(e) => setModeReglement(e.target.value)}
                  >
                    {(payWithSubscription && !subscribePlanId) ? (
                      <option value="abonnement">Abonnement</option>
                    ) : (
                      <>
                        <option value="especes">Espèces</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="avance_solde">Avance/Crédit</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {(!payWithSubscription || !!subscribePlanId) && (
                <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                  <label style={{ fontSize: '0.68rem' }}>Acompte (FCFA)</label>
                  <input 
                    type="number" 
                    className="input-control" 
                    style={{ padding: '0.42rem', fontSize: '0.75rem', borderRadius: '8px' }}
                    placeholder="Ex: 1000"
                    value={avancePayee}
                    onChange={(e) => setAvancePayee(e.target.value)}
                  />
                </div>
              )}

            </div>

            {/* Total and Save */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Total</span>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>
                  {getCalculatedPrice().toLocaleString()} FCFA
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '0.42rem 0.9rem', fontSize: '0.72rem', borderRadius: '8px' }}
              >
                Enregistrer
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ================= MODAL CRÉATION CLIENT ================= */}
      {showNewCustomerModal && (
        <div className="modal-overlay center-align">
          <div className="modal-dialog" style={{ maxWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0 }}>Nouveau Client</h3>
              <button type="button" onClick={() => setShowNewCustomerModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={15} color="var(--text-muted)" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Prénom</label>
                <input type="text" className="input-control" style={{ padding: '0.42rem', fontSize: '0.75rem' }} required value={newCustPrenom} onChange={(e) => setNewCustPrenom(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Nom</label>
                <input type="text" className="input-control" style={{ padding: '0.42rem', fontSize: '0.75rem' }} required value={newCustNom} onChange={(e) => setNewCustNom(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Pays (Indicatif)</label>
                <select className="input-control" style={{ padding: '0.42rem', fontSize: '0.75rem' }} value={newCustIndicatif} onChange={(e) => setNewCustIndicatif(e.target.value)}>
                  {countries.map((c) => (
                    <option key={`${c.code}-${c.name}`} value={c.code}>{c.flag} {c.name} (+{c.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Téléphone</label>
                <input type="tel" className="input-control" style={{ padding: '0.42rem', fontSize: '0.75rem' }} required placeholder="Ex: 97979797" value={newCustTel} onChange={(e) => setNewCustTel(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Préférence Pliage</label>
                <select className="input-control" style={{ padding: '0.42rem', fontSize: '0.75rem' }} value={newCustPref} onChange={(e) => setNewCustPref(e.target.value)}>
                  <option value="Plié">Plié</option>
                  <option value="Sur cintre">Sur cintre</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.3rem', padding: '0.42rem', fontSize: '0.75rem', borderRadius: '8px' }}>
                Enregistrer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RÈGLEMENT DETTE CRM ================= */}
      {showDebtPaymentModal && selectedCrmCustomer && (
        <div className="modal-overlay center-align">
          <div className="modal-dialog" style={{ maxWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0 }}>Régler la Dette</h3>
              <button type="button" onClick={() => setShowDebtPaymentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={15} color="var(--text-muted)" />
              </button>
            </div>
            
            <div style={{ marginBottom: '0.7rem', fontSize: '0.72rem' }}>
              Client: <strong>{selectedCrmCustomer.prenom} {selectedCrmCustomer.nom}</strong>
              <div style={{ fontSize: '0.82rem', color: 'var(--status-late)', marginTop: '0.15rem' }}>
                Dette: <strong>{selectedCrmCustomer.solde_dette} FCFA</strong>
              </div>
            </div>

            <form onSubmit={handlePayDebt} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Montant Reçu (FCFA)</label>
                <input type="number" className="input-control" style={{ padding: '0.42rem', fontSize: '0.75rem' }} max={selectedCrmCustomer.solde_dette} required placeholder="Ex: 1500" value={debtPaymentAmount} onChange={(e) => setDebtPaymentAmount(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.42rem', fontSize: '0.75rem', borderRadius: '8px' }}>
                Encaisser
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RÈGLEMENT LIVRAISON ================= */}
      {showDeliveryPaymentModal && delivOrder && (
        <div className="modal-overlay center-align">
          <div className="modal-dialog" style={{ maxWidth: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0 }}>Solde Livraison</h3>
              <button type="button" onClick={() => setShowDeliveryPaymentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={15} color="var(--text-muted)" />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.72rem', marginBottom: '0.7rem', padding: '0.45rem', background: 'var(--bg-app)', borderRadius: '8px' }}>
              <div>Client : <strong>{customers.find(c => c.id === delivOrder.customer_id)?.prenom} {customers.find(c => c.id === delivOrder.customer_id)?.nom}</strong></div>
              <div>Commande : <strong>{delivOrder.identifiant_unique_marquage}</strong></div>
              <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '0.3rem', paddingTop: '0.3rem' }}>Total : <strong>{delivOrder.prix_total} F</strong></div>
              <div>Acompte : <strong style={{ color: 'var(--status-ready)' }}>{delivOrder.avance_payee} F</strong></div>
              <div style={{ fontSize: '0.78rem', color: 'var(--status-late)', marginTop: '0.1rem' }}>
                Reste : <strong>{delivOrder.prix_total - delivOrder.avance_payee} FCFA</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Mode de règlement</label>
                <select className="input-control" style={{ padding: '0.42rem', fontSize: '0.75rem' }} value={delivPaymentMethod} onChange={(e) => setDelivPaymentMethod(e.target.value)}>
                  <option value="especes">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Montant Reçu (FCFA)</label>
                <input type="number" className="input-control" style={{ padding: '0.42rem', fontSize: '0.75rem' }} max={delivOrder.prix_total - delivOrder.avance_payee} required value={delivAmountPaid} onChange={(e) => setDelivAmountPaid(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.3rem', padding: '0.5rem', fontSize: '0.75rem', borderRadius: '8px', background: 'var(--status-ready)', boxShadow: '0 3px 10px rgba(26, 174, 111, 0.25)' }}>
                Encaisser & Livrer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL REÇU / TICKET DE MARQUAGE ================= */}
      {createdOrder && (
        <div className="modal-overlay center-align">
          <div className="modal-dialog" style={{ maxWidth: '320px', color: '#000' }}>
            <div id="receipt-print-area" style={{
              background: '#ffffff',
              padding: '20px 16px',
              borderRadius: '8px',
              fontFamily: 'Inter, Arial, Helvetica, sans-serif',
              color: '#0a0a0a',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {/* ---- EN-TÊTE ---- */}
              <div style={{ textAlign: 'center', paddingBottom: '14px', marginBottom: '14px', borderBottom: '2px dashed #e8e8ef' }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0a0a0a', letterSpacing: '1px', fontFamily: 'DM Sans, Arial, Helvetica, sans-serif' }}>KLIN UP</h1>
                <p style={{ margin: '4px 0 10px', fontSize: '11px', color: 'var(--status-pending)', fontWeight: '600' }}>Ticket de Dépôt Client</p>
                <div style={{
                  display: 'inline-block',
                  background: '#1a1a5e',
                  color: '#ffffff',
                  padding: '5px 14px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  fontSize: '14px',
                  letterSpacing: '2px'
                }}>
                  {createdOrder.identifiant_unique_marquage}
                </div>
              </div>

              {/* ---- DÉTAILS ---- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid #e8e8ef' }}>
                <div><span style={{ fontWeight: '700' }}>Client :</span> {customers.find(c => c.id === createdOrder.customer_id)?.prenom} {customers.find(c => c.id === createdOrder.customer_id)?.nom}</div>
                <div>
                  <span style={{ fontWeight: '700' }}>Linge :</span>{' '}
                  <span style={{ color: 'var(--status-pending)', fontWeight: '600' }}>{createdOrder.type_article} ({serviceLabels[createdOrder.type_service] || createdOrder.type_service})</span>
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

              {createdOrder.is_subscription_order && createdOrder.subscription_details && (
                <div style={{ padding: '7px 9px', background: 'var(--status-ready-light)', border: '1px solid #b0e8d0', borderRadius: '6px', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: '800', color: 'var(--status-ready)', borderBottom: '1px dashed #b0e8d0', paddingBottom: '2px', marginBottom: '2px' }}>
                    Suivi Solde Abonnement
                  </div>
                  {createdOrder.subscription_details.immediate_subscription && (
                    <div style={{ fontWeight: '800', color: '#b07a18', borderBottom: '1px dashed #f0d98a', paddingBottom: '2px', marginBottom: '3px' }}>
                      Abonnement souscrit : {createdOrder.subscription_details.immediate_subscription.name}
                    </div>
                  )}
                  <div>Forfait : <strong>{createdOrder.subscription_details.name}</strong></div>
                  <div>Vêtements retirés : <strong>-{createdOrder.subscription_details.clothes_deducted}</strong></div>
                  {!createdOrder.subscription_details.immediate_subscription && (
                    <div>Solde précédent : <strong>{createdOrder.subscription_details.previous_balance} vêt.</strong></div>
                  )}
                  <div style={{ borderTop: '1px dashed #b0e8d0', paddingTop: '2px', marginTop: '2px', fontWeight: '800', color: 'var(--status-ready)' }}>
                    Nouveau solde : {createdOrder.subscription_details.new_balance} vêtements restants
                  </div>
                </div>
              )}

              {/* ---- TOTAUX ---- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#5a5a6e' }}>Total Commande :</span>
                  <span style={{ fontWeight: '700', color: '#0a0a0a' }}>
                    {createdOrder.is_subscription_order 
                      ? (createdOrder.subscription_details.immediate_subscription 
                        ? `${(createdOrder.prix_total || 0).toLocaleString()} FCFA` 
                        : '0 FCFA (Abonnement)') 
                      : `${(createdOrder.prix_total || 0).toLocaleString()} FCFA`}
                  </span>
                </div>
                {(!createdOrder.is_subscription_order || !!createdOrder.subscription_details.immediate_subscription) ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#5a5a6e' }}>Acompte Payé :</span>
                      <span style={{ fontWeight: '700', color: '#0a0a0a' }}>{(createdOrder.avance_payee || 0).toLocaleString()} FCFA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #e8e8ef' }}>
                      <span style={{ color: '#5a5a6e', fontWeight: '600' }}>Reste à payer :</span>
                      <span style={{ fontWeight: '800', fontSize: '13px', color: (createdOrder.prix_total - createdOrder.avance_payee) > 0 ? 'var(--status-late)' : 'var(--status-ready)' }}>
                        {((createdOrder.prix_total || 0) - (createdOrder.avance_payee || 0)).toLocaleString()} FCFA
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #e8e8ef' }}>
                    <span style={{ color: 'var(--status-ready)', fontWeight: '800' }}>Reste à payer :</span>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: 'var(--status-ready)' }}>0 FCFA</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', padding: '0.42rem', fontSize: '0.72rem', borderRadius: '8px' }}
                  onClick={() => alert("Impression du reçu en cours !")}
                >
                  <Printer size={12} /> Imprimer
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', padding: '0.42rem', fontSize: '0.72rem', borderRadius: '8px' }}
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
                style={{ width: '100%', padding: '0.42rem', fontSize: '0.72rem', borderRadius: '8px' }}
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
        <div className="modal-overlay center-align">
          <div className="modal-dialog" style={{ maxWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0 }}>Serveur</h3>
              <button type="button" onClick={() => setShowSettingsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={15} color="var(--text-muted)" />
              </button>
            </div>
            
            <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: '0 0 0.7rem 0', lineHeight: '1.35' }}>
              Renseignez l'adresse IP de votre ordinateur (ex: <code style={{ background: 'var(--bg-app)', padding: '1px 4px', borderRadius: '3px', fontSize: '0.65rem' }}>192.168.1.100</code>).
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
            }} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Adresse IP</label>
                <input type="text" className="input-control" style={{ padding: '0.42rem', fontSize: '0.75rem' }} required placeholder="Ex: 192.168.1.50" value={tempServerIp} onChange={(e) => setTempServerIp(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.3rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1, padding: '0.42rem', fontSize: '0.72rem', borderRadius: '8px' }}
                  onClick={() => {
                    localStorage.removeItem('server_ip');
                    setShowSettingsModal(false);
                    window.location.reload();
                  }}
                >
                  Réinitialiser
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.42rem', fontSize: '0.72rem', borderRadius: '8px' }}>
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
