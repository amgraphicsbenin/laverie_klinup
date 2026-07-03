import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
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
  Download
} from 'lucide-react';
import CustomSelect from './CustomSelect';

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

  // Formulaire d'édition
  const [editStaffNom, setEditStaffNom] = useState('');
  const [editStaffPrenom, setEditStaffPrenom] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffTel, setEditStaffTel] = useState('');
  const [editStaffStatut, setEditStaffStatut] = useState('actif');
  const [editStaffPermissions, setEditStaffPermissions] = useState({});

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

      const defaultPerms = {
        can_view_dashboard: selectedMember.role === 'super_admin' || selectedMember.role === 'manager',
        can_manage_orders: true,
        can_manage_crm: true,
        can_edit_catalog: selectedMember.role === 'super_admin' || selectedMember.role === 'manager',
        can_view_logs: selectedMember.role === 'super_admin',
        can_manage_staff: selectedMember.role === 'super_admin'
      };
      setEditStaffPermissions(selectedMember.permissions || defaultPerms);
    }
  }, [selectedStaffId, staff, selectedMember]);

  const handleRoleChangeInForm = (role) => {
    setEditStaffRole(role);
    setEditStaffPermissions({
      can_view_dashboard: role === 'super_admin' || role === 'manager',
      can_manage_orders: true,
      can_manage_crm: true,
      can_edit_catalog: role === 'super_admin' || role === 'manager',
      can_view_logs: role === 'super_admin',
      can_manage_staff: role === 'super_admin'
    });
  };

  const handleSaveStaff = (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    db.updateStaff(selectedStaffId, {
      nom: editStaffNom,
      prenom: editStaffPrenom,
      role: editStaffRole,
      email: editStaffEmail,
      telephone: editStaffTel,
      statut: editStaffStatut,
      permissions: editStaffPermissions
    });
    alert("Profil du personnel mis à jour avec succès !");
    refreshAdminData();
  };

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!newStaffNom || !newStaffPrenom) return;

    const defaultPerms = {
      can_view_dashboard: newStaffRole === 'super_admin' || newStaffRole === 'manager',
      can_manage_orders: true,
      can_manage_crm: true,
      can_edit_catalog: newStaffRole === 'super_admin' || newStaffRole === 'manager',
      can_view_logs: newStaffRole === 'super_admin',
      can_manage_staff: newStaffRole === 'super_admin'
    };

    const newMember = db.addStaff({
      nom: newStaffNom,
      prenom: newStaffPrenom,
      role: newStaffRole,
      email: newStaffEmail,
      telephone: newStaffTel,
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
    refreshAdminData();
  };

  const handleDeleteStaff = async (id) => {
    if (await confirm("Êtes-vous sûr de vouloir supprimer définitivement cet employé ?")) {
      db.deleteStaff(id);
      setSelectedStaffId('');
      refreshAdminData();
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
    en_attente: 'En attente de traitement',
    en_cours_lavage: 'En attente de repassage',
    en_cours_repassage: 'Repassé',
    pret: 'Prêt',
    a_recuperer: 'En attente de Récupération',
    a_livrer: 'En attente de Livraison',
    en_cours_livraison: 'En cours de livraison',
    restitue: 'Livré / Récupéré',
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
    lavage_simple: 'Lavage Simple',
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

  // --- CALCUL DU CHART METIER (VOLUME DE LINGE TRAITE) ---
  let daysOfWeek = [];
  let baseLavage = [];
  let baseRepassage = [];

  const now = new Date();

  // Helper to count articles in an order
  const getOrderClothesCount = (order) => {
    if (Array.isArray(order.detail_articles) && order.detail_articles.length > 0) {
      return order.detail_articles.reduce((sum, item) => sum + Number(item.quantite || 0), 0);
    }
    return 3; // default fallback if empty
  };

  if (chartPeriod === '7_days') {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    baseLavage = [3, 8, 12, 6, 2, 4, 1];
    baseRepassage = [1, 4, 6, 3, 1, 2, 0];

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
    baseLavage = [18, 35, 42, 28, 16, 22, 10];
    baseRepassage = [8, 18, 20, 12, 7, 10, 4];

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
    baseLavage = [85, 120, 145, 95, 110, 130, 75];
    baseRepassage = [40, 55, 70, 45, 50, 60, 35];

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
    if (!newCustNom || !newCustPrenom || !newCustTel || !newCustAdresse) return;

    try {
      const newCustomer = db.addCustomer({
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
    } catch (err) {
      alert("Erreur de création : " + err.message);
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
      refreshAdminData();
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

  const handleStartDelivery = async (order, finalStatus = 'restitue') => {
    setDelivFinalStatus(finalStatus);
    const remainingToPay = order.prix_total - order.avance_payee;
    if (remainingToPay <= 0) {
      if (await confirm(`Confirmer la finalisation de la commande ${order.identifiant_unique_marquage} ?`)) {
        db.updateOrderStatus(order.id, finalStatus);
        refreshAdminData();

        // Notification WhatsApp livraison directe (déjà payé)
        const customer = customers.find(c => c.id === order.customer_id);
        if (customer) {
          const finalStatusLabel = finalStatus === 'a_livrer' ? 'mise en livraison' : finalStatus === 'a_recuperer' ? 'mise à disposition/récupérée' : 'livrée/restituée';
          const text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${order.identifiant_unique_marquage} a été ${finalStatusLabel} avec succès. Merci pour votre confiance et à bientôt chez KLIN UP !`;
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

  const handleCancelOrder = async (orderId) => {
    if (await confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
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

      {/* ========================================================
         ONGLET : DASHBOARD (VUE D'ENSEMBLE)
         ======================================================== */}
      {activeTab === 'dashboard' && (
        <>
          {/* Cartes KPI Donezo Style */}
          <div className="kpi-container">

            {/* Chiffre d'Affaires - Forest Green Theme */}
            <div className="card kpi-card green-theme" style={{ cursor: 'pointer' }} onClick={() => setActiveDetailsCard('ca')}>
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
            <div className="card kpi-card white-theme" style={{ cursor: 'pointer' }} onClick={() => setActiveDetailsCard('completed')}>
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
            <div className="card kpi-card white-theme" style={{ cursor: 'pointer' }} onClick={() => setActiveDetailsCard('active')}>
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
            <div className="card kpi-card white-theme" style={{ cursor: 'pointer' }} onClick={() => setActiveDetailsCard('pending')}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Volume de Linge Traité</h3>
                  <CustomSelect 
                    value={chartPeriod} 
                    onChange={(e) => setChartPeriod(e.target.value)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="7_days">7 derniers jours</option>
                    <option value="30_days">30 derniers jours</option>
                    <option value="all">Tout l'historique</option>
                  </CustomSelect>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }}></span> Lavage
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--secondary)', borderRadius: '50%' }}></span> Repassage
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
                                    background: 'var(--secondary)',
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
                style={{ display: 'flex', gap: '0.5rem' }}
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
                  const isLivreur = s.role === 'livreur';
                  const isAtelier = s.role === 'agent_lavage_repassage';
                  const roleLabel = isSuper ? 'Super Admin' : isMgr ? 'Manager' : isLivreur ? 'Livreur' : isAtelier ? 'Lavage & Repassage' : "Agent d'accueil";
                  const taskLabel = isSuper ? "Supervision générale d'atelier" : isMgr ? "Gestion Caisse & Tarifs" : isLivreur ? "Livraison & Distribution" : isAtelier ? "Atelier & Production" : "Accueil & Marquage";
                  const isOnline = s.role !== 'agent_accueil' && s.role !== 'livreur' && s.role !== 'agent_lavage_repassage'; // simulate Pierre Diallo offline/mobile active

                  return (
                    <div className="team-item" key={s.id}>
                      <div className="team-item-left">
                        <div className="user-avatar" style={{ background: isSuper ? 'var(--primary)' : isMgr ? 'var(--secondary)' : '#64748b', width: '32px', height: '32px', fontSize: '0.75rem' }}>
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

              {/* Taux de Livraison (Horizontal Progress Bar Layout) */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'space-between', padding: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Taux de Livraison
                </h3>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                    {restitutionRate}%
                  </span>
                  <span className="badge" style={{
                    background: restitutionRate >= 90 ? 'var(--success-light)' : 'var(--warning-light)',
                    color: restitutionRate >= 90 ? 'var(--success)' : 'var(--warning)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '20px'
                  }}>
                    {restitutionRate >= 90 ? 'Optimal' : restitutionRate >= 50 ? 'Satisfaisant' : 'Attention'}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Proportion des commandes terminées et restituées avec succès au client par rapport au volume total.
                </p>

                <div style={{ width: '100%', height: '12px', background: 'rgba(226, 232, 240, 0.8)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${restitutionRate}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6 0%, #d946ef 100%)',
                    borderRadius: '6px',
                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
                    transition: 'width 0.8s ease-in-out'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div>
                    Livrées: <strong style={{ color: 'var(--text-primary)' }}>{completedOrdersCount}</strong>
                  </div>
                  <div>
                    En attente/Cours: <strong style={{ color: 'var(--text-primary)' }}>{totalOrdersCount - completedOrdersCount}</strong>
                  </div>
                  <div>
                    Total: <strong style={{ color: 'var(--text-primary)' }}>{totalOrdersCount}</strong>
                  </div>
                </div>
              </div>

              {/* Performance Ventes & Services KPI Card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between', padding: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Performance Services
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '0.25rem 0' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Panier Moyen
                    </span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', lineHeight: 1.2, marginTop: '0.1rem' }}>
                      {averageOrderValue.toLocaleString()} F CFA
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Service Populaire
                      </span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                        {mostPopularService}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Abonnés Actifs
                      </span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                        {activeSubscriptionsCount} clients
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', color: 'var(--text-secondary)' }}>
                  <span>Volume total: {nonCancelledOrdersCount} commandes</span>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>+15% ce mois-ci</span>
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
                let bulletBg = 'var(--status-pending)'; // pending/en_attente
                if (order.statut === 'en_cours_lavage') bulletBg = 'var(--status-washing)';
                if (order.statut === 'pret') bulletBg = 'var(--status-ready)';
                if (order.statut === 'restitue') bulletBg = 'var(--status-delivered)';
                if (order.statut === 'a_livrer') bulletBg = 'var(--primary)';
                if (order.statut === 'a_recuperer') bulletBg = 'var(--status-ready)';
                if (order.statut === 'annule') bulletBg = 'var(--status-late)';

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
                        {getOrderStatusLabel(order)}
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
                  en_attente: 'En attente de traitement',
                  en_cours_lavage: 'En attente de repassage',
                  en_cours_repassage: 'Repassé',
                  pret: 'Prêt',
                  a_livrer: 'En attente de Livraison',
                  a_recuperer: 'En attente de Récupération',
                  en_cours_livraison: 'En cours de livraison'
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
                          <span
                            className={`badge badge-${order.statut}`}
                            style={{
                              fontSize: '0.65rem',
                              cursor: (order.statut === 'a_livrer' || order.statut === 'a_recuperer' || order.statut === 'en_cours_livraison') ? 'pointer' : 'default'
                            }}
                            onClick={(e) => {
                              if (order.statut === 'a_livrer') {
                                e.stopPropagation();
                                handleStatusChange(order.id, 'en_cours_livraison');
                              } else if (order.statut === 'a_recuperer' || order.statut === 'en_cours_livraison') {
                                e.stopPropagation();
                                handleStartDelivery(order, 'restitue');
                              }
                            }}
                          >
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

                      {order.statut === 'a_livrer' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--primary-light)', padding: '0.45rem 0.6rem', borderRadius: '10px', marginTop: '0.1rem' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', gap: '0.25rem' }}>
                            <span>📍 Adresse :</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{customer?.adresse || 'Non renseignée'}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', gap: '0.25rem' }}>
                            <span>📞 Téléphone :</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{customer ? `+${customer.indicatif || '229'} ${customer.telephone}` : 'Non renseigné'}</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.65rem', borderRadius: '6px', width: 'fit-content', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(`Client: ${customer ? `${customer.prenom} ${customer.nom}` : ''}\nTél: ${customer ? `+${customer.indicatif || '229'} ${customer.telephone}` : ''}\nAdresse: ${customer?.adresse || 'Non renseignée'}`);
                            }}
                          >
                            Copier
                          </button>
                        </div>
                      )}

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
                            Lancer le traitement
                          </button>
                        )}
                        {order.statut === 'en_cours_lavage' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                            onClick={() => handleStatusChange(order.id, 'en_cours_repassage')}
                          >
                            Lancer le repassage
                          </button>
                        )}
                        {order.statut === 'en_cours_repassage' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                            onClick={() => handleStatusChange(order.id, 'pret')}
                          >
                            Marquer comme prêt
                          </button>
                        )}
                        {order.statut === 'pret' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                              onClick={() => handleStatusChange(order.id, 'a_livrer')}
                            >
                              À livrer
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                              onClick={() => handleStatusChange(order.id, 'a_recuperer')}
                            >
                              À récupérer
                            </button>
                          </>
                        )}
                        {order.statut === 'a_livrer' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                            onClick={() => handleStatusChange(order.id, 'en_cours_livraison')}
                          >
                            Livrer
                          </button>
                        )}
                        {order.statut === 'a_recuperer' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                            onClick={() => handleStartDelivery(order, 'restitue')}
                          >
                            Récupérer
                          </button>
                        )}
                        {order.statut === 'en_cours_livraison' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', border: 'none' }}
                            onClick={() => handleStartDelivery(order, 'restitue')}
                          >
                            Marquer comme livré
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
              <CustomSelect
                className="input-control"
                style={{ borderRadius: '10px', fontSize: '0.8rem', width: '120px', padding: '0.25rem 0.5rem' }}
                value={historyFilterStatus}
                onChange={(e) => setHistoryFilterStatus(e.target.value)}
              >
                <option value="all">Tous statuts</option>
                <option value="en_attente">En attente</option>
                <option value="en_cours_lavage">En cours</option>
                <option value="pret">Prêt</option>
                <option value="a_livrer">À livrer</option>
                <option value="a_recuperer">À récupérer</option>
                <option value="restitue">Livré</option>
                <option value="annule">Annulé</option>
              </CustomSelect>
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
                          {getOrderStatusLabel(order)}
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

                {/* Section Abonnement CRM */}
                <div className="card" style={{ padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Award size={15} color="var(--primary)" />
                      Forfait d'Abonnement
                    </span>
                    {selectedCrmCustomer.active_subscription && (
                      <span className="badge badge-pret" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>Actif</span>
                    )}
                  </div>

                  {selectedCrmCustomer.active_subscription ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{selectedCrmCustomer.active_subscription.name}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Solde : {selectedCrmCustomer.active_subscription.remaining_clothes} / {selectedCrmCustomer.active_subscription.total_clothes} vêtements
                        </span>
                      </div>

                      {/* Barre de progression premium */}
                      {(() => {
                        const remaining = selectedCrmCustomer.active_subscription.remaining_clothes;
                        const total = selectedCrmCustomer.active_subscription.total_clothes;
                        const percentUsed = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${percentUsed}%`, background: 'var(--primary)', borderRadius: '10px', transition: 'width 0.4s ease' }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                              <span>Consommé : {percentUsed}%</span>
                              <span>Disponible : {remaining} vêtements</span>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', marginTop: '0.1rem' }}>
                        <span>Souscrit le : {new Date(selectedCrmCustomer.active_subscription.subscribed_at).toLocaleDateString('fr-FR')}</span>
                        <span>Expire le : {new Date(selectedCrmCustomer.active_subscription.expires_at).toLocaleDateString('fr-FR')}</span>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleUnsubscribeCrm(selectedCrmCustomer.id)}
                        style={{ padding: '0.4rem', fontSize: '0.72rem', borderRadius: '8px', color: 'var(--status-late)', borderColor: '#fecaca', background: '#fff5f5', marginTop: '0.2rem' }}
                      >
                        Résilier l'abonnement
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <CustomSelect
                        className="input-control"
                        style={{ flexGrow: 1, padding: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
                        value={selectedCrmSubId}
                        onChange={(e) => setSelectedCrmSubId(e.target.value)}
                      >
                        <option value="">-- Choisir une formule --</option>
                        {catalog.filter(item => item.service === 'abonnement').map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.article} ({sub.prix.toLocaleString()} F/mois)</option>
                        ))}
                      </CustomSelect>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleSubscribeCrm(selectedCrmCustomer.id, selectedCrmSubId)}
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '8px' }}
                      >
                        Souscrire
                      </button>
                    </div>
                  )}
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
                                  {getOrderStatusLabel(o)}
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
              <CustomSelect
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
              </CustomSelect>
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
         ONGLET : GESTION DES ACCÈS / PERSONNEL (STAFF ACCESS)
         ======================================================== */}
      {activeTab === 'staff_management' && (
        <div className="grid-2" style={{ gridTemplateColumns: '0.8fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* COLONNE GAUCHE : LISTE DES EMPLOYÉS & DEMANDES DE PIN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Membres de l'Équipe */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  Membres de l'Équipe
                </h3>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowNewStaffModal(true)}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <UserPlus size={14} /> Ajouter
                </button>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '380px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {staff.map(s => {
                  const isSelected = selectedStaffId === s.id;
                  const isSuper = s.role === 'super_admin';
                  const isMgr = s.role === 'manager';
                  const roleLabel = isSuper ? 'Admin' : isMgr ? 'Manager' : s.role === 'livreur' ? 'Livreur' : s.role === 'agent_lavage_repassage' ? 'Atelier' : "Accueil";
                  const isSuspended = s.statut === 'suspendu';

                  return (
                    <div
                      key={s.id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '12px',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        background: isSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        opacity: isSuspended ? 0.65 : 1
                      }}
                      onClick={() => setSelectedStaffId(s.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {s.prenom} {s.nom}
                        </strong>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.65rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '6px',
                            background: isSuper ? 'var(--primary)' : isMgr ? 'var(--secondary)' : '#64748b',
                            color: '#fff'
                          }}
                        >
                          {roleLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                        <span>{s.email || `${s.prenom.toLowerCase()}.${s.nom.toLowerCase()}@klinup.com`}</span>
                        {isSuspended ? (
                          <span style={{ color: 'var(--status-late)', fontWeight: 700 }}>Suspendu</span>
                        ) : (
                          <span style={{ color: 'var(--status-ready)', fontWeight: 700 }}>Actif</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Demandes de réinitialisation PIN */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={18} color="var(--primary)" />
                  Demandes de Reset PIN
                </h3>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '250px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {db.getPinResetRequests().filter(r => r.status === 'pending').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Aucune demande en attente
                  </div>
                ) : (
                  db.getPinResetRequests().filter(r => r.status === 'pending').map(req => (
                    <div
                      key={req.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-app)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{req.staff_name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{req.email}</div>
                        </div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                          {new Date(req.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', borderRadius: '6px', background: 'var(--status-ready)' }}
                          onClick={() => {
                            const res = db.approvePinResetRequest(req.id);
                            if (res) {
                              alert(`Demande approuvée pour ${res.staffMember.prenom} ${res.staffMember.nom} !\n\nNouveau PIN généré : ${res.newPin}\n(Envoyé par email à ${res.staffMember.email})`);
                              refreshAdminData();
                            } else {
                              alert("Erreur: Impossible d'approuver (l'employé n'existe plus ou l'email est invalide).");
                            }
                          }}
                        >
                          Approuver
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', borderRadius: '6px', color: 'var(--status-late)', borderColor: '#fee2e2' }}
                          onClick={async () => {
                            if (await confirm("Rejeter cette demande de réinitialisation ?")) {
                              db.rejectPinResetRequest(req.id);
                              refreshAdminData();
                            }
                          }}
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : FICHE DÉTAILLÉE ET CONFIGURATION DES ACCÈS */}
          <div className="card" style={{ minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
            {selectedMember ? (
              <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Header Profil */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div className="user-avatar" style={{ background: selectedMember.role === 'super_admin' ? 'var(--primary)' : selectedMember.role === 'manager' ? 'var(--secondary)' : selectedMember.role === 'livreur' ? '#3b82f6' : selectedMember.role === 'agent_lavage_repassage' ? '#8b5cf6' : '#64748b', color: '#fff', width: '48px', height: '48px', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    {selectedMember.prenom.charAt(0)}{selectedMember.nom.charAt(0)}
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {selectedMember.prenom} {selectedMember.nom}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                      Rôle principal : <strong style={{ color: 'var(--primary)' }}>{selectedMember.role === 'super_admin' ? 'Super Administrateur' : selectedMember.role === 'manager' ? 'Manager Caisse' : selectedMember.role === 'livreur' ? 'Livreur' : selectedMember.role === 'agent_lavage_repassage' ? 'Agent Lavage/Repassage' : "Agent d'accueil"}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.45rem', color: 'var(--status-late)', borderColor: '#fee2e2' }}
                    onClick={() => handleDeleteStaff(selectedMember.id)}
                    title="Supprimer le profil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Formulaire d'information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Prénom</label>
                    <input
                      type="text"
                      className="input-control"
                      required
                      value={editStaffPrenom}
                      onChange={(e) => setEditStaffPrenom(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      className="input-control"
                      required
                      value={editStaffNom}
                      onChange={(e) => setEditStaffNom(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Email professionnel</label>
                    <input
                      type="email"
                      className="input-control"
                      required
                      value={editStaffEmail}
                      onChange={(e) => setEditStaffEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Non renseigné"
                      value={editStaffTel}
                      onChange={(e) => setEditStaffTel(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Rôle Système</label>
                    <CustomSelect
                      className="input-control"
                      value={editStaffRole}
                      onChange={(e) => handleRoleChangeInForm(e.target.value)}
                    >
                      <option value="super_admin">Super Administrateur (CMS)</option>
                      <option value="manager">Manager Caisse (CMS)</option>
                      <option value="agent_accueil">Agent d'accueil (Mobile App)</option>
                      <option value="livreur">Livreur (Mobile App)</option>
                      <option value="agent_lavage_repassage">Agent de lavage / Repassage (Mobile App)</option>
                    </CustomSelect>
                  </div>
                  <div className="form-group">
                    <label>Statut d'Accès</label>
                    <CustomSelect
                      className="input-control"
                      value={editStaffStatut}
                      onChange={(e) => setEditStaffStatut(e.target.value)}
                    >
                      <option value="actif">Compte Actif (Autorisé)</option>
                      <option value="suspendu">Compte Suspendu (Bloqué)</option>
                    </CustomSelect>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem', alignItems: 'end' }}>
                  <div className="form-group">
                    <label>Code PIN actuel</label>
                    <input
                      type="text"
                      className="input-control"
                      readOnly
                      disabled
                      value={selectedMember.code_pin || 'Non défini'}
                      style={{ background: '#f1f5f9', cursor: 'not-allowed', fontWeight: 'bold', letterSpacing: '2px', textAlign: 'center' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.55rem', fontSize: '0.78rem', fontWeight: 700, width: '100%' }}
                    onClick={() => {
                      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                      db.resetStaffPin(selectedMember.id, newPin);
                      alert(`Code PIN réinitialisé pour ${selectedMember.prenom} ${selectedMember.nom} !\n\nNouveau PIN : ${newPin}\n(Un email a été envoyé à ${selectedMember.email})`);
                      refreshAdminData();
                    }}
                  >
                    Générer nouveau PIN
                  </button>
                </div>

                {/* Habilitations Détaillées */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    <Sliders size={16} color="var(--primary)" />
                    Matrice de Permissions Granulaires
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Configurez précisément les droits d'accès de cet utilisateur au sein de la plateforme.
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.65rem',
                    background: 'var(--bg-app)',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={!!editStaffPermissions.can_view_dashboard}
                        onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_view_dashboard: e.target.checked }))}
                      />
                      Accès Tableau de Bord
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={!!editStaffPermissions.can_manage_orders}
                        onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_manage_orders: e.target.checked }))}
                      />
                      Gérer les Commandes
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={!!editStaffPermissions.can_manage_crm}
                        onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_manage_crm: e.target.checked }))}
                      />
                      Consulter le CRM Clients
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={!!editStaffPermissions.can_edit_catalog}
                        onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_edit_catalog: e.target.checked }))}
                      />
                      Modifier les Tarifs
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={!!editStaffPermissions.can_view_logs}
                        disabled={editStaffRole !== 'super_admin'}
                        onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_view_logs: e.target.checked }))}
                      />
                      Voir Journal d'Audit
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={!!editStaffPermissions.can_manage_staff}
                        disabled={editStaffRole !== 'super_admin'}
                        onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_manage_staff: e.target.checked }))}
                      />
                      Gérer le Personnel
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem' }}>
                    Sauvegarder les modifications
                  </button>
                </div>

              </form>
            ) : (
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '0.5rem' }}>
                <User size={48} style={{ color: 'var(--text-muted)' }} />
                <span>Sélectionnez un employé pour gérer son profil et ses droits d'accès.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================
         ONGLET : PARAMÈTRES SYSTÈME (SETTINGS)
         ======================================================== */}
      {activeTab === 'settings' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Sliders size={18} color="var(--primary)" />
              Configuration Délais & Majorations
            </h3>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Délai Express (heures)</label>
                <input
                  type="number"
                  className="input-control"
                  required
                  min="1"
                  max="168"
                  value={inputExpressHours}
                  onChange={(e) => setInputExpressHours(e.target.value)}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temps de traitement en urgence (ex: 6)</span>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Majoration Express (%)</label>
                <input
                  type="number"
                  className="input-control"
                  required
                  min="0"
                  max="200"
                  value={inputExpressMarkup}
                  onChange={(e) => setInputExpressMarkup(e.target.value)}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Taux additionnel sur les prix de base (ex: 50)</span>
              </div>
            </div>

            <div className="form-group" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
              <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Délai de Livraison Normal (heures)</label>
              <input
                type="number"
                className="input-control"
                required
                min="1"
                max="720"
                value={inputNormalHours}
                onChange={(e) => setInputNormalHours(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temps de traitement standard de laverie (ex: 48)</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 2rem', fontWeight: 700, fontSize: '0.85rem' }}>
                Enregistrer les paramètres
              </button>
            </div>

            <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>État de la Connexion</h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 0, 0, 0.02)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Base de données principale</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {db.isRemote() ? "Connecté en temps réel au cloud Supabase" : "Exécution sur le stockage local (LocalStorage de secours)"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.6rem',
                    borderRadius: '20px',
                    background: db.isRemote() ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: db.isRemote() ? '#10b981' : '#f59e0b',
                    border: db.isRemote() ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                    textTransform: 'uppercase'
                  }}
                >
                  {db.isRemote() ? 'Supabase Cloud' : 'Mode Local'}
                </span>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* ========================================================
         MODAL : AJOUT D'UN NOUVEL EMPLOYÉ
         ======================================================== */}
      {showNewStaffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  <option value="agent_accueil">Agent d'accueil (Mobile App)</option>
                  <option value="manager">Manager Caisse (CMS)</option>
                  <option value="super_admin">Super Administrateur (CMS)</option>
                  <option value="livreur">Livreur (Mobile App)</option>
                  <option value="agent_lavage_repassage">Agent de lavage / Repassage (Mobile App)</option>
                </CustomSelect>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Ajouter</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowNewStaffModal(false)}>Annuler</button>
              </div>
            </form>
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
                <CustomSelect
                  className="input-control"
                  value={newArtCategory}
                  onChange={(e) => setNewArtCategory(e.target.value)}
                >
                  <option value="individuel">Vêtement individuel</option>
                  <option value="abonnement">Formule d'abonnement</option>
                </CustomSelect>
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
                  <CustomSelect
                    className="input-control"
                    value={newArtService}
                    onChange={(e) => setNewArtService(e.target.value)}
                  >
                    <option value="lavage_simple">Lavage Simple</option>
                    <option value="nettoyage_a_sec">Nettoyage à sec</option>
                    <option value="repassage">Repassage</option>
                  </CustomSelect>
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
                <CustomSelect
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
                </CustomSelect>

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
                    {/* Zone d'abonnement dynamique */}
                    {activeCustomer.active_subscription ? (
                      <div style={{ marginTop: '0.4rem', borderTop: '1px dashed rgba(59, 130, 246, 0.2)', paddingTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: subscribePlanId ? 'not-allowed' : 'pointer', fontWeight: 700, color: 'var(--primary)' }}>
                            <input
                              type="checkbox"
                              checked={payWithSubscription}
                              disabled={!!subscribePlanId}
                              onChange={(e) => setPayWithSubscription(e.target.checked)}
                            />
                            Régler avec l'abonnement
                          </label>
                          <span style={{ fontWeight: 700 }}>
                            ({activeCustomer.active_subscription.remaining_clothes} vêtements restants)
                          </span>
                        </div>

                        {/* Alerte si solde insuffisant et pas encore de renouvellement choisi */}
                        {payWithSubscription && !subscribePlanId && getTotalClothesCount() > activeCustomer.active_subscription.remaining_clothes && (
                          <div style={{ color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                            <AlertCircle size={12} /> Solde insuffisant ({getTotalClothesCount()} requis)
                          </div>
                        )}

                        {/* Menu de renouvellement / changement */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.2rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>Renouveler / Changer d'abonnement :</span>
                          <CustomSelect
                            className="input-control"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', width: '100%', background: 'var(--bg-card)' }}
                            value={subscribePlanId}
                            onChange={(e) => setSubscribePlanId(e.target.value)}
                          >
                            <option value="">-- Conserver l'abonnement en cours --</option>
                            {catalog.filter(c => c.categorie === 'abonnement').map(p => (
                              <option key={p.id} value={p.id}>{p.article} ({p.prix.toLocaleString()} F)</option>
                            ))}
                          </CustomSelect>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.4rem', borderTop: '1px dashed rgba(59, 130, 246, 0.2)', paddingTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Souscrire immédiatement à un abonnement :</span>
                          <CustomSelect
                            className="input-control"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', width: '100%', background: 'var(--bg-card)' }}
                            value={subscribePlanId}
                            onChange={(e) => setSubscribePlanId(e.target.value)}
                          >
                            <option value="">-- Pas d'abonnement --</option>
                            {catalog.filter(c => c.categorie === 'abonnement').map(p => (
                              <option key={p.id} value={p.id}>{p.article} ({p.prix.toLocaleString()} F)</option>
                            ))}
                          </CustomSelect>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Clothes & Services Selection — NEW Design */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Type de Linge &amp; Services</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  marginTop: '0.4rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  paddingRight: '2px'
                }}>
                  {catalogClothes.map(cloth => {
                    const qty = articleQuantities[cloth] || 0;
                    const selectedSvc = articleServices[cloth] || 'lavage_simple';
                    const isSelected = qty > 0;

                    const servicesForCloth = catalog.filter(c => c.categorie !== 'abonnement' && c.article === cloth);
                    const activeServices = servicesForCloth.length > 0 ? servicesForCloth : [
                      { service: 'lavage_simple', prix: 1500 },
                      { service: 'nettoyage_a_sec', prix: 3000 },
                      { service: 'repassage', prix: 1000 }
                    ];
                    const activeServiceObj = activeServices.find(s => s.service === selectedSvc) || activeServices[0];
                    const unitPrice = activeServiceObj ? activeServiceObj.prix : 1500;

                    // Service icon mapping
                    const svcIcons = { lavage_simple: '🫧', nettoyage_a_sec: '✨', repassage: '♨️' };

                    return (
                      <div key={cloth} style={{
                        gridColumn: isSelected ? 'span 3' : 'span 1',
                        display: 'flex',
                        flexDirection: isSelected ? 'row' : 'column',
                        alignItems: isSelected ? 'center' : 'stretch',
                        padding: isSelected ? '0.6rem 0.8rem' : '0.65rem 0.5rem',
                        background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        gap: isSelected ? '0.75rem' : '0.3rem',
                        boxShadow: isSelected ? '0 2px 8px rgba(59,130,246,0.10)' : 'none',
                      }}>

                        {/* LEFT: Item name & qty controls */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: isSelected ? '0.5rem' : '0',
                          flexDirection: isSelected ? 'row' : 'column',
                          flexShrink: 0,
                          flex: isSelected ? '0 0 auto' : '1'
                        }}>
                          {/* Quantity badge + item name (collapsed: column, expanded: row) */}
                          {!isSelected && (
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(cloth, 1)}
                              style={{
                                width: '36px', height: '36px',
                                borderRadius: '50%',
                                border: '2px solid var(--border-color)',
                                background: 'var(--bg-app)',
                                color: 'var(--text-muted)',
                                fontSize: '1.2rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              +
                            </button>
                          )}

                          {isSelected && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(cloth, -1)}
                                style={{
                                  width: '26px', height: '26px', borderRadius: '50%',
                                  border: '1.5px solid var(--border-color)',
                                  background: 'var(--bg-card)', color: 'var(--text-secondary)',
                                  fontSize: '0.95rem', fontWeight: 700,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >−</button>
                              <span style={{
                                minWidth: '28px', textAlign: 'center',
                                fontSize: '0.95rem', fontWeight: 800,
                                color: 'var(--primary)',
                                background: 'white',
                                borderRadius: '8px',
                                padding: '0.1rem 0.35rem',
                                border: '1px solid rgba(59,130,246,0.2)',
                              }}>{qty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(cloth, 1)}
                                style={{
                                  width: '26px', height: '26px', borderRadius: '50%',
                                  border: '1.5px solid var(--primary)',
                                  background: 'var(--primary)', color: 'white',
                                  fontSize: '0.95rem', fontWeight: 700,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >+</button>
                            </div>
                          )}

                          <span style={{
                            fontSize: isSelected ? '0.85rem' : '0.72rem',
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                            textAlign: 'center',
                            lineHeight: 1.2,
                          }}>{cloth}</span>
                        </div>

                        {/* RIGHT (when expanded): service pills + subtotal */}
                        {isSelected && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, flexWrap: 'wrap' }}>
                            {activeServices.map(s => {
                              const isActiveSvc = selectedSvc === s.service;
                              return (
                                <button
                                  key={s.service}
                                  type="button"
                                  onClick={() => handleUpdateService(cloth, s.service)}
                                  style={{
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '20px',
                                    border: isActiveSvc ? '1.5px solid var(--primary)' : '1.5px solid var(--border-color)',
                                    background: isActiveSvc ? 'var(--primary)' : 'var(--bg-card)',
                                    color: isActiveSvc ? 'white' : 'var(--text-secondary)',
                                    fontSize: '0.68rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    whiteSpace: 'nowrap',
                                  }}
                                >{svcIcons[s.service] || ''} {serviceLabels[s.service] || s.service}</button>
                              );
                            })}
                          </div>
                        )}

                        {/* Subtotal on the far right when selected */}
                        {isSelected && (
                          <span style={{
                            fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)',
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


              {/* Form Settings Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem' }}>Urgence</label>
                  <CustomSelect
                    className="input-control"
                    style={{ padding: '0.45rem', fontSize: '0.8rem', borderRadius: '8px' }}
                    value={niveauUrgence}
                    onChange={(e) => setNiveauUrgence(e.target.value)}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Express">Express (+50%)</option>
                  </CustomSelect>
                </div>

                <div className="form-group" style={{ marginBottom: 0, gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem' }}>Règlement</label>
                  <CustomSelect
                    className="input-control"
                    style={{ padding: '0.45rem', fontSize: '0.8rem', borderRadius: '8px' }}
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
                  </CustomSelect>
                </div>
              </div>

              {(!payWithSubscription || !!subscribePlanId) && (
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
              )}

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#555555' }}>Total Commande :</span>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflow: 'hidden', background: 'var(--bg-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
