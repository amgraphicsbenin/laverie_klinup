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
  Video
} from 'lucide-react';

export default function AdminView({ activeTab, searchQuery }) {
  const [catalog, setCatalog] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);

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
              <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '10px' }} onClick={() => setShowAddCatalogModal(true)}>
                + Nouvelle
              </button>
            </div>

            <div className="project-list">
              {orders.slice(0, 4).map(order => {
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


    </div>
  );
}
