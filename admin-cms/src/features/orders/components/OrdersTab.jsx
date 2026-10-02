import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../../../services/db';
import {
  ShoppingBag,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Ban,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Phone,
  MapPin,
  Sparkles,
  Ticket,
  Clock,
  Truck,
  Package,
  User,
  Check,
  Zap,
  Download,
  Printer,
  CreditCard,
  Building2,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Tag,
  Shirt
} from 'lucide-react';
import { IconTag, IconUser, IconPhone, IconShirt } from '@tabler/icons-react';
import CustomSelect from '../../../components/CustomSelect';
import MultiSearchInput from '../../../components/ui/MultiSearchInput';
import { exportOrdersCSV } from '../../../utils/exportUtils';

// Helper component for rich Action Dropdown items
function ActionMenuItem({ icon: Icon, iconColor, label, onClick, color, isBold = false, subtitle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.5rem 0.85rem',
        background: hovered ? 'var(--bg-app)' : 'transparent',
        border: 'none',
        width: '100%',
        textAlign: 'left',
        fontSize: '0.76rem',
        fontWeight: isBold ? 700 : 600,
        color: color || 'var(--text-primary)',
        cursor: 'pointer',
        transition: 'background 0.15s ease'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        flexShrink: 0
      }}>
        <Icon size={14} color={iconColor || color || 'currentColor'} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span>{label}</span>
        {subtitle && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '1px' }}>
            {subtitle}
          </span>
        )}
      </div>
    </button>
  );
}

// Types de recherche supportés dans la barre de recherche (icônes Tabler Lined)
const SEARCH_TYPES = [
  { id: 'id_code', label: 'N° Commande / Code', icon: IconTag, placeholder: 'Entrez l\'ID ou code marquage...' },
  { id: 'customer', label: 'Nom Client', icon: IconUser, placeholder: 'Nom ou prénom du client...' },
  { id: 'phone', label: 'Téléphone', icon: IconPhone, placeholder: 'Numéro de tél (ex: 97000000)...' },
  { id: 'article', label: 'Article', icon: IconShirt, placeholder: 'Nom d\'article (ex: Chemise, Robe...)...' }
];

export default function OrdersTab({
  orders = [],
  customers = [],
  stores: propStores,
  currentUser,
  atelierFilter = 'all',
  setAtelierFilter,
  isOrderLate = () => false,
  serviceLabels = {},
  handleStatusChange,
  handleValidateLivreurOrder,
  handleStartDelivery,
  copyToClipboard,
  formatDateTime = (d) => String(d || ''),
  handleCancelOrder,
  setShowOrderRegistrationModal,
  historySearchQuery = '',
  setHistorySearchQuery,
  historyFilterStatus = 'all',
  setHistoryFilterStatus,
  getOrderStatusLabel,
  setCreatedOrder
}) {
  // Local state
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [activeActionDropdown, setActiveActionDropdown] = useState(null); // { order, coords: { top, bottom, right } }
  const [searchType, setSearchType] = useState('id_code'); // 'id_code' | 'customer' | 'phone' | 'article'
  const [searchQuery, setSearchQuery] = useState(historySearchQuery || '');
  const [selectedStatus, setSelectedStatus] = useState(historyFilterStatus || 'all');
  const [selectedStore, setSelectedStore] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all', 'express', 'retard', 'reste_a_payer', 'solde', 'actives'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (défaut : plus récent au plus ancien), 'asc'

  const currentSearchTypeObj = SEARCH_TYPES.find(t => t.id === searchType) || SEARCH_TYPES[0];
  const searchPlaceholder = currentSearchTypeObj.placeholder;

  // Pagination states (Style Journaux d'Audit)
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(15);

  // Ref for handling clicks outside the active dropdown
  const dropdownRef = useRef(null);

  // Available stores
  const stores = propStores && propStores.length > 0 ? propStores : (db.getStores ? db.getStores() : []);

  // Sync external search query if changed
  useEffect(() => {
    if (setHistorySearchQuery) {
      setHistorySearchQuery(searchQuery);
    }
  }, [searchQuery, setHistorySearchQuery]);

  useEffect(() => {
    if (setHistoryFilterStatus) {
      setHistoryFilterStatus(selectedStatus);
    }
  }, [selectedStatus, setHistoryFilterStatus]);

  // Click outside and dynamic repositioning on scroll for the action dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (activeActionDropdown?.triggerEl && activeActionDropdown.triggerEl.contains(event.target)) {
          return;
        }
        setActiveActionDropdown(null);
      }
    };

    const handleScroll = (event) => {
      // Si l'utilisateur scrolle dans le menu lui-même, ne pas fermer
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }

      // Repositionner le menu pour suivre le bouton de la ligne lors du scroll au lieu de le fermer
      if (activeActionDropdown?.triggerEl) {
        const rect = activeActionDropdown.triggerEl.getBoundingClientRect();
        // Fermer uniquement si le bouton sort très largement du viewport (scroll au-delà)
        if (rect.bottom < -50 || rect.top > window.innerHeight + 50) {
          setActiveActionDropdown(null);
          return;
        }
        const menuEstimatedHeight = 350;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpward = spaceBelow < menuEstimatedHeight && rect.top > menuEstimatedHeight;

        setActiveActionDropdown(prev => prev ? ({
          ...prev,
          coords: {
            top: openUpward ? undefined : rect.bottom + 6,
            bottom: openUpward ? (window.innerHeight - rect.top + 6) : undefined,
            right: Math.max(16, window.innerWidth - rect.right)
          }
        }) : null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeActionDropdown]);

  const toggleExpand = (orderId) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const handleCopy = (orderId, text) => {
    if (copyToClipboard) {
      copyToClipboard(text);
    } else {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleActionDropdown = (e, order) => {
    e.stopPropagation();
    if (activeActionDropdown?.order?.id === order.id) {
      setActiveActionDropdown(null);
      return;
    }
    const triggerEl = e.currentTarget;
    const rect = triggerEl.getBoundingClientRect();
    const menuEstimatedHeight = 350;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuEstimatedHeight && rect.top > menuEstimatedHeight;

    setActiveActionDropdown({
      order,
      triggerEl,
      coords: {
        top: openUpward ? undefined : rect.bottom + 6,
        bottom: openUpward ? (window.innerHeight - rect.top + 6) : undefined,
        right: Math.max(16, window.innerWidth - rect.right)
      }
    });
  };

  // Badges configuration for statuses
  const statusBadgesConfig = {
    en_attente_validation: { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706', border: 'rgba(217, 119, 6, 0.28)', label: 'À valider (Livreur)' },
    en_attente: { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: 'rgba(245, 158, 11, 0.28)', label: 'En attente' },
    attente: { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: 'rgba(245, 158, 11, 0.28)', label: 'En attente' },
    traitement: { bg: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', border: 'rgba(124, 58, 237, 0.28)', label: 'Traitement' },
    en_cours_lavage: { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', border: 'rgba(37, 99, 235, 0.28)', label: 'Lavage' },
    lavage_cours: { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', border: 'rgba(37, 99, 235, 0.28)', label: 'Lavage' },
    en_cours_repassage: { bg: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', border: 'rgba(13, 148, 136, 0.28)', label: 'Repassage' },
    repassage_cours: { bg: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', border: 'rgba(13, 148, 136, 0.28)', label: 'Repassage' },
    pret: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.28)', label: 'Prêt' },
    a_livrer: { bg: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', border: 'rgba(79, 70, 229, 0.28)', label: 'À livrer' },
    a_recuperer: { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706', border: 'rgba(217, 119, 6, 0.28)', label: 'À récupérer' },
    en_cours_livraison: { bg: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', border: 'rgba(79, 70, 229, 0.25)', label: 'En livraison' },
    restitue: { bg: 'rgba(16, 185, 129, 0.10)', color: '#059669', border: 'rgba(16, 185, 129, 0.25)', label: 'Livrée / Restituée' },
    annule: { bg: 'rgba(239, 68, 68, 0.10)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)', label: 'Annulée' }
  };

  const getStatusBadge = (order) => {
    const fallbackLabel = getOrderStatusLabel ? getOrderStatusLabel(order) : order.statut;
    const cfg = statusBadgesConfig[order.statut] || {
      bg: 'rgba(100, 116, 139, 0.12)',
      color: 'var(--text-secondary)',
      border: 'rgba(100, 116, 139, 0.25)',
      label: fallbackLabel
    };
    return cfg;
  };

  // High-level KPI calculations
  const activeOrders = orders.filter(o => o.statut !== 'restitue' && o.statut !== 'annule');
  const expressOrdersCount = activeOrders.filter(o => o.niveau_urgence === 'Express').length;
  const readyOrdersCount = activeOrders.filter(o => ['pret', 'a_livrer', 'a_recuperer'].includes(o.statut)).length;
  const lateOrdersCount = activeOrders.filter(o => isOrderLate(o)).length;

  // Filter & Sort Logic: Default sorted from NEWEST to OLDEST (created_at / date_depot descending)
  const filteredOrders = orders.filter(order => {
    const customer = customers.find(c => c.id === order.customer_id);
    const clientName = customer ? `${customer.prenom || ''} ${customer.nom || ''}`.toLowerCase() : (order.client_name || '').toLowerCase();
    const rawClientPhone = customer ? String(customer.telephone || '') : String(order.client_telephone || '');
    const clientPhone = rawClientPhone.toLowerCase();
    const phoneDigits = rawClientPhone.replace(/\D/g, '');
    const orderIdStr = String(order.id || '').toLowerCase();
    const code = String(order.identifiant_unique_marquage || '').toLowerCase();
    const article = String(order.type_article || '').toLowerCase();
    const service = String(serviceLabels[order.type_service] || order.type_service || '').toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');

    // Text search matching selon le type de recherche sélectionné
    if (q) {
      const matchIdCode = orderIdStr.includes(q) || code.includes(q);
      const matchCustomer = clientName.includes(q);
      const matchPhone = clientPhone.includes(q) || (qDigits.length >= 3 && phoneDigits.includes(qDigits));
      const itemsArticle = (order.items || order.articles || [])
        .map(it => it.article || it.nom || it.name || '')
        .join(' ')
        .toLowerCase();
      const matchArticle = article.includes(q) || itemsArticle.includes(q);
      const matchService = service.includes(q);

      let matches = false;
      if (searchType === 'id_code') {
        matches = matchIdCode;
      } else if (searchType === 'customer') {
        matches = matchCustomer;
      } else if (searchType === 'phone') {
        matches = matchPhone;
      } else if (searchType === 'article') {
        matches = matchArticle;
      } else {
        matches = matchIdCode;
      }

      if (!matches) return false;
    }

    // Status filter
    if (selectedStatus !== 'all') {
      if (order.statut !== selectedStatus) return false;
    }

    // Store filter
    if (selectedStore !== 'all') {
      const matchStore = String(order.store_id || '') === String(selectedStore) ||
        stores.some(st => String(st.id) === String(selectedStore) && String(st.code) === String(order.store_id));
      if (!matchStore) return false;
    }

    // Quick filters
    const remaining = (order.prix_total || 0) - (order.avance_payee || 0);
    if (quickFilter === 'express') {
      if (order.niveau_urgence !== 'Express') return false;
    } else if (quickFilter === 'retard') {
      if (!isOrderLate(order)) return false;
    } else if (quickFilter === 'reste_a_payer') {
      if (remaining <= 0) return false;
    } else if (quickFilter === 'solde') {
      if (remaining > 0) return false;
    } else if (quickFilter === 'actives') {
      if (order.statut === 'restitue' || order.statut === 'annule') return false;
    }

    return true;
  }).sort((a, b) => {
    // Par défaut du plus récent au plus ancien
    const dateA = new Date(a.created_at || a.date_depot || 0).getTime();
    const dateB = new Date(b.created_at || b.date_depot || 0).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Réinitialiser la page courante lors d'un changement de filtre
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchType, selectedStatus, selectedStore, quickFilter, sortOrder]);

  // Calculs de pagination (Même système que les journaux d'audit)
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentPage, ordersPerPage]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ========================================================
          1. BANNIÈRE DE STATISTIQUES EN TÊTE (KPI SUMMARY CARDS)
          ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.9rem'
      }}>
        {/* KPI 1 : Commandes Actives */}
        <div className="card" style={{
          padding: '1rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              En Atelier (Actives)
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '2px' }}>
              {activeOrders.length} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>dépôts</span>
            </div>
          </div>
        </div>

        {/* KPI 2 : Traitements Express */}
        <div className="card" style={{
          padding: '1rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Flame size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Traitements Express
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#d97706', lineHeight: 1.1, marginTop: '2px' }}>
              {expressOrdersCount} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>urgentes</span>
            </div>
          </div>
        </div>

        {/* KPI 3 : Prêtes / À Livrer */}
        <div className="card" style={{
          padding: '1rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Prêtes / À Livrer
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#10b981', lineHeight: 1.1, marginTop: '2px' }}>
              {readyOrdersCount} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>disponibles</span>
            </div>
          </div>
        </div>

        {/* KPI 4 : Retards en Atelier */}
        <div className="card" style={{
          padding: '1rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: lateOrdersCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(100, 116, 139, 0.1)',
            color: lateOrdersCount > 0 ? '#ef4444' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Alertes Retard
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: lateOrdersCount > 0 ? '#ef4444' : 'var(--text-primary)', lineHeight: 1.1, marginTop: '2px' }}>
              {lateOrdersCount} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>dépassements</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. FILTRES RAPIDES ADMIN (COMPACT, ÉLÉGANT, AU-DESSUS DU TABLEAU)
          ======================================================== */}
      <div className="card" style={{
        padding: '0.85rem 1.15rem',
        borderRadius: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Ligne 1 : Barre de Recherche + Sélecteurs de filtres + Boutons d'Action */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem'
        }}>
          {/* Bloc Recherche & Sélecteurs */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.55rem', flex: 1, minWidth: '280px' }}>
            {/* Barre de Recherche Multi-Critères (Sélecteur Type + Champ Saisie dynamique) */}
            <MultiSearchInput
              searchTypes={SEARCH_TYPES}
              searchType={searchType}
              onSearchTypeChange={setSearchType}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              width="390px"
              minWidth="340px"
              selectWidth="155px"
            />

            {/* Sélecteur de Statut */}
            <div style={{ width: '150px' }}>
              <CustomSelect
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  fontSize: '0.76rem',
                  padding: '0.42rem 0.65rem',
                  borderRadius: '9px',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <option value="all">Tous statuts</option>
                <option value="en_attente_validation">À valider (Livreur)</option>
                <option value="en_attente">En attente</option>
                <option value="traitement">Traitement</option>
                <option value="en_cours_lavage">Lavage</option>
                <option value="en_cours_repassage">Repassage</option>
                <option value="pret">Prêt</option>
                <option value="a_livrer">À livrer</option>
                <option value="a_recuperer">À récupérer</option>
                <option value="en_cours_livraison">En livraison</option>
                <option value="restitue">Livré / Restitué</option>
                <option value="annule">Annulé</option>
              </CustomSelect>
            </div>

            {/* Sélecteur de Point de Laverie (Store) si plusieurs stores */}
            {stores.length > 0 && (
              <div style={{ width: '160px' }}>
                <CustomSelect
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  style={{
                    fontSize: '0.76rem',
                    padding: '0.42rem 0.65rem',
                    borderRadius: '9px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <option value="all">Tous les points</option>
                  {stores.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.nom} ({st.code})
                    </option>
                  ))}
                </CustomSelect>
              </div>
            )}
          </div>

          {/* Boutons d'Action (Exporter & Nouvelle Commande) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => exportOrdersCSV(filteredOrders, customers)}
              style={{
                padding: '0.42rem 0.75rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'var(--bg-card)'
              }}
              title="Exporter le tableau actuel en CSV"
            >
              <Download size={13} /> Exporter CSV
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowOrderRegistrationModal(true)}
              style={{
                padding: '0.42rem 0.9rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'var(--primary)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
              }}
            >
              <Plus size={14} /> Nouvelle Commande
            </button>
          </div>
        </div>

        {/* Ligne 2 : Pastilles de filtres rapides (Quick filter pills) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          borderTop: '1px dashed var(--border-color)',
          paddingTop: '0.6rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.2rem' }}>
              Filtres rapides :
            </span>

            {[
              { id: 'all', label: `Toutes (${orders.length})` },
              { id: 'actives', label: `Actives (${activeOrders.length})` },
              { id: 'express', label: `Express (${expressOrdersCount})`, icon: Zap },
              { id: 'retard', label: `Retard (${lateOrdersCount})`, icon: AlertTriangle },
              { id: 'reste_a_payer', label: 'Reste à payer', icon: CreditCard },
              { id: 'solde', label: 'Soldées', icon: CheckCircle2 }
            ].map(pill => {
              const isActive = quickFilter === pill.id;
              const PillIcon = pill.icon;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setQuickFilter(pill.id)}
                  style={{
                    padding: '0.22rem 0.55rem',
                    fontSize: '0.71rem',
                    fontWeight: 700,
                    borderRadius: '7px',
                    border: isActive ? '1px solid transparent' : '1px solid var(--border-color)',
                    background: isActive ? 'var(--primary)' : 'var(--bg-app)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {PillIcon && <PillIcon size={12} />}
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tri & Compteur de résultats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.71rem',
                color: 'var(--text-secondary)',
                fontWeight: 600
              }}
              title="Changer l'ordre de tri chronologique"
            >
              <ArrowUpDown size={12} />
              <span>{sortOrder === 'desc' ? 'Plus récentes en premier' : 'Plus anciennes en premier'}</span>
            </button>

            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.15rem 0.55rem', borderRadius: '12px' }}>
              {filteredOrders.length} {filteredOrders.length <= 1 ? 'commande' : 'commandes'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. TABLEAU DES COMMANDES (STYLE TABLEAU TRÈS AVANCÉ)
          ======================================================== */}
      <div className="card" style={{
        padding: 0,
        borderRadius: '18px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        minHeight: '380px'
      }}>
        {/* Conteneur défilable horizontalement avec Colonne Action Sticky à droite */}
        <div style={{ overflowX: 'auto', width: '100%', position: 'relative' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.78rem'
          }}>
            {/* Table Header */}
            <thead>
              <tr style={{
                background: 'var(--bg-app)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)'
              }}>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', width: '40px' }}>
                  #
                </th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  ID de Commande
                </th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Date & Heure
                </th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Client & Coordonnées
                </th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Point de Laverie
                </th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Articles & Prestations
                </th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Statut
                </th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Finances & Règlement
                </th>
                <th style={{ padding: '0.75rem 0.85rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Retrait / Mode
                </th>
                {/* COLONNE ACTION FIXE (STICKY NON DÉFILABLE HORIZONTALEMENT) */}
                <th style={{
                  padding: '0.75rem 1rem',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  right: 0,
                  background: 'var(--bg-app)',
                  zIndex: 10,
                  boxShadow: '-5px 0 12px rgba(0,0,0,0.06)',
                  textAlign: 'center',
                  minWidth: '115px'
                }}>
                  Action
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Ticket size={36} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Aucune commande trouvée</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        Modifiez vos critères de recherche ou réinitialisez les filtres.
                      </div>
                      {(searchQuery || searchType !== 'id_code' || selectedStatus !== 'all' || selectedStore !== 'all' || quickFilter !== 'all') && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => {
                            setSearchQuery('');
                            setSearchType('id_code');
                            setSelectedStatus('all');
                            setSelectedStore('all');
                            setQuickFilter('all');
                          }}
                          style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, idx) => {
                  const customer = customers.find(c => c.id === order.customer_id);
                  const clientName = customer ? `${customer.prenom} ${customer.nom}` : (order.client_name || 'Client B2B');
                  const clientPhone = customer ? customer.telephone : (order.client_telephone || '-');
                  const isExpress = order.niveau_urgence === 'Express';
                  const isLate = isOrderLate(order);
                  const remainingToPay = (order.prix_total || 0) - (order.avance_payee || 0);
                  const statusCfg = getStatusBadge(order);
                  const isExpanded = expandedOrderId === order.id;
                  const isActionOpen = activeActionDropdown?.order?.id === order.id;

                  // Store matching
                  const currentStore = stores.find(s => s.id === order.store_id || s.code === order.store_id) || stores[0];

                  return (
                    <React.Fragment key={order.id || idx}>
                      {/* Ligne principale de commande */}
                      <tr
                        style={{
                          borderBottom: isExpanded ? 'none' : '1px solid var(--border-color)',
                          background: isExpress ? 'rgba(245, 158, 11, 0.02)' : (idx % 2 === 0 ? 'var(--bg-card)' : 'rgba(0,0,0,0.01)'),
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* 0. Bouton d'extension détail (+) */}
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => toggleExpand(order.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: isExpanded ? 'var(--primary)' : 'var(--text-muted)',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'transform 0.15s ease'
                            }}
                            title={isExpanded ? "Replier les détails" : "Déplier les détails financiers et articles"}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>

                        {/* 1. ID de Commande */}
                        <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {(() => {
                                const displayId = String(order.id || order.identifiant_unique_marquage || '');
                                return (
                                  <>
                                    <span style={{
                                      fontFamily: 'var(--font-title)',
                                      fontWeight: 800,
                                      fontSize: '0.84rem',
                                      color: 'var(--text-primary)',
                                      letterSpacing: '0.2px'
                                    }}>
                                      {displayId}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(order.id, displayId)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: copiedId === order.id ? '#10b981' : 'var(--text-muted)',
                                        padding: 0,
                                        display: 'inline-flex',
                                        alignItems: 'center'
                                      }}
                                      title="Copier l'ID de commande"
                                    >
                                      {copiedId === order.id ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                  </>
                                );
                              })()}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                              {isExpress && (
                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '6px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#d97706',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}>
                                  <Flame size={10} /> Express
                                </span>
                              )}
                              {isLate && (
                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}>
                                  <AlertTriangle size={10} /> Retard
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Date & Heure */}
                        <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {formatDateTime(order.created_at || order.date_depot)}
                            </span>
                            {order.date_retrait_prevue && (
                              <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Clock size={10} /> Prévu : {formatDateTime(order.date_retrait_prevue)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Client & Coordonnées */}
                        <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', minWidth: '170px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <User size={13} color="var(--primary)" />
                              <span>{clientName}</span>
                            </div>
                            <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Phone size={11} color="var(--text-muted)" />
                              <span>{clientPhone}</span>
                            </div>
                            {customer?.adresse && (
                              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={customer.adresse}>
                                <MapPin size={10} />
                                <span>{customer.adresse}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 4. Point de Laverie (Store) */}
                        <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <select
                            value={(() => {
                              const match = stores.find(s => s.id === order.store_id || s.code === order.store_id);
                              return match ? match.id : (stores[0]?.id || order.store_id || '');
                            })()}
                            onClick={(e) => e.stopPropagation()}
                            onChange={async (e) => {
                              e.stopPropagation();
                              const newSid = e.target.value;
                              if (db.updateOrderStore) {
                                await db.updateOrderStore(order.id, newSid);
                              }
                            }}
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--primary)',
                              background: 'rgba(59, 130, 246, 0.08)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              borderRadius: '7px',
                              padding: '0.22rem 0.45rem',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            {stores.map(st => (
                              <option key={st.id} value={st.id}>
                                {st.nom} ({st.code})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 5. Articles & Prestations */}
                        <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', minWidth: '160px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Package size={13} color="var(--primary)" />
                              <span>{order.type_article || 'Articles textiles'}</span>
                              {order.items && order.items.length > 1 && (
                                <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '0.05rem 0.35rem', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                  +{order.items.length}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                              <span style={{ background: 'var(--bg-app)', padding: '0.1rem 0.4rem', borderRadius: '5px', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                                {serviceLabels[order.type_service] || order.type_service || 'Lavage standard'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 6. Statut */}
                        <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontSize: '0.71rem',
                            fontWeight: 700,
                            padding: '0.24rem 0.65rem',
                            borderRadius: '16px',
                            background: statusCfg.bg,
                            color: statusCfg.color,
                            border: `1px solid ${statusCfg.border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusCfg.color }}></span>
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* 7. Finances & Règlement */}
                        <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                              {(order.prix_total || 0).toLocaleString()} F CFA
                            </div>
                            <div style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Avance: {(order.avance_payee || 0).toLocaleString()} F</span>
                              {remainingToPay > 0 ? (
                                <span style={{ color: '#d97706', fontWeight: 800, background: 'rgba(245, 158, 11, 0.1)', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>
                                  Dû: {remainingToPay.toLocaleString()} F
                                </span>
                              ) : (
                                <span style={{ color: '#10b981', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>
                                  Soldé
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 8. Retrait / Mode */}
                        <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {order.type_depot === 'livreur' || order.type_retrait === 'livraison' || order.adresse_livraison ? (
                              <span style={{ fontSize: '0.71rem', fontWeight: 600, color: '#4f46e5', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Truck size={13} /> Livraison
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Building2 size={13} /> Comptoir
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 9. COLONNE ACTION FIXE (STICKY NON DÉFILABLE HORIZONTALEMENT) */}
                        <td style={{
                          padding: '0.75rem 0.85rem',
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          position: 'sticky',
                          right: 0,
                          background: 'var(--bg-card)',
                          zIndex: 10,
                          boxShadow: '-5px 0 12px rgba(0,0,0,0.06)',
                          whiteSpace: 'nowrap'
                        }}>
                          <button
                            type="button"
                            onClick={(e) => toggleActionDropdown(e, order)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              background: isActionOpen ? 'var(--primary)' : 'var(--bg-app)',
                              color: isActionOpen ? '#fff' : 'var(--text-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <SlidersHorizontal size={12} />
                            <span>Action</span>
                            <ChevronDown size={12} style={{ transform: isActionOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                          </button>
                        </td>
                      </tr>

                      {/* TIROIR D'EXTENSION / ACCORDÉON DE DÉTAIL D'UNE COMMANDE */}
                      {isExpanded && (
                        <tr style={{ background: 'rgba(59, 130, 246, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                          <td colSpan={10} style={{ padding: '1rem 1.5rem' }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                              gap: '1.25rem',
                              background: 'var(--bg-card)',
                              padding: '1.15rem',
                              borderRadius: '14px',
                              border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}>
                              {/* Colonne A : Coordonnées Complètes & Logistique */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.76rem' }}>
                                <div style={{ fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                  <User size={14} /> Coordonnées & Prise en Charge
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                  Client : <strong style={{ color: 'var(--text-primary)' }}>{clientName}</strong>
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                  Téléphone : <strong style={{ color: 'var(--text-primary)' }}>{customer ? `+${customer.indicatif || '229'} ${customer.telephone}` : clientPhone}</strong>
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                  Adresse : <strong style={{ color: 'var(--text-primary)' }}>{customer?.adresse || order.adresse_livraison || 'Comptoir / Non renseignée'}</strong>
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                  Point de Traitement : <strong style={{ color: 'var(--text-primary)' }}>{currentStore?.nom || 'Agence Principale'} ({currentStore?.code || 'HQ'})</strong>
                                </div>
                                {order.cree_par_livreur && (
                                  <div style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', fontWeight: 600, fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Truck size={14} />
                                    <span>Commande collectée sur le terrain par le livreur</span>
                                  </div>
                                )}
                              </div>

                              {/* Colonne B : Ventilation Financière Complète */}
                              {(() => {
                                const isExpressOrder = order.niveau_urgence === 'Express';
                                const expressMarkupItem = db.getCatalog ? db.getCatalog().find(c => c.id === 'setting_express_markup') : null;
                                const expressMarkup = expressMarkupItem ? Number(expressMarkupItem.prix) : 50;

                                const itemsList = order.items || order.articles || [];
                                let itemsSum = itemsList.reduce((sum, art) => sum + (Number(art.prix || art.price || 0) * Number(art.quantite || art.quantity || 1)), 0);
                                if (itemsSum === 0 && itemsList.length === 0 && db.getCatalog) {
                                  const catalogItem = db.getCatalog().find(c => c.article === order.type_article && c.service === order.type_service);
                                  itemsSum = catalogItem ? catalogItem.prix : 1500;
                                }

                                const netPrice = order.prix_total !== undefined ? order.prix_total : (order.total || 0);
                                const calculatedBrut = isExpressOrder ? Math.round(itemsSum * (1 + expressMarkup / 100)) : itemsSum;
                                const displayBrut = order.prix_base_avant_remise || Math.max(calculatedBrut, netPrice);

                                const discountPercent = order.remise_pourcentage || 0;
                                const discountAmount = order.remise_montant || (discountPercent > 0 ? Math.round(displayBrut * (discountPercent / 100)) : 0);

                                const rewardTitle = order.applied_reward_title;
                                const rewardDiscount = Number(order.applied_reward_discount || order.reward_discount || 0);

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.76rem', borderLeft: '1px dashed var(--border-color)', paddingLeft: '1.25rem' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                      <CreditCard size={14} /> Ventilation Financière
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Total Brut :</span>
                                      <strong>{displayBrut.toLocaleString()} FCFA</strong>
                                    </div>

                                    {isExpressOrder && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                                        <span style={{ whiteSpace: 'nowrap' }}>Majoration Express (+{expressMarkup}%) :</span>
                                        <strong>Inclus</strong>
                                      </div>
                                    )}

                                    {discountAmount > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                                        <span style={{ whiteSpace: 'nowrap' }}>Remise Commerciale :</span>
                                        <strong>-{discountAmount.toLocaleString()} FCFA</strong>
                                      </div>
                                    )}

                                    {(rewardDiscount > 0 || rewardTitle) && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                                        <span style={{ whiteSpace: 'nowrap' }}>Récompense ({rewardTitle || 'Fidélité'}) :</span>
                                        <strong>-{rewardDiscount.toLocaleString()} FCFA</strong>
                                      </div>
                                    )}

                                    {Number(order.frais_livraison || 0) > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6' }}>
                                        <span style={{ whiteSpace: 'nowrap' }}>Frais de Livraison{order.distance_km ? ` (${order.distance_km} km)` : ''} :</span>
                                        <strong>+{Number(order.frais_livraison).toLocaleString()} FCFA</strong>
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.3rem', fontWeight: 800, fontSize: '0.82rem' }}>
                                      <span style={{ whiteSpace: 'nowrap' }}>Net à Payer :</span>
                                      <span style={{ color: 'var(--primary)' }}>{netPrice.toLocaleString()} FCFA</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                      <span style={{ whiteSpace: 'nowrap' }}>Acompte Versé :</span>
                                      <span style={{ fontWeight: 700 }}>{(order.avance_payee || 0).toLocaleString()} FCFA</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                                      <span style={{ whiteSpace: 'nowrap' }}>Solde Restant :</span>
                                      <span style={{ color: remainingToPay > 0 ? '#d97706' : '#10b981' }}>
                                        {remainingToPay > 0 ? `${remainingToPay.toLocaleString()} FCFA (Dû)` : 'Soldé (0 FCFA)'}
                                      </span>
                                    </div>

                                    {(order.operateur_momo || order.reference_momo || order.reference_paiement) && (
                                      <div style={{ marginTop: '0.3rem', padding: '0.35rem 0.5rem', background: 'rgba(0, 44, 247, 0.05)', borderRadius: '6px', fontSize: '0.72rem', color: '#002cf7' }}>
                                        <strong>Règlement Mobile Money :</strong> {order.operateur_momo || 'MoMo'} {order.reference_momo || order.reference_paiement ? `(Réf: ${order.reference_momo || order.reference_paiement})` : ''}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Colonne C : Liste des Articles Déposés (si multi-articles) */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.76rem', borderLeft: '1px dashed var(--border-color)', paddingLeft: '1.25rem' }}>
                                <div style={{ fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                  <Package size={14} /> Détail du Panier Déposé
                                </div>

                                {order.items && order.items.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '140px', overflowY: 'auto' }}>
                                    {order.items.map((it, itIdx) => (
                                      <div key={itIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0.4rem', background: 'var(--bg-app)', borderRadius: '6px' }}>
                                        <span><strong>{it.quantite || it.quantity || 1}x</strong> {it.article || it.nom || it.name || order.type_article}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{((it.prix || it.price || 0) * (it.quantite || it.quantity || 1)).toLocaleString()} F</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ color: 'var(--text-secondary)' }}>
                                    Article unique : <strong>{order.type_article}</strong> ({serviceLabels[order.type_service] || order.type_service})
                                  </div>
                                )}

                                {order.notes && (
                                  <div style={{ marginTop: '0.3rem', padding: '0.35rem 0.5rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', fontSize: '0.72rem', color: '#d97706' }}>
                                    <strong>Note / Consigne :</strong> {order.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. BARRE DE PAGINATION (STYLE JOURNAUX D'AUDIT) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.15rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>Afficher par page :</span>
            <div style={{ width: '145px', display: 'inline-block' }}>
              <CustomSelect
                value={ordersPerPage}
                onChange={(e) => {
                  setOrdersPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  fontSize: '0.76rem',
                  padding: '0.28rem 0.65rem',
                  borderRadius: '8px',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  height: '32px'
                }}
                dropdownStyle={{
                  bottom: 'calc(100% + 6px)',
                  top: 'auto',
                  minWidth: '150px',
                  boxShadow: '0 -10px 30px rgba(0,0,0,0.18)'
                }}
              >
                <option value={10}>10 commandes</option>
                <option value={15}>15 commandes</option>
                <option value={25}>25 commandes</option>
                <option value={50}>50 commandes</option>
                <option value={100}>100 commandes</option>
              </CustomSelect>
            </div>
            <span>• Affichage {paginatedOrders.length > 0 ? (currentPage - 1) * ordersPerPage + 1 : 0} - {Math.min(currentPage * ordersPerPage, filteredOrders.length)} sur {filteredOrders.length} {filteredOrders.length <= 1 ? 'commande' : 'commandes'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.76rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                opacity: currentPage <= 1 ? 0.45 : 1,
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={14} /> Précédent
            </button>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', padding: '0 0.4rem' }}>
              Page {currentPage} sur {Math.max(1, totalPages)}
            </span>
            <button
              type="button"
              className="btn btn-outline"
              disabled={totalPages <= 1 || currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.76rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                opacity: (totalPages <= 1 || currentPage >= totalPages) ? 0.45 : 1,
                cursor: (totalPages <= 1 || currentPage >= totalPages) ? 'not-allowed' : 'pointer'
              }}
            >
              Suivant <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. MENU DÉROULANT D'ACTIONS AVANCÉES FIXE (GLOBAL, NON ROGNÉ, HORS STACKING TABLE)
          ======================================================== */}
      {activeActionDropdown && (() => {
        const order = activeActionDropdown.order;
        const remainingToPay = (order.prix_total || 0) - (order.avance_payee || 0);
        const statusCfg = getStatusBadge(order);
        const customer = customers.find(c => c.id === order.customer_id);
        const clientName = customer ? `${customer.prenom} ${customer.nom}` : (order.client_name || 'Client B2B');
        const clientPhone = customer ? customer.telephone : (order.client_telephone || '-');

        return (
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              right: activeActionDropdown.coords.right,
              top: activeActionDropdown.coords.top,
              bottom: activeActionDropdown.coords.bottom,
              width: '240px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
              zIndex: 99999, // Au-dessus absolu de tout élément
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'left',
              padding: '0.4rem 0',
              animation: 'scaleInCenter 0.15s ease'
            }}
          >
            {/* Section 1 : Reçu & Impression */}
            <div style={{ padding: '0.3rem 0.85rem', fontSize: '0.64rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Consultation & Ticket
            </div>

            <ActionMenuItem
              icon={Ticket}
              iconColor="var(--primary)"
              label="Voir le Reçu de Caisse"
              onClick={() => {
                setActiveActionDropdown(null);
                if (setCreatedOrder) setCreatedOrder(order);
              }}
            />

            <ActionMenuItem
              icon={Printer}
              iconColor="#7c3aed"
              label="Imprimer la Facture"
              onClick={() => {
                setActiveActionDropdown(null);
                if (setCreatedOrder) setCreatedOrder(order);
              }}
            />

            {/* Séparateur */}
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0' }} />

            {/* Section 2 : Avancement de Statut contextualisé */}
            <div style={{ padding: '0.3rem 0.85rem', fontSize: '0.64rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Avancement Traitement
            </div>

            {(order.statut === 'en_attente_validation' || (order.cree_par_livreur && !order.validee_par_caisse)) && (
              <ActionMenuItem
                icon={CheckCircle2}
                iconColor="#059669"
                color="#059669"
                isBold
                label="Valider Commande Caisse"
                subtitle="Validation du dépôt livreur"
                onClick={() => {
                  setActiveActionDropdown(null);
                  if (handleValidateLivreurOrder) handleValidateLivreurOrder(order);
                  else if (handleStatusChange) handleStatusChange(order.id, 'en_attente');
                }}
              />
            )}

            {(order.statut === 'en_attente' || order.statut === 'attente' || order.statut === 'retard' || order.statut === 'en_retard') && (
              <ActionMenuItem
                icon={Zap}
                iconColor="#7c3aed"
                color="#7c3aed"
                isBold
                label="Passer au traitement"
                subtitle="Prise en charge atelier"
                onClick={() => {
                  setActiveActionDropdown(null);
                  if (handleStatusChange) handleStatusChange(order.id, 'traitement');
                }}
              />
            )}

            {order.statut === 'traitement' && (
              <ActionMenuItem
                icon={Sparkles}
                iconColor="#2563eb"
                color="#2563eb"
                isBold
                label="Lancer le lavage"
                subtitle="Mise en machine"
                onClick={() => {
                  setActiveActionDropdown(null);
                  if (handleStatusChange) handleStatusChange(order.id, 'en_cours_lavage');
                }}
              />
            )}

            {order.statut === 'en_cours_lavage' && (
              <ActionMenuItem
                icon={Flame}
                iconColor="#0d9488"
                color="#0d9488"
                isBold
                label="Passer au repassage"
                subtitle="Finition pressing"
                onClick={() => {
                  setActiveActionDropdown(null);
                  if (handleStatusChange) handleStatusChange(order.id, 'en_cours_repassage');
                }}
              />
            )}

            {order.statut === 'en_cours_repassage' && (
              <ActionMenuItem
                icon={CheckCircle2}
                iconColor="#10b981"
                color="#10b981"
                isBold
                label="Marquer comme Prêt"
                subtitle="Articles prêts à emballer"
                onClick={() => {
                  setActiveActionDropdown(null);
                  if (handleStatusChange) handleStatusChange(order.id, 'pret');
                }}
              />
            )}

            {order.statut === 'pret' && (
              <>
                <ActionMenuItem
                  icon={Truck}
                  iconColor="#4f46e5"
                  color="#4f46e5"
                  isBold
                  label="Définir À livrer"
                  subtitle="Prêt pour tournée livreur"
                  onClick={() => {
                    setActiveActionDropdown(null);
                    if (handleStatusChange) handleStatusChange(order.id, 'a_livrer');
                  }}
                />
                <ActionMenuItem
                  icon={Package}
                  iconColor="#d97706"
                  color="#d97706"
                  isBold
                  label="Définir À récupérer"
                  subtitle="Mise à disposition comptoir"
                  onClick={() => {
                    setActiveActionDropdown(null);
                    if (handleStatusChange) handleStatusChange(order.id, 'a_recuperer');
                  }}
                />
              </>
            )}

            {order.statut === 'a_livrer' && (
              <ActionMenuItem
                icon={Truck}
                iconColor="#4f46e5"
                color="#4f46e5"
                isBold
                label="Démarrer la livraison"
                subtitle="En cours d'acheminement"
                onClick={() => {
                  setActiveActionDropdown(null);
                  if (handleStatusChange) handleStatusChange(order.id, 'en_cours_livraison');
                }}
              />
            )}

            {(order.statut === 'a_recuperer' || order.statut === 'en_cours_livraison') && (
              <ActionMenuItem
                icon={CheckCircle2}
                iconColor="#059669"
                color="#059669"
                isBold
                label="Confirmer Restitution / Livré"
                subtitle="Clôture et remise au client"
                onClick={() => {
                  setActiveActionDropdown(null);
                  if (handleStartDelivery) handleStartDelivery(order, 'restitue');
                  else if (handleStatusChange) handleStatusChange(order.id, 'restitue');
                }}
              />
            )}

            {/* Reste à payer / Encaissement rapide */}
            {remainingToPay > 0 && order.statut !== 'annule' && (
              <ActionMenuItem
                icon={CreditCard}
                iconColor="#d97706"
                color="#d97706"
                isBold
                label={`Encaisser Solde (${remainingToPay.toLocaleString()} F)`}
                subtitle="Règlement caisse terrain"
                onClick={() => {
                  setActiveActionDropdown(null);
                  if (handleStartDelivery) {
                    handleStartDelivery(order, order.statut);
                  } else if (setCreatedOrder) {
                    setCreatedOrder(order);
                  }
                }}
              />
            )}

            {/* Séparateur */}
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0' }} />

            {/* Section 3 : Outils & Coordonnées */}
            <div style={{ padding: '0.3rem 0.85rem', fontSize: '0.64rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Gestion
            </div>

            <ActionMenuItem
              icon={Copy}
              label="Copier Fiche Complète"
              onClick={() => {
                setActiveActionDropdown(null);
                const cName = customer ? `${customer.prenom} ${customer.nom}` : clientName;
                const cPhone = customer ? `+${customer.indicatif || '229'} ${customer.telephone}` : clientPhone;
                const cAddr = customer?.adresse || 'Non renseignée';
                const text = `KLIN UP - Commande ${order.id || order.identifiant_unique_marquage}\nClient: ${cName}\nTél: ${cPhone}\nAdresse: ${cAddr}\nStatut: ${statusCfg.label}\nMontant: ${order.prix_total} FCFA (Reste: ${remainingToPay} FCFA)`;
                handleCopy(order.id, text);
              }}
            />

            {order.statut !== 'annule' && (
              <ActionMenuItem
                icon={Ban}
                iconColor="#ef4444"
                color="#ef4444"
                label="Annuler la Commande"
                onClick={() => {
                  setActiveActionDropdown(null);
                  if (handleCancelOrder) handleCancelOrder(order.id);
                }}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
}
