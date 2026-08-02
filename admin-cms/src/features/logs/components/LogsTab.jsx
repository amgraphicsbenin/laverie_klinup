import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  AlertCircle,
  Download,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Activity,
  Calendar,
  Smartphone,
  Monitor,
  Info,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
  Tag,
  ShoppingBag,
  DollarSign,
  Building2,
  Trash2,
  SlidersHorizontal,
  Key,
  CheckCircle2,
  LogOut,
  LogIn,
  Layers,
  Sparkles
} from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import { exportLogsCSV } from '../../../utils/exportUtils';
import { db } from '../../../services/db';

export default function LogsTab({
  logSearchText,
  setLogSearchText,
  logFilterAction,
  setLogFilterAction,
  filteredLogs,
  staff = [],
  selectedStoreId = 'all',
  stores: storesProp
}) {
  const stores = useMemo(() => (storesProp && storesProp.length > 0 ? storesProp : (db.getStores ? db.getStores() : [])), [storesProp]);

  // --- ÉTATS LOCAUX DE FILTRAGE ET DE PAGINATION ---
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState(selectedStoreId || 'all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(15);

  React.useEffect(() => {
    if (selectedStoreId !== undefined) {
      setStoreFilter(selectedStoreId);
    }
  }, [selectedStoreId]);

  // --- DÉTERMINATION DE L'ORIGINE DE L'ACTION (ADMIN vs MOBILE vs SYSTEME) ---
  const getLogOrigin = (log, user) => {
    const action = log.action || '';
    const details = log.details || '';
    const role = user?.role || '';

    if (action.includes('POINT_LAVERIE') || action.includes('RESET_PIN') || action.includes('SUSPENSION_PERSONNEL') || action.includes('SUPPRESSION_PERSONNEL') || role === 'super_admin' || role === 'manager') {
      if (action === 'DEMANDE_RESET_PIN' || details.includes('App Mobile')) {
        return { label: 'App Mobile', icon: Smartphone, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      }
      return { label: 'Admin CMS', icon: Monitor, color: '#002cf7', bg: 'rgba(0, 44, 247, 0.1)' };
    }

    if (role === 'agent_accueil' || role === 'livreur' || role === 'agent_lavage_repassage') {
      return { label: 'App Mobile', icon: Smartphone, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
    }

    return { label: 'Système', icon: Activity, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };
  };

  // --- MAPPAGE DES ACTIONS EN LIBELLÉS & THÈMES FRANÇAIS ---
  const getActionMeta = (actionStr = '') => {
    switch (actionStr) {
      // Sécurité & Personnel
      case 'SUSPENSION_PERSONNEL':
        return { label: 'Désactivation / Suspension', category: 'security', severity: 'danger', icon: UserX, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' };
      case 'SUPPRESSION_PERSONNEL':
        return { label: 'Suppression Définitive Compte', category: 'security', severity: 'danger', icon: Trash2, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' };
      case 'REACTIVATION_PERSONNEL':
        return { label: 'Réactivation Compte', category: 'security', severity: 'success', icon: UserCheck, color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' };
      case 'CREATION_PERSONNEL':
        return { label: 'Création Membre Personnel', category: 'security', severity: 'info', icon: UserCheck, color: '#002cf7', bg: 'rgba(0, 44, 247, 0.1)' };
      case 'MODIFICATION_PERSONNEL':
        return { label: 'Mise à Jour Profil', category: 'security', severity: 'warning', icon: SlidersHorizontal, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' };
      case 'DEMANDE_RESET_PIN':
      case 'RESET_PIN':
        return { label: 'Réinitialisation Code PIN', category: 'security', severity: 'warning', icon: Key, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
      case 'CONNEXION':
        return { label: 'Connexion Utilisateur', category: 'security', severity: 'info', icon: LogIn, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      case 'DECONNEXION':
        return { label: 'Déconnexion Session', category: 'security', severity: 'muted', icon: LogOut, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };

      // Commandes & Ventes
      case 'CREATION_COMMANDE':
        return { label: 'Nouvelle Commande', category: 'orders', severity: 'info', icon: ShoppingBag, color: '#002cf7', bg: 'rgba(0, 44, 247, 0.1)' };
      case 'ANNULATION_COMMANDE':
        return { label: 'Annulation Commande', category: 'orders', severity: 'danger', icon: ShieldAlert, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' };
      case 'MISE_A_JOUR_STATUT':
        return { label: 'Changement Statut Commande', category: 'orders', severity: 'info', icon: RefreshCw, color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)' };
      case 'PAIEMENT_FINAL':
        return { label: 'Règlement Commande', category: 'sales', severity: 'success', icon: DollarSign, color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' };
      case 'COMMANDE_ABONNEMENT':
        return { label: 'Débit Abonnement Commande', category: 'orders', severity: 'info', icon: Sparkles, color: '#0d9488', bg: 'rgba(13, 148, 136, 0.1)' };

      // Clientèle & Abonnements
      case 'CREATION_CLIENT':
        return { label: 'Nouveau Client', category: 'sales', severity: 'success', icon: UserCheck, color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' };
      case 'MODIFICATION_CLIENT':
        return { label: 'Mise à Jour Client', category: 'sales', severity: 'warning', icon: SlidersHorizontal, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' };
      case 'SUPPRESSION_CLIENT':
        return { label: 'Suppression Client', category: 'sales', severity: 'danger', icon: Trash2, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' };
      case 'SOUSCRIPTION_ABONNEMENT':
        return { label: 'Souscription Abonnement', category: 'sales', severity: 'success', icon: Sparkles, color: '#9333ea', bg: 'rgba(147, 51, 234, 0.1)' };
      case 'DESABONNEMENT':
        return { label: 'Résiliation Abonnement', category: 'sales', severity: 'danger', icon: X, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' };
      case 'MAJ_SOLDE_FINANCIER':
        return { label: 'Ajustement Dette Client', category: 'sales', severity: 'warning', icon: DollarSign, color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' };

      // Système & Laveries
      case 'CHANGEMENT_POINT_LAVERIE':
      case 'CREATION_POINT_LAVERIE':
      case 'MODIFICATION_POINT_LAVERIE':
      case 'SUPPRESSION_POINT_LAVERIE':
        return { label: 'Gestion Point de Laverie', category: 'system', severity: 'info', icon: Building2, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      case 'AJOUT_CATALOGUE':
      case 'MODIFICATION_TARIF':
      case 'SUPPRESSION_CATALOGUE':
        return { label: 'Tarifs & Catalogue', category: 'system', severity: 'warning', icon: Tag, color: '#db2777', bg: 'rgba(219, 39, 119, 0.1)' };

      default:
        return { label: actionStr || 'Action Système', category: 'system', severity: 'muted', icon: Activity, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };
    }
  };

  // --- FILTRAGE MULTI-CRITÈRES AVANCÉ ---
  const fullyFilteredLogs = useMemo(() => {
    return filteredLogs.filter(log => {
      const user = staff.find(s => s.id === log.user_id);
      const meta = getActionMeta(log.action);
      const origin = getLogOrigin(log, user);

      // 1. Filtre par recherche textuelle globale
      if (logSearchText) {
        const query = logSearchText.toLowerCase();
        const userName = user ? `${user.prenom || ''} ${user.nom || ''}`.toLowerCase() : 'système';
        const userEmail = user?.email ? user.email.toLowerCase() : '';
        const actionLabel = (meta?.label || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const logId = (log.id || '').toLowerCase();

        const matchesSearch = userName.includes(query) ||
          userEmail.includes(query) ||
          actionLabel.includes(query) ||
          details.includes(query) ||
          logId.includes(query);

        if (!matchesSearch) return false;
      }

      // 2. Filtre par Action Globale (Drop-down racine)
      if (logFilterAction !== 'all' && log.action !== logFilterAction) {
        return false;
      }

      // 3. Filtre par Catégorie
      if (categoryFilter !== 'all' && meta.category !== categoryFilter) {
        return false;
      }

      // 4. Filtre par Origine Plateforme
      if (originFilter !== 'all') {
        if (originFilter === 'admin' && origin.label !== 'Admin CMS') return false;
        if (originFilter === 'mobile' && origin.label !== 'App Mobile') return false;
        if (originFilter === 'system' && origin.label !== 'Système') return false;
      }

      // 5. Filtre par Point de Laverie
      if (storeFilter !== 'all') {
        const targetStore = stores.find(s => s.id === storeFilter || s.code === storeFilter);
        const storeCode = targetStore?.code?.toLowerCase();
        const storeName = targetStore?.nom?.toLowerCase();

        const logStore = log.store_id || user?.store_id;
        const matchesStoreId = logStore === storeFilter || (storeCode && logStore === storeCode);

        const detailsLower = (log.details || '').toLowerCase();
        const matchesDetails = (storeCode && detailsLower.includes(storeCode)) ||
                              (storeName && detailsLower.includes(storeName));

        if (!matchesStoreId && !matchesDetails) return false;
      }

      // 6. Filtre par Période de Date
      if (dateFilter !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        if (dateFilter === 'today') {
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (logDate < startOfDay) return false;
        } else if (dateFilter === '7days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (logDate < sevenDaysAgo) return false;
        } else if (dateFilter === '30days') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (logDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [filteredLogs, staff, logSearchText, logFilterAction, categoryFilter, originFilter, storeFilter, dateFilter]);

  // --- STATISTIQUES DE TRACES DE LOGS (KPIS) ---
  const stats = useMemo(() => {
    const total = fullyFilteredLogs.length;
    const logins = fullyFilteredLogs.filter(l => l.action === 'CONNEXION' || l.action === 'DECONNEXION').length;
    const securityOps = fullyFilteredLogs.filter(l => {
      const cat = getActionMeta(l.action).category;
      return cat === 'security';
    }).length;
    const orderOps = fullyFilteredLogs.filter(l => {
      const cat = getActionMeta(l.action).category;
      return cat === 'orders' || cat === 'sales';
    }).length;

    return { total, logins, securityOps, orderOps };
  }, [fullyFilteredLogs]);

  // --- PAGINATION ---
  const totalPages = Math.ceil(fullyFilteredLogs.length / logsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * logsPerPage;
    return fullyFilteredLogs.slice(start, start + logsPerPage);
  }, [fullyFilteredLogs, currentPage, logsPerPage]);

  // Extraire le motif éventuel d'une chaîne de détails
  const extractMotif = (details = '') => {
    if (!details) return null;
    const match = details.match(/Motif\s*:\s*(.*)/i);
    return match ? match[1].trim() : null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. SECTION KPIs TRACES D'AUDIT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0, 44, 247, 0.1)', color: '#002cf7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Traces Filtrées</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Sécurité & Accès</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>{stats.securityOps}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogIn size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Connexions / Sessions</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>{stats.logins}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Commandes & Ventes</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{stats.orderOps}</div>
          </div>
        </div>
      </div>

      {/* 2. CARTE PRINCIPALE : TABLEAU D'AUDIT AVANCÉ */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* EN-TÊTE & EXPORT */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="chart-title" style={{ margin: 0 }}>Journal d'Audit & Sécurité Opérationnelle</h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Traces détaillées des actions exécutées sur l'Admin CMS et sur les Applications Mobiles Terrain
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => exportLogsCSV(fullyFilteredLogs, staff, stores)}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            title="Exporter les traces d'audit en fichier CSV"
          >
            <Download size={15} /> Exporter en CSV ({fullyFilteredLogs.length})
          </button>
        </div>

        {/* 3. BARRE DE FILTRES MULTI-CRITÈRES */}
        <div className="smart-filter-panel">
          {/* Recherche Textuelle */}
          <div className="search-control-container" style={{ flex: '1 1 240px' }}>
            <Search size={15} className="search-control-icon" />
            <input
              type="text"
              className="search-control-input"
              placeholder="Rechercher par nom, email, détail, motif..."
              value={logSearchText}
              onChange={(e) => {
                setLogSearchText(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Filtre par Origine Plateforme */}
          <div className="select-control-wrapper" style={{ minWidth: '160px' }}>
            <CustomSelect
              className="input-control"
              value={originFilter}
              onChange={(e) => { setOriginFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">🌐 Toutes Origines</option>
              <option value="admin">🖥️ Admin CMS</option>
              <option value="mobile">📱 App Mobile</option>
              <option value="system">🤖 Système</option>
            </CustomSelect>
          </div>

          {/* Filtre par Catégorie d'Action */}
          <div className="select-control-wrapper" style={{ minWidth: '170px' }}>
            <CustomSelect
              className="input-control"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">📂 Toutes Catégories</option>
              <option value="security">🔒 Sécurité & Accès</option>
              <option value="orders">🛍️ Commandes</option>
              <option value="sales">💰 Ventes & Dette</option>
              <option value="system">⚙️ Système & Laveries</option>
            </CustomSelect>
          </div>

          {/* Filtre par Point de Laverie */}
          <div className="select-control-wrapper" style={{ minWidth: '170px' }}>
            <CustomSelect
              className="input-control"
              value={storeFilter}
              onChange={(e) => { setStoreFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">📍 Tous les Points</option>
              {(stores || []).map(s => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </CustomSelect>
          </div>

          {/* Filtre par Période */}
          <div className="select-control-wrapper" style={{ minWidth: '150px' }}>
            <CustomSelect
              className="input-control"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">📅 Toutes les Dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="7days">7 Derniers Jours</option>
              <option value="30days">30 Derniers Jours</option>
            </CustomSelect>
          </div>

          {/* Réinitialiser les filtres */}
          {(logSearchText || originFilter !== 'all' || categoryFilter !== 'all' || storeFilter !== 'all' || dateFilter !== 'all' || logFilterAction !== 'all') && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setLogSearchText('');
                setLogFilterAction('all');
                setOriginFilter('all');
                setCategoryFilter('all');
                setStoreFilter('all');
                setDateFilter('all');
                setCurrentPage(1);
              }}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', borderRadius: '8px', color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.25)' }}
            >
              <X size={14} /> Effacer filtres
            </button>
          )}
        </div>

        {/* 4. TABLEAU DES TRACES D'AUDIT */}
        <div className="table-container" style={{ minHeight: '350px' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Horodatage & Origine</th>
                <th style={{ width: '220px' }}>Utilisateur / Rôle</th>
                <th style={{ width: '220px' }}>Action Exécutée</th>
                <th>Détails & Motif de l'Opération</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Inspecter</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)', display: 'block' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Aucune trace d'audit ne correspond à vos filtres</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Essayez de réinitialiser la recherche ou de modifier les filtres de plateforme et de catégorie.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => {
                  const user = staff.find(s => s.id === log.user_id);
                  const userName = user ? `${user.prenom} ${user.nom}` : 'Automate / Système';
                  const userRole = user ? user.role : 'System Bot';
                  const meta = getActionMeta(log.action);
                  const origin = getLogOrigin(log, user);
                  const ActionIcon = meta.icon;
                  const OriginIcon = origin.icon;

                  const motifText = extractMotif(log.details);
                  const logStore = (stores.find(st => st.id === log.store_id || st.id === user?.store_id) || {}).nom || 'Point Central';

                  return (
                    <tr key={log.id} style={{ transition: 'background 0.15s ease' }}>
                      {/* Horodatage & Origine */}
                      <td style={{ verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.3rem', padding: '0.15rem 0.4rem', borderRadius: '6px', background: origin.bg, color: origin.color, fontSize: '0.68rem', fontWeight: 700 }}>
                          <OriginIcon size={12} /> {origin.label}
                        </div>
                      </td>

                      {/* Utilisateur / Rôle */}
                      <td style={{ verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>{userName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{userRole}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>📍 {logStore}</div>
                      </td>

                      {/* Action Exécutée */}
                      <td style={{ verticalAlign: 'top' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '20px',
                            background: meta.bg,
                            color: meta.color,
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            lineHeight: 1.2
                          }}
                        >
                          <ActionIcon size={14} /> {meta.label}
                        </div>
                        <div style={{ fontSize: '0.66rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                          Code: {log.action}
                        </div>
                      </td>

                      {/* Détails & Motif */}
                      <td style={{ verticalAlign: 'top', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        <div>{log.details}</div>
                        {motifText && (
                          <div
                            style={{
                              marginTop: '0.4rem',
                              padding: '0.35rem 0.6rem',
                              borderRadius: '8px',
                              background: 'rgba(220, 38, 38, 0.08)',
                              borderLeft: '3px solid #dc2626',
                              color: '#dc2626',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            💡 Motif spécifié : {motifText}
                          </div>
                        )}
                      </td>

                      {/* Action Inspecter */}
                      <td style={{ textAlign: 'center', verticalAlign: 'top' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setSelectedLog(log)}
                          style={{ padding: '0.3rem 0.5rem', borderRadius: '8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                          title="Inspecter les détails complets de cette trace d'audit"
                        >
                          <Eye size={14} /> Voir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. BARRE DE PAGINATION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Afficher par page :</span>
            <select
              value={logsPerPage}
              onChange={(e) => {
                setLogsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', padding: '0.15rem 0.4rem', fontSize: '0.76rem' }}
            >
              <option value={15}>15 lignes</option>
              <option value={30}>30 lignes</option>
              <option value={50}>50 lignes</option>
              <option value={100}>100 lignes</option>
            </select>
            <span>• Affichage {paginatedLogs.length > 0 ? (currentPage - 1) * logsPerPage + 1 : 0} - {Math.min(currentPage * logsPerPage, fullyFilteredLogs.length)} sur {fullyFilteredLogs.length} traces</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.76rem',
                borderRadius: '8px',
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
                padding: '0.3rem 0.6rem',
                fontSize: '0.76rem',
                borderRadius: '8px',
                opacity: (totalPages <= 1 || currentPage >= totalPages) ? 0.45 : 1,
                cursor: (totalPages <= 1 || currentPage >= totalPages) ? 'not-allowed' : 'pointer'
              }}
            >
              Suivant <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* 6. MODALE D'INSPECTION DÉTAILLÉE D'UNE TRACE D'AUDIT (CRÉÉE VIA PORTAL) */}
      {selectedLog && (() => {
        const user = staff.find(s => s.id === selectedLog.user_id);
        const meta = getActionMeta(selectedLog.action);
        const origin = getLogOrigin(selectedLog, user);
        const ActionIcon = meta.icon;
        const OriginIcon = origin.icon;
        const motifText = extractMotif(selectedLog.details);

        return createPortal(
          <div className="modal-backdrop" onClick={() => setSelectedLog(null)}>
            <div
              className="card modal-dialog-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '620px',
                width: '100%',
                maxHeight: '88vh',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-card, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                borderRadius: '24px',
                padding: '1.75rem',
                boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25), 0 10px 25px -5px rgba(15, 23, 42, 0.12)',
                border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                margin: 'auto'
              }}
            >
              {/* En-tête Modale */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ActionIcon size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{meta.label}</h4>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 700, marginTop: '0.15rem' }}>
                      ID Trace: {selectedLog.id}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    cursor: 'pointer',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="Fermer la fenêtre"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Corps Modale : Métadonnées */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Horodatage</div>
                  <div style={{ fontWeight: 800, marginTop: '0.25rem', color: '#0f172a', fontSize: '0.88rem' }}>{new Date(selectedLog.timestamp).toLocaleString()}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Origine Plateforme</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem', fontWeight: 800, color: origin.color, fontSize: '0.88rem' }}>
                    <OriginIcon size={16} /> {origin.label}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Opérateur / Utilisateur</div>
                  <div style={{ fontWeight: 800, marginTop: '0.25rem', color: '#0f172a', fontSize: '0.88rem' }}>{user ? `${user.prenom} ${user.nom}` : 'Automate / Système'}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, marginTop: '0.1rem' }}>Rôle: {user ? user.role : 'N/A'}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Point de Laverie</div>
                  <div style={{ fontWeight: 800, marginTop: '0.25rem', color: '#0f172a', fontSize: '0.88rem' }}>
                    📍 {(stores.find(st => st.id === selectedLog.store_id || st.id === user?.store_id) || {}).nom || 'Point Central'}
                  </div>
                </div>
              </div>

              {/* Contenu textuel complet */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Description complète de l'opération
                </div>
                <div style={{ background: '#f8fafc', padding: '0.9rem 1rem', borderRadius: '12px', fontSize: '0.88rem', color: '#0f172a', fontWeight: 600, lineHeight: 1.5, border: '1px solid #e2e8f0' }}>
                  {selectedLog.details}
                </div>
              </div>

              {/* Bloc Motif si disponible */}
              {motifText && (
                <div style={{ padding: '0.9rem 1.1rem', background: 'rgba(220, 38, 38, 0.06)', borderRadius: '12px', border: '1px solid rgba(220, 38, 38, 0.25)', borderLeft: '4px solid #dc2626' }}>
                  <div style={{ fontSize: '0.74rem', color: '#b91c1c', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    💡 Motif Spécifié pour cette Opération
                  </div>
                  <div style={{ fontSize: '0.92rem', color: '#991b1b', fontWeight: 800, marginTop: '0.3rem', lineHeight: 1.4 }}>
                    {motifText}
                  </div>
                </div>
              )}

              {/* Pied de Modale */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  style={{
                    padding: '0.55rem 1.5rem',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>,
          document.body
        );
      })()}

    </div>
  );
}
