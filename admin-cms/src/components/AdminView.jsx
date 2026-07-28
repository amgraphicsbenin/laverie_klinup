import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/db';

const ModalPortal = ({ children }) => {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
};
import { countries } from '../utils/countriesData';
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
  Users,
  Shirt,
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
  UserPlus,
  ShieldCheck,
  Download,
  GripVertical
} from 'lucide-react';
import CustomSelect from './CustomSelect';

import DashboardTab from '../features/dashboard/components/DashboardTab';
import OrdersTab from '../features/orders/components/OrdersTab';
import CustomersTab from '../features/customers/components/CustomersTab';
import CatalogTab from '../features/catalog/components/CatalogTab';
import StaffTab from '../features/staff/components/StaffTab';
import LogsTab from '../features/logs/components/LogsTab';
import SettingsTab from '../features/settings/components/SettingsTab';
import StoresTab from '../features/stores/components/StoresTab';

export default function AdminView({ activeTab, onManageStaff }) {
  const currentUser = db.getCurrentUser();
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
  const [remisePourcentage, setRemisePourcentage] = useState('');
  const [payWithSubscription, setPayWithSubscription] = useState(false);
  const [subscribePlanId, setSubscribePlanId] = useState('');

  useEffect(() => {
    const cust = customers.find(c => c.id === selectedCustomerId);
    if (subscribePlanId) {
      setPayWithSubscription(true);
      setNiveauUrgence('Normal');
    } else if (cust && cust.active_subscription) {
      setPayWithSubscription(true);
      setNiveauUrgence('Normal');
    } else {
      setPayWithSubscription(false);
    }
  }, [selectedCustomerId, customers, subscribePlanId]);

  const resetOrderRegistrationForm = () => {
    setSelectedCustomerId('');
    setArticleQuantities({});
    setArticleServices({});
    setNiveauUrgence('Normal');
    setModeReglement('especes');
    setAvancePayee('');
    setRemisePourcentage('0');
    setPayWithSubscription(false);
    setSubscribePlanId('');
  };

  const handleCancelOrderRegistration = () => {
    const hasData = !!selectedCustomerId || Object.values(articleQuantities).some(q => q > 0) || !!subscribePlanId || Number(avancePayee) > 0 || Number(remisePourcentage) > 0;
    if (hasData) {
      if (window.confirm("Voulez-vous vraiment annuler la création de cette commande ? Toutes les informations saisies seront réinitialisées.")) {
        resetOrderRegistrationForm();
        setShowOrderRegistrationModal(false);
      }
    } else {
      resetOrderRegistrationForm();
      setShowOrderRegistrationModal(false);
    }
  };

  // Flow de Livraison / Paiement Final
  const [showDeliveryPaymentModal, setShowDeliveryPaymentModal] = useState(false);
  const [delivOrder, setDelivOrder] = useState(null);
  const [delivPaymentMethod, setDelivPaymentMethod] = useState('especes');
  const [delivAmountPaid, setDelivAmountPaid] = useState('');
  const [momoRefNumber, setMomoRefNumber] = useState('');
  const [momoRefError, setMomoRefError] = useState('');

  // Flow d'Annulation de Commande
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');

  // Modale de création de commande
  const [showOrderRegistrationModal, setShowOrderRegistrationModal] = useState(false);

  // Modale de détails avancés des cartes KPI du Dashboard
  const [activeDetailsCard, setActiveDetailsCard] = useState(null); // 'ca', 'completed', 'active', 'pending'
  const [kpiDateFrom, setKpiDateFrom] = useState('');
  const [kpiDateTo, setKpiDateTo] = useState('');
  const [tempKpiDateFrom, setTempKpiDateFrom] = useState('');
  const [tempKpiDateTo, setTempKpiDateTo] = useState('');

  useEffect(() => {
    if (activeDetailsCard) {
      setTempKpiDateFrom('');
      setTempKpiDateTo('');
      setKpiDateFrom('');
      setKpiDateTo('');
    }
  }, [activeDetailsCard]);

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
  const [newCustAdresse, setNewCustAdresse] = useState('');
  const [delivFinalStatus, setDelivFinalStatus] = useState('a_livrer');



  // CRM Search & Debt
  const [crmSearch, setCrmSearch] = useState('');
  const [selectedCrmCustomer, setSelectedCrmCustomer] = useState(null);
  const [showDebtPaymentModal, setShowDebtPaymentModal] = useState(false);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState('');
  const [selectedCrmSubId, setSelectedCrmSubId] = useState('');

  // États pour les Paramètres Système (Délais et Majoration)
  const [inputExpressHours, setInputExpressHours] = useState('');
  const [inputNormalHours, setInputNormalHours] = useState('');
  const [inputExpressMarkup, setInputExpressMarkup] = useState('');

  useEffect(() => {
    if (catalog.length > 0) {
      const expHours = catalog.find(item => item.id === 'setting_express_hours')?.prix;
      const normHours = catalog.find(item => item.id === 'setting_normal_hours')?.prix;
      const expMarkup = catalog.find(item => item.id === 'setting_express_markup')?.prix;

      if (expHours !== undefined) setInputExpressHours(String(expHours));
      if (normHours !== undefined) setInputNormalHours(String(normHours));
      if (expMarkup !== undefined) setInputExpressMarkup(String(expMarkup));
    }
  }, [catalog]);

  // Réinitialiser / fermer automatiquement toutes les modales ouvertes lors du changement d'onglet
  useEffect(() => {
    setShowEditCatalogModal(false);
    setShowNewStaffModal(false);
    setShowNewCustomerModal(false);
    setShowOrderRegistrationModal(false);
    setShowDeliveryPaymentModal(false);
    setShowCancelModal(false);
    setShowDebtPaymentModal(false);
    setActiveDetailsCard(null);
  }, [activeTab]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const expHours = Number(inputExpressHours);
    const normHours = Number(inputNormalHours);
    const expMarkup = Number(inputExpressMarkup);

    if (isNaN(expHours) || expHours <= 0 || isNaN(normHours) || normHours <= 0 || isNaN(expMarkup) || expMarkup < 0) {
      alert("Veuillez saisir des valeurs numériques valides.");
      return;
    }

    db.updateCatalogPrice('setting_express_hours', expHours);
    db.updateCatalogPrice('setting_normal_hours', normHours);
    db.updateCatalogPrice('setting_express_markup', expMarkup);

    db.logAction('MODIFICATION_PARAMETRES', `Délais et majorations modifiés : Express ${expHours}h (+${expMarkup}%), Normal ${normHours}h`);
    alert("Paramètres système enregistrés et synchronisés en temps réel !");
  };

  const handleSubscribeCrm = (customerId, catalogItemId) => {
    if (!catalogItemId) {
      alert("Veuillez sélectionner un forfait d'abonnement.");
      return;
    }
    const updated = db.subscribeCustomer(customerId, catalogItemId);
    if (updated) {
      refreshAdminData();
      const updatedCustomers = db.getCustomers();
      const updatedCust = updatedCustomers.find(c => c.id === customerId);
      setSelectedCrmCustomer(updatedCust);
      setSelectedCrmSubId('');
      alert(`Abonnement souscrit avec succès pour ${updatedCust.prenom} ${updatedCust.nom} !`);
    }
  };

  const handleUnsubscribeCrm = async (customerId) => {
    if (await confirm("Êtes-vous sûr de vouloir résilier cet abonnement ?")) {
      const updated = db.unsubscribeCustomer(customerId);
      if (updated) {
        refreshAdminData();
        const updatedCustomers = db.getCustomers();
        const updatedCust = updatedCustomers.find(c => c.id === customerId);
        setSelectedCrmCustomer(updatedCust);
        alert("Abonnement résilié avec succès !");
      }
    }
  };

  // Receipt Modal
  const [createdOrder, setCreatedOrder] = useState(null);

  // Category sub-tab for catalog
  const [catalogCategory, setCatalogCategory] = useState('individuel'); // 'individuel' or 'abonnement'
  const [selectedCatalogIds, setSelectedCatalogIds] = useState([]);
  const [catalogSearchText, setCatalogSearchText] = useState('');
  const [catalogServiceFilter, setCatalogServiceFilter] = useState('all');
  const [catalogPriceFilter, setCatalogPriceFilter] = useState('all');
  const [catalogSortOrder, setCatalogSortOrder] = useState('name_asc');
  const [catalogCurrentPage, setCatalogCurrentPage] = useState(1);

  // Advanced Catalog Edit Modal states
  const [showEditCatalogModal, setShowEditCatalogModal] = useState(false);
  const [editArtName, setEditArtName] = useState('');
  const [editArtPrice, setEditArtPrice] = useState('');
  const [editArtDescription, setEditArtDescription] = useState('');
  const [editArtCategory, setEditArtCategory] = useState('individuel');
  
  // Service-specific edit prices (Traitement / Repassage)
  const [editArtTraitementActive, setEditArtTraitementActive] = useState(false);
  const [editArtTraitementPrice, setEditArtTraitementPrice] = useState('');
  const [editArtTraitementUrgentPrice, setEditArtTraitementUrgentPrice] = useState('');
  const [editArtRepassageActive, setEditArtRepassageActive] = useState(false);
  const [editArtRepassagePrice, setEditArtRepassagePrice] = useState('');
  const [editArtRepassageUrgentPrice, setEditArtRepassageUrgentPrice] = useState('');

  // Service-specific add prices (Traitement / Repassage)
  const [newArtTraitementActive, setNewArtTraitementActive] = useState(true);
  const [newArtTraitementPrice, setNewArtTraitementPrice] = useState('');
  const [newArtTraitementUrgentPrice, setNewArtTraitementUrgentPrice] = useState('');
  const [newArtRepassageActive, setNewArtRepassageActive] = useState(false);
  const [newArtRepassagePrice, setNewArtRepassagePrice] = useState('');
  const [newArtRepassageUrgentPrice, setNewArtRepassageUrgentPrice] = useState('');

  // Validation errors
  const [newArtNameError, setNewArtNameError] = useState('');
  const [editArtNameError, setEditArtNameError] = useState('');

  // Subscription config states (Add Modal)
  const [newArtNombreVetements, setNewArtNombreVetements] = useState('');
  const [newArtRamassage, setNewArtRamassage] = useState(false);
  const [newArtNombreRamassages, setNewArtNombreRamassages] = useState('');
  const [newArtRamassageGratuit, setNewArtRamassageGratuit] = useState(false);
  const [newArtLivraisonGratuite, setNewArtLivraisonGratuite] = useState(false);

  // Subscription config states (Edit Modal)
  const [editArtNombreVetements, setEditArtNombreVetements] = useState('');
  const [editArtRamassage, setEditArtRamassage] = useState(false);
  const [editArtNombreRamassages, setEditArtNombreRamassages] = useState('');
  const [editArtRamassageGratuit, setEditArtRamassageGratuit] = useState(false);
  const [editArtLivraisonGratuite, setEditArtLivraisonGratuite] = useState(false);

  // Subscription advantages list states (for vertical draggable list)
  const [newArtAdvantages, setNewArtAdvantages] = useState(['']);
  const [editArtAdvantages, setEditArtAdvantages] = useState(['']);
  const [dragAllowedIndex, setDragAllowedIndex] = useState(null);

  useEffect(() => {
    setSelectedCatalogIds([]);
    setCatalogSearchText('');
    setCatalogServiceFilter('all');
    setCatalogPriceFilter('all');
    setCatalogSortOrder('name_asc');
    setCatalogCurrentPage(1);
    setNewArtNameError('');
    setEditArtNameError('');
    // reset add states
    setNewArtPrice('');
    setNewArtTraitementActive(true);
    setNewArtTraitementPrice('');
    setNewArtTraitementUrgentPrice('');
    setNewArtRepassageActive(false);
    setNewArtRepassagePrice('');
    setNewArtRepassageUrgentPrice('');
  }, [catalogCategory]);

  useEffect(() => {
    setCatalogCurrentPage(1);
  }, [catalogSearchText, catalogServiceFilter, catalogPriceFilter, catalogSortOrder]);

  const [timerSeconds, setTimerSeconds] = useState(5048); // 01:24:08 by default
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Chart period filter
  const [chartPeriod, setChartPeriod] = useState('7_days'); // '7_days', '30_days', 'all'

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

  // Staff Access management states
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [showNewStaffModal, setShowNewStaffModal] = useState(false);
  const [newStaffNom, setNewStaffNom] = useState('');
  const [newStaffPrenom, setNewStaffPrenom] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('agent_accueil');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffTel, setNewStaffTel] = useState('');
  const [newStaffStoreId, setNewStaffStoreId] = useState('');

  // Formulaire d'édition
  const [editStaffNom, setEditStaffNom] = useState('');
  const [editStaffPrenom, setEditStaffPrenom] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffTel, setEditStaffTel] = useState('');
  const [editStaffStatut, setEditStaffStatut] = useState('actif');
  const [editStaffStoreId, setEditStaffStoreId] = useState('store_central');
  const [editStaffPermissions, setEditStaffPermissions] = useState({});

  const getRoleDefaultPermissions = (role) => {
    const isSuperAdmin = role === 'super_admin';
    const isManager = role === 'manager';
    const isAccueil = role === 'agent_accueil';
    const isLivreur = role === 'livreur';
    const isAtelier = role === 'agent_lavage_repassage';

    return {
      can_view_dashboard: isSuperAdmin || isManager,
      can_manage_orders: isSuperAdmin || isManager,
      can_manage_crm: isSuperAdmin || isManager || isAccueil,
      can_edit_catalog: isSuperAdmin || isManager,
      can_manage_stores: isSuperAdmin,
      can_view_logs: isSuperAdmin,
      can_manage_staff: isSuperAdmin,

      can_access_mobile: true,
      can_create_orders_mobile: isSuperAdmin || isManager || isAccueil,
      can_manage_delivery_mobile: isSuperAdmin || isLivreur,
      can_manage_workshop_mobile: isSuperAdmin || isAtelier
    };
  };

  const selectedMember = staff.find(s => s.id === selectedStaffId) || staff[0];

  useEffect(() => {
    if (selectedMember) {
      if (!selectedStaffId) {
        setSelectedStaffId(selectedMember.id);
      }
      setEditStaffNom(selectedMember.nom || '');
      setEditStaffPrenom(selectedMember.prenom || '');
      setEditStaffRole(selectedMember.role || 'agent_accueil');
      setEditStaffEmail(selectedMember.email || `${selectedMember.prenom.toLowerCase()}.${selectedMember.nom.toLowerCase()}@klinup.com`);
      setEditStaffTel(selectedMember.telephone || '');
      setEditStaffStatut(selectedMember.statut || 'actif');
      setEditStaffStoreId(selectedMember.store_id || selectedMember.laverie_id || selectedMember.laverie || (selectedMember.role === 'super_admin' ? 'all' : ''));

      const defaultPerms = getRoleDefaultPermissions(selectedMember.role);
      setEditStaffPermissions(selectedMember.permissions || defaultPerms);
    }
  }, [selectedStaffId, staff, selectedMember]);

  const handleRoleChangeInForm = (role) => {
    setEditStaffRole(role);
    setEditStaffPermissions(getRoleDefaultPermissions(role));
  };

  const handleSaveStaff = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedStaffId) return false;

    const currentMember = (staff || []).find(s => s.id === selectedStaffId);
    const isDeactivating = (editStaffStatut === 'suspendu' || editStaffStatut === 'inactif') && (currentMember?.statut === 'actif');

    let motif = '';
    if (isDeactivating) {
      motif = window.prompt(`Désactivation du compte de "${editStaffPrenom} ${editStaffNom}".\n\nVeuillez indiquer obligatoirement le motif de la désactivation :`);
      if (!motif || !motif.trim()) {
        alert("Mise à jour annulée : Le motif de désactivation est obligatoire.");
        return false;
      }
    }

    try {
      if (motif) {
        db.logAction('SUSPENSION_PERSONNEL', `Désactivation de ${editStaffPrenom} ${editStaffNom} | Motif : ${motif.trim()}`);
      }
      await db.updateStaff(selectedStaffId, {
        nom: editStaffNom,
        prenom: editStaffPrenom,
        role: editStaffRole,
        email: editStaffEmail,
        telephone: editStaffTel,
        statut: editStaffStatut,
        store_id: editStaffStoreId,
        permissions: editStaffPermissions
      });
      alert("Profil du personnel mis à jour avec succès !");
      refreshAdminData();
      return true;
    } catch (err) {
      alert("Erreur lors de la mise à jour du profil : " + err.message);
      return false;
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffNom || !newStaffPrenom) return;
    if (!newStaffStoreId) {
      alert("Veuillez sélectionner un point de laverie d'affectation pour cet employé.");
      return;
    }

    const emailToUse = (newStaffEmail ? newStaffEmail.trim() : `${newStaffPrenom.toLowerCase().trim()}.${newStaffNom.toLowerCase().trim()}@klinup.com`).toLowerCase();
    
    // Check email uniqueness to prevent collisions
    const emailExists = (staff || []).some(s => s.email && s.email.toLowerCase() === emailToUse);
    if (emailExists) {
      alert(`L'adresse email "${emailToUse}" est déjà attribuée à un membre du personnel.`);
      return;
    }

    const defaultPerms = getRoleDefaultPermissions(newStaffRole);

    try {
      const newMember = await db.addStaff({
        nom: newStaffNom.trim(),
        prenom: newStaffPrenom.trim(),
        role: newStaffRole,
        email: emailToUse,
        telephone: newStaffTel,
        code_pin: '000000',
        store_id: newStaffStoreId,
        statut: 'actif',
        permissions: defaultPerms
      });

      setSelectedStaffId(newMember.id);
      setShowNewStaffModal(false);
      setNewStaffNom('');
      setNewStaffPrenom('');
      setNewStaffRole('agent_accueil');
      setNewStaffEmail('');
      setNewStaffTel('');
      setNewStaffStoreId('');
      refreshAdminData();
      alert(`Employé "${newMember.prenom} ${newMember.nom}" créé avec succès dans la base de données !`);
    } catch (err) {
      alert("Erreur lors de la création de l'employé : " + err.message);
    }
  };

  const handleDeleteStaff = async (id) => {
    const staffMember = (staff || []).find(s => s.id === id);
    const staffName = staffMember ? `${staffMember.prenom} ${staffMember.nom}` : "cet employé";

    const motif = window.prompt(`Suppression définitive du compte "${staffName}".\n\nVeuillez indiquer obligatoirement le motif de la suppression :`);
    if (!motif || !motif.trim()) {
      alert("Suppression annulée : Le motif de suppression est obligatoire.");
      return;
    }

    try {
      db.logAction('SUPPRESSION_PERSONNEL', `Suppression définitive de ${staffName} | Motif : ${motif.trim()}`);
      await db.deleteStaff(id);
      setSelectedStaffId('');
      refreshAdminData();
      alert(`Compte "${staffName}" supprimé avec succès de la base de données !`);
    } catch (err) {
      alert("Erreur lors de la suppression de l'employé : " + err.message);
    }
  };

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

  const statusDisplayLabels = {
    en_attente: 'En attente',
    traitement: 'Traitement',
    en_cours_lavage: 'Lavage',
    en_cours_repassage: 'Repassage',
    pret: 'Prêt',
    a_recuperer: 'À récupérer',
    a_livrer: 'À livrer',
    en_cours_livraison: 'En livraison',
    restitue: 'Récupéré / Livré',
    annule: 'Annulé'
  };

  const getOrderStatusLabel = (order) => {
    if (!order) return '';
    if (order.statut === 'restitue') {
      const type = order.subscription_details?.type_livraison || (order.mode_reglement === 'livraison' ? 'livraison' : 'recuperation');
      return type === 'recuperation' ? 'Récupéré' : 'Livré';
    }
    return statusDisplayLabels[order.statut] || order.statut;
  };

  const serviceLabels = {
    lavage_simple: 'Traitement',
    nettoyage_a_sec: 'Nettoyage à sec',
    repassage: 'Repassage',
    abonnement: 'Abonnement'
  };

  // --- DATE FILTER HELPER FOR KPI PANELS ---
  const filterOrdersByKpiDate = (ordersList) => {
    if (!kpiDateFrom && !kpiDateTo) return ordersList;
    const from = kpiDateFrom ? new Date(kpiDateFrom + 'T00:00:00') : null;
    const to = kpiDateTo ? new Date(kpiDateTo + 'T23:59:59') : null;
    return ordersList.filter(o => {
      const d = new Date(o.created_at);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  };

  // --- EXPORT KPI VERS EXCEL (CSV BOM UTF-8) ---
  const exportKpiToExcel = () => {
    const timestamp = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    let filename = '';
    let headers = [];
    let rows = [];

    const filteredForExport = filterOrdersByKpiDate(orders);
    const filteredNonCancelled = filteredForExport.filter(o => o.statut !== 'annule');
    const filteredRevenue = filteredNonCancelled.reduce((sum, o) => sum + o.prix_total, 0);
    const dateRangeLabel = kpiDateFrom || kpiDateTo
      ? ` (${kpiDateFrom || '...'} au ${kpiDateTo || '...'})` : '';

    if (activeDetailsCard === 'ca') {
      filename = `KPI_Chiffre_Affaires_${timestamp}.csv`;
      const totalDebt = customers.reduce((sum, c) => sum + Number(c.solde_dette || 0), 0);
      headers = ['Indicateur', 'Valeur'];
      rows = [
        [`Période filtrée${dateRangeLabel}`, ''],
        ['Revenu Filtré (F CFA)', filteredRevenue],
        ['Encours Dette Clients (F CFA)', totalDebt],
        [''],
        ['Service', 'Montant (F CFA)', 'Part (%)'],
        ...Object.entries({ lavage_simple: 0, nettoyage_a_sec: 0, repassage: 0, abonnement: 0, autre: 0 }).map(([svc]) => {
          let amount = 0;
          filteredNonCancelled.forEach(o => {
            const s = o.type_service || 'autre';
            if (s === svc) amount += o.prix_total;
          });
          const pct = filteredRevenue > 0 ? ((amount / filteredRevenue) * 100).toFixed(1) : 0;
          return [serviceLabels[svc] || svc, amount, pct];
        }),
        [''],
        ['--- Transactions (période filtrée) ---'],
        ['Date', 'Code', 'Client', 'Article', 'Service', 'Total (F)', 'Avance (F)', 'Mode Règlement'],
        ...filteredForExport.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(o => {
          const c = customers.find(x => x.id === o.customer_id);
          return [
            new Date(o.created_at).toLocaleDateString('fr-FR'),
            o.identifiant_unique_marquage,
            c ? `${c.prenom} ${c.nom}` : 'Client B2B',
            o.type_article,
            serviceLabels[o.type_service] || o.type_service,
            o.prix_total,
            o.avance_payee,
            o.mode_reglement
          ];
        })
      ];
      rows = [headers, ...rows.slice(1)];
      rows[0] = headers;

    } else if (activeDetailsCard === 'completed') {
      filename = `KPI_Commandes_Livrees_${timestamp}.csv`;
      const completedOrders = filteredForExport.filter(o => o.statut === 'restitue');
      headers = ['Code', 'Client', 'Téléphone', 'Article', 'Service', 'Urgence', 'Montant (F CFA)', 'Avance (F CFA)', 'Date Dépôt'];
      rows = completedOrders.map(o => {
        const c = customers.find(x => x.id === o.customer_id);
        return [
          o.identifiant_unique_marquage,
          c ? `${c.prenom} ${c.nom}` : 'Client B2B',
          c ? c.telephone : '',
          o.type_article,
          serviceLabels[o.type_service] || o.type_service,
          o.niveau_urgence || 'Normal',
          o.prix_total,
          o.avance_payee,
          new Date(o.created_at).toLocaleDateString('fr-FR')
        ];
      });

    } else if (activeDetailsCard === 'active') {
      filename = `KPI_Commandes_Actives_${timestamp}.csv`;
      const activeOrders = filteredForExport.filter(o => o.statut !== 'restitue' && o.statut !== 'annule');
      headers = ['Code', 'Client', 'Téléphone', 'Article', 'Service', 'Urgence', 'Statut', 'Montant (F CFA)', 'Avance (F CFA)', 'Date Dépôt'];
      rows = activeOrders.map(o => {
        const c = customers.find(x => x.id === o.customer_id);
        return [
          o.identifiant_unique_marquage,
          c ? `${c.prenom} ${c.nom}` : 'Client B2B',
          c ? c.telephone : '',
          o.type_article,
          serviceLabels[o.type_service] || o.type_service,
          o.niveau_urgence || 'Normal',
          getOrderStatusLabel(o),
          o.prix_total,
          o.avance_payee,
          new Date(o.created_at).toLocaleDateString('fr-FR')
        ];
      });

    } else if (activeDetailsCard === 'pending') {
      filename = `KPI_Commandes_En_Attente_${timestamp}.csv`;
      const pendingOrders = filteredForExport.filter(o => o.statut === 'en_attente');
      headers = ['Code', 'Client', 'Téléphone', 'Article', 'Service', 'Urgence', 'Montant (F CFA)', 'Date Dépôt'];
      rows = pendingOrders.map(o => {
        const c = customers.find(x => x.id === o.customer_id);
        return [
          o.identifiant_unique_marquage,
          c ? `${c.prenom} ${c.nom}` : 'Client B2B',
          c ? c.telephone : '',
          o.type_article,
          serviceLabels[o.type_service] || o.type_service,
          o.niveau_urgence || 'Normal',
          o.prix_total,
          new Date(o.created_at).toLocaleDateString('fr-FR')
        ];
      });
    }

    // Build CSV content with UTF-8 BOM (for correct Excel French accent rendering)
    const escape = (val) => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csvRows = [headers, ...rows].map(r => Array.isArray(r) ? r.map(escape).join(',') : escape(r));
    const csvContent = '\uFEFF' + csvRows.join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderCAReport = (filteredOrders) => {
    const totalDebt = customers.reduce((sum, c) => sum + Number(c.solde_dette || 0), 0);
    const filteredNonCancelled = filteredOrders.filter(o => o.statut !== 'annule');
    const filteredRevenue = filteredNonCancelled.reduce((sum, o) => sum + o.prix_total, 0);

    // Revenue breakdown by type_service
    const revenueByService = {
      lavage_simple: 0,
      nettoyage_a_sec: 0,
      repassage: 0,
      abonnement: 0,
      autre: 0
    };

    filteredNonCancelled.forEach(o => {
      const svc = o.type_service || 'autre';
      if (revenueByService[svc] !== undefined) {
        revenueByService[svc] += o.prix_total;
      } else {
        revenueByService['autre'] += o.prix_total;
      }
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem', background: 'var(--primary-light)', border: '1px solid rgba(59, 130, 246, 0.2)', transition: 'none', transform: 'none', boxShadow: 'none' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Revenu (période filtrée)</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.2rem 0 0', color: 'var(--secondary)' }}>{filteredRevenue.toLocaleString()} F CFA</h3>
            {(kpiDateFrom || kpiDateTo) && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{filteredNonCancelled.length} commandes</span>}
          </div>
          <div className="card" style={{ padding: '1rem', background: 'var(--accent-light)', border: '1px solid rgba(217, 70, 239, 0.2)', transition: 'none', transform: 'none', boxShadow: 'none' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Encours Dette Clients</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.2rem 0 0', color: 'var(--accent)' }}>{totalDebt.toLocaleString()} F CFA</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'none', transform: 'none', boxShadow: 'none' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Répartition par type de service</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(revenueByService).map(([svcKey, amount]) => {
              const label = serviceLabels[svcKey] || svcKey;
              const percentage = filteredRevenue > 0 ? ((amount / filteredRevenue) * 100).toFixed(1) : 0;
              return (
                <div key={svcKey} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span>{label}</span>
                    <span>{amount.toLocaleString()} F ({percentage}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percentage}%`, background: 'var(--primary)', borderRadius: '3px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'none', transform: 'none', boxShadow: 'none' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Transactions ({filteredOrders.length} résultats)</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Article / Service</th>
                  <th>Total</th>
                  <th>Avance</th>
                  <th>Règlement</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(o => {
                  const customer = customers.find(c => c.id === o.customer_id);
                  const clientName = customer ? `${customer.prenom} ${customer.nom}` : 'Client B2B';
                  return (
                    <tr key={o.id}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                      <td>{clientName}</td>
                      <td>{o.type_article} ({serviceLabels[o.type_service] || o.type_service})</td>
                      <td style={{ fontWeight: 700 }}>{o.prix_total.toLocaleString()} F</td>
                      <td>{o.avance_payee.toLocaleString()} F</td>
                      <td>
                        <span className="badge badge-restitue" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          {o.mode_reglement}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- Completed orders list content ---
  const renderCompletedOrdersList = (filteredOrders) => {
    const completedOrders = filteredOrders.filter(o => o.statut === 'restitue');
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Client</th>
              <th>Article</th>
              <th>Service</th>
              <th>Urgence</th>
              <th>Montant</th>
              <th>Date de Dépôt</th>
            </tr>
          </thead>
          <tbody>
            {completedOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucune commande livrée pour la période sélectionnée.</td>
              </tr>
            ) : (
              completedOrders.map(o => {
                const customer = customers.find(c => c.id === o.customer_id);
                const clientName = customer ? `${customer.prenom} ${customer.nom}` : 'Client B2B';
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{o.identifiant_unique_marquage}</td>
                    <td>{clientName}</td>
                    <td>{o.type_article}</td>
                    <td>{serviceLabels[o.type_service] || o.type_service}</td>
                    <td><span className="badge" style={{ background: o.niveau_urgence === 'Express' ? 'var(--status-late-light)' : 'var(--primary-light)', color: o.niveau_urgence === 'Express' ? 'var(--status-late)' : 'var(--primary)' }}>{o.niveau_urgence || 'Normal'}</span></td>
                    <td style={{ fontWeight: 700 }}>{o.prix_total.toLocaleString()} F</td>
                    <td>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Active orders list content ---
  const renderActiveOrdersList = (filteredOrders) => {
    const activeOrders = filteredOrders.filter(o => o.statut !== 'restitue' && o.statut !== 'annule');
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Client</th>
              <th>Article</th>
              <th>Urgence</th>
              <th>Statut</th>
              <th>Montant</th>
              <th>Date de Dépôt</th>
            </tr>
          </thead>
          <tbody>
            {activeOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucune commande active pour la période sélectionnée.</td>
              </tr>
            ) : (
              activeOrders.map(o => {
                const customer = customers.find(c => c.id === o.customer_id);
                const clientName = customer ? `${customer.prenom} ${customer.nom}` : 'Client B2B';
                const badgeClass = `badge badge-${o.statut}`;
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{o.identifiant_unique_marquage}</td>
                    <td>{clientName}</td>
                    <td>{o.type_article}</td>
                    <td>
                      <span className="badge" style={{
                        background: o.niveau_urgence === 'Express' ? 'var(--status-late-light)' : 'var(--primary-light)',
                        color: o.niveau_urgence === 'Express' ? 'var(--status-late)' : 'var(--primary)'
                      }}>
                        {o.niveau_urgence}
                      </span>
                    </td>
                    <td>
                      <span className={badgeClass}>
                        {getOrderStatusLabel(o)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{o.prix_total.toLocaleString()} F</td>
                    <td>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Pending orders list content ---
  const renderPendingOrdersList = (filteredOrders) => {
    const pendingOrders = filteredOrders.filter(o => o.statut === 'en_attente');
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Client</th>
              <th>Article</th>
              <th>Urgence</th>
              <th>Montant</th>
              <th>Date de Dépôt</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucune commande en attente pour la période sélectionnée.</td>
              </tr>
            ) : (
              pendingOrders.map(o => {
                const customer = customers.find(c => c.id === o.customer_id);
                const clientName = customer ? `${customer.prenom} ${customer.nom}` : 'Client B2B';
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{o.identifiant_unique_marquage}</td>
                    <td>{clientName}</td>
                    <td>{o.type_article}</td>
                    <td><span className="badge" style={{ background: o.niveau_urgence === 'Express' ? 'var(--status-late-light)' : 'var(--primary-light)', color: o.niveau_urgence === 'Express' ? 'var(--status-late)' : 'var(--primary)' }}>{o.niveau_urgence || 'Normal'}</span></td>
                    <td style={{ fontWeight: 700 }}>{o.prix_total.toLocaleString()} F</td>
                    <td>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', borderRadius: '6px' }}
                        onClick={() => {
                          db.updateOrderStatus(o.id, 'en_cours_lavage');
                          refreshAdminData();
                        }}
                      >
                        Démarrer Lavage
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // --- CALCUL DU RESTITUTION RATE DYNAMIQUE ---
  const restitutionRate = totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 0;
  const strokeDashoffset = 188.5 - (restitutionRate / 100) * 188.5;

  // --- STATISTIQUES SUPPLÉMENTAIRES (KPI LAVERIE) ---
  const nonCancelledOrdersCount = nonCancelledOrders.length;
  const averageOrderValue = nonCancelledOrdersCount > 0 ? Math.round(earnedRevenue / nonCancelledOrdersCount) : 0;
  const activeSubscriptionsCount = customers.filter(c => c.active_subscription).length;

  const serviceCounts = {};
  nonCancelledOrders.forEach(o => {
    const svc = o.type_service || 'autre';
    serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
  });
  let mostPopularService = 'Aucun';
  let maxCount = 0;
  Object.entries(serviceCounts).forEach(([svc, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostPopularService = serviceLabels[svc] || svc;
    }
  });

  // --- CALCUL DU CHART METIER (VOLUME DE LINGE TRAITÉ DYNAMIQUE) ---
  let daysOfWeek = [];
  let baseLavage = [0, 0, 0, 0, 0, 0, 0];
  let baseRepassage = [0, 0, 0, 0, 0, 0, 0];

  const now = new Date();

  // Helper to count articles in an order
  const getOrderClothesCount = (order) => {
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items.reduce((sum, item) => sum + Number(item.quantite || item.quantity || 1), 0);
    }
    if (Array.isArray(order.detail_articles) && order.detail_articles.length > 0) {
      return order.detail_articles.reduce((sum, item) => sum + Number(item.quantite || item.quantity || 1), 0);
    }
    return 1;
  };

  if (chartPeriod === '7_days') {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    baseLavage = [0, 0, 0, 0, 0, 0, 0];
    baseRepassage = [0, 0, 0, 0, 0, 0, 0];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = i === 0 ? "Auj." : `${dayNames[d.getDay()]} ${d.getDate()}`;
      daysOfWeek.push(label);
    }

    orders.forEach(o => {
      const orderDate = new Date(o.created_at || Date.now());
      const diffTime = now - orderDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays < 7) {
        const idx = 6 - diffDays;
        const count = getOrderClothesCount(o);
        if (o.type_service === 'lavage_simple' || o.type_service === 'nettoyage_a_sec') {
          baseLavage[idx] += count;
        } else if (o.type_service === 'repassage') {
          baseRepassage[idx] += count;
        }
      }
    });

  } else if (chartPeriod === '30_days') {
    daysOfWeek = ['J-30', 'J-25', 'J-20', 'J-15', 'J-10', 'J-5', 'Auj.'];
    baseLavage = [0, 0, 0, 0, 0, 0, 0];
    baseRepassage = [0, 0, 0, 0, 0, 0, 0];

    orders.forEach(o => {
      const orderDate = new Date(o.created_at || Date.now());
      const diffTime = now - orderDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays < 30) {
        const idx = 6 - Math.floor(diffDays / 5);
        const count = getOrderClothesCount(o);
        if (o.type_service === 'lavage_simple' || o.type_service === 'nettoyage_a_sec') {
          baseLavage[idx] += count;
        } else if (o.type_service === 'repassage') {
          baseRepassage[idx] += count;
        }
      }
    });

  } else {
    const monthNames = ['Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    baseLavage = [0, 0, 0, 0, 0, 0, 0];
    baseRepassage = [0, 0, 0, 0, 0, 0, 0];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      daysOfWeek.push(monthNames[d.getMonth()]);
    }

    orders.forEach(o => {
      const orderDate = new Date(o.created_at || Date.now());
      const diffMonths = (now.getFullYear() - orderDate.getFullYear()) * 12 + (now.getMonth() - orderDate.getMonth());
      
      if (diffMonths >= 0 && diffMonths < 7) {
        const idx = 6 - diffMonths;
        const count = getOrderClothesCount(o);
        if (o.type_service === 'lavage_simple' || o.type_service === 'nettoyage_a_sec') {
          baseLavage[idx] += count;
        } else if (o.type_service === 'repassage') {
          baseRepassage[idx] += count;
        }
      }
    });
  }

  // --- FILTRES CATALOGUE ---
  const getGroupedCatalog = () => {
    const rawGroupedCatalog = [];
    const groups = {};

    catalog.forEach(item => {
      if (!item || !item.article) return;
      if (item.categorie === 'individuel') {
        const articleKey = item.article.trim().toLowerCase();
        if (!groups[articleKey]) {
          groups[articleKey] = {
            id: item.id,
            article: item.article,
            categorie: 'individuel',
            traitement: null,
            repassage: null,
            allIds: [],
            is_active: false
          };
        }
        groups[articleKey].allIds.push(item.id);
        if (item.is_active !== false && item.statut !== 'inactif') {
          groups[articleKey].is_active = true;
        }
        if (item.service === 'lavage_simple') {
          groups[articleKey].traitement = {
            id: item.id,
            prix: item.prix,
            prix_urgent: item.prix_urgent || Math.round(item.prix * 1.5)
          };
        } else if (item.service === 'repassage') {
          groups[articleKey].repassage = {
            id: item.id,
            prix: item.prix,
            prix_urgent: item.prix_urgent || Math.round(item.prix * 1.5)
          };
        }
      } else if (item.categorie === 'abonnement' && catalogCategory === 'abonnement') {
        rawGroupedCatalog.push(item);
      }
    });

    if (catalogCategory === 'individuel') {
      Object.values(groups).forEach(g => {
        rawGroupedCatalog.push(g);
      });
    }

    return rawGroupedCatalog.filter(item => {
      if (!item) return false;
      // Search query
      const activeSearch = catalogSearchText;
      if (activeSearch) {
        const q = activeSearch.toLowerCase();
        const matchName = item.article ? item.article.toLowerCase().includes(q) : false;
        const matchDesc = item.description ? item.description.toLowerCase().includes(q) : false;
        return matchName || matchDesc;
      }
      
      // Service filter for clothes
      if (catalogCategory === 'individuel') {
        if (catalogServiceFilter === 'lavage_simple' && !item.traitement) return false;
        if (catalogServiceFilter === 'repassage' && !item.repassage) return false;
        
        // Price range filter
        if (catalogPriceFilter !== 'all') {
          const prices = [];
          if (item.traitement) prices.push(item.traitement.prix);
          if (item.repassage) prices.push(item.repassage.prix);
          if (prices.length === 0) return false;
          
          const matchesRange = prices.some(p => {
            if (catalogPriceFilter === 'low') return p < 1500;
            if (catalogPriceFilter === 'medium') return p >= 1500 && p <= 3000;
            if (catalogPriceFilter === 'high') return p > 3000;
            return true;
          });
          if (!matchesRange) return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const artA = a?.article || '';
      const artB = b?.article || '';
      if (catalogSortOrder === 'name_asc') return artA.localeCompare(artB);
      if (catalogSortOrder === 'name_desc') return artB.localeCompare(artA);
      if (catalogSortOrder === 'price_asc') {
        const priceA = a.categorie === 'abonnement' ? a.prix : Math.min(a.traitement?.prix || Infinity, a.repassage?.prix || Infinity);
        const priceB = b.categorie === 'abonnement' ? b.prix : Math.min(b.traitement?.prix || Infinity, b.repassage?.prix || Infinity);
        return priceA - priceB;
      }
      if (catalogSortOrder === 'price_desc') {
        const priceA = a.categorie === 'abonnement' ? a.prix : Math.max(a.traitement?.prix || 0, a.repassage?.prix || 0);
        const priceB = b.categorie === 'abonnement' ? b.prix : Math.max(b.traitement?.prix || 0, b.repassage?.prix || 0);
        return priceB - priceA;
      }
      return 0;
    });
  };

  const filteredCatalog = getGroupedCatalog();

  // --- FILTRES LOGS ---
  const filteredLogs = logs.filter(log => {
    if (logFilterAction !== 'all' && log.action !== logFilterAction) return false;

    const activeSearch = logSearchText;
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

  // --- GESTION DES AVANTAGES (LISTE VERTICALE ET DRAG & DROP) ---
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex, isEdit) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    if (isEdit) {
      setEditArtAdvantages(prev => {
        const next = [...prev];
        const [movedItem] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, movedItem);
        return next;
      });
    } else {
      setNewArtAdvantages(prev => {
        const next = [...prev];
        const [movedItem] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, movedItem);
        return next;
      });
    }
    setDragAllowedIndex(null);
  };

  const handleUpdateAdvantage = (idx, value, isEdit) => {
    if (isEdit) {
      setEditArtAdvantages(prev => {
        const next = [...prev];
        next[idx] = value;
        return next;
      });
    } else {
      setNewArtAdvantages(prev => {
        const next = [...prev];
        next[idx] = value;
        return next;
      });
    }
  };

  const handleAddAdvantageField = (isEdit) => {
    if (isEdit) {
      setEditArtAdvantages(prev => [...prev, '']);
    } else {
      setNewArtAdvantages(prev => [...prev, '']);
    }
  };

  const handleDeleteAdvantageField = (idx, isEdit) => {
    if (isEdit) {
      setEditArtAdvantages(prev => {
        if (prev.length <= 1) return [''];
        return prev.filter((_, i) => i !== idx);
      });
    } else {
      setNewArtAdvantages(prev => {
        if (prev.length <= 1) return [''];
        return prev.filter((_, i) => i !== idx);
      });
    }
  };

  // --- ACTIONS CATALOGUE ---
  const handleStartEditPrice = (item) => {
    setEditingItem(item);
    setEditingPrice(item.prix.toString());
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!editingItem || !editingPrice) return;

    try {
      await db.updateCatalogPrice(editingItem.id, Number(editingPrice));
      setEditingItem(null);
      refreshAdminData();
      alert("Prix mis à jour avec succès dans la base de données !");
    } catch (err) {
      alert("Erreur lors de la mise à jour du prix : " + err.message);
    }
  };

  const handleStartEditProduct = (groupedItem) => {
    setEditingItem(groupedItem);
    setEditArtName(groupedItem.article);
    setEditArtDescription(groupedItem.description || '');
    
    // Parse description for vertical draggable list
    const desc = groupedItem.description || '';
    const initialAdvantages = desc.split('|').map(s => s.trim()).filter(Boolean);
    setEditArtAdvantages(initialAdvantages.length > 0 ? initialAdvantages : ['']);

    setEditArtCategory(groupedItem.categorie || 'individuel');
    setEditArtNameError('');

    if (groupedItem.categorie === 'individuel') {
      // Set Traitement values
      if (groupedItem.traitement) {
        setEditArtTraitementActive(true);
        setEditArtTraitementPrice(groupedItem.traitement.prix.toString());
        setEditArtTraitementUrgentPrice(groupedItem.traitement.prix_urgent.toString());
      } else {
        setEditArtTraitementActive(false);
        setEditArtTraitementPrice('');
        setEditArtTraitementUrgentPrice('');
      }
      // Set Repassage values
      if (groupedItem.repassage) {
        setEditArtRepassageActive(true);
        setEditArtRepassagePrice(groupedItem.repassage.prix.toString());
        setEditArtRepassageUrgentPrice(groupedItem.repassage.prix_urgent.toString());
      } else {
        setEditArtRepassageActive(false);
        setEditArtRepassagePrice('');
        setEditArtRepassageUrgentPrice('');
      }
    } else {
      // Subscription case
      setEditArtPrice(groupedItem.prix.toString());
      setEditArtNombreVetements(groupedItem.nombre_vetements !== undefined && groupedItem.nombre_vetements !== null ? groupedItem.nombre_vetements.toString() : '');
      setEditArtRamassage(!!groupedItem.ramassage);
      setEditArtNombreRamassages(groupedItem.nombre_ramassages !== undefined && groupedItem.nombre_ramassages !== null ? groupedItem.nombre_ramassages.toString() : '');
      setEditArtRamassageGratuit(!!groupedItem.ramassage_gratuit);
      setEditArtLivraisonGratuite(!!groupedItem.livraison_gratuite);
    }
    setShowEditCatalogModal(true);
  };

  const handleSaveProductAdvanced = async (e) => {
    e.preventDefault();
    if (!editingItem || !editArtName) return;

    if (editArtCategory === 'individuel') {
      if (!editArtTraitementActive && !editArtRepassageActive) {
        alert("Veuillez sélectionner au moins un service (Traitement ou Repassage) pour cet article.");
        return;
      }
      if (editArtTraitementActive && (!editArtTraitementPrice || !editArtTraitementUrgentPrice)) {
        alert("Veuillez saisir les tarifs de traitement.");
        return;
      }
      if (editArtRepassageActive && (!editArtRepassagePrice || !editArtRepassageUrgentPrice)) {
        alert("Veuillez saisir les tarifs de repassage.");
        return;
      }
    } else {
      if (!editArtPrice) return;
    }

    // Check unique name constraint (excluding current item records)
    const nameExists = catalog.some(
      item => item && item.article && !editingItem.allIds?.includes(item.id) && item.id !== editingItem.id && item.article.trim().toLowerCase() === editArtName.trim().toLowerCase()
    );
    if (nameExists) {
      setEditArtNameError(`Le produit "${editArtName}" existe déjà. Chaque nom de produit doit être unique.`);
      return;
    }

    try {
      if (editArtCategory === 'individuel') {
        // Traitement
        if (editArtTraitementActive) {
          if (editingItem.traitement) {
            await db.updateCatalogItem(editingItem.traitement.id, {
              article: editArtName.trim(),
              service: 'lavage_simple',
              prix: Number(editArtTraitementPrice),
              prix_urgent: Number(editArtTraitementUrgentPrice),
              description: ''
            });
          } else {
            await db.addCatalogItem(
              editArtName.trim(),
              'lavage_simple',
              Number(editArtTraitementPrice),
              'individuel',
              '',
              Number(editArtTraitementUrgentPrice)
            );
          }
        } else {
          if (editingItem.traitement) {
            await db.deleteCatalogItem(editingItem.traitement.id);
          }
        }

        // Repassage
        if (editArtRepassageActive) {
          if (editingItem.repassage) {
            await db.updateCatalogItem(editingItem.repassage.id, {
              article: editArtName.trim(),
              service: 'repassage',
              prix: Number(editArtRepassagePrice),
              prix_urgent: Number(editArtRepassageUrgentPrice),
              description: ''
            });
          } else {
            await db.addCatalogItem(
              editArtName.trim(),
              'repassage',
              Number(editArtRepassagePrice),
              'individuel',
              '',
              Number(editArtRepassageUrgentPrice)
            );
          }
        } else {
          if (editingItem.repassage) {
            await db.deleteCatalogItem(editingItem.repassage.id);
          }
        }
      } else {
        // Subscription case
        const finalDescription = editArtAdvantages.map(a => a.trim()).filter(Boolean).join(' | ');
        await db.updateCatalogItem(editingItem.id, {
          article: editArtName.trim(),
          service: 'abonnement',
          prix: Number(editArtPrice),
          description: finalDescription,
          nombre_vetements: editArtNombreVetements ? Number(editArtNombreVetements) : null,
          ramassage: editArtRamassage,
          nombre_ramassages: editArtRamassage && editArtNombreRamassages ? Number(editArtNombreRamassages) : null,
          ramassage_gratuit: editArtRamassage ? editArtRamassageGratuit : false,
          livraison_gratuite: editArtLivraisonGratuite
        });
      }

      setEditingItem(null);
      setShowEditCatalogModal(false);
      setEditArtName('');
      setEditArtPrice('');
      setEditArtDescription('');
      setEditArtAdvantages(['']);
      setEditArtNombreVetements('');
      setEditArtRamassage(false);
      setEditArtNombreRamassages('');
      setEditArtRamassageGratuit(false);
      setEditArtLivraisonGratuite(false);
      setEditArtNameError('');
      refreshAdminData();
      alert("Produit mis à jour avec succès dans la base de données !");
    } catch (err) {
      alert("Erreur lors de l'enregistrement du produit : " + err.message);
    }
  };

  const handleToggleCatalogItemActive = async (groupedItem) => {
    try {
      await db.toggleCatalogItemActive(groupedItem.article || groupedItem.id);
      refreshAdminData();
    } catch (err) {
      alert("Erreur de modification du statut : " + err.message);
    }
  };

  const handleDeleteCatalogItem = async (groupedItem) => {
    const name = groupedItem.article;
    const idsToDelete = groupedItem.allIds || [groupedItem.id];
    if (await confirm(`Voulez-vous vraiment supprimer l'article "${name}" du catalogue ?`)) {
      try {
        await db.deleteCatalogItemsBatch(idsToDelete);
        setSelectedCatalogIds(prev => prev.filter(x => x !== groupedItem.id));
        refreshAdminData();
        alert(`Article "${name}" supprimé avec succès de la base de données.`);
      } catch (err) {
        alert("Erreur lors de la suppression : " + err.message);
      }
    }
  };

  const handleDeleteCatalogItemsBatch = async () => {
    if (selectedCatalogIds.length === 0) return;
    if (await confirm(`Voulez-vous vraiment supprimer ces ${selectedCatalogIds.length} articles sélectionnés du catalogue ?`)) {
      const idsToDelete = [];
      selectedCatalogIds.forEach(id => {
        const groupedItem = filteredCatalog.find(item => item.id === id);
        if (groupedItem) {
          if (groupedItem.allIds) {
            idsToDelete.push(...groupedItem.allIds);
          } else {
            idsToDelete.push(groupedItem.id);
          }
        }
      });
      try {
        await db.deleteCatalogItemsBatch(idsToDelete);
        setSelectedCatalogIds([]);
        refreshAdminData();
        alert("Articles supprimés avec succès de la base de données.");
      } catch (err) {
        alert("Erreur lors de la suppression des articles : " + err.message);
      }
    }
  };

  const handleAddCatalogItem = async (e) => {
    e.preventDefault();
    if (!newArtName) return;

    if (newArtCategory === 'individuel') {
      if (!newArtTraitementActive && !newArtRepassageActive) {
        alert("Veuillez sélectionner au moins un service (Traitement ou Repassage) pour cet article.");
        return;
      }
      if (newArtTraitementActive && (!newArtTraitementPrice || !newArtTraitementUrgentPrice)) {
        alert("Veuillez saisir les tarifs de traitement.");
        return;
      }
      if (newArtRepassageActive && (!newArtRepassagePrice || !newArtRepassageUrgentPrice)) {
        alert("Veuillez saisir les tarifs de repassage.");
        return;
      }
    } else {
      if (!newArtPrice) return;
    }

    // Check unique name constraint
    const nameExists = catalog.some(
      item => item && item.article && item.article.trim().toLowerCase() === newArtName.trim().toLowerCase()
    );
    if (nameExists) {
      setNewArtNameError(`Le produit "${newArtName}" existe déjà. Chaque nom de produit doit être unique.`);
      return;
    }

    try {
      if (newArtCategory === 'individuel') {
        if (newArtTraitementActive) {
          await db.addCatalogItem(
            newArtName.trim(),
            'lavage_simple',
            Number(newArtTraitementPrice),
            'individuel',
            '',
            Number(newArtTraitementUrgentPrice)
          );
        }
        if (newArtRepassageActive) {
          await db.addCatalogItem(
            newArtName.trim(),
            'repassage',
            Number(newArtRepassagePrice),
            'individuel',
            '',
            Number(newArtRepassageUrgentPrice)
          );
        }
      } else {
        const finalDescription = newArtAdvantages.map(a => a.trim()).filter(Boolean).join(' | ');
        await db.addCatalogItem(
          newArtName.trim(),
          'abonnement',
          Number(newArtPrice),
          newArtCategory,
          finalDescription,
          null, // prix_urgent
          newArtNombreVetements ? Number(newArtNombreVetements) : null,
          newArtRamassage,
          newArtRamassage && newArtNombreRamassages ? Number(newArtNombreRamassages) : null,
          newArtRamassage ? newArtRamassageGratuit : false,
          newArtLivraisonGratuite
        );
      }

      refreshAdminData();
      setShowAddCatalogModal(false);
      setNewArtName('');
      setNewArtPrice('');
      setNewArtDescription('');
      setNewArtAdvantages(['']);
      setNewArtNombreVetements('');
      setNewArtRamassage(false);
      setNewArtNombreRamassages('');
      setNewArtRamassageGratuit(false);
      setNewArtLivraisonGratuite(false);
      setNewArtNameError('');
      alert(`Produit "${newArtName.trim()}" créé avec succès dans la base de données !`);
    } catch (err) {
      alert("Erreur lors de la création du produit : " + err.message);
    }
  };

  const renderArrowBtn = () => (
    <button className="kpi-arrow-btn" type="button">
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

  const getAssetIcon = (itemName) => {
    const name = (itemName || '').toLowerCase();
    if (name.includes('chemise') || name.includes('polo') || name.includes('haut')) return <Sparkles size={14} color="var(--primary)" />;
    if (name.includes('pantalon') || name.includes('jeans') || name.includes('culotte') || name.includes('jupe')) return <Layers size={14} color="var(--primary)" />;
    if (name.includes('robe') || name.includes('costume') || name.includes('veste')) return <Award size={14} color="var(--primary)" />;
    if (name.includes('couette') || name.includes('drap') || name.includes('serviette') || name.includes('rideau')) return <Zap size={14} color="var(--primary)" />;
    return <ShoppingBag size={14} color="var(--primary)" />;
  };

  const getDynamicSku = (item) => {
    if (item.sku) return item.sku;
    const artCode = (item.article || 'ART').trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const srvCode = (item.service || 'SRV').trim() === 'lavage_simple' ? 'LAV' :
                    (item.service || 'SRV').trim() === 'repassage' ? 'REP' :
                    (item.service || 'SRV').trim() === 'nettoyage_a_sec' ? 'SEC' : 'GEN';
    const idSuffix = item.id ? item.id.substring(item.id.indexOf('_') + 1).toUpperCase().substring(0, 4) : '0000';
    return `KLIN-${artCode}-${srvCode}-${idSuffix}`;
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
    if (!phone) return;
    const formattedPhone = formatPhoneForWhatsApp(phone, indicatif);
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const isOrderLate = (order) => {
    if (order.statut === 'restitue' || order.statut === 'annule') return false;
    return new Date(order.due_date) < new Date();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Informations copiées dans le presse-papier !");
    }).catch(err => {
      console.error("Clipboard copy failed: ", err);
    });
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

  const getTotalClothesCount = () => {
    let total = 0;
    Object.keys(articleQuantities).forEach(cloth => {
      total += articleQuantities[cloth] || 0;
    });
    return total;
  };

  const getBasePrice = () => {
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

  const getCalculatedPrice = () => {
    const base = getBasePrice();
    const discountPercent = Number(remisePourcentage || 0);
    if (discountPercent > 0 && discountPercent <= 100) {
      const discountAmount = Math.round(base * (discountPercent / 100));
      return Math.max(0, base - discountAmount);
    }
    return base;
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustNom || !newCustPrenom || !newCustTel || !newCustAdresse) return;

    try {
      const newCustomer = await db.addCustomer({
        nom: newCustNom,
        prenom: newCustPrenom,
        telephone: newCustTel,
        indicatif: newCustIndicatif,
        preferences_pliage: newCustPref,
        adresse: newCustAdresse
      });

      refreshAdminData();
      setSelectedCustomerId(newCustomer.id);
      setShowNewCustomerModal(false);
      setNewCustNom('');
      setNewCustPrenom('');
      setNewCustTel('');
      setNewCustIndicatif('229');
      setNewCustAdresse('');
      alert(`Client ${newCustomer.prenom} ${newCustomer.nom} créé avec succès dans la base de données !`);
    } catch (err) {
      alert("Erreur de création du client : " + err.message);
    }
  };

  const handleCreateOrder = async (e) => {
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
      items: selectedItems,
      remise_pourcentage: Number(remisePourcentage || 0)
    };

    try {
      const newOrder = await db.createOrder(orderData);
      refreshAdminData();
      setCreatedOrder(newOrder);
      setAvancePayee('');
      setRemisePourcentage('');
      setSubscribePlanId('');
      setArticleQuantities({});
      setShowOrderRegistrationModal(false);

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
      alert(`Commande ${newOrder.identifiant_unique_marquage} enregistrée avec succès dans la base de données !`);
    } catch (err) {
      alert("Erreur d'enregistrement de la commande : " + err.message);
    }
  };

  const handleStartDelivery = async (order, finalStatus = 'restitue') => {
    setDelivFinalStatus(finalStatus);
    const remainingToPay = order.prix_total - order.avance_payee;
    if (remainingToPay <= 0) {
      if (await confirm(`Confirmer la finalisation de la commande ${order.identifiant_unique_marquage} ?`)) {
        try {
          await db.updateOrderStatus(order.id, finalStatus);
          refreshAdminData();

          // Notification WhatsApp livraison directe (déjà payé)
          const customer = customers.find(c => c.id === order.customer_id);
          if (customer) {
            const finalStatusLabel = finalStatus === 'a_livrer' ? 'mise en livraison' : finalStatus === 'a_recuperer' ? 'mise à disposition/récupérée' : 'livrée/restituée';
            const text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} a été ${finalStatusLabel} avec succès. Merci pour votre confiance et à bientôt chez KLIN UP !`;
            sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
          }
        } catch (err) {
          alert("Erreur de mise à jour du statut : " + err.message);
        }
      }
    } else {
      setDelivOrder(order);
      setDelivPaymentMethod('especes');
      setDelivAmountPaid(remainingToPay.toString());
      setShowDeliveryPaymentModal(true);
    }
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!delivOrder) return;

    if (delivPaymentMethod === 'mobile_money' && !momoRefNumber.trim()) {
      setMomoRefError("Le numéro de référence est obligatoire.");
      return;
    }

    try {
      await db.deliverOrderWithPayment(
        delivOrder.id, 
        Number(delivAmountPaid || 0), 
        delivPaymentMethod, 
        delivFinalStatus,
        delivPaymentMethod === 'mobile_money' ? momoRefNumber.trim() : null
      );
      refreshAdminData();
      setShowDeliveryPaymentModal(false);

      // Notification WhatsApp solde livraison
      const customer = customers.find(c => c.id === delivOrder.customer_id);
      if (customer) {
        const finalStatusLabel = delivFinalStatus === 'a_livrer' ? 'mise en livraison' : delivFinalStatus === 'a_recuperer' ? 'mise à disposition/récupérée' : 'livrée/restituée';
        const text = `Bonjour ${customer.prenom} ${customer.nom}, nous confirmons la ${finalStatusLabel} de votre commande ${delivOrder.identifiant_unique_marquage} et le règlement du solde de ${Number(delivAmountPaid).toLocaleString()} FCFA.\nVotre commande est entièrement soldée. Merci pour votre fidélité !`;
        sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
      }

      setDelivOrder(null);
      setMomoRefNumber('');
      setMomoRefError('');
      alert("Livraison et paiement enregistrés avec succès dans la base de données !");
    } catch (err) {
      alert("Erreur lors de la livraison : " + err.message);
    }
  };

  const handlePayDebt = async (e) => {
    e.preventDefault();
    if (!selectedCrmCustomer || !debtPaymentAmount) return;

    try {
      await db.updateCustomerDebt(selectedCrmCustomer.id, -Number(debtPaymentAmount));
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
      alert("Règlement de dette enregistré avec succès dans la base de données !");
    } catch (err) {
      alert("Erreur lors du règlement de la dette : " + err.message);
    }
  };

  const handleStatusChange = async (orderId, nextStatus) => {
    const order = orders.find(o => o.id === orderId);
    try {
      await db.updateOrderStatus(orderId, nextStatus);
      refreshAdminData();

      // Notification WhatsApp changement statut
      if (order) {
        const customer = customers.find(c => c.id === order.customer_id);
        if (customer) {
          let text = '';
          if (nextStatus === 'traitement') {
            text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} est maintenant prise en charge et en cours de traitement chez KLIN UP.`;
          } else if (nextStatus === 'en_cours_lavage') {
            text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} est en cours de lavage/séchage chez KLIN UP.`;
          } else if (nextStatus === 'en_cours_repassage') {
            text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} est en cours de repassage chez KLIN UP.`;
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
    } catch (err) {
      alert("Erreur lors du changement de statut : " + err.message);
    }
  };

  const validateCancelReason = (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return "Le motif de l'annulation est obligatoire.";
    }
    const hasLetter = /[a-zA-Z\u00C0-\u00FF]/.test(trimmed);
    if (!hasLetter) {
      return "Le motif doit contenir des lettres explicatives (pas seulement des chiffres ou symboles).";
    }
    return null;
  };

  const handleCancelOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    setOrderToCancel(order);
    setCancelReason('');
    setCancelReasonError('');
    setShowCancelModal(true);
  };

  const handleConfirmCancelOrder = async (e) => {
    e.preventDefault();
    const error = validateCancelReason(cancelReason);
    if (error) {
      setCancelReasonError(error);
      return;
    }
    if (!orderToCancel) return;

    try {
      await db.cancelOrder(orderToCancel.id, cancelReason.trim());
      refreshAdminData();
      setShowCancelModal(false);

      // Notification WhatsApp annulation
      const customer = customers.find(c => c.id === orderToCancel.customer_id);
      if (customer) {
        const text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${orderToCancel.identifiant_unique_marquage} a été annulée.\nMotif : ${cancelReason.trim()}`;
        sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
      }

      setOrderToCancel(null);
      setCancelReason('');
      setCancelReasonError('');
      alert("Commande annulée avec succès dans la base de données.");
    } catch (err) {
      alert("Erreur lors de l'annulation : " + err.message);
    }
  };



  const catalogClothes = catalog.length > 0
    ? [...new Set(catalog.filter(c => c.categorie !== 'abonnement' && c.categorie !== 'system_setting' && c.service !== 'system').map(c => c.article))]
    : [
        'Chemise', 'Pantalon', 'Robe', 'Combinaison', 'Jupe', 'Pull', 'Culotte', 'T-shirt', 'Polo', 'Blouson', 
        'Veste', 'Costume', 'Cravate', 'Haut', 'Débardeur', 'Jeans', 'Robe de mariée', 'Couette Legée', 'Couette lourd', 
        '1Draps+ 2 taies', '2 draps+ 2 taies', 'Taies', 'Petite serviette', 'Grandes serviettes', 'Ensemble 2 pièce', 
        'Ensemble 3 pièces', 'Chapeau', 'chausette', 'Nappe de table', 'Rideau', 'Robe fantaisiste', 'Serpillière', 
        'Torchon', 'Foulard'
      ];

  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {activeTab === 'dashboard' && (
        <DashboardTab
          earnedRevenue={earnedRevenue}
          completedOrdersCount={completedOrdersCount}
          activeOrdersCount={activeOrdersCount}
          pendingOrdersCount={pendingOrdersCount}
          chartPeriod={chartPeriod}
          setChartPeriod={setChartPeriod}
          daysOfWeek={daysOfWeek}
          baseLavage={baseLavage}
          baseRepassage={baseRepassage}
          restitutionRate={restitutionRate}
          averageOrderValue={averageOrderValue}
          mostPopularService={mostPopularService}
          activeSubscriptionsCount={activeSubscriptionsCount}
          nonCancelledOrdersCount={nonCancelledOrdersCount}
          totalOrdersCount={totalOrdersCount}
          orders={orders}
          customers={customers}
          staff={staff}
          serviceLabels={serviceLabels}
          getOrderStatusLabel={getOrderStatusLabel}
          setActiveDetailsCard={setActiveDetailsCard}
          setShowOrderRegistrationModal={setShowOrderRegistrationModal}
          onManageStaff={onManageStaff}
        />
      )}


      {/* ========================================================
         ONGLET : GESTION DES COMMANDES (ORDERS MANAGEMENT)
         ======================================================== */}
      {activeTab === 'orders_management' && (
        <OrdersTab
          orders={orders}
          customers={customers}
          atelierFilter={atelierFilter}
          setAtelierFilter={setAtelierFilter}
          isOrderLate={isOrderLate}
          serviceLabels={serviceLabels}
          handleStatusChange={handleStatusChange}
          handleStartDelivery={handleStartDelivery}
          copyToClipboard={copyToClipboard}
          formatDateTime={formatDateTime}
          handleCancelOrder={handleCancelOrder}
          setShowOrderRegistrationModal={setShowOrderRegistrationModal}
          historySearchQuery={historySearchQuery}
          setHistorySearchQuery={setHistorySearchQuery}
          historyFilterStatus={historyFilterStatus}
          setHistoryFilterStatus={setHistoryFilterStatus}
          getOrderStatusLabel={getOrderStatusLabel}
          setCreatedOrder={setCreatedOrder}
        />
      )}

      {/* ========================================================
         ONGLET : CLIENTS CRM (CRM MANAGEMENT)
         ======================================================== */}
      {activeTab === 'crm_management' && (
        <CustomersTab
          customers={customers}
          selectedCrmCustomer={selectedCrmCustomer}
          setSelectedCrmCustomer={setSelectedCrmCustomer}
          crmSearch={crmSearch}
          setCrmSearch={setCrmSearch}
          setShowNewCustomerModal={setShowNewCustomerModal}
          setShowDebtPaymentModal={setShowDebtPaymentModal}
          setDebtPaymentAmount={setDebtPaymentAmount}
          handleUnsubscribeCrm={handleUnsubscribeCrm}
          selectedCrmSubId={selectedCrmSubId}
          setSelectedCrmSubId={setSelectedCrmSubId}
          handleSubscribeCrm={handleSubscribeCrm}
          catalog={catalog}
          orders={orders}
          serviceLabels={serviceLabels}
          getOrderStatusLabel={getOrderStatusLabel}
          setCreatedOrder={setCreatedOrder}
        />
      )}

      {/* ========================================================
         ONGLET : CATALOGUE TARIFS (CATALOG)
         ======================================================== */}
      {activeTab === 'catalog' && (
        <CatalogTab
          catalogCategory={catalogCategory}
          setCatalogCategory={setCatalogCategory}
          selectedCatalogIds={selectedCatalogIds}
          setSelectedCatalogIds={setSelectedCatalogIds}
          handleDeleteCatalogItemsBatch={handleDeleteCatalogItemsBatch}
          catalogSearchText={catalogSearchText}
          setCatalogSearchText={setCatalogSearchText}
          catalogServiceFilter={catalogServiceFilter}
          setCatalogServiceFilter={setCatalogServiceFilter}
          catalogPriceFilter={catalogPriceFilter}
          setCatalogPriceFilter={setCatalogPriceFilter}
          catalogSortOrder={catalogSortOrder}
          setCatalogSortOrder={setCatalogSortOrder}
          filteredCatalog={filteredCatalog}
          catalogCurrentPage={catalogCurrentPage}
          setCatalogCurrentPage={setCatalogCurrentPage}
          getAssetIcon={getAssetIcon}
          handleStartEditProduct={handleStartEditProduct}
          handleDeleteCatalogItem={handleDeleteCatalogItem}
          handleToggleCatalogItemActive={handleToggleCatalogItemActive}
          setShowAddCatalogModal={setShowAddCatalogModal}
        />
      )}

      {/* ========================================================
         ONGLET : POINTS DE LAVERIE (STORES)
         ======================================================== */}
      {activeTab === 'laundry_points' && (
        <StoresTab
          onShowSuccess={(msg) => alert(msg)}
        />
      )}

      {/* ========================================================
         ONGLET : JOURNAL D'AUDIT (LOGS)
         ======================================================== */}
      {activeTab === 'logs' && (
        <LogsTab
          logSearchText={logSearchText}
          setLogSearchText={setLogSearchText}
          logFilterAction={logFilterAction}
          setLogFilterAction={setLogFilterAction}
          filteredLogs={filteredLogs}
          staff={staff}
        />
      )}

      {/* ========================================================
         ONGLET : GESTION DES ACCÈS / PERSONNEL (STAFF ACCESS)
         ======================================================== */}
      {(activeTab === 'staff_management' || activeTab === 'staff_roles' || activeTab === 'staff_users') && (
        <StaffTab
          subTab={activeTab === 'staff_roles' ? 'roles' : 'users'}
          staff={staff}
          selectedStaffId={selectedStaffId}
          setSelectedStaffId={setSelectedStaffId}
          setShowNewStaffModal={setShowNewStaffModal}
          refreshAdminData={refreshAdminData}
          selectedMember={selectedMember}
          handleSaveStaff={handleSaveStaff}
          handleDeleteStaff={handleDeleteStaff}
          editStaffPrenom={editStaffPrenom}
          setEditStaffPrenom={setEditStaffPrenom}
          editStaffNom={editStaffNom}
          setEditStaffNom={setEditStaffNom}
          editStaffEmail={editStaffEmail}
          setEditStaffEmail={setEditStaffEmail}
          editStaffTel={editStaffTel}
          setEditStaffTel={setEditStaffTel}
          editStaffRole={editStaffRole}
          handleRoleChangeInForm={handleRoleChangeInForm}
          editStaffStatut={editStaffStatut}
          setEditStaffStatut={setEditStaffStatut}
          editStaffStoreId={editStaffStoreId}
          setEditStaffStoreId={setEditStaffStoreId}
          editStaffPermissions={editStaffPermissions}
          setEditStaffPermissions={setEditStaffPermissions}
        />
      )}

      {/* ========================================================
         ONGLET : PARAMÈTRES SYSTÈME (SETTINGS)
         ======================================================== */}
      {activeTab === 'settings' && (
        <SettingsTab
          handleSaveSettings={handleSaveSettings}
          inputExpressHours={inputExpressHours}
          setInputExpressHours={setInputExpressHours}
          inputExpressMarkup={inputExpressMarkup}
          setInputExpressMarkup={setInputExpressMarkup}
          inputNormalHours={inputNormalHours}
          setInputNormalHours={setInputNormalHours}
        />
      )}

      {/* ========================================================
         MODAL : AJOUT D'UN NOUVEL EMPLOYÉ
         ======================================================== */}
      {showNewStaffModal && (
        <ModalPortal>
          <div className="modal-backdrop">
            <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.22), 0 10px 25px -5px rgba(15, 23, 42, 0.10)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'default' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Ajouter un Employé
              </h3>

              <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group">
                    <label>Prénom</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Prénom"
                      required
                      value={newStaffPrenom}
                      onChange={(e) => setNewStaffPrenom(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Nom"
                      required
                      value={newStaffNom}
                      onChange={(e) => setNewStaffNom(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Professionnel</label>
                  <input
                    type="email"
                    className="input-control"
                    placeholder="nom.prenom@klinup.com"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Ex: +229 97979797"
                    value={newStaffTel}
                    onChange={(e) => setNewStaffTel(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Rôle Principal</label>
                  <CustomSelect
                    className="input-control"
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                  >
                    {((db.getRoles ? db.getRoles() : []).length > 0 ? db.getRoles() : [
                      { key: 'super_admin', label: 'Super Administrateur' },
                      { key: 'manager', label: 'Gérant (Manager)' },
                      { key: 'agent_accueil', label: 'Agent d\'Accueil / Caisse' },
                      { key: 'agent_lavage_repassage', label: 'Agent Atelier (Lavage / Repassage)' },
                      { key: 'livreur', label: 'Livreur / Agent de Collecte' }
                    ]).map(r => (
                      <option key={r.id || r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="form-group">
                  <label>Point de Laverie d'affectation <span style={{ color: '#ef4444' }}>*</span></label>
                  <CustomSelect
                    className="input-control"
                    value={newStaffStoreId}
                    onChange={(e) => setNewStaffStoreId(e.target.value)}
                    required
                  >
                    <option value="">-- Sélectionner un point de laverie * --</option>
                    <option value="all">Tous les points (Accès Global Super Admin)</option>
                    {db.getStores().map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nom} ({s.code})
                      </option>
                    ))}
                  </CustomSelect>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Ajouter</button>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowNewStaffModal(false)}>Annuler</button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}



      {/* ========================================================
         MODAL D'AJOUT D'ARTICLE OU ABONNEMENT AU CATALOGUE
         ======================================================== */}
      {showAddCatalogModal && (
        <div className="modal-backdrop">
          <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.22), 0 10px 25px -5px rgba(15, 23, 42, 0.10)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'default' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Ajouter au Catalogue
            </h3>

            <form onSubmit={handleAddCatalogItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Category choice & Name side-by-side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Catégorie de tarif</label>
                  <CustomSelect
                    className="input-control"
                    value={newArtCategory}
                    onChange={(e) => setNewArtCategory(e.target.value)}
                  >
                    <option value="individuel">Vêtement individuel</option>
                    <option value="abonnement">Formule d'abonnement</option>
                  </CustomSelect>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>{newArtCategory === 'individuel' ? "Nom de l'article" : "Nom de la formule d'abonnement"}</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder={newArtCategory === 'individuel' ? "Ex: Chemise, Pull, Jeans" : "Ex: Offre Spéciale, Abonnement Prestige"}
                    required
                    value={newArtName}
                    onChange={(e) => setNewArtName(e.target.value)}
                  />
                  {newArtNameError && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.72rem', marginTop: '0.25rem', fontWeight: 600 }}>
                      {newArtNameError}
                    </div>
                  )}
                </div>
              </div>

              {newArtCategory === 'individuel' ? (
                // Input elements for Clothing items (Traitement and Repassage simultaneous pricing)
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Traitement check & prices */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', background: 'var(--bg-app)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newArtTraitementActive}
                        onChange={(e) => setNewArtTraitementActive(e.target.checked)}
                      />
                      Activer le service Traitement
                    </label>
                    {newArtTraitementActive && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Base (FCFA)</label>
                          <input
                            type="number"
                            className="input-control"
                            style={{ height: '32px', fontSize: '0.8rem' }}
                            required
                            placeholder="Ex: 1000"
                            value={newArtTraitementPrice}
                            onChange={(e) => {
                              setNewArtTraitementPrice(e.target.value);
                              const val = Number(e.target.value);
                              if (!isNaN(val)) {
                                setNewArtTraitementUrgentPrice(Math.round(val * 1.5).toString());
                              }
                            }}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Urgent (FCFA) ⚡</label>
                          <input
                            type="number"
                            className="input-control"
                            style={{ height: '32px', fontSize: '0.8rem' }}
                            required
                            placeholder="Ex: 1500"
                            value={newArtTraitementUrgentPrice}
                            onChange={(e) => setNewArtTraitementUrgentPrice(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Repassage check & prices */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', background: 'var(--bg-app)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newArtRepassageActive}
                        onChange={(e) => setNewArtRepassageActive(e.target.checked)}
                      />
                      Activer le service Repassage
                    </label>
                    {newArtRepassageActive && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Base (FCFA)</label>
                          <input
                            type="number"
                            className="input-control"
                            style={{ height: '32px', fontSize: '0.8rem' }}
                            required
                            placeholder="Ex: 500"
                            value={newArtRepassagePrice}
                            onChange={(e) => {
                              setNewArtRepassagePrice(e.target.value);
                              const val = Number(e.target.value);
                              if (!isNaN(val)) {
                                setNewArtRepassageUrgentPrice(Math.round(val * 1.5).toString());
                              }
                            }}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Urgent (FCFA) ⚡</label>
                          <input
                            type="number"
                            className="input-control"
                            style={{ height: '32px', fontSize: '0.8rem' }}
                            required
                            placeholder="Ex: 750"
                            value={newArtRepassageUrgentPrice}
                            onChange={(e) => setNewArtRepassageUrgentPrice(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Input elements for Subscriptions
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Tarif mensuel (FCFA)</label>
                      <input
                        type="number"
                        className="input-control"
                        placeholder="Ex: 25000"
                        required
                        value={newArtPrice}
                        onChange={(e) => setNewArtPrice(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Nombre de vêtements inclus</label>
                      <input
                        type="number"
                        className="input-control"
                        placeholder="Ex: 50"
                        required
                        value={newArtNombreVetements}
                        onChange={(e) => setNewArtNombreVetements(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'start' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600 }}>Service de ramassage ?</label>
                      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={newArtRamassage}
                            onChange={() => setNewArtRamassage(true)}
                            style={{ cursor: 'pointer' }}
                          />
                          Oui
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={!newArtRamassage}
                            onChange={() => setNewArtRamassage(false)}
                            style={{ cursor: 'pointer' }}
                          />
                          Non
                        </label>
                      </div>

                      {newArtRamassage && (
                        <div style={{
                          background: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.65rem 0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          marginTop: '0.5rem'
                        }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.73rem', fontWeight: 700, marginBottom: '0.2rem' }}>Nombre de ramassages / mois</label>
                            <input
                              type="number"
                              className="input-control"
                              style={{ height: '30px', fontSize: '0.8rem' }}
                              placeholder="Ex: 4 (Laissez vide si illimité)"
                              value={newArtNombreRamassages}
                              onChange={(e) => setNewArtNombreRamassages(e.target.value)}
                            />
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700, margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={newArtRamassageGratuit}
                              onChange={(e) => setNewArtRamassageGratuit(e.target.checked)}
                              style={{ cursor: 'pointer' }}
                            />
                            Ramassage gratuit
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600 }}>Livraison gratuite ?</label>
                      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={newArtLivraisonGratuite}
                            onChange={() => setNewArtLivraisonGratuite(true)}
                            style={{ cursor: 'pointer' }}
                          />
                          Oui
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={!newArtLivraisonGratuite}
                            onChange={() => setNewArtLivraisonGratuite(false)}
                            style={{ cursor: 'pointer' }}
                          />
                          Non
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                      <span>Avantages & Conditions</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                        Glissez les poignées ☰ pour réordonner
                      </span>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '2px' }}>
                      {newArtAdvantages.map((adv, idx) => (
                        <div
                          key={idx}
                          draggable={dragAllowedIndex === idx}
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, idx, false)}
                          onDragEnd={() => setDragAllowedIndex(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.25rem',
                            background: 'var(--bg-app)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.2s ease',
                            opacity: dragAllowedIndex === idx ? 0.7 : 1,
                          }}
                        >
                          <div
                            onMouseEnter={() => setDragAllowedIndex(idx)}
                            onMouseLeave={() => setDragAllowedIndex(null)}
                            style={{
                              cursor: 'grab',
                              padding: '0.25rem',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Faire glisser pour réordonner"
                          >
                            <GripVertical size={14} />
                          </div>
                          <input
                            type="text"
                            className="input-control"
                            style={{
                              height: '30px',
                              fontSize: '0.8rem',
                              margin: 0,
                              flex: 1,
                              border: 'none',
                              background: 'transparent',
                              padding: '0 0.25rem',
                            }}
                            placeholder="Ex: Livraison gratuite"
                            required
                            value={adv}
                            onChange={(e) => handleUpdateAdvantage(idx, e.target.value, false)}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteAdvantageField(idx, false)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleAddAdvantageField(false)}
                      style={{
                        padding: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        background: 'var(--primary-light)',
                        border: '1px dashed rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        marginTop: '0.15rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                    >
                      <Plus size={12} /> Ajouter un avantage
                    </button>
                  </div>
                </>
              )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Ajouter</button>
                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddCatalogModal(false)}>Annuler</button>
                  </div>
                </form>
              </div>
            </div>
          )}

      {/* ========================================================
         MODAL DE MODIFICATION AVANCÉE D'ARTICLE OU ABONNEMENT
         ======================================================== */}
      {showEditCatalogModal && (
        <ModalPortal>
          <div className="modal-backdrop" onClick={() => setShowEditCatalogModal(false)}>
            <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25)', border: '1px solid var(--border-color)', margin: 'auto', cursor: 'default' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Options d'Édition Avancées
              </h3>

              <form onSubmit={handleSaveProductAdvanced} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Category info & Name side-by-side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Catégorie de tarif</label>
                    <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-app)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {editArtCategory === 'individuel' ? 'Vêtement individuel' : "Formule d'abonnement"}
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>{editArtCategory === 'individuel' ? "Nom de l'article" : "Nom de la formule d'abonnement"}</label>
                    <input
                      type="text"
                      className="input-control"
                      required
                      value={editArtName}
                      onChange={(e) => setEditArtName(e.target.value)}
                    />
                    {editArtNameError && (
                      <div style={{ color: 'var(--danger)', fontSize: '0.72rem', marginTop: '0.25rem', fontWeight: 600 }}>
                        {editArtNameError}
                      </div>
                    )}
                  </div>
                </div>

                {editArtCategory === 'individuel' ? (
                  // Input elements for Clothing items (Traitement and Repassage simultaneous pricing)
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Traitement check & prices */}
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', background: 'var(--bg-app)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editArtTraitementActive}
                          onChange={(e) => setEditArtTraitementActive(e.target.checked)}
                        />
                        Activer le service Traitement
                      </label>
                      {editArtTraitementActive && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Base (FCFA)</label>
                            <input
                              type="number"
                              className="input-control"
                              style={{ height: '32px', fontSize: '0.8rem' }}
                              required
                              placeholder="Ex: 1000"
                              value={editArtTraitementPrice}
                              onChange={(e) => {
                                setEditArtTraitementPrice(e.target.value);
                                const val = Number(e.target.value);
                                if (!isNaN(val)) {
                                  setEditArtTraitementUrgentPrice(Math.round(val * 1.5).toString());
                                }
                              }}
                            />
                          </div>
                          <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Urgent (FCFA) ⚡</label>
                            <input
                              type="number"
                              className="input-control"
                              style={{ height: '32px', fontSize: '0.8rem' }}
                              required
                              placeholder="Ex: 1500"
                              value={editArtTraitementUrgentPrice}
                              onChange={(e) => setEditArtTraitementUrgentPrice(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Repassage check & prices */}
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', background: 'var(--bg-app)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editArtRepassageActive}
                          onChange={(e) => setEditArtRepassageActive(e.target.checked)}
                        />
                        Activer le service Repassage
                      </label>
                      {editArtRepassageActive && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Base (FCFA)</label>
                            <input
                              type="number"
                              className="input-control"
                              style={{ height: '32px', fontSize: '0.8rem' }}
                              required
                              placeholder="Ex: 500"
                              value={editArtRepassagePrice}
                              onChange={(e) => {
                                setEditArtRepassagePrice(e.target.value);
                                const val = Number(e.target.value);
                                if (!isNaN(val)) {
                                  setEditArtRepassageUrgentPrice(Math.round(val * 1.5).toString());
                                }
                              }}
                            />
                          </div>
                          <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Urgent (FCFA) ⚡</label>
                            <input
                              type="number"
                              className="input-control"
                              style={{ height: '32px', fontSize: '0.8rem' }}
                              required
                              placeholder="Ex: 750"
                              value={editArtRepassageUrgentPrice}
                              onChange={(e) => setEditArtRepassageUrgentPrice(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Input elements for Subscriptions
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Tarif mensuel (FCFA)</label>
                        <input
                          type="number"
                          className="input-control"
                          required
                          value={editArtPrice}
                          onChange={(e) => setEditArtPrice(e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Nombre de vêtements inclus</label>
                        <input
                          type="number"
                          className="input-control"
                          placeholder="Ex: 50"
                          required
                          value={editArtNombreVetements}
                          onChange={(e) => setEditArtNombreVetements(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'start' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 600 }}>Service de ramassage ?</label>
                        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={editArtRamassage}
                              onChange={() => setEditArtRamassage(true)}
                              style={{ cursor: 'pointer' }}
                            />
                            Oui
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={!editArtRamassage}
                              onChange={() => setEditArtRamassage(false)}
                              style={{ cursor: 'pointer' }}
                            />
                            Non
                          </label>
                        </div>

                        {editArtRamassage && (
                          <div style={{
                            background: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.65rem 0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            marginTop: '0.5rem'
                          }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.73rem', fontWeight: 700, marginBottom: '0.2rem' }}>Nombre de ramassages / mois</label>
                              <input
                                type="number"
                                className="input-control"
                                style={{ height: '30px', fontSize: '0.8rem' }}
                                placeholder="Ex: 4 (Laissez vide si illimité)"
                                value={editArtNombreRamassages}
                                onChange={(e) => setEditArtNombreRamassages(e.target.value)}
                              />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700, margin: 0 }}>
                              <input
                                type="checkbox"
                                checked={editArtRamassageGratuit}
                                onChange={(e) => setEditArtRamassageGratuit(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                              />
                              Ramassage gratuit
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 600 }}>Livraison gratuite ?</label>
                        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={editArtLivraisonGratuite}
                              onChange={() => setEditArtLivraisonGratuite(true)}
                              style={{ cursor: 'pointer' }}
                            />
                            Oui
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={!editArtLivraisonGratuite}
                              onChange={() => setEditArtLivraisonGratuite(false)}
                              style={{ cursor: 'pointer' }}
                            />
                            Non
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                        <span>Avantages & Conditions</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                          Glissez les poignées ☰ pour réordonner
                        </span>
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '2px' }}>
                        {editArtAdvantages.map((adv, idx) => (
                          <div
                            key={idx}
                            draggable={dragAllowedIndex === idx}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, idx, true)}
                            onDragEnd={() => setDragAllowedIndex(null)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.25rem',
                              background: 'var(--bg-app)',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              transition: 'all 0.2s ease',
                              opacity: dragAllowedIndex === idx ? 0.7 : 1,
                            }}
                          >
                            <div
                              onMouseEnter={() => setDragAllowedIndex(idx)}
                              onMouseLeave={() => setDragAllowedIndex(null)}
                              style={{
                                cursor: 'grab',
                                padding: '0.25rem',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Faire glisser pour réordonner"
                            >
                              <GripVertical size={14} />
                            </div>
                            <input
                              type="text"
                              className="input-control"
                              style={{
                                height: '30px',
                                fontSize: '0.8rem',
                                margin: 0,
                                flex: 1,
                                border: 'none',
                                background: 'transparent',
                                padding: '0 0.25rem',
                              }}
                              placeholder="Ex: Livraison gratuite"
                              required
                              value={adv}
                              onChange={(e) => handleUpdateAdvantage(idx, e.target.value, true)}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteAdvantageField(idx, true)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleAddAdvantageField(true)}
                        style={{
                          padding: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--primary)',
                          background: 'var(--primary-light)',
                          border: '1px dashed rgba(59, 130, 246, 0.3)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          marginTop: '0.15rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                      >
                        <Plus size={12} /> Ajouter un avantage
                      </button>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Enregistrer</button>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowEditCatalogModal(false)}>Annuler</button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

          {/* ========================================================
          MODAL : ENREGISTREMENT COMMANDE (CAISSE ADMIN REDESIGN)
          ======================================================== */}
          {showOrderRegistrationModal && (
            <ModalPortal>
              <div className="modal-backdrop">
                <div 
                  className="card modal-dialog-card" 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ 
                    width: '100%', 
                    maxWidth: '660px', 
                    maxHeight: '85vh', 
                    overflow: 'hidden', 
                    background: 'var(--bg-card)', 
                    padding: '1.25rem 1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.85rem',
                    borderRadius: '24px'
                  }}
                >
                {/* Header bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(0, 44, 247, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Nouvelle Commande Caisse
                      </h3>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Enregistrement de dépôt & marquage d'articles
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.25rem', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={handleCancelOrderRegistration}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', minHeight: 0, flex: '1 1 auto', paddingRight: '0.25rem' }}>

                  {/* 👤 SECTION 1 : SELECTION CLIENT & ABONNEMENT */}
                  <div style={{ background: 'var(--bg-app)', padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={15} color="var(--primary)" /> Client Destinataire
                      </label>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem', borderRadius: '8px', fontWeight: 700 }}
                        onClick={() => setShowNewCustomerModal(true)}
                      >
                        + Nouveau Client
                      </button>
                    </div>

                    <CustomSelect
                      className="input-control"
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.82rem', borderRadius: '8px', fontWeight: 600 }}
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                    >
                      <option value="">-- Sélectionner un client dans la base --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.prenom} {c.nom} ({c.telephone})</option>
                      ))}
                    </CustomSelect>

                    {activeCustomer && (
                      <div style={{ padding: '0.65rem 0.75rem', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Préférence pliage : <strong>{activeCustomer.preferences_pliage || 'Non spécifié'}</strong></span>
                          <span style={{ color: 'var(--primary)', fontWeight: 800, background: 'var(--primary-light)', padding: '0.12rem 0.45rem', borderRadius: '6px' }}>
                            ⭐ {activeCustomer.points_fidelite} pts fidélité
                          </span>
                        </div>

                        {activeCustomer.solde_dette > 0 && (
                          <div style={{ color: 'var(--accent)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--accent-light)', padding: '0.3rem 0.55rem', borderRadius: '6px', marginTop: '0.1rem' }}>
                            <TriangleAlert size={13} /> Solde débiteur encours : {activeCustomer.solde_dette.toLocaleString()} FCFA
                          </div>
                        )}

                        {/* Zone d'abonnement dynamique */}
                        {activeCustomer.active_subscription ? (
                          <div style={{ marginTop: '0.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: subscribePlanId ? 'not-allowed' : 'pointer', fontWeight: 800, color: 'var(--primary)' }}>
                                <input
                                  type="checkbox"
                                  checked={payWithSubscription}
                                  disabled={!!subscribePlanId}
                                  onChange={(e) => setPayWithSubscription(e.target.checked)}
                                />
                                Utiliser le forfait d'abonnement actif
                              </label>
                              <span style={{ fontWeight: 800, color: 'var(--success)' }}>
                                ({activeCustomer.active_subscription.remaining_clothes} vêt. restants)
                              </span>
                            </div>

                            {payWithSubscription && !subscribePlanId && getTotalClothesCount() > activeCustomer.active_subscription.remaining_clothes && (
                              <div style={{ color: 'var(--accent)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                                <AlertCircle size={13} /> Solde insuffisant ({getTotalClothesCount()} vêt. requis)
                              </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.15rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Changer / Renouveler l'abonnement :</span>
                              <CustomSelect
                                className="input-control"
                                style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', borderRadius: '6px', width: '100%', background: 'var(--bg-app)' }}
                                value={subscribePlanId}
                                onChange={(e) => setSubscribePlanId(e.target.value)}
                              >
                                <option value="">-- Conserver le forfait actuel --</option>
                                {catalog.filter(c => c.categorie === 'abonnement').map(p => (
                                  <option key={p.id} value={p.id}>{p.article} ({p.prix.toLocaleString()} F)</option>
                                ))}
                              </CustomSelect>
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: '0.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.72rem' }}>Souscrire immédiatement à une formule d'abonnement :</span>
                            <CustomSelect
                              className="input-control"
                              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', borderRadius: '6px', width: '100%', background: 'var(--bg-app)' }}
                              value={subscribePlanId}
                              onChange={(e) => setSubscribePlanId(e.target.value)}
                            >
                              <option value="">-- Pas d'abonnement pour cette commande --</option>
                              {catalog.filter(c => c.categorie === 'abonnement').map(p => (
                                <option key={p.id} value={p.id}>{p.article} ({p.prix.toLocaleString()} F)</option>
                              ))}
                            </CustomSelect>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 👔 SECTION 2 : ARTICLES & SERVICES DU PANIER */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Shirt size={15} color="var(--primary)" /> Composition du Panier de Linge
                      </label>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.15rem 0.55rem', borderRadius: '20px' }}>
                        {getTotalClothesCount()} article{getTotalClothesCount() > 1 ? 's' : ''} au total
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.55rem',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      paddingRight: '4px'
                    }}>
                      {catalogClothes.map(cloth => {
                        const qty = articleQuantities[cloth] || 0;
                        const selectedSvc = articleServices[cloth] || 'lavage_simple';
                        const isSelected = qty > 0;

                        const servicesForCloth = catalog.filter(c => c.categorie !== 'abonnement' && c.article === cloth && c.service !== 'nettoyage_a_sec');
                        const activeServices = servicesForCloth.length > 0 ? servicesForCloth : [
                          { service: 'lavage_simple', prix: 1500 },
                          { service: 'repassage', prix: 1000 }
                        ];
                        const activeServiceObj = activeServices.find(s => s.service === selectedSvc) || activeServices[0];
                        const unitPrice = activeServiceObj ? activeServiceObj.prix : 1500;
                        const svcIcons = { lavage_simple: '🫧', nettoyage_a_sec: '✨', repassage: '♨️' };

                        return (
                          <div key={cloth} style={{
                            gridColumn: isSelected ? 'span 3' : 'span 1',
                            display: 'flex',
                            flexDirection: isSelected ? 'row' : 'column',
                            alignItems: isSelected ? 'center' : 'stretch',
                            padding: isSelected ? '0.75rem 0.95rem' : '0.75rem 0.6rem',
                            background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-app)',
                            borderRadius: '14px',
                            border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            gap: isSelected ? '0.85rem' : '0.4rem',
                            boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.12)' : 'none',
                          }}>

                            {/* Quantity controls */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: isSelected ? '0.6rem' : '0',
                              flexDirection: isSelected ? 'row' : 'column',
                              flexShrink: 0
                            }}>
                              {!isSelected && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(cloth, 1)}
                                  style={{
                                    width: '38px', height: '38px',
                                    borderRadius: '50%',
                                    border: '1.5px solid var(--border-color)',
                                    background: 'var(--bg-card)',
                                    color: 'var(--primary)',
                                    fontSize: '1.2rem', fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    margin: 'auto'
                                  }}
                                >
                                  +
                                </button>
                              )}

                              {isSelected && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(cloth, -1)}
                                    style={{
                                      width: '28px', height: '28px', borderRadius: '50%',
                                      border: '1.5px solid var(--border-color)',
                                      background: 'var(--bg-card)', color: 'var(--text-secondary)',
                                      fontSize: '1rem', fontWeight: 800,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      cursor: 'pointer',
                                    }}
                                  >−</button>
                                  <span style={{
                                    minWidth: '30px', textAlign: 'center',
                                    fontSize: '0.95rem', fontWeight: 800,
                                    color: 'var(--primary)',
                                    background: 'var(--bg-card)',
                                    borderRadius: '8px',
                                    padding: '0.15rem 0.4rem',
                                    border: '1px solid rgba(59, 130, 246, 0.25)',
                                  }}>{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(cloth, 1)}
                                    style={{
                                      width: '28px', height: '28px', borderRadius: '50%',
                                      border: 'none',
                                      background: 'var(--primary)', color: '#ffffff',
                                      fontSize: '1rem', fontWeight: 800,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      cursor: 'pointer',
                                    }}
                                  >+</button>
                                </div>
                              )}

                              <span style={{
                                fontSize: isSelected ? '0.88rem' : '0.74rem',
                                fontWeight: isSelected ? 800 : 700,
                                color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                                textAlign: 'center',
                                lineHeight: 1.2,
                              }}>{cloth}</span>
                            </div>

                            {/* Service Pills */}
                            {isSelected && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1, flexWrap: 'wrap' }}>
                                {activeServices.map(s => {
                                  const isActiveSvc = selectedSvc === s.service;
                                  return (
                                    <button
                                      key={s.service}
                                      type="button"
                                      onClick={() => handleUpdateService(cloth, s.service)}
                                      style={{
                                        padding: '0.3rem 0.7rem',
                                        borderRadius: '20px',
                                        border: isActiveSvc ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                                        background: isActiveSvc ? 'var(--primary)' : 'var(--bg-card)',
                                        color: isActiveSvc ? '#ffffff' : 'var(--text-secondary)',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {svcIcons[s.service] || ''} {serviceLabels[s.service] || s.service}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Subtotal */}
                            {isSelected && (
                              <span style={{
                                fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)',
                                whiteSpace: 'nowrap', marginLeft: 'auto', flexShrink: 0,
                              }}>
                                {(unitPrice * qty).toLocaleString()} F
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ⚡ SECTION 3 : PARAMÈTRES RÈGLEMENT, URGENCE & REMISE */}
                  <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {(() => {
                        const activeCust = customers.find(c => c.id === selectedCustomerId);
                        const isSubMode = (payWithSubscription && activeCust && activeCust.active_subscription) || !!subscribePlanId;

                        return (
                          <div className="form-group" style={{ marginBottom: 0, gap: '0.35rem' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>Niveau d'Urgence</label>
                            <CustomSelect
                              className="input-control"
                              disabled={isSubMode}
                              style={{
                                padding: '0.55rem',
                                fontSize: '0.82rem',
                                borderRadius: '10px',
                                fontWeight: 700
                              }}
                              value={isSubMode ? 'Normal' : niveauUrgence}
                              onChange={(e) => setNiveauUrgence(e.target.value)}
                            >
                              <option value="Normal">🟢 Normal (Standard)</option>
                              {!isSubMode && <option value="Express">⚡ Express (+50% Majoré)</option>}
                            </CustomSelect>
                          </div>
                        );
                      })()}

                      <div className="form-group" style={{ marginBottom: 0, gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>Mode de Règlement</label>
                        <CustomSelect
                          className="input-control"
                          style={{ padding: '0.55rem', fontSize: '0.82rem', borderRadius: '10px', fontWeight: 700 }}
                          value={(payWithSubscription && !subscribePlanId) ? 'abonnement' : modeReglement}
                          disabled={payWithSubscription && !subscribePlanId}
                          onChange={(e) => setModeReglement(e.target.value)}
                        >
                          {(payWithSubscription && !subscribePlanId) ? (
                            <option value="abonnement">⭐ Forfait Abonnement</option>
                          ) : (
                            <>
                              <option value="especes">💵 Espèces</option>
                              <option value="mobile_money">📱 Mobile Money</option>
                              <option value="avance_solde">🤝 Avance / Crédit</option>
                            </>
                          )}
                        </CustomSelect>
                      </div>
                    </div>

                    {(() => {
                      const activeCust = customers.find(c => c.id === selectedCustomerId);
                      const isSubMode = (payWithSubscription && activeCust && activeCust.active_subscription) || !!subscribePlanId;

                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group" style={{ marginBottom: 0, gap: '0.35rem' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              Acompte Versé (FCFA)
                            </label>
                            <input
                              type="number"
                              className="input-control"
                              disabled={isSubMode}
                              style={{
                                padding: '0.55rem',
                                fontSize: '0.82rem',
                                borderRadius: '10px',
                                fontWeight: 700
                              }}
                              placeholder="Ex: 2000"
                              value={isSubMode ? '0' : avancePayee}
                              onChange={(e) => setAvancePayee(e.target.value)}
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: 0, gap: '0.35rem' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              Remise Commerciale (%)
                            </label>
                            <input
                              type="number"
                              className="input-control"
                              disabled={isSubMode}
                              style={{
                                padding: '0.55rem',
                                fontSize: '0.82rem',
                                borderRadius: '10px',
                                fontWeight: 700
                              }}
                              placeholder="Ex: 10"
                              min="0"
                              max="100"
                              value={isSubMode ? '0' : remisePourcentage}
                              onChange={(e) => setRemisePourcentage(e.target.value)}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Subscriptions Deduction Recap */}
                    {(() => {
                      if (subscribePlanId) {
                        const subPlan = catalog.find(c => c.id === subscribePlanId && c.categorie === 'abonnement');
                        const totalClothes = getTotalClothesCount();
                        const quota = subPlan ? (subPlan.nombre_vetements || 0) : 0;
                        const remainingAfterOrder = Math.max(0, quota - totalClothes);

                        return (
                          <div style={{
                            background: 'rgba(37, 99, 235, 0.08)',
                            border: '1px solid rgba(37, 99, 235, 0.25)',
                            borderRadius: '12px',
                            padding: '0.75rem 0.95rem',
                            fontSize: '0.78rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem'
                          }}>
                            <div style={{ fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid rgba(37, 99, 235, 0.15)', paddingBottom: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Souscription NOUVEAU FORFAIT</span>
                              <span>{subPlan ? subPlan.article : ''} ({quota} vêt.)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 800 }}>
                              <span>Déduction automatique panier :</span>
                              <span>-{totalClothes} vêt. (0 FCFA)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 800 }}>
                              <span>Solde restant disponible après commande :</span>
                              <span style={{ color: '#10b981' }}>{remainingAfterOrder} / {quota} vêt.</span>
                            </div>
                          </div>
                        );
                      }

                      if (payWithSubscription && activeCustomer && activeCustomer.active_subscription) {
                        const totalClothes = getTotalClothesCount();
                        const remaining = activeCustomer.active_subscription.remaining_clothes;
                        const remainingAfterOrder = remaining - totalClothes;
                        return (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: '12px',
                            padding: '0.75rem 0.95rem',
                            fontSize: '0.78rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem'
                          }}>
                            <div style={{ fontWeight: 800, color: '#10b981', borderBottom: '1px solid rgba(16, 185, 129, 0.15)', paddingBottom: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Déduction Forfait Actif</span>
                              <span>{activeCustomer.active_subscription.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 800 }}>
                              <span>Solde après commande :</span>
                              <span style={{ color: remainingAfterOrder >= 0 ? '#10b981' : 'var(--danger)' }}>{remainingAfterOrder} vêt.</span>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })()}

                  </div>

                  {/* 💰 RÉCAPITULATIF FINANCIER & VALIDER */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Total Commande Caisse</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
                        <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {getCalculatedPrice().toLocaleString()} FCFA
                        </div>
                        {Number(remisePourcentage) > 0 && (
                          <div style={{ fontSize: '0.78rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                            <span style={{ textDecoration: 'line-through', color: 'var(--danger)', fontWeight: 700 }}>
                              {getBasePrice().toLocaleString()} F
                            </span>
                            <span style={{ color: '#10b981', fontWeight: 800 }}>
                              (-{remisePourcentage}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleCancelOrderRegistration}
                        style={{ padding: '0.6rem 1.1rem', fontSize: '0.82rem', borderRadius: '12px', fontWeight: 700 }}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ padding: '0.6rem 1.35rem', fontSize: '0.82rem', borderRadius: '12px', fontWeight: 800, boxShadow: '0 4px 15px rgba(0, 44, 247, 0.3)' }}
                      >
                        ⚡ Valider Commande
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

      {/* ========================================================
         MODAL : CRÉATION CLIENT (Nouveau Client CRM)
         ======================================================== */}
      {showNewCustomerModal && (
        <ModalPortal>
          <div className="modal-backdrop">
            <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.22), 0 10px 25px -5px rgba(15, 23, 42, 0.10)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'default' }}>
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
                  <CustomSelect
                    className="input-control"
                    value={newCustIndicatif}
                    onChange={(e) => setNewCustIndicatif(e.target.value)}
                  >
                    {countries.map((c) => (
                      <option key={`${c.code}-${c.name}`} value={c.code}>
                        {c.flag} {c.name} (+{c.code})
                      </option>
                    ))}
                  </CustomSelect>
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
                  <CustomSelect
                    className="input-control"
                    value={newCustPref}
                    onChange={(e) => setNewCustPref(e.target.value)}
                  >
                    <option value="Plié">Plié</option>
                    <option value="Sur cintre">Sur cintre</option>
                  </CustomSelect>
                </div>

                <div className="form-group">
                  <label>Adresse physique</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Adresse (domicile ou bureau)"
                    required
                    value={newCustAdresse}
                    onChange={(e) => setNewCustAdresse(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Créer</button>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowNewCustomerModal(false)}>Annuler</button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================
         MODAL : RÈGLEMENT DETTE CLIENT (CRM)
         ======================================================== */}
      {showDebtPaymentModal && selectedCrmCustomer && (
        <div className="modal-backdrop">
          <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.22), 0 10px 25px -5px rgba(15, 23, 42, 0.10)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'default' }}>
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

            {(() => {
              const activeUnpaidOrders = orders.filter(
                o => o.customer_id === selectedCrmCustomer.id &&
                     o.statut !== 'restitue' &&
                     o.statut !== 'annule' &&
                     (o.prix_total - o.avance_payee) > 0
              );
              if (activeUnpaidOrders.length === 0) return null;
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Commandes en cours liées à la dette :
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                    {activeUnpaidOrders.map(o => {
                      const rest = o.prix_total - o.avance_payee;
                      return (
                        <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', background: 'var(--bg-app)', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700 }}>{o.identifiant_unique_marquage}</span>
                            <span className={`badge badge-${o.statut}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                              {getOrderStatusLabel(o)}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                            {o.type_article}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            Service: {serviceLabels[o.type_service] || o.type_service}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.3rem', marginTop: '0.1rem', fontSize: '0.72rem' }}>
                            <span>Total : <strong>{o.prix_total.toLocaleString()} F</strong></span>
                            <span>Reste : <strong style={{ color: 'var(--accent)' }}>{rest.toLocaleString()} F</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

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
        <div className="modal-backdrop">
          <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.22), 0 10px 25px -5px rgba(15, 23, 42, 0.10)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'default' }}>
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
                <CustomSelect
                  className="input-control"
                  value={delivPaymentMethod}
                  onChange={(e) => setDelivPaymentMethod(e.target.value)}
                >
                  <option value="especes">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                </CustomSelect>
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

              {delivPaymentMethod === 'mobile_money' && (
                <div className="form-group">
                  <label>Numéro de Référence <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Ex: TXN12345678"
                    required
                    style={{ borderColor: momoRefError ? '#ef4444' : 'var(--border-color)' }}
                    value={momoRefNumber}
                    onChange={(e) => {
                      setMomoRefNumber(e.target.value);
                      if (e.target.value.trim()) setMomoRefError('');
                    }}
                  />
                  {momoRefError && (
                    <span style={{ fontSize: '0.7rem', color: '#ef4444', display: 'block', marginTop: '0.2rem' }}>{momoRefError}</span>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--success)', border: 'none' }}>Confirmer la Livraison</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setShowDeliveryPaymentModal(false); setMomoRefNumber(''); setMomoRefError(''); }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL : ANNULATION DE COMMANDE AVEC MOTIF
         ======================================================== */}
      {showCancelModal && orderToCancel && (
        <div className="modal-backdrop">
          <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.22), 0 10px 25px -5px rgba(15, 23, 42, 0.10)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'default' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--danger)' }}>
              Annuler la Commande
            </h3>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Voulez-vous vraiment annuler la commande <strong>{orderToCancel.identifiant_unique_marquage}</strong> ? Cette opération va recréditer la dette du client si elle n'est pas encore soldée.
            </div>

            <form onSubmit={handleConfirmCancelOrder} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Motif de l'annulation <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  className="input-control"
                  style={{ width: '100%', height: '80px', borderRadius: '8px', padding: '0.5rem', fontSize: '0.85rem', resize: 'none', border: cancelReasonError ? '1px solid #ef4444' : '1px solid var(--border-color)' }}
                  placeholder="Expliquez la raison de l'annulation..."
                  required
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    if (e.target.value.trim()) setCancelReasonError('');
                  }}
                />
                {cancelReasonError && (
                  <span style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.2rem' }}>{cancelReasonError}</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', border: 'none', color: '#fff' }}>Annuler la commande</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setShowCancelModal(false); setOrderToCancel(null); }}>Fermer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL : TICKET DE DÉPÔT / REÇU CLIENT (TICKET POPUP)
         ======================================================== */}
      {createdOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.12)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', cursor: 'default' }}>
          <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '340px', background: '#fff', color: '#000', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRadius: '16px', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.22), 0 10px 25px -5px rgba(15, 23, 42, 0.10)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'default' }}>

            <div id="receipt-print-area-admin" style={{
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
                <div><span style={{ fontWeight: '700' }}>Mode règlement :</span> {createdOrder.mode_reglement === 'mobile_money' ? 'Mobile Money' : createdOrder.mode_reglement === 'especes' ? 'Espèces' : createdOrder.mode_reglement}</div>
                {createdOrder.reference_momo && (
                  <div><span style={{ fontWeight: '700' }}>Réf. Paiement :</span> <strong style={{ color: 'var(--primary)' }}>{createdOrder.reference_momo}</strong></div>
                )}
                <div><span style={{ fontWeight: '700' }}>Dépôt :</span> {formatDateTime(createdOrder.created_at)}</div>
                <div><span style={{ fontWeight: '700' }}>Échéance :</span> {formatDateTime(createdOrder.due_date)}</div>
                {createdOrder.acompte_paid_at && (
                  <div><span style={{ fontWeight: '700' }}>Règlement Acompte :</span> {formatDateTime(createdOrder.acompte_paid_at)}</div>
                )}
                {createdOrder.solde_paid_at && (
                  <div><span style={{ fontWeight: '700' }}>Règlement Solde :</span> {formatDateTime(createdOrder.solde_paid_at)}</div>
                )}
                {createdOrder.statut === 'annule' && (
                  <div style={{ marginTop: '4px', padding: '6px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626' }}>
                    <span style={{ fontWeight: '700' }}>Motif Annulation :</span> {createdOrder.motif_annulation || 'Non spécifié'}
                  </div>
                )}
              </div>

              {createdOrder.is_subscription_order && createdOrder.subscription_details && (
                <div style={{ padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: '800', color: '#16a34a', borderBottom: '1px dashed #bbf7d0', paddingBottom: '3px', marginBottom: '2px' }}>
                    Suivi Solde Abonnement
                  </div>
                  {createdOrder.subscription_details.immediate_subscription && (
                    <div style={{ fontWeight: '800', color: '#b45309', borderBottom: '1px dashed #fbd38d', paddingBottom: '3px', marginBottom: '4px' }}>
                      Abonnement souscrit : {createdOrder.subscription_details.immediate_subscription.name}
                    </div>
                  )}
                  <div>Forfait : <strong>{createdOrder.subscription_details.name}</strong></div>
                  <div>Vêtements retirés : <strong>-{createdOrder.subscription_details.clothes_deducted}</strong></div>
                  {!createdOrder.subscription_details.immediate_subscription && (
                    <div>Solde précédent : <strong>{createdOrder.subscription_details.previous_balance} vêt.</strong></div>
                  )}
                  <div style={{ borderTop: '1px dashed #bbf7d0', paddingTop: '3px', marginTop: '2px', fontWeight: '800', color: '#16a34a' }}>
                    Nouveau solde : {createdOrder.subscription_details.new_balance} vêtements restants
                  </div>
                </div>
              )}

              {/* ---- TOTAUX ---- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                {createdOrder.remise_pourcentage > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#555555' }}>Prix de base :</span>
                      <span style={{ fontWeight: '600', color: '#555555', textDecoration: 'line-through' }}>
                        {(createdOrder.prix_base_avant_remise || 0).toLocaleString()} FCFA
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#16a34a' }}>
                      <span style={{ fontWeight: '600' }}>Réduction ({createdOrder.remise_pourcentage}%) :</span>
                      <span style={{ fontWeight: '700' }}>
                        -{(createdOrder.remise_montant || 0).toLocaleString()} FCFA
                      </span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#555555', fontWeight: createdOrder.remise_pourcentage > 0 ? '700' : 'normal' }}>Total Commande :</span>
                  <span style={{ fontWeight: '700', color: '#000000' }}>
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
                      <span style={{ color: '#555555' }}>Acompte Payé :</span>
                      <span style={{ fontWeight: '700', color: '#000000' }}>{(createdOrder.avance_payee || 0).toLocaleString()} FCFA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e5e5e5' }}>
                      <span style={{ color: '#555555', fontWeight: '600' }}>Reste à payer :</span>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: (createdOrder.prix_total - createdOrder.avance_payee) > 0 ? '#d32f2f' : '#16a34a' }}>
                        {((createdOrder.prix_total || 0) - (createdOrder.avance_payee || 0)).toLocaleString()} FCFA
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e5e5e5' }}>
                    <span style={{ color: '#16a34a', fontWeight: '800' }}>Reste à payer :</span>
                    <span style={{ fontWeight: '800', fontSize: '14px', color: '#16a34a' }}>
                      0 FCFA
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
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
                  className="btn btn-outline"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#000', borderColor: '#000', padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}
                  onClick={() => {
                    const element = document.getElementById('receipt-print-area-admin');
                    if (element && window.html2pdf) {
                      const opt = {
                        margin: 0.3,
                        filename: `Facture_${createdOrder.identifiant_unique_marquage}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true, logging: false },
                        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
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
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', background: '#000', color: '#fff', border: 'none', padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}
                onClick={() => setCreatedOrder(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {activeDetailsCard && (
        <div className="modal-backdrop">
          <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflow: 'hidden', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.22), 0 10px 25px -5px rgba(15, 23, 42, 0.10)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {activeDetailsCard === 'ca' && <TrendingUp size={20} className="text-primary" />}
                {activeDetailsCard === 'completed' && <CheckCircle size={20} style={{ color: 'var(--status-ready)' }} />}
                {activeDetailsCard === 'active' && <Clock size={20} style={{ color: 'var(--primary)' }} />}
                {activeDetailsCard === 'pending' && <AlertCircle size={20} style={{ color: 'var(--status-pending)' }} />}
                {activeDetailsCard === 'ca' && "Détails Financiers (Chiffre d'Affaires)"}
                {activeDetailsCard === 'completed' && "Détails des Commandes Livrées"}
                {activeDetailsCard === 'active' && "Détails des Commandes Actives"}
                {activeDetailsCard === 'pending' && "Détails des Commandes en Attente"}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={exportKpiToExcel}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '8px',
                    border: '1.5px solid #16a34a',
                    background: 'rgba(22, 163, 74, 0.08)',
                    color: '#16a34a',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(22, 163, 74, 0.08)'; e.currentTarget.style.color = '#16a34a'; }}
                >
                  <Download size={14} />
                  Exporter Excel
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '0.25rem', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setActiveDetailsCard(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Date Filter Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap',
              padding: '0.6rem 0.8rem',
              background: 'var(--bg-app)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>📅 Filtrer par date :</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="date"
                  className="input-control"
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px', width: '135px' }}
                  value={tempKpiDateFrom}
                  onChange={e => setTempKpiDateFrom(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>au</span>
                <input
                  type="date"
                  className="input-control"
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px', width: '135px' }}
                  value={tempKpiDateTo}
                  onChange={e => setTempKpiDateTo(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={() => {
                    setKpiDateFrom(tempKpiDateFrom);
                    setKpiDateTo(tempKpiDateTo);
                  }}
                  style={{
                    padding: '0.35rem 0.95rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--primary)',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-dark)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--primary)'; }}
                >
                  Appliquer
                </button>
                {(tempKpiDateFrom || tempKpiDateTo || kpiDateFrom || kpiDateTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempKpiDateFrom('');
                      setTempKpiDateTo('');
                      setKpiDateFrom('');
                      setKpiDateTo('');
                    }}
                    style={{
                      padding: '0.35rem 0.95rem',
                      borderRadius: '8px',
                      border: '1.5px solid #ef4444',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
              {(kpiDateFrom || kpiDateTo) && (
                <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700, background: 'var(--primary-light)', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>
                  {filterOrdersByKpiDate(orders).length} résultat(s)
                </span>
              )}
            </div>

            <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '0.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {(() => { const fo = filterOrdersByKpiDate(orders); return (<>
                {activeDetailsCard === 'ca' && renderCAReport(fo)}
                {activeDetailsCard === 'completed' && renderCompletedOrdersList(fo)}
                {activeDetailsCard === 'active' && renderActiveOrdersList(fo)}
                {activeDetailsCard === 'pending' && renderPendingOrdersList(fo)}
              </>); })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
