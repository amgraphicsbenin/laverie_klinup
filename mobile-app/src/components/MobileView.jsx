import React, { useState, useEffect, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { db } from '../services/db';
import FormulaireCommande from './FormulaireCommande';
import FicheClient from './FicheClient';
import VueKanban from './VueKanban';
import { countries } from '../utils/countriesData';

const AndroidPrint = registerPlugin('AndroidPrint');
import logoDark from '../assets/logo_dark.png';
import logoGold from '../assets/logo_gold.png';
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
  Scan,
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
  EyeOff,
  LogOut,
  Lock,
  Mail,
  Users,
  Edit2,
  Trash2,
  ArrowLeft,
  Sun,
  Flame,
  Feather,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  Check,
  Key
} from 'lucide-react';

// Composant utilitaire — Google Material Symbols Rounded
const MIcon = ({ name, size = 22, style = {}, className = '', filled = false }) => (
  <span
    className={`material-symbols-rounded${className ? ' ' + className : ''}`}
    style={{
      fontSize: size,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      userSelect: 'none',
      ...style
    }}
  >
    {name}
  </span>
);

import { CustomSelect } from './CustomSelect';
export { CustomSelect };

export default function MobileView() {
  const [activeTab, setActiveTab] = useState('accueil'); // accueil, gestion, facturation, profile
  const [accueilSubView, setAccueilSubView] = useState('main'); // main, top_clients
  const [gestionSubView, setGestionSubView] = useState('main'); // main, all_profiles, all_subscriptions
  const [activityPeriod, setActivityPeriod] = useState('7_days'); // 3_days, 7_days, 1_month, 3_months, 6_months, 12_months
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [loyaltySearchQuery, setLoyaltySearchQuery] = useState('');
  const [detailSearchQuery, setDetailSearchQuery] = useState('');
  const [dbIsRemote, setDbIsRemote] = useState(() => db.isRemote());
  
  // Paramètres fonctionnels
  const [enableWhatsAppNotifications, setEnableWhatsAppNotifications] = useState(() => {
    return localStorage.getItem('klin_up_whatsapp_enabled') !== 'false';
  });

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    return `${past.getDate().toString().padStart(2, '0')}/${(past.getMonth() + 1).toString().padStart(2, '0')}/${past.getFullYear()}`;
  };

  const loadNotificationsFromLogs = () => {
    const logs = db.getLogs();
    const readIds = JSON.parse(localStorage.getItem('klin_up_read_notifications') || '[]');
    const deletedIds = JSON.parse(localStorage.getItem('klin_up_deleted_notifications') || '[]');

    return logs
      .filter(log => !deletedIds.includes(log.id))
      .map(log => {
        let type = 'info';
        if (log.action === 'CREATION_COMMANDE' || log.action === 'PAIEMENT') {
          type = 'success';
        } else if (log.action === 'ANNULATION' || log.action === 'SUPPRESSION') {
          type = 'warning';
        }

        return {
          id: log.id,
          text: log.details,
          type,
          read: readIds.includes(log.id),
          date: getRelativeTime(log.timestamp)
        };
      });
  };

  const [notifications, setNotifications] = useState(() => loadNotificationsFromLogs());
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const markAsRead = (id) => {
    const readIds = JSON.parse(localStorage.getItem('klin_up_read_notifications') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('klin_up_read_notifications', JSON.stringify(readIds));
    }
    setNotifications(loadNotificationsFromLogs());
  };

  const deleteNotification = (id) => {
    const deletedIds = JSON.parse(localStorage.getItem('klin_up_deleted_notifications') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('klin_up_deleted_notifications', JSON.stringify(deletedIds));
    }
    setNotifications(loadNotificationsFromLogs());
  };

  const markAllAsRead = () => {
    const readIds = JSON.parse(localStorage.getItem('klin_up_read_notifications') || '[]');
    notifications.forEach(n => {
      if (!readIds.includes(n.id)) {
        readIds.push(n.id);
      }
    });
    localStorage.setItem('klin_up_read_notifications', JSON.stringify(readIds));
    setNotifications(loadNotificationsFromLogs());
  };

  const clearAllNotifications = () => {
    const deletedIds = JSON.parse(localStorage.getItem('klin_up_deleted_notifications') || '[]');
    notifications.forEach(n => {
      if (!deletedIds.includes(n.id)) {
        deletedIds.push(n.id);
      }
    });
    localStorage.setItem('klin_up_deleted_notifications', JSON.stringify(deletedIds));
    setNotifications([]);
  };
  
  // États Mode Client Calmy (Simulation)
  const [isCalmyClientMode, setIsCalmyClientMode] = useState(false);
  const [calmyView, setCalmyView] = useState('dashboard'); // dashboard, select_cycle, tracker
  const [selectedCalmyMachine, setSelectedCalmyMachine] = useState(3); // Machine N°3 par défaut
  const [selectedCalmyCycle, setSelectedCalmyCycle] = useState('express'); // delicat, express, hot
  const [calmyTimeRemaining, setCalmyTimeRemaining] = useState(1200); // 20 minutes en secondes par défaut
  const [calmyIsActive, setCalmyIsActive] = useState(false);
  const [notifyFiveMinBefore, setNotifyFiveMinBefore] = useState(true);

  // Compte à rebours temps réel pour le cycle Calmy
  useEffect(() => {
    let timer;
    if (isCalmyClientMode && calmyIsActive && calmyTimeRemaining > 0) {
      timer = setInterval(() => {
        setCalmyTimeRemaining(prev => {
          if (prev <= 1) {
            setCalmyIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCalmyClientMode, calmyIsActive, calmyTimeRemaining]);

  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const expressHours = Number(catalog.find(c => c.id === 'setting_express_hours')?.prix ?? 6);
  const normalHours = Number(catalog.find(c => c.id === 'setting_normal_hours')?.prix ?? 48);
  const expressMarkup = Number(catalog.find(c => c.id === 'setting_express_markup')?.prix ?? 50);
  const [currentUser, setCurrentUser] = useState(() => db.getCurrentUser());
  const [showCAValues, setShowCAValues] = useState(true);

  // Détermine si l'utilisateur peut toggler/voir les valeurs CA (admin, manager, accueil)
  const canToggleCA = currentUser ? (currentUser.role === 'super_admin' || currentUser.role === 'manager' || currentUser.role === 'agent_accueil') : false;
  // Alias de compatibilité — la carte CA s'affiche toujours pour tous les rôles
  const isCAAccessible = canToggleCA;
  const canViewCA = canToggleCA;

  // États d'authentification par email & code PIN de 6 chiffres
  const [selectedLoginUser, setSelectedLoginUser] = useState(null);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const pinInputRef = useRef(null);

  useEffect(() => {
    if (selectedLoginUser) {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 150);
    }
  }, [selectedLoginUser]);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showQualityStatsModal, setShowQualityStatsModal] = useState(false);

  // États pour la gestion des profils clients (Création, Modification, Suppression)
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [custNom, setCustNom] = useState('');
  const [custPrenom, setCustPrenom] = useState('');
  const [custTelephone, setCustTelephone] = useState('');
  const [custAdresse, setCustAdresse] = useState('');
  const [custPreferences, setCustPreferences] = useState('Plié');
  const [profileSearch, setProfileSearch] = useState('');
  const [showDeleteCustomerConfirm, setShowDeleteCustomerConfirm] = useState(null);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState(null);
  const [previousGestionSubView, setPreviousGestionSubView] = useState('main');

  const handleOpenCreateCustomer = () => {
    if (currentUser && currentUser.role === 'agent_lavage_repassage') return;
    setEditingCustomer(null);
    setCustNom('');
    setCustPrenom('');
    setCustTelephone('');
    setCustAdresse('');
    setCustPreferences('Plié');
    setShowCustomerModal(true);
  };

  const handleOpenEditCustomer = (cust) => {
    if (currentUser && currentUser.role === 'agent_lavage_repassage') return;
    setEditingCustomer(cust);
    setCustNom(cust.nom);
    setCustPrenom(cust.prenom);
    setCustTelephone(cust.telephone);
    setCustAdresse(cust.adresse || '');
    setCustPreferences(cust.preferences_pliage || 'Plié');
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!custNom.trim() || !custPrenom.trim() || !custTelephone.trim() || !custAdresse.trim()) {
      alert("Veuillez remplir tous les champs obligatoires (adresse comprise).");
      return;
    }

    try {
      if (editingCustomer) {
        db.updateCustomer(editingCustomer.id, {
          nom: custNom.trim(),
          prenom: custPrenom.trim(),
          telephone: custTelephone.trim(),
          adresse: custAdresse.trim(),
          preferences_pliage: custPreferences
        });
        alert("Profil client mis à jour avec succès !");
      } else {
        const newCustomer = db.addCustomer({
          nom: custNom.trim(),
          prenom: custPrenom.trim(),
          telephone: custTelephone.trim(),
          adresse: custAdresse.trim(),
          preferences_pliage: custPreferences
        });
        setSuccessPopup({
          type: 'customer',
          title: 'Compte client créé !',
          message: `Le client ${newCustomer.prenom} ${newCustomer.nom} a bien été enregistré.`,
          extraInfo: `Téléphone: ${newCustomer.telephone}`
        });
      }
      setShowCustomerModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCustomer = (id) => {
    db.deleteCustomer(id);
    alert("Profil client supprimé avec succès !");
    setShowDeleteCustomerConfirm(null);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail) return;
    
    let matchedUser = db.getStaff().find(s => s.email && s.email.toLowerCase() === loginEmail.trim().toLowerCase());
    
    if (!matchedUser && db.isRemote()) {
      try {
        await db.refreshStaff();
        matchedUser = db.getStaff().find(s => s.email && s.email.toLowerCase() === loginEmail.trim().toLowerCase());
      } catch (err) {
        console.warn("Failed to refresh staff on login:", err);
      }
    }

    if (matchedUser) {
      if (matchedUser.statut === 'suspendu') {
        alert("Votre compte a été suspendu par un administrateur.");
        return;
      }
      setSelectedLoginUser(matchedUser);
      setPinCode('');
    } else {
      alert("Aucun employé trouvé avec cette adresse email.");
    }
  };

  const handleRequestPinResetSubmit = (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    db.createPinResetRequest(resetEmail.trim());
    alert(`Demande de réinitialisation envoyée pour ${resetEmail} ! Veuillez demander à un administrateur d'approuver votre demande.`);
    setShowResetPinModal(false);
    setResetEmail('');
  };

  const handlePinChange = (e) => {
    if (pinError || isUnlocking) return;
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 6) return;
    setPinCode(val);
    
    if (val.length === 6) {
      if (selectedLoginUser && selectedLoginUser.code_pin === val) {
        setIsUnlocking(true);
        setTimeout(() => {
          db.setCurrentUser(selectedLoginUser);
          setSelectedLoginUser(null);
          setPinCode('');
          setIsUnlocking(false);
        }, 300);
      } else {
        setPinError(true);
        setTimeout(() => {
          setPinCode('');
          setPinError(false);
        }, 800);
      }
    }
  };

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
  const [historyFilterScope, setHistoryFilterScope] = useState('all'); // all, mine

  // Filtered orders list for the history tab
  const filteredHistoryOrders = orders.filter(o => {
    // Filter by scope
    if (historyFilterScope === 'mine' && currentUser && o.created_by_id !== currentUser.id) return false;

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

  // ── Stats réelles pour l'onglet Compte ──────────────────────────────
  // On filtre les commandes de l'utilisateur connecté.
  // Rétro-compatibilité : si une commande n'a pas de created_by_id (données
  // existantes avant la migration), on ne l'inclut PAS dans les stats perso.
  const myOrders = currentUser
    ? orders.filter(o => o.created_by_id === currentUser.id)
    : [];

  // Dépôts du Jour : commandes créées aujourd'hui par l'utilisateur connecté
  const todayDeposits = (() => {
    const todayStr = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    return myOrders.filter(o => o.created_at && o.created_at.slice(0, 10) === todayStr).length;
  })();

  // Score Qualité : basé sur les 90 derniers jours, filtré par utilisateur
  // Critères : commandes livrées à temps (+), annulées (-), en retard (-)
  const qualityScore = (() => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const recentOrders = myOrders.filter(o => o.created_at && new Date(o.created_at) >= ninetyDaysAgo);

    if (recentOrders.length === 0) return null; // Pas encore assez de données

    const now = new Date();
    let totalHandled = 0;
    let lateCount = 0;
    let cancelledCount = 0;
    let onTimeCount = 0;

    recentOrders.forEach(o => {
      if (o.statut === 'annule') {
        cancelledCount++;
        totalHandled++;
      } else if (o.statut === 'restitue' || o.statut === 'a_livrer' || o.statut === 'a_recuperer') {
        totalHandled++;
        const due = o.due_date ? new Date(o.due_date) : null;
        const paidAt = o.solde_paid_at ? new Date(o.solde_paid_at) : null;
        if (due && paidAt && paidAt <= due) {
          onTimeCount++;
        } else if (due && paidAt && paidAt > due) {
          lateCount++;
        } else {
          onTimeCount++; // Pas d'info → bénéfice du doute
        }
      } else {
        // Commandes en cours : pénalité si due_date dépassée
        const due = o.due_date ? new Date(o.due_date) : null;
        if (due && now > due) {
          lateCount++;
          totalHandled++;
        }
      }
    });

    if (totalHandled === 0) return null;

    // Algorithme de score :
    // - Commande livrée à temps = pas de pénalité
    // - Commande annulée = -5 points
    // - Commande en retard = -10 points
    const penalty = (cancelledCount * 5) + (lateCount * 10);
    const rawScore = Math.max(0, 100 - (penalty / totalHandled) * 100);
    return Math.min(100, rawScore).toFixed(1);
  })();

  const qualityStats = (() => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const recentOrders = myOrders.filter(o => o.created_at && new Date(o.created_at) >= ninetyDaysAgo);

    let total = recentOrders.length;
    let onTime = 0;
    let late = 0;
    let cancelled = 0;
    let active = 0;
    let totalProcessingTimeMs = 0;
    let completedCountForAvg = 0;

    const now = new Date();

    recentOrders.forEach(o => {
      if (o.statut === 'annule') {
        cancelled++;
      } else if (o.statut === 'restitue') {
        const due = o.due_date ? new Date(o.due_date) : null;
        const paidAt = o.solde_paid_at ? new Date(o.solde_paid_at) : null;
        if (due && paidAt && paidAt <= due) {
          onTime++;
        } else if (due && paidAt && paidAt > due) {
          late++;
        } else {
          onTime++;
        }
        
        if (o.created_at && o.solde_paid_at) {
          const diff = new Date(o.solde_paid_at) - new Date(o.created_at);
          if (diff > 0) {
            totalProcessingTimeMs += diff;
            completedCountForAvg++;
          }
        }
      } else {
        // En cours
        active++;
        const due = o.due_date ? new Date(o.due_date) : null;
        if (due && now > due) {
          late++;
        }
      }
    });

    const avgProcessingTimeHours = completedCountForAvg > 0 
      ? (totalProcessingTimeMs / completedCountForAvg / 3600000).toFixed(1)
      : null;

    return {
      total,
      onTime,
      late,
      cancelled,
      active,
      avgProcessingTimeHours
    };
  })();
  // ─────────────────────────────────────────────────────────────────────


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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Informations copiées dans le presse-papier !");
    }).catch(err => {
      console.error("Clipboard copy failed: ", err);
    });
  };

  const handleCompleteDelivery = (order, originalStatus) => {
    setDelivFinalStatus('restitue');
    const remainingToPay = order.prix_total - order.avance_payee;
    if (remainingToPay <= 0) {
      if (confirm(`Confirmer la restitution de la commande ${order.identifiant_unique_marquage} ?`)) {
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
    
    db.deliverOrderWithPayment(delivOrder.id, Number(delivAmountPaid || 0), delivPaymentMethod, delivFinalStatus);
    refreshData();
    setShowDeliveryPaymentModal(false);

    // Notification WhatsApp solde livraison
    const customer = customers.find(c => c.id === delivOrder.customer_id);
    if (customer) {
      const text = `Bonjour ${customer.prenom} ${customer.nom}, nous confirmons la livraison de votre commande ${delivOrder.identifiant_unique_marquage} (${delivFinalStatus === 'a_livrer' ? 'À livrer' : 'À récupérer'}) et le règlement du solde de ${Number(delivAmountPaid).toLocaleString()} FCFA.\nVotre commande est entièrement soldée. Merci pour votre fidélité !`;
      sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
    }

    setDelivOrder(null);
  };

  // Nouveau Client
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustNom, setNewCustNom] = useState('');
  const [newCustPrenom, setNewCustPrenom] = useState('');
  const [newCustTel, setNewCustTel] = useState('');
  const [newCustAdresse, setNewCustAdresse] = useState('');
  const [newCustPref, setNewCustPref] = useState('Plié');
  const [newCustIndicatif, setNewCustIndicatif] = useState('229');
  const [delivFinalStatus, setDelivFinalStatus] = useState('a_livrer');

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
  const [successPopup, setSuccessPopup] = useState(null);

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

  // Gestion du retour gestuel et physique Android (Back Button)
  useEffect(() => {
    const handleBackButton = async () => {
      // 1. Fermer les modales ou dropdowns actifs
      if (showOrderRegistrationModal) {
        setShowOrderRegistrationModal(false);
        return;
      }
      if (showNotificationsModal) {
        setShowNotificationsModal(false);
        return;
      }
      if (showResetPinModal) {
        setShowResetPinModal(false);
        return;
      }
      if (showLogoutConfirm) {
        setShowLogoutConfirm(false);
        return;
      }
      if (showCustomerModal) {
        setShowCustomerModal(false);
        return;
      }
      if (showDeleteCustomerConfirm) {
        setShowDeleteCustomerConfirm(null);
        return;
      }
      if (showDeliveryPaymentModal) {
        setShowDeliveryPaymentModal(false);
        return;
      }
      if (showNewCustomerModal) {
        setShowNewCustomerModal(false);
        return;
      }
      if (showDebtPaymentModal) {
        setShowDebtPaymentModal(false);
        return;
      }
      if (showSettingsModal) {
        setShowSettingsModal(false);
        return;
      }
      if (showPeriodDropdown) {
        setShowPeriodDropdown(false);
        return;
      }
      if (createdOrder) {
        setCreatedOrder(null);
        return;
      }

      // 2. Revenir aux vues principales des onglets
      if (accueilSubView !== 'main') {
        setAccueilSubView('main');
        return;
      }
      if (gestionSubView !== 'main') {
        if (gestionSubView === 'client_order_history') {
          setGestionSubView(previousGestionSubView);
        } else {
          setGestionSubView('main');
        }
        return;
      }

      // 3. Revenir à l'onglet principal "accueil"
      if (activeTab !== 'accueil') {
        setActiveTab('accueil');
        setAccueilSubView('main');
        setGestionSubView('main');
        return;
      }

      // 4. Si sur l'accueil racine, minimiser l'app natrice
      try {
        const { App } = await import('@capacitor/app');
        await App.minimizeApp();
      } catch (err) {
        console.log('App.minimizeApp is not available on this platform.', err);
      }
    };

    let active = true;
    let listenerHandle = null;
    const setupBackButtonListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('backButton', () => {
          handleBackButton();
        });
        if (!active) {
          handle.remove();
        } else {
          listenerHandle = handle;
        }
      } catch (err) {
        console.log('Capacitor App backButton listener registration skipped (not on native platform).', err);
      }
    };

    setupBackButtonListener();

    return () => {
      active = false;
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [
    showOrderRegistrationModal,
    showNotificationsModal,
    showResetPinModal,
    showLogoutConfirm,
    showCustomerModal,
    showDeleteCustomerConfirm,
    showDeliveryPaymentModal,
    showNewCustomerModal,
    showDebtPaymentModal,
    showSettingsModal,
    showPeriodDropdown,
    createdOrder,
    accueilSubView,
    gestionSubView,
    previousGestionSubView,
    activeTab
  ]);

  // Load initial data
  useEffect(() => {
    if (currentUser && currentUser.role === 'agent_lavage_repassage') {
      setActiveTab('gestion');
      setGestionSubView('main');
    }
  }, [currentUser]);

  useEffect(() => {
    setCustomers(db.getCustomers());
    setOrders(db.getOrders());
    setCatalog(db.getCatalog());
    setCurrentUser(db.getCurrentUser());
    setNotifications(loadNotificationsFromLogs());

    const unsubscribe = db.subscribe(() => {
      setCustomers(db.getCustomers());
      setOrders(db.getOrders());
      setCatalog(db.getCatalog());
      setCurrentUser(db.getCurrentUser());
      setNotifications(loadNotificationsFromLogs());
      setDbIsRemote(db.isRemote());
    });
    return () => unsubscribe();
  }, [activeTab]);

  const refreshData = () => {
    setCustomers(db.getCustomers());
    setOrders(db.getOrders());
  };

  // Extract unique clothes from catalog for Caisses dropdown
  const catalogClothes = catalog.length > 0 
    ? [...new Set(catalog.filter(c => c.categorie !== 'abonnement' && c.categorie !== 'system_setting' && c.service !== 'system').map(c => c.article))] 
    : [
        'Chemise', 'Pantalon', 'Robe', 'Combinaison', 'Jupe', 'Pull', 'Culotte', 'T-shirt', 'Polo', 'Blouson', 
        'Veste', 'Costume', 'Cravate', 'Haut', 'Débardeur', 'Jeans', 'Robe de mariée', 'Couette Legée', 'Couette lourd', 
        '1Draps+ 2 taies', '2 draps+ 2 taies', 'Taies', 'Petite serviette', 'Grandes serviettes', 'Ensemble 2 pièce', 
        'Ensemble 3 pièces', 'Chapeau', 'chausette', 'Nappe de table', 'Rideau', 'Robe fantaisiste', 'Serpillière', 
        'Torchon', 'Foulard'
      ];

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
    return niveauUrgence === 'Express' ? Math.round(total * (1 + expressMarkup / 100)) : total;
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustNom || !newCustPrenom || !newCustTel || !newCustAdresse) {
      alert("Veuillez remplir tous les champs obligatoires (adresse comprise).");
      return;
    }
    
    try {
      const newCustomer = db.addCustomer({
        nom: newCustNom,
        prenom: newCustPrenom,
        telephone: newCustTel,
        adresse: newCustAdresse,
        indicatif: newCustIndicatif,
        preferences_pliage: newCustPref
      });
      
      refreshData();
      setSelectedCustomerId(newCustomer.id);
      setShowNewCustomerModal(false);
      setNewCustNom('');
      setNewCustPrenom('');
      setNewCustTel('');
      setNewCustAdresse('');
      setNewCustIndicatif('229');

      setSuccessPopup({
        type: 'customer',
        title: 'Compte client créé !',
        message: `Le client ${newCustomer.prenom} ${newCustomer.nom} a bien été enregistré.`,
        extraInfo: `Téléphone: +${newCustomer.indicatif} ${newCustomer.telephone}`
      });
    } catch (err) {
      alert(err.message);
    }
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
      setAvancePayee('');
      setSubscribePlanId('');
      setArticleQuantities({});
      setShowOrderRegistrationModal(false);

      setSuccessPopup({
        type: 'order',
        title: 'Commande Enregistrée !',
        message: `La commande a bien été créée avec succès.`,
        extraInfo: newOrder.identifiant_unique_marquage,
        order: newOrder
      });

      // Notification WhatsApp à l'enregistrement
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        let text = '';
        const formattedDueDate = formatDateOnly(newOrder.due_date);
        
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
        } else if (nextStatus === 'en_cours_repassage') {
          text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} est maintenant en cours de repassage chez KLIN UP.`;
        } else if (nextStatus === 'pret') {
          const remaining = order.prix_total - order.avance_payee;
          text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} est prête ! Vous pouvez passer la récupérer.\nReste à payer: ${remaining.toLocaleString()} FCFA.\nÀ bientôt chez KLIN UP !`;
        } else if (nextStatus === 'a_livrer') {
          text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} est prête et est en cours de livraison à votre adresse.`;
        } else if (nextStatus === 'a_recuperer') {
          text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} est prête et est en attente de récupération à la laverie.`;
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
    lavage_simple: 'Traitement',
    nettoyage_a_sec: 'Nettoyage à sec',
    repassage: 'Repassage',
    abonnement: 'Abonnement'
  };

  const statusLabels = {
    en_attente: 'En attente de traitement',
    en_cours_lavage: 'En attente de repassage',
    en_cours_repassage: 'Repassé',
    pret: 'Prêt',
    restitue: 'Restitué',
    a_livrer: 'En attente de Livraison',
    a_recuperer: 'En attente de Récupération',
    en_cours_livraison: 'En cours de livraison',
    annule: 'Annulé'
  };

  const getOrderStatusLabel = (order) => {
    if (order.statut === 'restitue') {
      const type = order.subscription_details?.type_livraison || order.subscription_details?.restitution_type || 'recuperation';
      return type === 'livraison' ? 'Livré' : 'Récupéré';
    }
    return statusLabels[order.statut] || order.statut;
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

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
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
    if (!enableWhatsAppNotifications) return;
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

  // Rendu de l'application cliente Calmy
  const renderCalmyClientView = () => {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getCycleDuration = (id) => {
      if (id === 'delicat') return 2100; // 35 min
      if (id === 'express') return 1200; // 20 min
      return 3000; // 50 min
    };

    const getCycleLabel = (id) => {
      if (id === 'delicat') return 'Délicat';
      if (id === 'express') return 'Express';
      return 'Haute Température';
    };

    const getCyclePrice = (id) => {
      if (id === 'delicat') return '2 200 F';
      if (id === 'express') return '1 500 F';
      return '2 600 F';
    };

    const getStepStatus = () => {
      const duration = getCycleDuration(selectedCalmyCycle);
      const elapsed = duration - calmyTimeRemaining;
      const pct = (elapsed / duration) * 100;

      if (pct < 60) return { label: 'Lavage en cours', step: 1 };
      if (pct < 85) return { label: 'Rinçage en cours', step: 2 };
      return { label: 'Essorage & Séchage', step: 3 };
    };

    const stepInfo = getStepStatus();

    // VIEW: DASHBOARD
    if (calmyView === 'dashboard') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '16px 20px 32px', minHeight: '100%', position: 'relative' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Bonjour Marie,</p>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-title)', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>Ma Laverie</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => setIsCalmyClientMode(false)} 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.68rem', borderRadius: '10px', fontWeight: 700 }}
              >
                ← Staff Portal
              </button>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', border: '1px solid rgba(43, 130, 240, 0.2)' }}>
                MA
              </div>
            </div>
          </div>

          {/* Active Machine Widget */}
          {calmyIsActive ? (
            <div 
              className="card" 
              onClick={() => setCalmyView('tracker')}
              style={{ 
                cursor: 'pointer',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.8rem', 
                border: '1.5px solid var(--primary)', 
                background: 'linear-gradient(135deg, rgba(43, 130, 240, 0.1) 0%, rgba(26, 75, 140, 0.05) 100%)',
                boxShadow: '0 8px 24px rgba(43, 130, 240, 0.12)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="spin-washing" style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2.5px dashed var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Waves size={16} color="var(--primary)" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Machine N°{selectedCalmyMachine}</h4>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: '1px 0 0' }}>{stepInfo.label}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-title)' }}>
                    {formatTime(calmyTimeRemaining)}
                  </div>
                  <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)' }}>restantes</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(43, 130, 240, 0.15)', paddingTop: '0.6rem' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Cycle : <strong>{getCycleLabel(selectedCalmyCycle)}</strong></span>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  Suivre en direct <ChevronRight size={12} />
                </span>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.65)', border: '1px solid rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={22} strokeWidth={1.5} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Aucun cycle actif</h4>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: '2px 0 0', lineHeight: 1.35 }}>Sélectionnez une machine libre dans l'application pour lancer votre cycle de lavage.</p>
              </div>
              <button 
                onClick={() => setCalmyView('select_cycle')}
                className="btn btn-primary" 
                style={{ width: '100%', borderRadius: '12px', padding: '0.65rem', fontSize: '0.78rem', marginTop: '0.2rem' }}
              >
                + Lancer un cycle
              </button>
            </div>
          )}

          {/* Machine Grid Status */}
          <div>
            <div className="section-header">
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Machines Disponibles</h4>
              <span className="see-all">Plan</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', padding: '0.85rem', background: 'rgba(255, 255, 255, 0.65)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(43, 130, 240, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Waves size={14} />
                  </div>
                  <span className="badge badge-pret" style={{ fontSize: '0.48rem', padding: '0.05rem 0.25rem' }}>4 Libres</span>
                </div>
                <div>
                  <h5 style={{ fontSize: '0.78rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Lavantes</h5>
                  <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', margin: '1px 0 0' }}>4 libres sur 6</p>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', padding: '0.85rem', background: 'rgba(255, 255, 255, 0.65)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.08)', color: 'var(--status-pending)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sun size={14} />
                  </div>
                  <span className="badge badge-pret" style={{ fontSize: '0.48rem', padding: '0.05rem 0.25rem' }}>2 Libres</span>
                </div>
                <div>
                  <h5 style={{ fontSize: '0.78rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Séchantes</h5>
                  <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', margin: '1px 0 0' }}>2 libres sur 4</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick instructions */}
          <div className="card" style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Comment démarrer ?</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              <div>1. Mettez votre linge dans une machine disponible.</div>
              <div>2. Cliquez sur <strong>Lancer un cycle</strong> dans l'application.</div>
              <div>3. Sélectionnez le numéro de la machine.</div>
              <div>4. Payez et suivez le lavage en temps réel !</div>
            </div>
          </div>

        </div>
      );
    }

    // VIEW: SELECT CYCLE
    if (calmyView === 'select_cycle') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', padding: '16px 20px 32px', minHeight: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '10px' }}>
            <button 
              onClick={() => setCalmyView('dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>Choisir un cycle</h2>
          </div>

          {/* Machine selection row */}
          <div>
            <label style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
              Sélectionner la machine
            </label>
            <div style={{ display: 'flex', gap: '0.55rem', marginTop: '0.35rem' }}>
              {[
                { id: 1, label: 'N°1', busy: true },
                { id: 2, label: 'N°2', busy: true },
                { id: 3, label: 'N°3', busy: false },
                { id: 4, label: 'N°4', busy: false }
              ].map(mach => {
                const isSelected = selectedCalmyMachine === mach.id;
                return (
                  <button
                    key={mach.id}
                    type="button"
                    disabled={mach.busy}
                    onClick={() => setSelectedCalmyMachine(mach.id)}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--primary-gradient)' : mach.busy ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.7)',
                      color: isSelected ? '#fff' : mach.busy ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: mach.busy ? 'not-allowed' : 'pointer',
                      opacity: mach.busy ? 0.35 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {mach.label}
                    {mach.busy && <div style={{ fontSize: '0.45rem', fontWeight: 500, marginTop: '1px' }}>Occupée</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of cycles (3 cards) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <label style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
              Type de cycle
            </label>

            {/* Option 1: Délicat */}
            <div 
              onClick={() => setSelectedCalmyCycle('delicat')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '16px',
                cursor: 'pointer',
                border: selectedCalmyCycle === 'delicat' ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                background: selectedCalmyCycle === 'delicat' ? 'linear-gradient(135deg, rgba(43, 130, 240, 0.08) 0%, rgba(26, 75, 140, 0.04) 100%)' : 'rgba(255, 255, 255, 0.65)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedCalmyCycle === 'delicat' ? 'var(--primary)' : 'var(--text-muted)' }}>
                  <Feather size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Délicat</h4>
                  <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', margin: '1px 0 0' }}>Laine, soie & linges fins 30°C</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>35 min</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700 }}>2 200 F</div>
              </div>
            </div>

            {/* Option 2: Express */}
            <div 
              onClick={() => setSelectedCalmyCycle('express')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '16px',
                cursor: 'pointer',
                border: selectedCalmyCycle === 'express' ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                background: selectedCalmyCycle === 'express' ? 'linear-gradient(135deg, rgba(43, 130, 240, 0.08) 0%, rgba(26, 75, 140, 0.04) 100%)' : 'rgba(255, 255, 255, 0.65)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedCalmyCycle === 'express' ? 'var(--primary)' : 'var(--text-muted)' }}>
                  <Clock size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Express</h4>
                  <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', margin: '1px 0 0' }}>Lavage rapide quotidien 40°C</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>20 min</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700 }}>1 500 F</div>
              </div>
            </div>

            {/* Option 3: Haute Température */}
            <div 
              onClick={() => setSelectedCalmyCycle('hot')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '16px',
                cursor: 'pointer',
                border: selectedCalmyCycle === 'hot' ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                background: selectedCalmyCycle === 'hot' ? 'linear-gradient(135deg, rgba(43, 130, 240, 0.08) 0%, rgba(26, 75, 140, 0.04) 100%)' : 'rgba(255, 255, 255, 0.65)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedCalmyCycle === 'hot' ? 'var(--primary)' : 'var(--text-muted)' }}>
                  <Flame size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Haute Température</h4>
                  <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', margin: '1px 0 0' }}>Désinfection intense 60°C</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>50 min</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700 }}>2 600 F</div>
              </div>
            </div>

          </div>

          {/* Confirm launch button */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <button
              onClick={() => {
                const duration = getCycleDuration(selectedCalmyCycle);
                setCalmyTimeRemaining(duration);
                setCalmyIsActive(true);
                setCalmyView('tracker');
              }}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '16px',
                fontSize: '0.85rem',
                fontWeight: 800,
                boxShadow: '0 8px 24px rgba(43, 130, 240, 0.25)'
              }}
            >
              Payer et Démarrer ({getCyclePrice(selectedCalmyCycle)})
            </button>
          </div>

        </div>
      );
    }

    // VIEW: TRACKER
    if (calmyView === 'tracker') {
      const duration = getCycleDuration(selectedCalmyCycle);
      const elapsed = duration - calmyTimeRemaining;
      const progressPercent = (elapsed / duration) * 100;
      
      // Ring dimensions
      const radius = 80;
      const strokeWidth = 8;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '16px 20px 32px', minHeight: '100%', alignItems: 'center' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: '10px' }}>
            <button 
              onClick={() => setCalmyView('dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>Suivi en direct</h2>
            <button 
              onClick={() => setCalmyView('dashboard')}
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', width: '100%' }}>
            Machine N°{selectedCalmyMachine} • Cycle {getCycleLabel(selectedCalmyCycle)}
          </div>

          {/* 200px Circle Progress */}
          <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.5rem 0' }}>
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
              {/* Outer Track */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="rgba(43, 130, 240, 0.08)"
                strokeWidth={strokeWidth}
              />
              {/* Filled Progress Ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="var(--primary)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>

            {/* Inner Content overlay */}
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-title)', letterSpacing: '-1px', lineHeight: 1, color: 'var(--text-primary)' }}>
                {formatTime(calmyTimeRemaining)}
              </div>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px' }}>
                {stepInfo.label}
              </span>
            </div>
          </div>

          {/* Stepper Steps (Lavage, Rinçage, Séchage) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0.5rem 10px', position: 'relative', marginTop: '0.5rem' }}>
            {/* Stepper background line */}
            <div style={{ position: 'absolute', top: '23px', left: '30px', right: '30px', height: '3px', background: 'var(--border-color)', zIndex: 1 }}>
              {/* Active fill line */}
              <div 
                style={{ 
                  height: '100%', 
                  background: 'var(--primary)', 
                  width: stepInfo.step === 1 ? '0%' : stepInfo.step === 2 ? '50%' : '100%', 
                  transition: 'width 0.4s ease' 
                }} 
              />
            </div>

            {/* Steps */}
            {[
              { num: 1, label: 'Lavage', icon: <Waves size={12} /> },
              { num: 2, label: 'Rinçage', icon: <Clock size={12} /> },
              { num: 3, label: 'Séchage', icon: <Sun size={12} /> }
            ].map(step => {
              const isDone = stepInfo.step > step.num;
              const isActive = stepInfo.step === step.num;
              
              let stepBg = 'rgba(255,255,255,0.7)';
              let stepBorder = 'rgba(0,0,0,0.06)';
              let stepColor = 'var(--text-secondary)';

              if (isDone) {
                stepBg = 'var(--primary)';
                stepBorder = 'var(--primary)';
                stepColor = '#ffffff';
              } else if (isActive) {
                stepBg = 'var(--primary-light)';
                stepBorder = 'var(--primary)';
                stepColor = 'var(--primary)';
              }

              return (
                <div key={step.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', zIndex: 2, width: '60px' }}>
                  <div 
                    style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      background: stepBg, 
                      border: `1px solid ${stepBorder}`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: stepColor,
                      boxShadow: isActive ? '0 0 10px rgba(43, 130, 240, 0.3)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                    className={isActive && step.num === 1 ? 'spin-washing' : ''}
                  >
                    {isDone ? <CheckCircle size={12} /> : step.icon}
                  </div>
                  <span style={{ fontSize: '0.58rem', fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Toggle notify settings card */}
          <div className="card" style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0, 0, 0, 0.05)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={13} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.72rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>M'avertir avant la fin</h4>
                <p style={{ fontSize: '0.55rem', color: 'var(--text-muted)', margin: '1px 0 0' }}>Notification 5 min avant</p>
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
              <input 
                type="checkbox" 
                checked={notifyFiveMinBefore} 
                onChange={(e) => setNotifyFiveMinBefore(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }} 
              />
              <span 
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: notifyFiveMinBefore ? 'var(--primary)' : '#ccc',
                  transition: '.3s',
                  borderRadius: '34px'
                }}
              >
                <span 
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '16px', width: '16px',
                    left: notifyFiveMinBefore ? '19px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '.3s',
                    borderRadius: '50%'
                  }}
                />
              </span>
            </label>
          </div>

          {/* Cancel button */}
          <button 
            type="button"
            className="btn btn-outline"
            style={{ width: '100%', color: 'var(--status-late)', borderColor: 'rgba(220, 38, 38, 0.25)', padding: '0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}
            onClick={() => {
              if (confirm("Voulez-vous vraiment annuler le cycle en cours ? Vous serez remboursé.")) {
                setCalmyIsActive(false);
                setCalmyTimeRemaining(1200);
                setCalmyView('dashboard');
              }
            }}
          >
            Annuler le cycle
          </button>

          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); alert("Un technicien a été alerté. Il arrivera sous peu !"); }}
            style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textDecoration: 'underline', marginTop: '0.2rem' }}
          >
            Signaler un problème
          </a>

        </div>
      );
    }
  };

  const getPeriodLabel = (val) => {
    switch (val) {
      case '3_days': return '3 jours';
      case '7_days': return '7 jours';
      case '1_month': return '1 mois';
      case '3_months': return '3 mois';
      case '6_months': return '6 mois';
      case '12_months': return '12 mois';
      default: return '7 jours';
    }
  };

  const getActivityData = () => {
    if (activityPeriod === '3_days') {
      return Array.from({ length: 3 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (2 - i));
        const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === d.toDateString());
        return { label: d.toLocaleDateString('fr-FR', { weekday: 'short' }), count: dayOrders.length };
      });
    }
    if (activityPeriod === '7_days') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === d.toDateString());
        return { label: d.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2), count: dayOrders.length };
      });
    }
    if (activityPeriod === '1_month') {
      return Array.from({ length: 4 }, (_, i) => {
        const start = new Date(); start.setDate(start.getDate() - (28 - i * 7));
        const end = new Date(start); end.setDate(end.getDate() + 7);
        const weekOrders = orders.filter(o => {
          const od = new Date(o.created_at);
          return od >= start && od < end;
        });
        return { label: `S${i+1}`, count: weekOrders.length };
      });
    }
    if (activityPeriod === '3_months') {
      return Array.from({ length: 3 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - (2 - i));
        const monthOrders = orders.filter(o => {
          const od = new Date(o.created_at);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        });
        return { label: d.toLocaleDateString('fr-FR', { month: 'short' }), count: monthOrders.length };
      });
    }
    if (activityPeriod === '6_months') {
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
        const monthOrders = orders.filter(o => {
          const od = new Date(o.created_at);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        });
        return { label: d.toLocaleDateString('fr-FR', { month: 'short' }), count: monthOrders.length };
      });
    }
    if (activityPeriod === '12_months') {
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
        const monthOrders = orders.filter(o => {
          const od = new Date(o.created_at);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        });
        return { label: d.toLocaleDateString('fr-FR', { month: 'narrow' }), count: monthOrders.length };
      });
    }
    return [];
  };

  const renderCADetailView = () => {
    const revenueTotal = orders.filter(o => o.statut !== 'annule').reduce((s, o) => s + (o.prix_total || 0), 0);
    const encaisseTotal = orders.filter(o => o.statut !== 'annule').reduce((s, o) => s + (o.avance_payee || 0), 0);
    const resteTotal = revenueTotal - encaisseTotal;
    const servicesRevenue = orders.filter(o => o.statut !== 'annule').reduce((acc, o) => {
      acc[o.type_service] = (acc[o.type_service] || 0) + (o.prix_total || 0);
      return acc;
    }, {});

    const collectionRate = revenueTotal > 0 ? (encaisseTotal / revenueTotal) * 100 : 0;

    return (
      <div className="mobile-subview" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '10px 16px 24px', minHeight: '100%' }}>
        <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '8px' }}>
          <button 
            type="button"
            onClick={() => {
              setAccueilSubView('main');
              setDetailSearchQuery('');
            }}
            style={{ background: 'rgba(0, 0, 0, 0.03)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Finances & CA</h2>
        </div>

        <p style={{ margin: '0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Vue analytique en temps réel des transactions, taux d'encaissement et répartition des services.
        </p>

        {/* Global Finance Card */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(135deg, rgba(43, 130, 240, 0.04) 0%, rgba(22, 163, 74, 0.02) 100%)', border: '1px solid rgba(43, 130, 240, 0.15)', boxShadow: '0 4px 20px rgba(43, 130, 240, 0.05)' }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chiffre d'Affaires Global</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', marginTop: '2px' }}>
              {revenueTotal.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>FCFA</span>
            </div>
          </div>

          <div style={{ height: '8px', width: '100%', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: '100%', width: `${collectionRate}%`, background: 'linear-gradient(90deg, var(--status-ready) 0%, #34d399 100%)', borderRadius: '99px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-ready)' }} />
                ENCAISSÉ ({collectionRate.toFixed(0)}%)
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--status-ready)', marginTop: '2px' }}>{encaisseTotal.toLocaleString()} F</div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-late)' }} />
                RESTE À PERCEVOIR
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--status-late)', marginTop: '2px' }}>{resteTotal.toLocaleString()} F</div>
            </div>
          </div>
        </div>

        {/* Services breakdown */}
        <div className="card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.95rem', border: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Répartition par type de service</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.entries(servicesRevenue).map(([srv, val]) => {
              const pct = revenueTotal > 0 ? (val / revenueTotal) * 100 : 0;
              let srvColor = 'var(--primary)';
              let srvIcon = <Waves size={13} />;
              if (srv === 'repassage_seul') { srvColor = '#8b5cf6'; srvIcon = <MIcon name="iron" size={13} style={{ color: '#8b5cf6' }} />; }
              else if (srv === 'nettoyage_sec') { srvColor = '#14b8a6'; srvIcon = <Feather size={13} color="#14b8a6" />; }
              
              return (
                <div key={srv} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {srvIcon}
                      {serviceLabels[srv] || srv}
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>
                      {val.toLocaleString()} F <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 500 }}>({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: srvColor, borderRadius: '99px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderActivesDetailView = () => {
    const activeOrdersList = orders.filter(o => o.statut !== 'restitue' && o.statut !== 'annule')
      .sort((a, b) => {
        if (a.niveau_urgence === 'Express' && b.niveau_urgence !== 'Express') return -1;
        if (a.niveau_urgence !== 'Express' && b.niveau_urgence === 'Express') return 1;
        return new Date(a.due_date) - new Date(b.due_date);
      });

    const filteredActive = activeOrdersList.filter(o => {
      const q = detailSearchQuery.toLowerCase();
      const client = customers.find(c => c.id === o.customer_id);
      const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
      return (
        o.type_article.toLowerCase().includes(q) ||
        o.identifiant_unique_marquage.toLowerCase().includes(q) ||
        clientName.includes(q)
      );
    });

    return (
      <div className="mobile-subview" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '12px 16px 28px', minHeight: '100%' }}>
        <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button"
              onClick={() => {
                setAccueilSubView('main');
                setDetailSearchQuery('');
              }}
              style={{ background: '#ffffff', border: '1px solid var(--border-color)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s ease' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Commandes en Cours</h2>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
            {activeOrdersList.length} actives
          </span>
        </div>

        <p style={{ margin: '0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          Liste complète des commandes actuellement en traitement à l'atelier.
        </p>

        {/* Search Field */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-control" 
            style={{ 
              paddingLeft: '2.4rem', 
              width: '100%', 
              borderRadius: '14px', 
              fontSize: '0.75rem', 
              paddingTop: '0.52rem', 
              paddingBottom: '0.52rem',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
            }} 
            placeholder="Rechercher par marquage, client, article..." 
            value={detailSearchQuery} 
            onChange={(e) => setDetailSearchQuery(e.target.value)} 
          />
          {detailSearchQuery && (
            <button 
              type="button"
              onClick={() => setDetailSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '12px' }}>
          {filteredActive.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              Aucune commande en cours trouvée.
            </div>
          ) : (
            filteredActive.map(order => {
              const client = customers.find(c => c.id === order.customer_id);
              const isExpress = order.niveau_urgence === 'Express';
              const isLate = isOrderLate(order);
              const initial = client ? `${client.prenom[0] || ''}${client.nom[0] || ''}`.toUpperCase() : '?';
              const borderLeftColor = isLate ? 'var(--status-late)' : (isExpress ? 'var(--status-pending)' : 'var(--primary)');
              
              return (
                <div 
                  key={order.id} 
                  className="order-detail-card-modern" 
                  style={{ 
                    padding: '1rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.6rem', 
                    borderLeft: `4px solid ${borderLeftColor}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: '0.2px' }}>{order.identifiant_unique_marquage}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isExpress && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.52rem', fontWeight: 800, color: 'var(--status-pending)', background: 'var(--status-pending-light)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                          <Zap size={9} strokeWidth={3} /> EXPRESS
                        </span>
                      )}
                      <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.55rem', padding: '0.12rem 0.4rem', fontWeight: 700 }}>
                        {getOrderStatusLabel(order)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', borderTop: '1px solid #f8fafc', paddingTop: '0.6rem' }}>
                    <div 
                      className="client-avatar-initials"
                      style={{
                        background: isLate ? 'var(--status-late-light)' : (isExpress ? 'var(--status-pending-light)' : 'var(--primary-light)'),
                        color: isLate ? 'var(--status-late)' : (isExpress ? 'var(--status-pending)' : 'var(--primary)'),
                        borderColor: isLate ? 'rgba(220, 38, 38, 0.15)' : (isExpress ? 'rgba(217, 119, 6, 0.15)' : 'rgba(59, 130, 246, 0.15)')
                      }}
                    >
                      {initial}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {order.type_article}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Client : <strong style={{ fontWeight: 600 }}>{client ? `${client.prenom} ${client.nom}` : 'Client Inconnu'}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {order.prix_total?.toLocaleString()} F
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem', color: 'var(--text-muted)', background: 'var(--primary-light)', padding: '0.45rem 0.75rem', borderRadius: '10px', marginTop: '0.2rem', border: '1px solid rgba(59, 130, 246, 0.05)' }}>
                    <span>Service: <strong style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{serviceLabels[order.type_service] || order.type_service}</strong></span>
                    <span style={{ color: isLate ? 'var(--status-late)' : 'var(--text-muted)', fontWeight: isLate ? 700 : 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {isLate && <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--status-late)', animation: 'pulse-glow-ready 1.5s infinite' }} />}
                      Échéance : {formatDateTime(order.due_date)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderLivreesDetailView = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedOrders = orders.filter(o => o.statut === 'restitue' && new Date(o.updated_at || o.created_at) >= startOfMonth);

    const filteredCompleted = completedOrders.filter(o => {
      const q = detailSearchQuery.toLowerCase();
      const client = customers.find(c => c.id === o.customer_id);
      const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
      return (
        o.type_article.toLowerCase().includes(q) ||
        o.identifiant_unique_marquage.toLowerCase().includes(q) ||
        clientName.includes(q)
      );
    });

    return (
      <div className="mobile-subview" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button"
              onClick={() => {
                setAccueilSubView('main');
                setDetailSearchQuery('');
              }}
              style={{ background: '#ffffff', border: '1px solid var(--border-color)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s ease' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Commandes Restituées</h2>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--status-ready)', background: 'var(--status-ready-light)', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(22, 163, 74, 0.15)' }}>
            {completedOrders.length} ce mois-ci
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '12px 16px 28px' }}>
          <p style={{ margin: '0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Liste des commandes livrées/récupérées avec succès sur le mois en cours.
          </p>

          {/* Search Field */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-control" 
              style={{ 
                paddingLeft: '2.4rem', 
                width: '100%', 
                borderRadius: '14px', 
                fontSize: '0.75rem', 
                paddingTop: '0.52rem', 
                paddingBottom: '0.52rem',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
              }} 
              placeholder="Rechercher par marquage, client, article..." 
              value={detailSearchQuery} 
              onChange={(e) => setDetailSearchQuery(e.target.value)} 
            />
            {detailSearchQuery && (
              <button 
                type="button"
                onClick={() => setDetailSearchQuery('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '12px' }}>
            {filteredCompleted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                Aucune commande restituée trouvée.
              </div>
            ) : (
              filteredCompleted.map(order => {
                const client = customers.find(c => c.id === order.customer_id);
                const initial = client ? `${client.prenom[0] || ''}${client.nom[0] || ''}`.toUpperCase() : '?';
                
                return (
                  <div 
                    key={order.id} 
                    className="order-detail-card-modern" 
                    style={{ 
                      padding: '1rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.6rem', 
                      borderLeft: '4px solid var(--status-ready)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-ready)', fontFamily: 'monospace', letterSpacing: '0.2px' }}>{order.identifiant_unique_marquage}</span>
                      <span style={{ fontSize: '0.55rem', padding: '0.12rem 0.4rem', fontWeight: 700, color: 'var(--status-ready)', background: 'var(--status-ready-light)', borderRadius: '4px', border: '1px solid rgba(22, 163, 74, 0.15)' }}>
                        LIVRÉ
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', borderTop: '1px solid #f8fafc', paddingTop: '0.6rem' }}>
                      <div 
                        className="client-avatar-initials"
                        style={{
                          background: 'var(--status-ready-light)',
                          color: 'var(--status-ready)',
                          borderColor: 'rgba(22, 163, 74, 0.15)'
                        }}
                      >
                        {initial}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {order.type_article}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Client : <strong style={{ fontWeight: 600 }}>{client ? `${client.prenom} ${client.nom}` : 'Client Inconnu'}</strong>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-ready)' }}>
                        {order.prix_total?.toLocaleString()} F
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem', color: 'var(--text-muted)', background: 'var(--primary-light)', padding: '0.45rem 0.75rem', borderRadius: '10px', marginTop: '0.2rem', border: '1px solid rgba(59, 130, 246, 0.05)' }}>
                      <span>Service: <strong style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{serviceLabels[order.type_service] || order.type_service}</strong></span>
                      <span>
                        Livrée le : {formatDateTime(order.updated_at || order.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderExpressDetailView = () => {
    const expressOrdersList = orders.filter(o => o.statut !== 'restitue' && o.statut !== 'annule' && o.niveau_urgence === 'Express');

    const filteredExpress = expressOrdersList.filter(o => {
      const q = detailSearchQuery.toLowerCase();
      const client = customers.find(c => c.id === o.customer_id);
      const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
      return (
        o.type_article.toLowerCase().includes(q) ||
        o.identifiant_unique_marquage.toLowerCase().includes(q) ||
        clientName.includes(q)
      );
    });

    return (
      <div className="mobile-subview" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '12px 16px 28px', minHeight: '100%' }}>
        <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button"
              onClick={() => {
                setAccueilSubView('main');
                setDetailSearchQuery('');
              }}
              style={{ background: '#ffffff', border: '1px solid var(--border-color)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s ease' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Commandes Express</h2>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--status-pending)', background: 'var(--status-pending-light)', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(217, 119, 6, 0.15)' }}>
            {expressOrdersList.length} express
          </span>
        </div>

        <p style={{ margin: '0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          Commandes express prioritaires à traiter de toute urgence à l'atelier.
        </p>

        {/* Search Field */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-control" 
            style={{ 
              paddingLeft: '2.4rem', 
              width: '100%', 
              borderRadius: '14px', 
              fontSize: '0.75rem', 
              paddingTop: '0.52rem', 
              paddingBottom: '0.52rem',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
            }} 
            placeholder="Rechercher par marquage, client, article..." 
            value={detailSearchQuery} 
            onChange={(e) => setDetailSearchQuery(e.target.value)} 
          />
          {detailSearchQuery && (
            <button 
              type="button"
              onClick={() => setDetailSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '12px' }}>
          {filteredExpress.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              Aucune commande Express en cours trouvée.
            </div>
          ) : (
            filteredExpress.map(order => {
              const client = customers.find(c => c.id === order.customer_id);
              const initial = client ? `${client.prenom[0] || ''}${client.nom[0] || ''}`.toUpperCase() : '?';
              
              return (
                <div 
                  key={order.id} 
                  className="order-detail-card-modern" 
                  style={{ 
                    padding: '1rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.6rem', 
                    borderLeft: '4px solid var(--status-pending)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-pending)', fontFamily: 'monospace', letterSpacing: '0.2px' }}>{order.identifiant_unique_marquage}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.52rem', padding: '0.12rem 0.4rem', fontWeight: 800, color: 'var(--status-pending)', background: 'var(--status-pending-light)', borderRadius: '4px' }}>
                      <Zap size={9} strokeWidth={3} /> URGENT
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', borderTop: '1px solid #f8fafc', paddingTop: '0.6rem' }}>
                    <div 
                      className="client-avatar-initials"
                      style={{
                        background: 'var(--status-pending-light)',
                        color: 'var(--status-pending)',
                        borderColor: 'rgba(217, 119, 6, 0.15)'
                      }}
                    >
                      {initial}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {order.type_article}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Client : <strong style={{ fontWeight: 600 }}>{client ? `${client.prenom} ${client.nom}` : 'Client Inconnu'}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {order.prix_total?.toLocaleString()} F
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem', color: 'var(--status-late)', background: 'var(--status-late-light)', padding: '0.45rem 0.75rem', borderRadius: '10px', marginTop: '0.2rem', border: '1px solid rgba(220, 38, 38, 0.05)', fontWeight: 700 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Étape: <strong style={{ fontWeight: 600 }}>{getOrderStatusLabel(order)}</strong></span>
                    <span>
                      Délai : {formatDateTime(order.due_date)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderRetardDetailView = () => {
    const activeOrders = orders.filter(o => o.statut !== 'restitue' && o.statut !== 'annule');
    const lateOrdersList = activeOrders.filter(o => isOrderLate(o));

    const filteredLate = lateOrdersList.filter(o => {
      const q = detailSearchQuery.toLowerCase();
      const client = customers.find(c => c.id === o.customer_id);
      const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
      return (
        o.type_article.toLowerCase().includes(q) ||
        o.identifiant_unique_marquage.toLowerCase().includes(q) ||
        clientName.includes(q)
      );
    });

    return (
      <div className="mobile-subview" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '12px 16px 28px', minHeight: '100%' }}>
        <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button"
              onClick={() => {
                setAccueilSubView('main');
                setDetailSearchQuery('');
              }}
              style={{ background: '#ffffff', border: '1px solid var(--border-color)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s ease' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Commandes en Retard</h2>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--status-late)', background: 'var(--status-late-light)', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(220, 38, 38, 0.15)' }}>
            {lateOrdersList.length} retard
          </span>
        </div>

        <p style={{ margin: '0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          Commandes en retard dont l'échéance de livraison est maintenant dépassée.
        </p>

        {/* Search Field */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-control" 
            style={{ 
              paddingLeft: '2.4rem', 
              width: '100%', 
              borderRadius: '14px', 
              fontSize: '0.75rem', 
              paddingTop: '0.52rem', 
              paddingBottom: '0.52rem',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
            }} 
            placeholder="Rechercher par marquage, client, article..." 
            value={detailSearchQuery} 
            onChange={(e) => setDetailSearchQuery(e.target.value)} 
          />
          {detailSearchQuery && (
            <button 
              type="button"
              onClick={() => setDetailSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '12px' }}>
          {filteredLate.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              Aucune commande en retard. Bon travail !
            </div>
          ) : (
            filteredLate.map(order => {
              const client = customers.find(c => c.id === order.customer_id);
              const initial = client ? `${client.prenom[0] || ''}${client.nom[0] || ''}`.toUpperCase() : '?';
              
              return (
                <div 
                  key={order.id} 
                  className="order-detail-card-modern" 
                  style={{ 
                    padding: '1rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.6rem', 
                    border_left: 'none', /* Using custom targetContent to match style */
                    borderLeft: '4px solid var(--status-late)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-late)', fontFamily: 'monospace', letterSpacing: '0.2px' }}>{order.identifiant_unique_marquage}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.52rem', padding: '0.12rem 0.4rem', fontWeight: 800, color: 'var(--status-late)', background: 'var(--status-late-light)', borderRadius: '4px', border: '1px solid rgba(220, 38, 38, 0.15)' }}>
                      <TriangleAlert size={9} /> RETARD
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', borderTop: '1px solid #f8fafc', paddingTop: '0.6rem' }}>
                    <div 
                      className="client-avatar-initials"
                      style={{
                        background: 'var(--status-late-light)',
                        color: 'var(--status-late)',
                        borderColor: 'rgba(220, 38, 38, 0.15)'
                      }}
                    >
                      {initial}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {order.type_article}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Client : <strong style={{ fontWeight: 600 }}>{client ? `${client.prenom} ${client.nom}` : 'Client Inconnu'}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {order.prix_total?.toLocaleString()} F
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem', color: 'var(--status-late)', background: 'var(--status-late-light)', padding: '0.45rem 0.75rem', borderRadius: '10px', marginTop: '0.2rem', border: '1px solid rgba(220, 38, 38, 0.05)', fontWeight: 700 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Statut: <strong style={{ fontWeight: 600 }}>{getOrderStatusLabel(order)}</strong></span>
                    <span>
                      Dû le : {formatDateTime(order.due_date)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderPipelineDetailView = () => {
    const activeOrders = orders.filter(o => o.statut !== 'restitue' && o.statut !== 'annule');
    const pipeline = [
      { label: 'En attente de tri', key: 'en_attente', color: 'var(--status-pending)', bg: 'var(--status-pending-light)', icon: <Inbox size={15} />, desc: 'Commandes à trier, marquer et préparer pour lavage.' },
      { label: 'En Lavage', key: 'en_cours_lavage', color: 'var(--status-washing)', bg: 'var(--status-washing-light)', icon: <Waves size={15} />, desc: 'Articles actuellement en machine ou en cours de nettoyage.' },
      { label: 'En Repassage', key: 'en_cours_repassage', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', icon: <MIcon name="iron" size={15} style={{ color: '#8b5cf6' }} />, desc: 'Articles sortis des séchoirs, en finition de repassage.' },
      { label: 'Prêt pour livraison', key: 'pret', color: 'var(--status-ready)', bg: 'var(--status-ready-light)', icon: <CheckCircle2 size={15} />, desc: 'Traitement terminé, vêtements rangés sur cintres.' },
    ];

    return (
      <div className="mobile-subview" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '12px 16px 28px', minHeight: '100%' }}>
        <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button"
              onClick={() => {
                setAccueilSubView('main');
                setDetailSearchQuery('');
              }}
              style={{ background: '#ffffff', border: '1px solid var(--border-color)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s ease' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Charge de l'Atelier</h2>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
            {activeOrders.length} en cours
          </span>
        </div>

        <p style={{ margin: '0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          État de charge détaillé de chaque étape du traitement.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingBottom: '12px' }}>
          {pipeline.map(p => {
            const stepOrders = activeOrders.filter(o => o.statut === p.key);
            const count = stepOrders.length;
            return (
              <div 
                key={p.key} 
                className="order-detail-card-modern" 
                style={{ 
                  padding: '1rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.6rem',
                  borderLeft: `4px solid ${p.color}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: p.bg, color: p.color, display: 'flex', alignItems: 'center', flexShrink: 0, justifyContent: 'center' }}>
                      {p.icon}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.label}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: p.bg, color: p.color, padding: '0.2rem 0.55rem', borderRadius: '8px', border: `1px solid rgba(255,255,255,0.1)` }}>
                    {count}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{p.desc}</p>
                
                {count > 0 && (
                  <div style={{ marginTop: '0.5rem', background: 'var(--primary-light)', border: '1px solid rgba(59, 130, 246, 0.05)', borderRadius: '12px', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '1px solid rgba(59, 130, 246, 0.08)', paddingBottom: '4px', marginBottom: '2px' }}>Commandes dans cette étape</div>
                    {stepOrders.slice(0, 3).map(order => {
                      const client = customers.find(c => c.id === order.customer_id);
                      return (
                        <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>{order.identifiant_unique_marquage}</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                            {order.type_article} · {client ? `${client.prenom} ${client.nom[0]}.` : 'Client'}
                          </span>
                        </div>
                      );
                    })}
                    {count > 3 && (
                      <div style={{ fontSize: '0.58rem', color: 'var(--primary)', fontWeight: 700, textAlign: 'center', marginTop: '2px' }}>
                        + {count - 3} autres commandes
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderActivityDetailView = () => {
    const actData = getActivityData();
    const totalOrders = actData.reduce((s, d) => s + d.count, 0);
    const maxBar = Math.max(...actData.map(d => d.count), 1);

    return (
      <div className="mobile-subview" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '12px 16px 28px', minHeight: '100%' }}>
        <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '6px' }}>
          <button 
            type="button"
            onClick={() => {
              setAccueilSubView('main');
              setDetailSearchQuery('');
            }}
            style={{ background: '#ffffff', border: '1px solid var(--border-color)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s ease' }}
          >
            <ArrowLeft size={18} />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Activité & Graphique</h2>
        </div>

        <p style={{ margin: '0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          Volume d'activité et commandes enregistrées sur la période sélectionnée (<strong>{getPeriodLabel(activityPeriod)}</strong>).
        </p>

        {/* Futuristic Glassmorphic Graph Card */}
        <div className="order-detail-card-modern" style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Commandes Créées</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.55rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>{totalOrders} au total</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px', marginTop: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', position: 'relative' }}>
            {actData.map((d, i) => {
              const isLast = i === actData.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ 
                    width: '100%', 
                    background: isLast ? 'var(--primary-gradient)' : 'linear-gradient(180deg, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.05) 100%)', 
                    borderRadius: '6px 6px 0 0', 
                    height: `${Math.max(d.count > 0 ? 6 : 2, (d.count / maxBar) * 110)}px`, 
                    transition: 'height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    position: 'relative',
                    border: isLast ? '1px solid rgba(59, 130, 246, 0.3)' : '1px dashed rgba(59, 130, 246, 0.15)',
                    boxShadow: isLast ? '0 2px 8px rgba(59, 130, 246, 0.2)' : 'none'
                  }}>
                    {d.count > 0 && (
                      <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {d.count}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Period Stats Block */}
        <div className="order-detail-card-modern" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Statistiques Additionnelles</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary-light)', padding: '0.65rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.05)' }}>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600 }}>MOYENNE INTERVALLE</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{(totalOrders / actData.length).toFixed(1)} <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-secondary)' }}>cmd</span></div>
            </div>
            <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '0.65rem', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.05)' }}>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600 }}>MAX ENREGISTRÉ</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{maxBar} <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-secondary)' }}>cmd</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTopClientsView = () => {
    const loyaltyCustomers = customers.map(c => {
      const orderCount = orders.filter(o => o.customer_id === c.id && o.statut !== 'annule').length;
      const totalSpent = orders.filter(o => o.customer_id === c.id && o.statut !== 'annule').reduce((s, o) => s + (o.prix_total || 0), 0);
      return {
        ...c,
        orderCount,
        totalSpent
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    const filteredCustomers = loyaltyCustomers.filter(c => {
      const query = loyaltySearchQuery.toLowerCase();
      return (
        c.nom.toLowerCase().includes(query) ||
        c.prenom.toLowerCase().includes(query) ||
        (c.telephone && c.telephone.includes(query))
      );
    });

    return (
      <div className="mobile-subview" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '10px 16px 24px', minHeight: '100%' }}>
        <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button"
              onClick={() => {
                setAccueilSubView('main');
                setLoyaltySearchQuery('');
              }}
              style={{ background: 'rgba(0, 0, 0, 0.03)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Classement Fidélité</h2>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '20px' }}>
            {loyaltyCustomers.length} Clients
          </span>
        </div>

        <p style={{ margin: '0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Découvrez nos clients les plus actifs classés selon leur volume de dépenses total.
        </p>

        {/* Search Field */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-control" 
            style={{ 
              paddingLeft: '2.4rem', 
              width: '100%', 
              borderRadius: '12px', 
              fontSize: '0.72rem', 
              paddingTop: '0.55rem', 
              paddingBottom: '0.55rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }} 
            placeholder="Rechercher un client ou téléphone..." 
            value={loyaltySearchQuery} 
            onChange={(e) => setLoyaltySearchQuery(e.target.value)} 
          />
          {loyaltySearchQuery && (
            <button 
              type="button"
              onClick={() => setLoyaltySearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Podium for top 3 */}
        {!loyaltySearchQuery && filteredCustomers.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1.3rem 0.6rem 0.6rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(255, 255, 255, 0.98) 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.04)',
            marginBottom: '0.4rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, rgba(255, 255, 255, 0) 70%)', zIndex: 0, pointerEvents: 'none' }} />

            {/* 2nd Place */}
            {loyaltyCustomers[1] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0, zIndex: 1 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: '2.5px solid #cbd5e1',
                    boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    color: '#475569'
                  }}>
                    {loyaltyCustomers[1].prenom[0]?.toUpperCase()}{loyaltyCustomers[1].nom[0]?.toUpperCase()}
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #94a3b8, #64748b)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    border: '1.5px solid #fff'
                  }}>
                    2
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.45rem', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {loyaltyCustomers[1].prenom}
                </span>
                <span style={{ fontSize: '0.58rem', color: 'var(--primary)', fontWeight: 700 }}>
                  {loyaltyCustomers[1].orderCount} cmd
                </span>
                {canViewCA && (
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {showCAValues ? `${loyaltyCustomers[1].totalSpent.toLocaleString()} F` : '•••• F'}
                  </span>
                )}
                {/* Pedestal */}
                <div style={{
                  width: '100%',
                  height: '42px',
                  background: 'linear-gradient(to top, rgba(148, 163, 184, 0.08) 0%, rgba(148, 163, 184, 0.18) 100%)',
                  borderRadius: '10px 10px 18px 18px',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  marginTop: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '0.78rem' }}>🥈</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {loyaltyCustomers[0] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.1, minWidth: 0, zIndex: 2 }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%) rotate(-8deg)', fontSize: '1.25rem', zIndex: 3 }}>👑</span>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    border: '3px solid #fbbf24',
                    boxShadow: '0 6px 18px rgba(251, 191, 36, 0.3)',
                    background: '#fffbeb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: '#d97706'
                  }}>
                    {loyaltyCustomers[0].prenom[0]?.toUpperCase()}{loyaltyCustomers[0].nom[0]?.toUpperCase()}
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    border: '1.5px solid #fff'
                  }}>
                    1
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.45rem', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {loyaltyCustomers[0].prenom} {loyaltyCustomers[0].nom[0]}.
                </span>
                <span style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 850 }}>
                  {loyaltyCustomers[0].orderCount} cmd
                </span>
                {canViewCA && (
                  <span style={{ fontSize: '0.58rem', color: '#b45309', fontWeight: 800 }}>
                    {showCAValues ? `${loyaltyCustomers[0].totalSpent.toLocaleString()} F` : '•••• F'}
                  </span>
                )}
                {/* Pedestal */}
                <div style={{
                  width: '100%',
                  height: '62px',
                  background: 'linear-gradient(to top, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.22) 100%)',
                  borderRadius: '12px 12px 20px 20px',
                  border: '1px solid rgba(251, 191, 36, 0.18)',
                  marginTop: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(251, 191, 36, 0.08)'
                }}>
                  <span style={{ fontSize: '0.95rem' }}>🥇</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {loyaltyCustomers[2] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0, zIndex: 1 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2.5px solid #d97706',
                    boxShadow: '0 4px 10px rgba(217, 119, 6, 0.18)',
                    background: '#fff7ed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    color: '#c2410c'
                  }}>
                    {loyaltyCustomers[2].prenom[0]?.toUpperCase()}{loyaltyCustomers[2].nom[0]?.toUpperCase()}
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fdba74, #ea580c)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    border: '1.5px solid #fff'
                  }}>
                    3
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.45rem', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {loyaltyCustomers[2].prenom}
                </span>
                <span style={{ fontSize: '0.55rem', color: 'var(--primary)', fontWeight: 700 }}>
                  {loyaltyCustomers[2].orderCount} cmd
                </span>
                {canViewCA && (
                  <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {showCAValues ? `${loyaltyCustomers[2].totalSpent.toLocaleString()} F` : '•••• F'}
                  </span>
                )}
                {/* Pedestal */}
                <div style={{
                  width: '100%',
                  height: '32px',
                  background: 'linear-gradient(to top, rgba(217, 119, 6, 0.05) 0%, rgba(217, 119, 6, 0.15) 100%)',
                  borderRadius: '10px 10px 18px 18px',
                  border: '1px solid rgba(217, 119, 6, 0.12)',
                  marginTop: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '0.72rem' }}>🥉</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loyalty List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', paddingBottom: '10px' }}>
          {filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '16px' }}>
              Aucun client ne correspond à votre recherche.
            </div>
          ) : (
            (() => {
              const displayList = (!loyaltySearchQuery) ? filteredCustomers.slice(3) : filteredCustomers;
              
              return displayList.map((c) => {
                const globalIndex = loyaltyCustomers.findIndex(gc => gc.id === c.id);
                
                return (
                  <div 
                    key={c.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      padding: '0.7rem 0.85rem',
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.01)',
                      transition: 'transform 0.2s ease',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Rank Badge */}
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      background: 'rgba(0, 0, 0, 0.04)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.65rem', 
                      fontWeight: 800, 
                      color: 'var(--text-secondary)', 
                      flexShrink: 0 
                    }}>
                      {globalIndex + 1}
                    </div>

                    {/* Initials Avatar */}
                    <div style={{
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, var(--primary-light), rgba(26, 26, 94, 0.08))', 
                      color: 'var(--primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.72rem', 
                      fontWeight: 900, 
                      flexShrink: 0
                    }}>
                      {c.prenom[0]?.toUpperCase()}{c.nom[0]?.toUpperCase()}
                    </div>

                    {/* Customer Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                        {c.prenom} {c.nom}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '1px', fontFamily: 'var(--font-mono)' }}>
                        {c.telephone || 'Aucun tel'}
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {c.orderCount} cmd{c.orderCount > 1 ? 's' : ''}
                      </span>
                      {canViewCA && (
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {showCAValues ? `${c.totalSpent.toLocaleString()} F` : '•••••• F'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-simulator">
      {/* Background Liquid Orbs */}
      <div className="liquid-orb-1"></div>
      <div className="liquid-orb-2"></div>

      {/* Main Container */}
      <div 
        className={`mobile-content ${!currentUser ? 'auth-mode' : ''}`}
        style={{ padding: isCalmyClientMode ? 0 : undefined }}
      >
        {!dbIsRemote && (
          <div style={{
            background: '#fee2e2',
            color: '#ef4444',
            padding: '0.4rem 0.8rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
            zIndex: 1000
          }}>
            <span>⚠️ Mode local (Hors-ligne).</span>
            <button 
              type="button" 
              onClick={async () => {
                const res = await db.testConnection();
                if (res.success) {
                  alert("Connexion rétablie !");
                } else {
                  alert("Échec de connexion : " + res.error);
                }
              }}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.15rem 0.45rem',
                fontSize: '0.6rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Reconnecter
            </button>
          </div>
        )}

        {isCalmyClientMode ? (
          renderCalmyClientView()
        ) : !currentUser ? (

          !selectedLoginUser ? (
            /* ══════════════════════════════════════
               ÉCRAN 1 — EMAIL (style design ref)
               ══════════════════════════════════════ */
            <div className="auth-screen login-screen">
              <div className="auth-card-glass">
                {/* Logo KLIN UP */}
                <div className="login-logo-badge">
                  <img src={logoDark} alt="KLIN UP" />
                </div>

                {/* Titre + sous-titre */}
                <h1 className="login-title">Connexion KLIN&nbsp;UP</h1>
                <p className="login-subtitle">
                  Connectez-vous pour accéder à la plateforme laverie caisse &amp; atelier.
                </p>

                {/* Formulaire */}
                <form
                  className="login-form"
                  onSubmit={handleEmailSubmit}
                >
                  <div className="login-field-wrap">
                    <label className="login-field-label">Email</label>
                    <div className="login-input-group">
                      <input
                        type="email"
                        required
                        placeholder="Entrez votre adresse email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="login-input"
                        autoComplete="email"
                      />
                      <Mail className="login-input-icon" size={16} />
                    </div>
                  </div>

                  <button type="submit" className="login-submit-btn">
                    Se connecter
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setShowResetPinModal(true)}
                  className="login-link-btn"
                >
                  Mot de passe oublié ? <span>Réinitialiser le PIN</span>
                </button>
              </div>
            </div>

          ) : (
            /* ══════════════════════════════════════
               ÉCRAN 2 — CODE PIN (style design ref)
               ══════════════════════════════════════ */
            <div className="auth-screen pin-screen">
              <div className="auth-card-glass">
                {/* Bouton retour chevron */}
                <button
                  type="button"
                  className="pin-back-btn"
                  onClick={() => setSelectedLoginUser(null)}
                  aria-label="Retour"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Identité utilisateur */}
                <div
                  className="pin-avatar"
                  style={{
                    background: selectedLoginUser.role === 'super_admin'
                      ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
                      : selectedLoginUser.role === 'manager'
                      ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                      : 'linear-gradient(135deg, #059669, #10b981)'
                  }}
                >
                  {selectedLoginUser.prenom[0]}{selectedLoginUser.nom[0]}
                </div>

                <h2 className="pin-user-name">{selectedLoginUser.prenom} {selectedLoginUser.nom}</h2>
                <p className="pin-user-role">
                  {selectedLoginUser.role === 'super_admin' ? 'Super Administrateur'
                    : selectedLoginUser.role === 'manager' ? 'Gestionnaire'
                    : selectedLoginUser.role === 'livreur' ? 'Livreur'
                    : selectedLoginUser.role === 'agent_lavage_repassage' ? 'Agent Lavage / Repassage'
                    : "Agent d'accueil"}
                </p>

                {/* Section PIN */}
                <p className="pin-section-title">Vérifiez votre identité</p>
                <p className="pin-section-subtitle">
                  Entrez votre code PIN à 6 chiffres pour accéder à l'espace de travail.
                </p>

                {/* Affichage OTP-style avec input caché pour le clavier système */}
                <div 
                  className="pin-otp-container" 
                  style={{ position: 'relative', width: '100%', maxWidth: '280px', margin: '0 auto' }}
                  onClick={() => pinInputRef.current?.focus()}
                >
                  <input
                    ref={pinInputRef}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pinCode}
                    onChange={handlePinChange}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: 'transparent',
                      caretColor: 'transparent',
                      zIndex: 10
                    }}
                    autoFocus
                  />
                  <div className={`pin-otp-display ${pinError ? 'shake-otp' : ''}`} style={{ margin: 0 }}>
                    {[0, 1, 2, 3, 4, 5].map(idx => {
                      const hasDigit = pinCode.length > idx;
                      const isError = pinError;
                      return (
                        <div
                          key={idx}
                          className={[
                            'pin-otp-digit',
                            hasDigit && !isError ? 'filled' : '',
                            isError && hasDigit ? 'error' : '',
                            !hasDigit ? 'empty' : ''
                          ].filter(Boolean).join(' ')}
                        >
                          {hasDigit ? '•' : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bouton valider — n'est actif qu'avec 6 chiffres */}
                <button
                  type="button"
                  className="pin-verify-btn"
                  onClick={() => {
                    if (pinCode.length === 6 && selectedLoginUser) {
                      if (selectedLoginUser.code_pin === pinCode) {
                        db.setCurrentUser(selectedLoginUser);
                        setSelectedLoginUser(null);
                        setPinCode('');
                      } else {
                        setPinError(true);
                        setTimeout(() => { setPinCode(''); setPinError(false); }, 800);
                      }
                    }
                  }}
                  disabled={pinCode.length < 6}
                  style={{ opacity: pinCode.length < 6 ? 0.55 : 1, marginTop: '16px' }}
                >
                  Vérifier
                </button>

                {/* Lien reset */}
                <button
                  type="button"
                  className="pin-resend-link"
                  onClick={() => setShowResetPinModal(true)}
                  style={{ marginTop: '16px' }}
                >
                  PIN oublié ? <span>Réinitialiser</span>
                </button>
              </div>
            </div>
          )




        ) : (
          <>
        {/* ========================================================
           ONGLET : ACCUEIL — Style Finance App
           ======================================================== */}
        {activeTab === 'accueil' && (() => {
          if (accueilSubView === 'top_clients') {
            return renderTopClientsView();
          }
          if (accueilSubView === 'ca_detail') {
            return renderCADetailView();
          }
          if (accueilSubView === 'actives_detail') {
            return renderActivesDetailView();
          }
          if (accueilSubView === 'livrees_detail') {
            return renderLivreesDetailView();
          }
          if (accueilSubView === 'express_detail') {
            return renderExpressDetailView();
          }
          if (accueilSubView === 'retard_detail') {
            return renderRetardDetailView();
          }
          if (accueilSubView === 'pipeline_detail') {
            return renderPipelineDetailView();
          }
          if (accueilSubView === 'activity_detail') {
            return renderActivityDetailView();
          }

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
            { label: 'Tri', key: 'en_attente', color: 'var(--status-pending)', colorLight: 'var(--status-pending-light)', icon: 'inbox' },
            { label: 'Lavage', key: 'en_cours_lavage', color: 'var(--status-washing)', colorLight: 'var(--status-washing-light)', icon: 'waves' },
            { label: 'Repassage', key: 'en_cours_repassage', color: '#8b5cf6', colorLight: 'rgba(139, 92, 246, 0.1)', icon: 'iron' },
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
          })).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* HEADER — Logo + Action Buttons */}
              <div className="mobile-header" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '115px', height: '40px', overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={logoDark}
                      alt="KLIN UP Logo"
                      style={{
                        width: '115px',
                        height: 'auto',
                        display: 'block',
                        marginTop: '-31px',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {!db.isRemote() && (
                      <span 
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirmDiag = confirm("L'application est actuellement en mode local (impossible de se connecter à Supabase). Voulez-vous lancer un test de diagnostic de connexion ?");
                          if (confirmDiag) {
                            alert("Lancement du test de diagnostic...");
                            const res = await db.testConnection();
                            if (res.success) {
                              alert("Succès ! " + res.message + "\n\nL'application s'est reconnectée à Supabase et est maintenant en ligne !");
                            } else {
                              alert("Échec du diagnostic !\n\nErreur : " + res.error + "\n\nConseils : Vérifiez votre connexion internet.");
                            }
                          }
                        }}
                        title="L'application fonctionne sur le stockage local de l'appareil (les variables d'environnement Supabase manquent ou le serveur est injoignable). Cliquez pour lancer un diagnostic."
                        style={{ 
                          cursor: 'pointer',
                          fontSize: '0.55rem', 
                          fontWeight: 600, 
                          padding: '0.15rem 0.4rem', 
                          borderRadius: '6px', 
                          background: 'rgba(217, 119, 6, 0.06)', 
                          color: '#d97706',
                          border: '1px solid rgba(217, 119, 6, 0.15)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Local
                      </span>
                    )}
                    <button 
                      className="action-circle-btn" 
                      style={{ 
                        position: 'relative', 
                        width: '34px', 
                        height: '34px', 
                        borderRadius: '50%', 
                        background: '#ffffff', 
                        border: '1px solid #f1f5f9', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        boxShadow: 'none',
                        color: 'var(--text-secondary)'
                      }}
                      onClick={() => setShowNotificationsModal(true)}
                    >
                      <Bell size={15} strokeWidth={2} />
                      {notifications.some(n => !n.read) && (
                        <span style={{ position: 'absolute', top: '9px', right: '9px', width: '5px', height: '5px', background: 'var(--status-late)', borderRadius: '50%' }} />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Welcoming header block */}
                <div>
                  <div className="modern-home-greeting">
                    Bonjour, {currentUser ? currentUser.prenom : 'KLIN UP'} 👋
                  </div>
                  <div className="modern-home-sub">
                    Voici l'état de votre activité aujourd'hui.
                  </div>
                </div>
              </div>

              {/* TOTAL SPEND — Style Finance Card */}
              <div 
                className="dashboard-main-card-modern" 
                onClick={(e) => {
                  if (e.target.closest('.eye-toggle-btn')) return;
                  setAccueilSubView(canToggleCA ? 'ca_detail' : 'actives_detail');
                }}
              >
                {/* Carte Chiffre d'Affaires */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                  <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Chiffre d'Affaires Total</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.85rem', fontWeight: 700, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', lineHeight: 1.1, color: '#ffffff' }}>
                      {canToggleCA ? (showCAValues ? `${revenueTotal.toLocaleString()} ` : '•••••• ') : '•••••• '}
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>FCFA</span>
                    </div>
                  </div>
                  {canToggleCA && (
                    <button
                      type="button"
                      className="eye-toggle-btn"
                      style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCAValues(!showCAValues);
                      }}
                      title={showCAValues ? 'Masquer le CA' : 'Afficher le CA'}
                    >
                      {showCAValues ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  )}
                </div>
                
                {/* Mini chart area */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '38px', marginTop: '1rem', marginBottom: '0.4rem' }}>
                  {last7.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <div style={{ 
                        width: '5px', 
                        background: i === 6 ? '#ffffff' : 'rgba(255, 255, 255, 0.25)', 
                        borderRadius: '99px', 
                        height: `${Math.max(4, (d.count / maxBarCount) * 34)}px`,
                        transition: 'height 0.4s ease',
                        boxShadow: i === 6 ? '0 0 8px rgba(255,255,255,0.6)' : 'none'
                      }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {last7.map((d, i) => (<div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.55rem', color: i === 6 ? '#ffffff' : 'rgba(255,255,255,0.6)', fontWeight: i === 6 ? 700 : 500, textTransform: 'uppercase' }}>{d.label}</div>))}
                </div>

                {/* Encaissé / Reste dû */}
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.2rem', paddingTop: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Encaissé</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginTop: '1px' }}>
                        {canToggleCA ? (showCAValues ? `${encaisseTotal.toLocaleString()} F` : '•••••• F') : '•••••• F'}
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#f87171', boxShadow: '0 0 8px #f87171' }} />
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Reste dû</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginTop: '1px' }}>
                        {canToggleCA ? (showCAValues ? `${resteTotal.toLocaleString()} F` : '•••••• F') : '•••••• F'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                {[
                  { label: 'Actives', value: activeOrders.length, color: 'var(--primary)', bg: 'var(--primary-light)', icon: <Activity size={15} color="var(--primary)" />, sub: 'en cours', subView: 'actives_detail' },
                  { label: 'Livrées', value: completedThisMonth.length, color: 'var(--status-ready)', bg: 'var(--status-ready-light)', icon: <CheckCircle size={15} color="var(--status-ready)" />, sub: 'ce mois-ci', subView: 'livrees_detail' },
                  { label: 'Express', value: expressOrders.length, color: 'var(--status-pending)', bg: 'var(--status-pending-light)', icon: <Zap size={15} color="var(--status-pending)" />, sub: 'urgentes', subView: 'express_detail' },
                  {
                    label: 'CA Mois',
                    value: canToggleCA ? (showCAValues ? (revenueMonth >= 1000 ? `${(revenueMonth/1000).toFixed(0)}k` : revenueMonth) : '••••••') : '••••••',
                    color: 'var(--secondary)',
                    bg: 'var(--secondary-light)',
                    icon: <TrendingUp size={15} color="var(--secondary)" />,
                    sub: 'FCFA',
                    subView: canToggleCA ? 'ca_detail' : 'actives_detail'
                  },
                ].map((kpi, i) => {
                  const kpiCardBg = [
                    'linear-gradient(135deg, rgba(43, 130, 240, 0.09) 0%, rgba(255, 255, 255, 0.98) 60%)',
                    'linear-gradient(135deg, rgba(34, 197, 94, 0.09) 0%, rgba(255, 255, 255, 0.98) 60%)',
                    'linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(255, 255, 255, 0.98) 60%)',
                    'linear-gradient(135deg, rgba(99, 102, 241, 0.09) 0%, rgba(255, 255, 255, 0.98) 60%)'
                  ];
                  const kpiCardBorder = [
                    'rgba(43, 130, 240, 0.16)',
                    'rgba(34, 197, 94, 0.16)',
                    'rgba(245, 158, 11, 0.16)',
                    'rgba(99, 102, 241, 0.16)'
                  ];
                  return (
                  <div 
                    key={i} 
                    className="kpi-card-modern" 
                    style={{ 
                      background: kpiCardBg[i],
                      borderColor: kpiCardBorder[i]
                    }}
                    onClick={() => setAccueilSubView(kpi.subView)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="kpi-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.2px' }}>{kpi.label}</div>
                      <div 
                        className="kpi-icon" 
                        style={{ 
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: kpi.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${kpiCardBorder[i]}`
                        }}
                      >
                        {kpi.icon}
                      </div>
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                      <div className="kpi-value" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{kpi.value}</div>
                      <div className="kpi-sub" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{kpi.sub}</div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* PIPELINE ATELIER — Stepper Horizontal */}
              <div 
                className="pipeline-card-modern" 
                onClick={() => setAccueilSubView('pipeline_detail')}
              >
                <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Pipeline Atelier</h4>
                  <span className="see-all" style={{ fontSize: '0.62rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse-glow-ready 1.5s infinite' }} />
                    Temps réel
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', position: 'relative', padding: '0.2rem 0' }}>
                  {pipelineCounts.map((p, idx) => (
                    <div className="pipeline-step-node" key={p.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      {/* Stepper line */}
                      {idx < 3 && (
                        <div style={{
                          position: 'absolute',
                          top: '16px',
                          left: 'calc(50% + 16px)',
                          right: 'calc(-50% + 16px)',
                          height: '2px',
                          background: '#f1f5f9',
                          zIndex: 1
                        }} />
                      )}
                      
                      <div 
                        className={p.count > 0 ? "pipeline-step-circle-active" : ""}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: p.count > 0 ? p.colorLight : '#ffffff',
                          border: `2px solid ${p.count > 0 ? p.color : '#e2e8f0'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                          marginBottom: '0.4rem',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: p.count > 0 ? p.color : 'var(--text-muted)' }}>
                          {p.count}
                        </span>
                      </div>
                      
                      <span style={{ 
                        fontSize: '0.62rem', 
                        color: p.count > 0 ? 'var(--text-primary)' : 'var(--text-muted)', 
                        fontWeight: p.count > 0 ? 600 : 500,
                        textAlign: 'center'
                      }}>
                        {p.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIVITÉ PÉRIODIQUE */}
              <div className="activity-card-modern" style={{ position: 'relative', zIndex: showPeriodDropdown ? 10 : 1 }}>
                <div className="section-header" style={{ position: 'relative', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}>
                    <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Activité — <span style={{ color: 'var(--primary)', borderBottom: '1px dashed var(--primary)' }}>{getPeriodLabel(activityPeriod)}</span></h4>
                    <ChevronDown size={12} color="var(--primary)" />
                  </div>
                  <span className="see-all" style={{ cursor: 'pointer', fontSize: '0.62rem', color: 'var(--primary)', fontWeight: 600 }} onClick={() => setAccueilSubView('activity_detail')}>Voir plus</span>
                  
                  {showPeriodDropdown && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, zIndex: 100,
                      background: '#fff', border: '1px solid var(--border-color)', borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '120px'
                    }}>
                      {[
                        { value: '3_days', label: '3 jours' },
                        { value: '7_days', label: '7 jours' },
                        { value: '1_month', label: '1 mois' },
                        { value: '3_months', label: '3 mois' },
                        { value: '6_months', label: '6 mois' },
                        { value: '12_months', label: '12 mois' }
                      ].map(p => (
                        <div
                          key={p.value}
                          onClick={() => {
                            setActivityPeriod(p.value);
                            setShowPeriodDropdown(false);
                          }}
                          style={{
                            padding: '0.45rem 0.6rem', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer',
                            background: activityPeriod === p.value ? 'var(--primary-light)' : 'transparent',
                            color: activityPeriod === p.value ? 'var(--primary)' : 'var(--text-primary)',
                            fontWeight: activityPeriod === p.value ? 600 : 400
                          }}
                        >
                          {p.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {(() => {
                  const actData = getActivityData();
                  const maxBar = Math.max(...actData.map(d => d.count), 1);
                  return (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '52px', marginTop: '0.5rem', padding: '0 4px' }}>
                      {actData.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div className="activity-chart-bar" style={{ 
                            width: '6px', 
                            height: `${Math.max(d.count > 0 ? 6 : 2, (d.count / maxBar) * 46)}px`, 
                            background: i === actData.length - 1 ? 'linear-gradient(to top, var(--primary) 0%, #3b82f6 100%)' : 'rgba(59, 130, 246, 0.15)',
                            transition: 'height 0.5s ease', 
                            position: 'relative' 
                          }}>
                            {d.count > 0 && i >= actData.length - 2 && (
                              <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.52rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                                {d.count}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d.label}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* TOP CLIENTS */}
              {topCustomers.length > 0 && (
                <div 
                  className="top-clients-card-modern" 
                  onClick={() => setAccueilSubView('top_clients')}
                >
                  <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Top Clients</h4>
                    <span className="see-all" style={{ cursor: 'pointer', fontSize: '0.62rem', color: 'var(--primary)', fontWeight: 600 }}>Voir tout</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {topCustomers.map((c, idx) => {
                      const rankBadges = ["client-rank-badge", "client-rank-badge-silver", "client-rank-badge-bronze"];
                      const initials = `${c.prenom ? c.prenom.charAt(0) : ''}${c.nom ? c.nom.charAt(0) : ''}`.toUpperCase();
                      return (
                        <div 
                          key={c.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.65rem', 
                            padding: '0.5rem 0.65rem', 
                            background: idx === 0 ? 'var(--primary-light)' : 'rgba(0, 0, 0, 0.015)', 
                            borderRadius: '12px',
                            border: idx === 0 ? '1px solid rgba(59, 130, 246, 0.12)' : '1px solid rgba(0, 0, 0, 0.03)'
                          }}
                        >
                          <div 
                            className={rankBadges[idx]}
                            style={{ 
                              width: '22px', 
                              height: '22px', 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: '0.68rem', 
                              flexShrink: 0 
                            }}
                          >
                            {idx + 1}
                          </div>
                          
                          <div className="client-avatar-initials">
                            {initials}
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.prenom} {c.nom}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px', fontWeight: 500 }}>
                              {canViewCA ? `${c.orderCount} commande${c.orderCount > 1 ? 's' : ''}` : 'Client Privilégié'}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                            {canViewCA ? (showCAValues ? `${c.totalSpent.toLocaleString()} F` : '•••••• F') : `${c.orderCount} cmd`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COMMANDES EN COURS */}
              <div>
                <div className="section-header" style={{ marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Commandes en cours</h4>
                  <span className="see-all" style={{ fontSize: '0.62rem', color: 'var(--primary)', fontWeight: 600 }}>Voir tout</span>
                </div>
                <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-control" 
                    style={{ 
                      paddingLeft: '2.3rem', 
                      width: '100%', 
                      borderRadius: '14px', 
                      fontSize: '0.75rem', 
                      padding: '0.5rem 1rem 0.5rem 2.3rem',
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)'
                    }} 
                    placeholder="Rechercher code, article, client..." 
                    value={homeSearchQuery} 
                    onChange={(e) => setHomeSearchQuery(e.target.value)} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredHomeOrders.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '1.5rem', background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                      Aucune commande active.
                    </p>
                  ) : filteredHomeOrders.map(order => {
                    const client = customers.find(c => c.id === order.customer_id);
                    const clientName = client ? `${client.prenom} ${client.nom}` : 'Client';
                    const clientInitials = client ? `${client.prenom?.[0] || ''}${client.nom?.[0] || ''}` : 'CL';
                    const isLate = isOrderLate(order);
                    return (
                      <div 
                        className="mobile-order-row" 
                        key={order.id} 
                        style={{ 
                          borderLeft: isLate ? '4px solid var(--status-late)' : '4px solid var(--primary)',
                          background: '#ffffff',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                          padding: '0.7rem 0.9rem',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '8px', 
                          background: 'var(--primary-light)', 
                          color: 'var(--primary)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 700, 
                          fontSize: '0.7rem', 
                          flexShrink: 0 
                        }}>
                          {clientInitials}
                        </div>
                        <div className="mobile-order-info" style={{ flex: 1, minWidth: 0 }}>
                          <div className="mobile-order-title" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.type_article}</div>
                          <div className="mobile-order-desc" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {clientName} · <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{order.identifiant_unique_marquage}</span>
                          </div>
                        </div>
                        <div className="mobile-order-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                          <span className="mobile-order-price" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            +{order.prix_total.toLocaleString()} F
                          </span>
                          <span 
                            className={`badge badge-${order.statut}`} 
                            style={{ 
                              fontSize: '0.55rem', 
                              padding: '0.12rem 0.4rem', 
                              borderRadius: '4px',
                              fontWeight: 600
                            }}
                          >
                            {getOrderStatusLabel(order)}
                          </span>
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
            {gestionSubView === 'main' && (
              <>
                {/* Header */}
                <div className="mobile-header" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div>
                    <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>Gestion</h1>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Suivi et traitement</p>
                  </div>
                  {currentUser && currentUser.role !== 'agent_lavage_repassage' && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', width: '100%', justifyContent: 'center' }}>
                      <button 
                        type="button"
                        className="btn btn-primary" 
                        style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.72rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                        onClick={() => setShowOrderRegistrationModal(true)}
                      >
                        <Plus size={14} /> Ajouter une commande
                      </button>
                      <button 
                        type="button"
                        className="btn" 
                        style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.72rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', background: 'var(--status-ready)', color: '#fff', border: 'none' }}
                        onClick={handleOpenCreateCustomer}
                      >
                        <Plus size={14} /> Ajouter un profil client
                      </button>
                    </div>
                  )}
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
                <VueKanban
                  filteredAtelierOrders={filteredAtelierOrders}
                  customers={customers}
                  serviceLabels={serviceLabels}
                  getOrderStatusLabel={getOrderStatusLabel}
                  isOrderLate={isOrderLate}
                  formatDateTime={formatDateTime}
                  handleStatusChange={handleStatusChange}
                  handleCompleteDelivery={handleCompleteDelivery}
                  handleCancelOrder={handleCancelOrder}
                  copyToClipboard={copyToClipboard}
                  currentUser={currentUser}
                />

                {currentUser && currentUser.role !== 'agent_lavage_repassage' && (
                  <>
                    {/* ================= GESTION DES PROFILS CLIENTS ================= */}
                    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
                          <Users size={16} />
                          <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>Profils Clients</h4>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setGestionSubView('all_profiles')}
                          style={{ border: 'none', background: 'transparent', fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}
                        >
                          Voir tout
                        </button>
                      </div>

                      {/* Search Bar for profiles */}
                      <div style={{ position: 'relative' }}>
                        <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          className="input-control" 
                          style={{ paddingLeft: '2rem', width: '100%', borderRadius: '12px', fontSize: '0.72rem', padding: '0.35rem 1rem 0.35rem 2rem' }} 
                          placeholder="Rechercher un profil..." 
                          value={profileSearch} 
                          onChange={(e) => setProfileSearch(e.target.value)} 
                        />
                      </div>

                      {/* List of Profiles */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '2px' }}>
                        {customers.filter(c => 
                          c.nom.toLowerCase().includes(profileSearch.toLowerCase()) ||
                          c.prenom.toLowerCase().includes(profileSearch.toLowerCase()) ||
                          c.telephone.includes(profileSearch)
                        ).map(c => (
                          <div 
                            key={c.id} 
                            onClick={(e) => {
                              if (e.target.closest('button') || e.target.closest('svg')) return;
                              setSelectedClientForHistory(c);
                              setPreviousGestionSubView('main');
                              setGestionSubView('client_order_history');
                            }}
                            style={{ 
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                              background: 'var(--bg-app)', padding: '0.55rem 0.7rem', borderRadius: '12px', 
                              border: '1px solid var(--border-color)', gap: '0.4rem',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                              <div style={{
                                width: '26px', height: '26px', borderRadius: '50%', 
                                background: 'var(--primary-light)', color: 'var(--primary)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                fontSize: '0.7rem', fontWeight: 800, flexShrink: 0
                              }}>
                                {c.prenom[0]}{c.nom[0]}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {c.prenom} {c.nom}
                                </div>
                                <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                                  {c.telephone}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span style={{ 
                                fontSize: '0.55rem', fontWeight: 700, padding: '0.15rem 0.35rem', 
                                borderRadius: '6px', background: c.preferences_pliage === 'Sur cintre' ? 'rgba(0,210,196,0.1)' : 'var(--primary-light)', 
                                color: c.preferences_pliage === 'Sur cintre' ? 'var(--secondary)' : 'var(--primary)',
                                whiteSpace: 'nowrap'
                              }}>
                                {c.preferences_pliage === 'Sur cintre' ? 'Cintre' : 'Plié'}
                              </span>
                              <button 
                                type="button"
                                onClick={() => handleOpenEditCustomer(c)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', padding: '0.15rem', display: 'flex' }}
                                title="Modifier"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => setShowDeleteCustomerConfirm(c)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--status-late)', padding: '0.15rem', display: 'flex' }}
                                title="Supprimer"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {customers.filter(c => 
                          c.nom.toLowerCase().includes(profileSearch.toLowerCase()) ||
                          c.prenom.toLowerCase().includes(profileSearch.toLowerCase()) ||
                          c.telephone.includes(profileSearch)
                        ).length === 0 && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0.75rem', textAlign: 'center' }}>
                            Aucun profil trouvé.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CRM Abonnements */}
                    <div className="card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Award size={14} color="var(--primary)" />
                          <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>Abonnements Clients</h4>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setGestionSubView('all_subscriptions')}
                          style={{ border: 'none', background: 'transparent', fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}
                        >
                          Voir tout
                        </button>
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
                        <FicheClient
                          selectedCrmCustomer={selectedCrmCustomer}
                          setSelectedCrmCustomer={setSelectedCrmCustomer}
                          catalog={catalog}
                          db={db}
                          refreshData={refreshData}
                        />
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {gestionSubView === 'all_profiles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setGestionSubView('main')} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                  >
                    <ChevronLeft size={20} color="var(--primary)" />
                  </button>
                  <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Tous les profils clients</h1>
                </div>
                
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="input-control" 
                      style={{ paddingLeft: '2rem', width: '100%', borderRadius: '12px', fontSize: '0.72rem', padding: '0.35rem 1rem 0.35rem 2rem' }} 
                      placeholder="Rechercher un profil..." 
                      value={profileSearch} 
                      onChange={(e) => setProfileSearch(e.target.value)} 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
                    {customers.filter(c => 
                      c.nom.toLowerCase().includes(profileSearch.toLowerCase()) ||
                      c.prenom.toLowerCase().includes(profileSearch.toLowerCase()) ||
                      c.telephone.includes(profileSearch)
                    ).map(c => (
                      <div 
                        key={c.id} 
                        onClick={(e) => {
                          if (e.target.closest('button') || e.target.closest('svg')) return;
                          setSelectedClientForHistory(c);
                          setPreviousGestionSubView('all_profiles');
                          setGestionSubView('client_order_history');
                        }}
                        style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          background: 'var(--bg-app)', padding: '0.65rem 0.8rem', borderRadius: '12px', 
                          border: '1px solid var(--border-color)', gap: '0.4rem',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', 
                            background: 'var(--primary-light)', color: 'var(--primary)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: '0.75rem', fontWeight: 800, flexShrink: 0
                          }}>
                            {c.prenom[0]}{c.nom[0]}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.prenom} {c.nom}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                              {c.telephone} · <strong style={{ color: 'var(--secondary)' }}>{c.points_fidelite} pts</strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ 
                            fontSize: '0.58rem', fontWeight: 700, padding: '0.2rem 0.45rem', 
                            borderRadius: '6px', background: c.preferences_pliage === 'Sur cintre' ? 'rgba(0,210,196,0.1)' : 'var(--primary-light)', 
                            color: c.preferences_pliage === 'Sur cintre' ? 'var(--secondary)' : 'var(--primary)',
                            whiteSpace: 'nowrap'
                          }}>
                            {c.preferences_pliage === 'Sur cintre' ? 'Cintre' : 'Plié'}
                          </span>
                          <button 
                            type="button"
                            onClick={() => handleOpenEditCustomer(c)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', padding: '0.2rem', display: 'flex' }}
                            title="Modifier"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setShowDeleteCustomerConfirm(c)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--status-late)', padding: '0.2rem', display: 'flex' }}
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {customers.filter(c => 
                      c.nom.toLowerCase().includes(profileSearch.toLowerCase()) ||
                      c.prenom.toLowerCase().includes(profileSearch.toLowerCase()) ||
                      c.telephone.includes(profileSearch)
                    ).length === 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>
                        Aucun profil trouvé.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {gestionSubView === 'all_subscriptions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setGestionSubView('main')} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                  >
                    <ChevronLeft size={20} color="var(--primary)" />
                  </button>
                  <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Tous les abonnements</h1>
                </div>

                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="input-control" 
                      style={{ paddingLeft: '2rem', width: '100%', borderRadius: '12px', fontSize: '0.72rem', padding: '0.35rem 1rem 0.35rem 2rem' }} 
                      placeholder="Rechercher un abonné..." 
                      value={crmSearch} 
                      onChange={(e) => {
                        setCrmSearch(e.target.value);
                        setSelectedCrmCustomer(null);
                      }} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
                    {customers.filter(c => 
                      c.nom.toLowerCase().includes(crmSearch.toLowerCase()) ||
                      c.prenom.toLowerCase().includes(crmSearch.toLowerCase()) ||
                      c.telephone.includes(crmSearch)
                    ).map(c => {
                      return (
                        <div 
                          key={c.id} 
                          style={{ 
                            background: 'var(--bg-app)', padding: '0.65rem 0.8rem', borderRadius: '12px', 
                            display: 'flex', flexDirection: 'column', gap: '0.45rem', border: '1px solid var(--border-color)' 
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{c.prenom} {c.nom}</span>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Tél : {c.telephone}</span>
                          </div>
                          
                          {c.active_subscription ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>{c.active_subscription.name}</strong>
                                <span style={{ fontWeight: 600 }}>{c.active_subscription.remaining_clothes} / {c.active_subscription.total_clothes} vêt.</span>
                              </div>
                              
                              {(() => {
                                const remaining = c.active_subscription.remaining_clothes;
                                const total = c.active_subscription.total_clothes;
                                const percentUsed = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
                                return (
                                  <div className="progress-bar-track">
                                    <div className="progress-bar-fill" style={{ width: `${percentUsed}%`, background: 'var(--primary)' }}></div>
                                  </div>
                                );
                              })()}
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.1rem' }}>
                                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                                  Expire le : {new Date(c.active_subscription.expires_at).toLocaleDateString('fr-FR')}
                                </span>
                                <button 
                                  type="button" 
                                  className="btn btn-outline" 
                                  onClick={() => handleUnsubscribeCrm(c.id)}
                                  style={{ padding: '0.2rem 0.45rem', fontSize: '0.62rem', color: 'var(--status-late)', borderColor: '#f5c6c6', background: 'var(--status-late-light)', borderRadius: '6px' }}
                                >
                                  Résilier
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem' }}>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Aucun forfait actif.</div>
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <CustomSelect
                                  value={selectedCrmSubId && selectedCrmCustomer?.id === c.id ? selectedCrmSubId : ''}
                                  onChange={(val) => {
                                    setSelectedCrmCustomer(c);
                                    setSelectedCrmSubId(val);
                                  }}
                                  placeholder="-- Choisir --"
                                  options={catalog.filter(i => i.service === 'abonnement').map(sub => ({
                                    value: sub.id,
                                    label: `${sub.article} (${sub.prix} F)`
                                  }))}
                                  style={{ flex: 1 }}
                                />
                                <button 
                                  type="button" 
                                  className="btn btn-primary" 
                                  onClick={() => handleSubscribeCrm(c.id, selectedCrmSubId && selectedCrmCustomer?.id === c.id ? selectedCrmSubId : '')}
                                  style={{ padding: '0.28rem 0.55rem', fontSize: '0.68rem', borderRadius: '6px' }}
                                >
                                  Souscrire
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {gestionSubView === 'client_order_history' && selectedClientForHistory && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '8px' }}>
                <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setGestionSubView(previousGestionSubView)} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                  >
                    <ChevronLeft size={20} color="var(--primary)" />
                  </button>
                  <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Historique de {selectedClientForHistory.prenom} {selectedClientForHistory.nom}
                  </h1>
                </div>

                {/* Profil client card */}
                <div className="card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', 
                      background: 'var(--primary-light)', color: 'var(--primary)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '0.85rem', fontWeight: 800, flexShrink: 0
                    }}>
                      {selectedClientForHistory.prenom?.[0] || ''}{selectedClientForHistory.nom?.[0] || ''}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {selectedClientForHistory.prenom} {selectedClientForHistory.nom}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                        Tél : {selectedClientForHistory.telephone}
                      </div>
                    </div>
                    {selectedClientForHistory.points_fidelite !== undefined && (
                      <div style={{ 
                        fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.45rem', 
                        borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'rgb(245, 158, 11)',
                        display: 'flex', alignItems: 'center', gap: '0.15rem'
                      }}>
                        🏆 {selectedClientForHistory.points_fidelite} pts
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.1rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    <div style={{ flex: 1 }}>
                      Pliage : <strong>{selectedClientForHistory.preferences_pliage === 'Sur cintre' ? 'Sur Cintre' : 'Plié'}</strong>
                    </div>
                    {selectedClientForHistory.solde_dette > 0 ? (
                      <div style={{ color: 'var(--status-late)' }}>
                        Dette : <strong>{Number(selectedClientForHistory.solde_dette).toLocaleString()} FCFA</strong>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--status-ready)' }}>
                        Aucune dette
                      </div>
                    )}
                  </div>

                  {selectedClientForHistory.active_subscription && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                        <strong style={{ color: 'var(--primary)' }}>{selectedClientForHistory.active_subscription.name}</strong>
                        <span style={{ fontWeight: 600 }}>{selectedClientForHistory.active_subscription.remaining_clothes} / {selectedClientForHistory.active_subscription.total_clothes} vêt.</span>
                      </div>
                      <div className="progress-bar-track" style={{ height: '5px' }}>
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${Math.max(0, Math.min(100, Math.round(((selectedClientForHistory.active_subscription.total_clothes - selectedClientForHistory.active_subscription.remaining_clothes) / selectedClientForHistory.active_subscription.total_clothes) * 100)))}%`, 
                            background: 'var(--primary)' 
                          }}
                        ></div>
                      </div>
                      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                        Expire le : {new Date(selectedClientForHistory.active_subscription.expires_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Liste des commandes */}
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>Commandes</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(() => {
                    const clientOrders = orders
                      .filter(o => o.customer_id === selectedClientForHistory.id)
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                    if (clientOrders.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.75rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          Aucune commande enregistrée pour ce client.
                        </div>
                      );
                    }

                    return clientOrders.map(order => {
                      const isExpress = order.niveau_urgence === 'Express';
                      const remaining = order.prix_total - order.avance_payee;

                      return (
                        <div 
                          key={order.id} 
                          className="mobile-order-row"
                          style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '0.8rem', background: '#fff' }}
                        >
                          {/* Header row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <strong style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>{order.identifiant_unique_marquage}</strong>
                              <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{formatDateTime(order.created_at)}</span>
                            </div>
                            <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.52rem', padding: '0.1rem 0.35rem' }}>
                              {getOrderStatusLabel(order)}
                            </span>
                          </div>

                          {/* Urgence */}
                          <div style={{ fontSize: '0.68rem', display: 'flex', flexDirection: 'column', gap: '0.12rem', width: '100%', textAlign: 'left' }}>
                            <div>Urgence: <span style={{ fontWeight: 700, color: isExpress ? 'var(--status-late)' : 'var(--text-primary)' }}>{order.niveau_urgence}</span></div>
                          </div>

                          {/* Items and Services */}
                          <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '0.4rem', borderRadius: '8px', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', width: '100%', textAlign: 'left', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.6rem' }}>Détails articles :</div>
                            {order.items && order.items.length > 0 ? (
                              order.items.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.25rem' }}>
                                  <span>• {it.quantite}x {it.article} ({serviceLabels[it.service] || it.service})</span>
                                </div>
                              ))
                            ) : (
                              <div style={{ paddingLeft: '0.25rem' }}>• {order.type_article} ({serviceLabels[order.type_service] || order.type_service})</div>
                            )}
                          </div>

                          {/* Financial info */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.65rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.35rem', width: '100%', textAlign: 'left' }}>
                            <div>Total: <strong>{(order.prix_total || 0).toLocaleString()} F</strong></div>
                            <div>Acompte: <strong style={{ color: 'var(--status-ready)' }}>{(order.avance_payee || 0).toLocaleString()} F</strong></div>
                            <div>Réglement: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{(order.mode_reglement || 'Non défini').replace(/_/g, ' ')}</span></div>
                            <div style={{ color: remaining > 0 ? 'var(--status-late)' : 'var(--status-ready)' }}>
                              Solde: <strong>{(remaining || 0).toLocaleString()} F</strong>
                            </div>
                          </div>

                          {/* Action footer */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem', marginTop: '0.1rem', width: '100%' }}>
                            <button 
                              type="button"
                              className="btn btn-outline" 
                              style={{ padding: '0.22rem 0.55rem', fontSize: '0.62rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                              onClick={() => setCreatedOrder(order)}
                            >
                              <Printer size={10} /> Voir Ticket
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================
           ONGLET : HISTORIQUE
           ======================================================== */}
        {activeTab === 'historique' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="mobile-header" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>Historique</h1>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Archives des commandes</p>
            </div>

            {/* Search and filter */}
            <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {/* Scope filter (All vs Mine) */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem', gap: '0.55rem' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    fontSize: '0.68rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: historyFilterScope === 'all' ? 'var(--primary-light)' : 'transparent',
                    color: historyFilterScope === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setHistoryFilterScope('all')}
                >
                  Toutes les commandes
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    fontSize: '0.68rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: historyFilterScope === 'mine' ? 'var(--primary-light)' : 'transparent',
                    color: historyFilterScope === 'mine' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setHistoryFilterScope('mine')}
                >
                  Mes dépôts
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ padding: '0.4rem', paddingLeft: '2.2rem', width: '100%', fontSize: '0.75rem' }}
                  placeholder="Rechercher code, client, linge..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                />
              </div>

              {/* Status filter pills */}
              <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.15rem', scrollbarWidth: 'none' }}>
                {[
                  { id: 'all', label: 'Toutes' },
                  { id: 'en_attente', label: 'Traitement' },
                  { id: 'en_cours_lavage', label: 'Repassage' },
                  { id: 'pret', label: 'Prêt' },
                  { id: 'a_recuperer', label: 'À récupérer' },
                  { id: 'a_livrer', label: 'À livrer' },
                  { id: 'en_cours_livraison', label: 'En cours' },
                  { id: 'restitue', label: 'Restitué' },
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
                      border: historyFilterStatus === filter.id ? '1px solid var(--secondary)' : '1px solid var(--border-color)',
                      background: historyFilterStatus === filter.id ? 'var(--primary-gradient)' : 'rgba(0, 0, 0, 0.04)',
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
                      className="mobile-order-row"
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '0.8rem' }}
                    >
                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.58rem' }}>
                            {clientInitials}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>{order.identifiant_unique_marquage}</strong>
                            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{formatDateTime(order.created_at)}</div>
                          </div>
                        </div>
                        <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.52rem', padding: '0.1rem 0.35rem' }}>
                          {getOrderStatusLabel(order)}
                        </span>
                      </div>

                      {/* Client Info */}
                      <div style={{ fontSize: '0.68rem', display: 'flex', flexDirection: 'column', gap: '0.12rem', width: '100%', textAlign: 'left' }}>
                        <div>Client: <strong>{clientName}</strong> {client && <span style={{ color: 'var(--text-secondary)' }}>({client.telephone})</span>}</div>
                        <div>Urgence: <span style={{ fontWeight: 700, color: isExpress ? 'var(--status-late)' : 'var(--text-primary)' }}>{order.niveau_urgence}</span></div>
                      </div>

                      {/* Items and Services */}
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem', borderRadius: '8px', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', width: '100%', textAlign: 'left', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.6rem' }}>Détails articles :</div>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.25rem' }}>
                              <span>• {it.quantite}x {it.article} ({serviceLabels[it.service] || it.service})</span>
                            </div>
                          ))
                        ) : (
                          <div style={{ paddingLeft: '0.25rem' }}>• {order.type_article} ({serviceLabels[order.type_service] || order.type_service})</div>
                        )}
                      </div>

                      {/* Financial info */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.65rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.35rem', width: '100%', textAlign: 'left' }}>
                        <div>Total: <strong>{(order.prix_total || 0).toLocaleString()} F</strong></div>
                        <div>Acompte: <strong style={{ color: 'var(--status-ready)' }}>{(order.avance_payee || 0).toLocaleString()} F</strong></div>
                        <div>Réglement: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{(order.mode_reglement || 'Non défini').replace(/_/g, ' ')}</span></div>
                        <div style={{ color: remaining > 0 ? 'var(--status-late)' : 'var(--status-ready)' }}>
                          Solde: <strong>{(remaining || 0).toLocaleString()} F</strong>
                        </div>
                      </div>

                      {/* Footer */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem', marginTop: '0.1rem', width: '100%' }}>
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
            <div className="mobile-header" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>Compte</h1>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Profil & Préférences</p>
            </div>

            {/* Profile card — finance style */}
            <div 
              className="card interactive clickable" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.9rem', cursor: 'pointer' }}
              onClick={() => setShowUserDetailsModal(true)}
            >
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
                <div 
                  className="kpi-card interactive clickable" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setHistoryFilterScope('mine');
                    setActiveTab('historique');
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
                    <div className="kpi-icon" style={{ background: 'var(--primary-light)', width: '28px', height: '28px', borderRadius: '8px' }}>
                      <Sliders size={13} color="var(--primary)" />
                    </div>
                    <span className="kpi-label">Dépôts du Jour</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
                    {todayDeposits} cmd
                  </div>
                </div>
                <div 
                  className="kpi-card interactive clickable" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowQualityStatsModal(true)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
                    <div className="kpi-icon" style={{ background: 'var(--status-ready-light)', width: '28px', height: '28px', borderRadius: '8px' }}>
                      <Award size={13} color="var(--status-ready)" />
                    </div>
                    <span className="kpi-label">Score Qualité</span>
                  </div>
                  {qualityScore !== null ? (
                    <div className="kpi-value" style={{
                      fontSize: '1.2rem',
                      color: Number(qualityScore) >= 85 ? 'var(--status-ready)' : Number(qualityScore) >= 65 ? 'var(--status-pending)' : 'var(--status-late)'
                    }}>
                      {qualityScore} %
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.3 }}>
                      Données insuffisantes
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Paramètres de Fonctionnement */}
            <div className="card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                <Sliders size={14} color="var(--primary)" />
                <h4 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>
                  Paramètres de Fonctionnement
                </h4>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* WhatsApp Notification Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications WhatsApp</span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Ouverture automatique de wa.me</span>
                  </div>
                  <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '34px', height: '20px' }}>
                    <input 
                      type="checkbox" 
                      checked={enableWhatsAppNotifications}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setEnableWhatsAppNotifications(val);
                        localStorage.setItem('klin_up_whatsapp_enabled', String(val));
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: enableWhatsAppNotifications ? 'var(--primary)' : 'rgba(0, 0, 0, 0.1)',
                      transition: '0.3s', borderRadius: '20px'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '14px', width: '14px', left: '3px', bottom: '3px',
                        backgroundColor: 'white', transition: '0.3s', borderRadius: '50%',
                        transform: enableWhatsAppNotifications ? 'translateX(14px)' : 'translateX(0)'
                      }} />
                    </span>
                  </label>
                </div>

                {/* Database Connection Mode */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', marginTop: '0.2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>Base de données</span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Statut de synchronisation</span>
                  </div>
                  <span 
                    onClick={async () => {
                      if (db.isRemote()) {
                        alert("Connexion active : L'application est connectée avec succès au cloud Supabase.");
                      } else {
                        const confirmDiag = confirm("L'application est actuellement en mode local. Voulez-vous lancer un test de diagnostic de connexion Supabase ?");
                        if (confirmDiag) {
                          alert("Lancement du test de diagnostic...");
                          const res = await db.testConnection();
                          if (res.success) {
                            alert("Succès ! " + res.message + "\n\nL'application s'est reconnectée à Supabase et est maintenant en ligne !");
                          } else {
                            alert("Échec du diagnostic !\n\nErreur : " + res.error + "\n\nConseils : Vérifiez la connexion Internet de votre téléphone.");
                          }
                        }
                      }
                    }}
                    style={{ 
                      cursor: 'pointer',
                      fontSize: '0.62rem', 
                      fontWeight: 800, 
                      padding: '0.15rem 0.5rem', 
                      borderRadius: '20px', 
                      background: db.isRemote() ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                      color: db.isRemote() ? '#10b981' : '#f59e0b',
                      border: db.isRemote() ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2px'
                    }}
                  >
                    {db.isRemote() ? 'Supabase Cloud' : 'Mode Local'}
                  </span>
                </div>

              </div>
            </div>

            {/* Déconnexion */}
            <button
              type="button"
              className="btn btn-outline"
              style={{
                borderColor: 'var(--status-late)',
                color: 'var(--status-late)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                padding: '0.75rem',
                borderRadius: '14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                width: '100%',
                marginTop: '0.5rem',
                transition: 'all 0.2s ease',
                background: 'transparent'
              }}
              onClick={() => {
                setShowLogoutConfirm(true);
              }}
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
        )}

          </>
        )}
      </div>

      {/* Bottom Navigation — Redesign */}
      {currentUser && (
        <div className="mobile-footer-nav">
          <div className="menu-list">
            {currentUser.role !== 'agent_lavage_repassage' && (
              <button 
                className={`menu-item ${activeTab === 'accueil' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('accueil');
                  setAccueilSubView('main');
                  setGestionSubView('main');
                }}
              >
                <div className="nav-icon-wrap">
                  <MIcon name="home" size={22} filled={activeTab === 'accueil'} />
                </div>
                <span>Accueil</span>
              </button>
            )}
            <button 
              className={`menu-item ${activeTab === 'gestion' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('gestion');
                setAccueilSubView('main');
                setGestionSubView('main');
              }}
            >
              <div className="nav-icon-wrap">
                <MIcon name="layers" size={22} filled={activeTab === 'gestion'} />
              </div>
              <span>Gestion</span>
            </button>
            {currentUser.role !== 'agent_lavage_repassage' && (
              <div className="scan-item">
                <button 
                  type="button"
                  className="scan-btn"
                  title="Scanner un vêtement"
                  onClick={() => {
                    setShowOrderRegistrationModal(true);
                  }}
                >
                  <MIcon name="add" size={26} />
                </button>
              </div>
            )}
            {currentUser.role !== 'agent_lavage_repassage' && (
              <button 
                className={`menu-item ${activeTab === 'historique' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('historique');
                  setAccueilSubView('main');
                  setGestionSubView('main');
                  setHistoryFilterScope('all');
                }}
              >
                <div className="nav-icon-wrap">
                  <MIcon name="receipt_long" size={22} filled={activeTab === 'historique'} />
                </div>
                <span>Historique</span>
              </button>
            )}
            <button 
              className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('profile');
                setAccueilSubView('main');
                setGestionSubView('main');
              }}
            >
              <div className="nav-icon-wrap">
                <MIcon name="account_circle" size={22} filled={activeTab === 'profile'} />
              </div>
              <span>Compte</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL ENREGISTREMENT COMMANDE ================= */}
      {showOrderRegistrationModal && (
        <FormulaireCommande
          onClose={() => setShowOrderRegistrationModal(false)}
          customers={customers}
          catalog={catalog}
          db={db}
          currentUser={currentUser}
          serviceLabels={serviceLabels}
          setCreatedOrder={(newOrder) => {
            setSuccessPopup({
              type: 'order',
              title: 'Commande Enregistrée !',
              message: `La commande a bien été créée avec succès.`,
              extraInfo: newOrder.identifiant_unique_marquage,
              order: newOrder
            });
          }}
          sendWhatsAppMessage={sendWhatsAppMessage}
          formatDateTime={formatDateOnly}
        />
      )}

      {/* ================= MODAL CRÉATION CLIENT ================= */}
      {showNewCustomerModal && (
        <div 
          className="modal-overlay center-align"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewCustomerModal(false); }}
        >
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
                <CustomSelect
                  value={newCustIndicatif}
                  onChange={setNewCustIndicatif}
                  options={countries.map((c) => ({
                    value: c.code,
                    label: `${c.flag} ${c.name} (+${c.code})`
                  }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Téléphone</label>
                <input type="tel" className="input-control" style={{ padding: '0.42rem', fontSize: '0.75rem' }} required placeholder="Ex: 97979797" value={newCustTel} onChange={(e) => setNewCustTel(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Adresse</label>
                <input type="text" className="input-control" style={{ padding: '0.42rem', fontSize: '0.75rem' }} required placeholder="Ex: Rue 125, Cotonou" value={newCustAdresse} onChange={(e) => setNewCustAdresse(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Préférence Pliage</label>
                <CustomSelect
                  value={newCustPref}
                  onChange={setNewCustPref}
                  options={[
                    { value: 'Plié', label: 'Plié' },
                    { value: 'Sur cintre', label: 'Sur cintre' }
                  ]}
                />
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
        <div 
          className="modal-overlay center-align"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDebtPaymentModal(false); }}
        >
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
        <div 
          className="modal-overlay center-align"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeliveryPaymentModal(false); }}
        >
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
                <CustomSelect
                  value={delivPaymentMethod}
                  onChange={setDelivPaymentMethod}
                  options={[
                    { value: 'especes', label: 'Espèces' },
                    { value: 'mobile_money', label: 'Mobile Money' }
                  ]}
                />
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
        <div 
          className="modal-overlay center-align"
          onClick={(e) => { if (e.target === e.currentTarget) { setCreatedOrder(null); setSelectedCustomerId(''); } }}
        >
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
                <div style={{ height: '55px', overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>
                  <img src={logoDark} alt="KLIN UP Logo" style={{ height: '110px', objectFit: 'contain', display: 'block', margin: '-20px auto' }} />
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '11px', color: 'var(--status-pending)', fontWeight: '600' }}>Ticket de Dépôt Client</p>
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
                {createdOrder.remise_pourcentage > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#5a5a6e' }}>Prix de base :</span>
                      <span style={{ fontWeight: '600', color: '#5a5a6e', textDecoration: 'line-through' }}>
                        {(createdOrder.prix_base_avant_remise || 0).toLocaleString()} FCFA
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--status-ready)' }}>
                      <span style={{ fontWeight: '600' }}>Réduction ({createdOrder.remise_pourcentage}%) :</span>
                      <span style={{ fontWeight: '700' }}>
                        -{(createdOrder.remise_montant || 0).toLocaleString()} FCFA
                      </span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#5a5a6e', fontWeight: createdOrder.remise_pourcentage > 0 ? '700' : 'normal' }}>Total Commande :</span>
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
                  onClick={() => {
                    const element = document.getElementById('receipt-print-area');
                    if (!element) return;
                    if (Capacitor.isNativePlatform()) {
                      const htmlContent = `
                        <html>
                          <head>
                            <meta charset="utf-8">
                            <style>
                              body { margin: 0; padding: 10px; background: #fff; font-family: sans-serif; }
                              img { max-width: 100%; height: auto; }
                            </style>
                          </head>
                          <body>
                            ${element.outerHTML}
                          </body>
                        </html>
                      `;
                      AndroidPrint.printReceipt({ html: htmlContent });
                    } else {
                      window.print();
                    }
                  }}
                >
                  <Printer size={12} /> Imprimer
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', padding: '0.42rem', fontSize: '0.72rem', borderRadius: '8px' }}
                  onClick={() => {
                    const element = document.getElementById('receipt-print-area');
                    if (!element) return;
                    
                    const filename = `Facture_${createdOrder.identifiant_unique_marquage}.pdf`;
                    const opt = {
                      margin:       0.3,
                      filename:     filename,
                      image:        { type: 'jpeg', quality: 0.98 },
                      html2canvas:  { scale: 2, useCORS: true, logging: false },
                      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                    };

                    if (Capacitor.isNativePlatform()) {
                      if (window.html2pdf) {
                        window.html2pdf().set(opt).from(element).output('datauristring').then((dataUri) => {
                          const base64 = dataUri.split(',')[1];
                          AndroidPrint.savePdf({ base64Data: base64, fileName: filename });
                        }).catch((err) => {
                          alert("Erreur lors de la génération du PDF : " + err.message);
                        });
                      } else {
                        alert("Le module PDF est en cours de chargement. Veuillez réessayer.");
                      }
                    } else {
                      if (window.html2pdf) {
                        window.html2pdf().set(opt).from(element).save();
                      } else {
                        alert("Le module PDF est en cours de chargement. Veuillez réessayer.");
                      }
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

      {/* ================= SUCCESS POPUP (MODAL CONFIRMATION ACCUSÉ) ================= */}
      {successPopup && (
        <div 
          className="modal-overlay center-align"
          style={{ zIndex: 1000 }}
          onClick={() => {
            if (successPopup.type === 'order' && successPopup.order) {
              setCreatedOrder(successPopup.order);
            }
            setSuccessPopup(null);
          }}
        >
          <div 
            className="modal-dialog" 
            style={{ 
              maxWidth: '300px', 
              background: '#ffffff', 
              color: '#1a1a1a', 
              padding: '1.25rem', 
              borderRadius: '16px', 
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '0.6rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>
                Confirmation
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  if (successPopup.type === 'order' && successPopup.order) {
                    setCreatedOrder(successPopup.order);
                  }
                  setSuccessPopup(null);
                }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999999', padding: '2px', display: 'flex', alignItems: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Glowing Success Badge */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'var(--primary-light)',
              border: '2px solid var(--primary)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0.5rem auto 1.1rem auto',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)',
              animation: 'pulse-subtle 2s infinite'
            }}>
              <Check size={28} strokeWidth={3} />
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.4rem 0', fontFamily: 'var(--font-title)' }}>
              {successPopup.title}
            </h4>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', lineHeight: 1.45 }}>
              {successPopup.message}
            </p>

            {successPopup.extraInfo && (
              <div style={{ 
                background: 'var(--primary-light)', 
                border: '1.5px dashed rgba(59, 130, 246, 0.25)', 
                borderRadius: '10px', 
                padding: '0.5rem 0.75rem', 
                fontSize: '0.72rem', 
                color: 'var(--text-primary)',
                fontWeight: 700,
                marginBottom: '1.2rem',
                fontFamily: successPopup.type === 'order' ? 'var(--font-mono)' : 'inherit',
                letterSpacing: successPopup.type === 'order' ? '0.5px' : 'normal'
              }}>
                {successPopup.extraInfo}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {successPopup.type === 'order' ? (
                <>
                  <button 
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', borderRadius: '12px', padding: '0.6rem', fontSize: '0.75rem', fontWeight: 600, background: 'var(--primary-gradient)', border: 'none', color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
                    onClick={() => {
                      setCreatedOrder(successPopup.order);
                      setSuccessPopup(null);
                    }}
                  >
                    Voir le Ticket
                  </button>
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: '100%', borderRadius: '12px', padding: '0.6rem', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', border: '1px solid #e2e8f0', color: 'var(--text-primary)', cursor: 'pointer' }}
                    onClick={() => {
                      setSuccessPopup(null);
                    }}
                  >
                    Continuer
                  </button>
                </>
              ) : (
                <button 
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', borderRadius: '12px', padding: '0.6rem', fontSize: '0.75rem', fontWeight: 600, background: 'var(--primary-gradient)', border: 'none', color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
                  onClick={() => {
                    setSuccessPopup(null);
                  }}
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PARAMÈTRES (CONFIG IP SERVEUR) ================= */}
      {showSettingsModal && (
        <div 
          className="modal-overlay center-align"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettingsModal(false); }}
        >
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

      {/* ================= MODAL RESET PIN ================= */}
      {showResetPinModal && (
        <div
          className="modal-overlay center-align"
          style={{ zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetPinModal(false); }}
        >
          <div className="modal-dialog" style={{ maxWidth: '300px', background: '#ffffff', color: '#1a1a1a', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.9rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '0.6rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: '#a855f7' }}>Réinitialiser le PIN</h3>
              <button type="button" onClick={() => setShowResetPinModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999999' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleRequestPinResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#666666', lineHeight: 1.5, margin: 0 }}>
                Saisissez votre adresse email pour envoyer une demande de réinitialisation. L'administrateur devra approuver la demande.
              </p>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.35rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1a1a1a', letterSpacing: '0.2px' }}>Adresse Email</label>
                <input
                  type="email"
                  className="input-control"
                  style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', borderRadius: '10px', border: '1.5px solid #e5e5e5', fontFamily: 'var(--font-sans)' }}
                  required
                  placeholder="Ex: marie.koffi@klinup.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.2rem', padding: '0.65rem', fontSize: '0.8rem', borderRadius: '12px', width: '100%', background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', color: '#ffffff', border: 'none', fontWeight: 600, boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                Envoyer la demande
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DÉTAILS DE L'UTILISATEUR ================= */}
      {showUserDetailsModal && (
        <div 
          className="modal-overlay center-align" 
          style={{ zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowUserDetailsModal(false); }}
        >
          <div className="modal-dialog" style={{ maxWidth: '320px', background: '#ffffff', color: '#18181b', padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>Détails de l'utilisateur</h3>
              <button type="button" onClick={() => setShowUserDetailsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={15} color="var(--text-muted)" />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentUser.prenom.charAt(0)}{currentUser.nom.charAt(0)}
              </div>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>{currentUser.prenom} {currentUser.nom}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', margin: '2px 0 0' }}>
                  {currentUser.role.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem', background: '#f9fafb', padding: '0.85rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Identifiant :</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{currentUser.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Email :</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{currentUser.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Date de création :</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{new Date(currentUser.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ 
                padding: '0.6rem', 
                borderRadius: '10px', 
                fontSize: '0.75rem', 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.4rem',
                borderColor: 'var(--primary)',
                color: 'var(--primary)',
                fontWeight: 700,
                background: 'transparent'
              }}
              onClick={() => {
                setShowUserDetailsModal(false);
                setResetEmail(currentUser.email);
                setShowResetPinModal(true);
              }}
            >
              <Key size={14} />
              Réinitialiser le PIN
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL STATISTIQUES DE QUALITÉ ================= */}
      {showQualityStatsModal && (
        <div 
          className="modal-overlay center-align" 
          style={{ zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowQualityStatsModal(false); }}
        >
          <div className="modal-dialog" style={{ maxWidth: '320px', background: '#ffffff', color: '#18181b', padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>Performance & Délais</h3>
              <button type="button" onClick={() => setShowQualityStatsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={15} color="var(--text-muted)" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px' }}>Score de Qualité Global</span>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-title)', lineHeight: 1 }}>
                {qualityScore !== null ? `${qualityScore} %` : 'N/A'}
              </span>
              <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2px' }}>
                Basé sur les performances de vos dépôts des 90 derniers jours.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem', background: '#f9fafb', padding: '0.85rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Temps moyen de gestion :</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                  {qualityStats.avgProcessingTimeHours 
                    ? (parseFloat(qualityStats.avgProcessingTimeHours) < 24 
                        ? `${qualityStats.avgProcessingTimeHours} h` 
                        : `${(parseFloat(qualityStats.avgProcessingTimeHours) / 24).toFixed(1)} jour(s)`)
                    : 'Aucun dépôt livré'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Commandes à temps :</span>
                <span style={{ color: 'var(--status-ready)', fontWeight: 800 }}>{qualityStats.onTime} cmd(s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Commandes en retard :</span>
                <span style={{ color: 'var(--status-late)', fontWeight: 800 }}>{qualityStats.late} cmd(s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Commandes annulées :</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>{qualityStats.cancelled} cmd(s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Volume total géré :</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{qualityStats.total} commande(s)</span>
              </div>
            </div>

            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.4, textAlign: 'center', padding: '0 0.5rem' }}>
              ℹ️ Pour maintenir un score élevé, assurez-vous de traiter et de finaliser les commandes avant leur date d'échéance programmée.
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CONFIRMATION DÉCONNEXION ================= */}
      {showLogoutConfirm && (
        <div 
          className="modal-overlay center-align" 
          style={{ zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
        >
          <div className="modal-dialog" style={{ maxWidth: '280px', background: '#ffffff', color: '#000000', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--status-late-light)', padding: '0.65rem', borderRadius: '50%', display: 'inline-flex', color: 'var(--status-late)' }}>
                <LogOut size={24} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Déconnexion</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                Êtes-vous sûr de vouloir vous déconnecter de votre session ?
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px' }}
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Annuler
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: 'var(--status-late)', color: '#ffffff', border: 'none' }}
                  onClick={() => {
                    db.setCurrentUser(null);
                    setShowLogoutConfirm(false);
                  }}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CRÉATION / MODIFICATION CLIENT ================= */}
      {showCustomerModal && (
        <div 
          className="modal-overlay center-align" 
          style={{ zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCustomerModal(false); }}
        >
          <div className="modal-dialog" style={{ maxWidth: '300px', background: '#ffffff', color: '#000000', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>
                {editingCustomer ? 'Modifier Profil' : 'Nouveau Client'}
              </h3>
              <button type="button" onClick={() => setShowCustomerModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={15} color="var(--text-muted)" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Prénom</label>
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ padding: '0.42rem', fontSize: '0.75rem', borderRadius: '8px' }} 
                  required 
                  placeholder="Ex: Marie" 
                  value={custPrenom} 
                  onChange={(e) => setCustPrenom(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nom</label>
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ padding: '0.42rem', fontSize: '0.75rem', borderRadius: '8px' }} 
                  required 
                  placeholder="Ex: Koffi" 
                  value={custNom} 
                  onChange={(e) => setCustNom(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Téléphone</label>
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ padding: '0.42rem', fontSize: '0.75rem', borderRadius: '8px' }} 
                  required 
                  placeholder="Ex: 0167676767" 
                  value={custTelephone} 
                  onChange={(e) => setCustTelephone(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Adresse</label>
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ padding: '0.42rem', fontSize: '0.75rem', borderRadius: '8px' }} 
                  required 
                  placeholder="Ex: Haie Vive, Cotonou" 
                  value={custAdresse} 
                  onChange={(e) => setCustAdresse(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Préférence Pliage</label>
                <CustomSelect
                  value={custPreferences}
                  onChange={setCustPreferences}
                  options={[
                    { value: 'Plié', label: 'Plié' },
                    { value: 'Sur cintre', label: 'Sur cintre' }
                  ]}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.3rem', padding: '0.48rem', fontSize: '0.75rem', borderRadius: '8px', width: '100%' }}>
                {editingCustomer ? 'Enregistrer les modifications' : 'Créer le profil'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CONFIRMATION SUPPRESSION CLIENT ================= */}
      {showDeleteCustomerConfirm && (
        <div 
          className="modal-overlay center-align" 
          style={{ zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteCustomerConfirm(null); }}
        >
          <div className="modal-dialog" style={{ maxWidth: '280px', background: '#ffffff', color: '#000000', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--status-late-light)', padding: '0.65rem', borderRadius: '50%', display: 'inline-flex', color: 'var(--status-late)' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Supprimer le Client ?</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                Êtes-vous sûr de vouloir supprimer définitivement le profil de <strong>{showDeleteCustomerConfirm.prenom} {showDeleteCustomerConfirm.nom}</strong> ? Cette action est irréversible.
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px' }}
                  onClick={() => setShowDeleteCustomerConfirm(null)}
                >
                  Annuler
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: 'var(--status-late)', color: '#ffffff', border: 'none' }}
                  onClick={() => handleDeleteCustomer(showDeleteCustomerConfirm.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ================= MODAL NOTIFICATIONS ================= */}
      {showNotificationsModal && (
        <div 
          className="modal-overlay center-align" 
          style={{ zIndex: 1001 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowNotificationsModal(false); }}
        >
          <div className="modal-dialog" style={{ maxWidth: '320px', background: '#ffffff', color: '#000000', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bell size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Notifications
                </h3>
              </div>
              <button type="button" onClick={() => setShowNotificationsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={16} color="var(--text-muted)" />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Aucune notification pour le moment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '2px', marginBottom: '0.8rem' }}>
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    style={{ 
                      padding: '0.6rem 0.7rem', 
                      borderRadius: '10px', 
                      background: n.read ? 'rgba(0,0,0,0.02)' : 'var(--primary-light)', 
                      border: n.read ? '1px solid var(--border-color)' : '1px solid rgba(59, 130, 246, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', fontWeight: n.read ? 600 : 700, color: 'var(--text-primary)', paddingRight: '30px', lineHeight: '1.3' }}>
                      {n.text}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{n.date}</span>
                      
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {!n.read && (
                          <button 
                            type="button" 
                            onClick={() => markAsRead(n.id)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: 'var(--primary)', 
                              fontSize: '0.6rem', 
                              fontWeight: 700, 
                              cursor: 'pointer',
                              padding: '2px 4px'
                            }}
                          >
                            Lu
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={() => deleteNotification(n.id)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--status-late)', 
                            fontSize: '0.6rem', 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            padding: '2px 4px'
                          }}
                        >
                          Effacer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1, padding: '0.38rem', fontSize: '0.68rem', borderRadius: '8px' }}
                  onClick={markAllAsRead}
                >
                  Tout lire
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ flex: 1, padding: '0.38rem', fontSize: '0.68rem', borderRadius: '8px', background: 'var(--status-late-light)', color: 'var(--status-late)', border: 'none' }}
                  onClick={clearAllNotifications}
                >
                  Tout effacer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
