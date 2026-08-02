import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  Users,
  UserPlus,
  Search,
  Award,
  CreditCard,
  Star,
  AlertTriangle,
  Phone,
  MapPin,
  Check,
  Copy,
  Ticket,
  Sparkles,
  ShieldCheck,
  Tag,
  Clock,
  ArrowRight,
  Download,
  Gift,
  Zap,
  Crown,
  X,
  CheckCircle2
} from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import { exportCustomersCSV } from '../../../utils/exportUtils';
import { getFidelityTier, FIDELITY_TIERS, REWARD_CATALOG, renderTierIcon, renderRewardIcon } from '../../../utils/fidelityUtils.jsx';
import { db } from '../../../services/db';

const ModalPortal = ({ children }) => {
  if (typeof document === 'undefined') return children;
  return ReactDOM.createPortal(children, document.body);
};

export default function CustomersTab({
  customers,
  selectedCrmCustomer,
  setSelectedCrmCustomer,
  crmSearch,
  setCrmSearch,
  setShowNewCustomerModal,
  setShowDebtPaymentModal,
  setDebtPaymentAmount,
  handleUnsubscribeCrm,
  selectedCrmSubId,
  setSelectedCrmSubId,
  handleSubscribeCrm,
  catalog,
  orders,
  serviceLabels,
  getOrderStatusLabel,
  setCreatedOrder
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'abonne', 'dette', 'fidelite'
  const [tierFilter, setTierFilter] = useState('all'); // 'all', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'
  const [copiedId, setCopiedId] = useState(null);

  // Modal Fidélité State
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardTab, setRewardTab] = useState('redeem'); // 'redeem' | 'adjust'
  const [pointsDeltaInput, setPointsDeltaInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [modalFeedback, setModalFeedback] = useState(null); // { type: 'success'|'error', text: '' }

  // Helper to copy customer details
  const handleCopyCustomer = (customer) => {
    const text = `Client: ${customer.prenom} ${customer.nom}\nTél: +${customer.indicatif || '229'} ${customer.telephone}\nAdresse: ${customer.adresse || 'Non renseignée'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(customer.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Avatar color generator based on name
  const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 45%)`;
  };

  // Metrics KPI calculations
  const totalCustomers = customers.length;
  const activeSubscribers = customers.filter(c => c.active_subscription).length;
  const indebtedCustomers = customers.filter(c => c.solde_dette > 0);
  const totalDebtAmount = indebtedCustomers.reduce((acc, c) => acc + (c.solde_dette || 0), 0);
  const totalFidelityPoints = customers.reduce((acc, c) => acc + (c.points_fidelite || 0), 0);
  const vipCustomersCount = customers.filter(c => (c.points_fidelite || 0) >= 150).length;

  // Handlers for Loyalty Actions
  const handleOpenRewardModal = (tab = 'redeem') => {
    setRewardTab(tab);
    setPointsDeltaInput('');
    setReasonInput('');
    setModalFeedback(null);
    setShowRewardModal(true);
  };

  const handleCloseRewardModal = () => {
    setShowRewardModal(false);
    setModalFeedback(null);
  };

  const handleApplyPointsAdjustment = async (customDelta = null) => {
    if (!selectedCrmCustomer) return;
    const deltaVal = customDelta !== null ? customDelta : Number(pointsDeltaInput);
    if (isNaN(deltaVal) || deltaVal === 0) {
      setModalFeedback({ type: 'error', text: 'Veuillez entrer un nombre de points valide.' });
      return;
    }

    try {
      const updated = await db.adjustCustomerPoints(
        selectedCrmCustomer.id,
        deltaVal,
        reasonInput || 'Ajustement Admin CMS'
      );
      if (updated) {
        setSelectedCrmCustomer({ ...updated });
        setModalFeedback({ type: 'success', text: `Solde mis à jour (${deltaVal >= 0 ? '+' : ''}${deltaVal} pts) !` });
        setTimeout(() => {
          handleCloseRewardModal();
        }, 1200);
      }
    } catch (err) {
      setModalFeedback({ type: 'error', text: err.message || 'Échec de l\'ajustement des points.' });
    }
  };

  const handleRedeemRewardAdmin = async (reward) => {
    if (!selectedCrmCustomer) return;
    const currentPts = Number(selectedCrmCustomer.points_fidelite || 0);

    if (currentPts < reward.cost) {
      setModalFeedback({ type: 'error', text: `Il manque ${reward.cost - currentPts} pts pour cette récompense.` });
      return;
    }

    try {
      const updated = await db.redeemCustomerReward(
        selectedCrmCustomer.id,
        reward.id,
        reward.title,
        reward.cost
      );
      if (updated) {
        setSelectedCrmCustomer({ ...updated });
        setModalFeedback({ type: 'success', text: `Récompense "${reward.title}" débloquée avec succès !` });
        setTimeout(() => {
          handleCloseRewardModal();
        }, 1200);
      }
    } catch (err) {
      setModalFeedback({ type: 'error', text: err.message || 'Échec du déblocage de la récompense.' });
    }
  };

  // Status badges mapping for orders
  const statusBadgesConfig = {
    en_attente: { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', label: 'En attente' },
    traitement: { bg: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', label: 'Traitement' },
    en_cours_lavage: { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', label: 'Lavage' },
    en_cours_repassage: { bg: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', label: 'Repassage' },
    pret: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', label: 'Prêt' },
    a_livrer: { bg: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', label: 'À livrer' },
    a_recuperer: { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706', label: 'À récupérer' },
    en_cours_livraison: { bg: 'rgba(79, 70, 229, 0.10)', color: '#4f46e5', label: 'En livraison' },
    restitue: { bg: 'rgba(16, 185, 129, 0.08)', color: '#059669', label: 'Livré / Récupéré' },
    annule: { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', label: 'Annulée' }
  };

  const selectedTier = selectedCrmCustomer ? getFidelityTier(selectedCrmCustomer.points_fidelite || 0) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* BANNIÈRE DE STATISTIQUES CRM & FIDÉLITÉ (KPI BAR) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {/* KPI 1 : Total Portefeuille Clients */}
        <div className="card" style={{
          padding: '1.1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Portefeuille Clients
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '2px' }}>
              {totalCustomers} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>fiches</span>
            </div>
          </div>
        </div>

        {/* KPI 2 : Abonnés Actifs */}
        <div className="card" style={{
          padding: '1.1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Abonnés Actifs
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#10b981', lineHeight: 1.1, marginTop: '2px' }}>
              {activeSubscribers} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>actifs</span>
            </div>
          </div>
        </div>

        {/* KPI 3 : Programme Fidélité & Points Cumulés */}
        <div className="card" style={{
          padding: '1.1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'rgba(217, 119, 6, 0.12)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Crown size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Fidélité & Rewards
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#d97706', lineHeight: 1.1, marginTop: '2px' }}>
              {totalFidelityPoints.toLocaleString('fr-FR')} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>pts</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {vipCustomersCount} clients VIP Or/Platine
            </div>
          </div>
        </div>

        {/* KPI 4 : Total En-cours Dette */}
        <div className="card" style={{
          padding: '1.1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Comptes en Dette
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#ef4444', lineHeight: 1.1, marginTop: '2px' }}>
              {totalDebtAmount.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>F</span>
            </div>
          </div>
        </div>
      </div>

      {/* DISPOSITION PRINCIPALE CRM (PORTEFEUILLE A GAUCHE, FICHE DETAILLEE A DROITE) */}
      <div className="grid-2" style={{ gridTemplateColumns: '0.85fr 1.15fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* COLONNE GAUCHE : RECHERCHE & LISTE DES CLIENTS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', borderRadius: '20px' }}>
          
          {/* Header Liste Clients */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.9rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Portefeuille Clients
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Fiches CRM, abonnements & programme fidélité
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => exportCustomersCSV(customers)}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                title="Exporter la liste des clients en CSV"
              >
                <Download size={14} /> CSV
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowNewCustomerModal(true)}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--primary)', color: '#fff', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
              >
                <UserPlus size={15} /> Nouveau
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="search-control-container">
            <Search size={15} className="search-control-icon" />
            <input
              type="text"
              className="search-control-input"
              placeholder="Rechercher par Nom, Prénom ou Téléphone..."
              value={crmSearch}
              onChange={(e) => setCrmSearch(e.target.value)}
            />
          </div>

          {/* Filter Chips Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="filter-pills-group" style={{ width: '100%' }}>
              <button
                type="button"
                className={`filter-pill-btn ${filterMode === 'all' ? 'active' : ''}`}
                onClick={() => setFilterMode('all')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Tous ({customers.length})
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${filterMode === 'abonne' ? 'active' : ''}`}
                onClick={() => setFilterMode('abonne')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Abonnés ({activeSubscribers})
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${filterMode === 'fidelite' ? 'active' : ''}`}
                onClick={() => setFilterMode('fidelite')}
                style={{ flex: 1, justifyContent: 'center', gap: '0.25rem' }}
              >
                <Award size={13} /> Fidélité
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${filterMode === 'dette' ? 'active' : ''}`}
                onClick={() => setFilterMode('dette')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Dettes ({indebtedCustomers.length})
              </button>
            </div>

            {/* Sub-Pills pour filtrer par statut de fidélité */}
            {filterMode === 'fidelite' && (
              <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => setTierFilter('all')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: tierFilter === 'all' ? 'var(--primary)' : 'var(--bg-app)',
                    color: tierFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Tous Tiers
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('BRONZE')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid rgba(217, 119, 6, 0.4)',
                    background: tierFilter === 'BRONZE' ? '#d97706' : 'rgba(217, 119, 6, 0.08)',
                    color: tierFilter === 'BRONZE' ? '#ffffff' : '#d97706',
                    cursor: 'pointer'
                  }}
                >
                  Bronze
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('SILVER')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid rgba(2, 132, 199, 0.4)',
                    background: tierFilter === 'SILVER' ? '#0284c7' : 'rgba(2, 132, 199, 0.08)',
                    color: tierFilter === 'SILVER' ? '#ffffff' : '#0284c7',
                    cursor: 'pointer'
                  }}
                >
                  Argent
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('GOLD')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid rgba(202, 138, 4, 0.4)',
                    background: tierFilter === 'GOLD' ? '#ca8a04' : 'rgba(202, 138, 4, 0.08)',
                    color: tierFilter === 'GOLD' ? '#ffffff' : '#ca8a04',
                    cursor: 'pointer'
                  }}
                >
                  Or
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('PLATINUM')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid rgba(124, 58, 237, 0.4)',
                    background: tierFilter === 'PLATINUM' ? '#7c3aed' : 'rgba(124, 58, 237, 0.08)',
                    color: tierFilter === 'PLATINUM' ? '#ffffff' : '#7c3aed',
                    cursor: 'pointer'
                  }}
                >
                  Platine VIP
                </button>
              </div>
            )}
          </div>

          {/* List of Customers */}
          <div style={{ overflowY: 'auto', maxHeight: '580px', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
            {(() => {
              const query = crmSearch.toLowerCase();
              let filteredCrm = customers.filter(c => {
                const nom = (c.nom || '').toLowerCase();
                const prenom = (c.prenom || '').toLowerCase();
                const tel = (c.telephone || '').toLowerCase();
                const matchesQuery = nom.includes(query) || prenom.includes(query) || tel.includes(query);
                
                if (!matchesQuery) return false;
                if (filterMode === 'abonne') return !!c.active_subscription;
                if (filterMode === 'dette') return c.solde_dette > 0;
                if (filterMode === 'fidelite') {
                  if (tierFilter === 'all') return true;
                  const tier = getFidelityTier(c.points_fidelite || 0);
                  return tier.key === tierFilter;
                }
                return true;
              });

              if (filterMode === 'fidelite') {
                filteredCrm = filteredCrm.sort((a, b) => (b.points_fidelite || 0) - (a.points_fidelite || 0));
              }

              if (filteredCrm.length === 0) {
                return (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1.5rem', background: 'var(--bg-app)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
                    <Users size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)', opacity: 0.6 }} />
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>Aucun client correspondant.</p>
                  </div>
                );
              }

              return filteredCrm.map(c => {
                const isSelected = selectedCrmCustomer?.id === c.id;
                const avatarBg = getAvatarColor(`${c.prenom} ${c.nom}`);
                const tier = getFidelityTier(c.points_fidelite || 0);

                return (
                  <button
                    type="button"
                    key={c.id}
                    className="card-clickable"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      width: '100%',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      color: 'inherit',
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.12)' : 'none'
                    }}
                    onClick={() => setSelectedCrmCustomer(c)}
                  >
                    {/* Circle Avatar */}
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: avatarBg,
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {c.prenom.charAt(0)}{c.nom.charAt(0)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.88rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.prenom} {c.nom}
                        </strong>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: tier.color, background: tier.bgLight, border: `1px solid ${tier.border}`, padding: '0.1rem 0.45rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          {renderTierIcon(tier.iconName, 11, tier.color)} {tier.name} • {c.points_fidelite || 0} pts
                        </span>
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Tél: {c.telephone}</span>
                        {c.solde_dette > 0 ? (
                          <span style={{ color: '#ef4444', fontWeight: 800, background: 'rgba(239, 68, 68, 0.1)', padding: '0.05rem 0.35rem', borderRadius: '4px', fontSize: '0.68rem' }}>
                            Dette: {c.solde_dette.toLocaleString()} F
                          </span>
                        ) : c.active_subscription ? (
                          <span style={{ color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '0.05rem 0.35rem', borderRadius: '4px', fontSize: '0.65rem' }}>
                            ✨ Abonné
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        </div>

        {/* COLONNE DROITE : PROFIL CLIENT DETAILLE, FIDELITE & HISTORIQUE */}
        <div className="card" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column', padding: '1.5rem', borderRadius: '20px' }}>
          {selectedCrmCustomer ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
              
              {/* Header profil client */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    background: getAvatarColor(`${selectedCrmCustomer.prenom} ${selectedCrmCustomer.nom}`),
                    color: '#fff',
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {selectedCrmCustomer.prenom.charAt(0)}{selectedCrmCustomer.nom.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-title)', margin: 0, color: 'var(--text-primary)' }}>
                      {selectedCrmCustomer.prenom} {selectedCrmCustomer.nom}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Phone size={13} color="var(--primary)" /> +{selectedCrmCustomer.indicatif || '229'} {selectedCrmCustomer.telephone}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={13} color="var(--primary)" /> {selectedCrmCustomer.adresse || 'Adresse non renseignée'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.74rem', fontWeight: 700, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.3rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  onClick={() => handleCopyCustomer(selectedCrmCustomer)}
                >
                  {copiedId === selectedCrmCustomer.id ? <Check size={14} /> : <Copy size={14} />}
                  {copiedId === selectedCrmCustomer.id ? 'Copié !' : 'Copier'}
                </button>
              </div>

              {/* KPI Mini-Cards Client */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
                
                {/* 1. Statut Fidélité */}
                <div style={{ padding: '0.85rem 1rem', background: selectedTier.bgLight, borderRadius: '14px', border: `1px solid ${selectedTier.border}`, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: selectedTier.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {renderTierIcon(selectedTier.iconName, 13, selectedTier.color)} Statut {selectedTier.name}
                  </span>
                  <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', color: selectedTier.color, fontWeight: 900 }}>
                    {selectedCrmCustomer.points_fidelite || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>pts</span>
                  </strong>
                </div>

                {/* 2. Solde Dette & Bouton de Règlement */}
                <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-app)', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CreditCard size={13} color={selectedCrmCustomer.solde_dette > 0 ? '#ef4444' : '#10b981'} /> Dette Restante
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', color: selectedCrmCustomer.solde_dette > 0 ? '#ef4444' : '#10b981', fontWeight: 900 }}>
                      {selectedCrmCustomer.solde_dette.toLocaleString()} <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>F</span>
                    </strong>
                    {selectedCrmCustomer.solde_dette > 0 && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          setDebtPaymentAmount(selectedCrmCustomer.solde_dette.toString());
                          setShowDebtPaymentModal(true);
                        }}
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.68rem', fontWeight: 700, borderRadius: '6px', background: '#ef4444', border: 'none', color: '#fff' }}
                      >
                        Régler
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Préférence Pliage */}
                <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-app)', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Tag size={13} color="var(--primary)" /> Préférence Pliage
                  </span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '0.1rem', fontWeight: 800 }}>
                    {selectedCrmCustomer.preferences_pliage}
                  </strong>
                </div>
              </div>

              {/* SECTION FIDÉLITÉ & RÉCOMPENSES DU CLIENT */}
              <div style={{ padding: '1.1rem', background: 'var(--bg-app)', border: `1px solid ${selectedTier.border}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: selectedTier.bgLight, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${selectedTier.border}` }}>
                      {renderTierIcon(selectedTier.iconName, 20, selectedTier.color)}
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)' }}>{selectedTier.title}</h5>
                      <span style={{ fontSize: '0.72rem', color: selectedTier.color, fontWeight: 700 }}>Statut Fidélité Actif</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: selectedTier.color }}>{selectedCrmCustomer.points_fidelite || 0} pts</strong>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Solde disponible</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {selectedTier.ptsToNext > 0 ? `${selectedTier.ptsToNext} pts restants vers ${selectedTier.nextTierName}` : 'Niveau VIP Maximale Atteint'}
                    </span>
                    <strong style={{ color: selectedTier.color }}>{selectedTier.progressPct}%</strong>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${selectedTier.progressPct}%`, background: selectedTier.color, borderRadius: '10px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* Perks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--bg-card)', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Avantages du statut {selectedTier.name} :</span>
                  {selectedTier.advantages.map((adv, idx) => (
                    <div key={idx} style={{ fontSize: '0.74rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={12} color={selectedTier.color} /> {adv}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOpenRewardModal('redeem')}
                    style={{ flex: 1, padding: '0.55rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: selectedTier.color, color: '#fff', border: 'none' }}
                  >
                    <Gift size={15} /> Échanger des Points
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleOpenRewardModal('adjust')}
                    style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', borderColor: 'var(--primary-light)' }}
                  >
                    <Zap size={14} /> Ajuster
                  </button>
                </div>
              </div>

              {/* Section Abonnement CRM */}
              <div style={{ padding: '1.1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={16} color="var(--primary)" />
                    Forfait d'Abonnement Actif
                  </span>
                  {selectedCrmCustomer.active_subscription && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      Actif
                    </span>
                  )}
                </div>

                {selectedCrmCustomer.active_subscription ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 800 }}>{selectedCrmCustomer.active_subscription.name}</strong>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        Solde : {selectedCrmCustomer.active_subscription.remaining_clothes} / {selectedCrmCustomer.active_subscription.total_clothes} vêtements
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {(() => {
                      const remaining = selectedCrmCustomer.active_subscription.remaining_clothes;
                      const total = selectedCrmCustomer.active_subscription.total_clothes;
                      const percentUsed = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <div style={{ height: '10px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${percentUsed}%`, background: 'var(--primary)', borderRadius: '10px', transition: 'width 0.4s ease' }}></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            <span>Vêtements lavés : {total - remaining}</span>
                            <span>Restants : {remaining} vêtements</span>
                          </div>
                        </div>
                      );
                    })()}

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.1rem' }}>
                      <span>Souscrit le : <strong>{new Date(selectedCrmCustomer.active_subscription.subscribed_at).toLocaleDateString('fr-FR')}</strong></span>
                      <span>Expire le : <strong>{new Date(selectedCrmCustomer.active_subscription.expires_at).toLocaleDateString('fr-FR')}</strong></span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleUnsubscribeCrm(selectedCrmCustomer.id)}
                      style={{ padding: '0.45rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', marginTop: '0.2rem' }}
                    >
                      Résilier l'abonnement
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <CustomSelect
                      className="input-control"
                      style={{ flexGrow: 1, padding: '0.5rem', fontSize: '0.78rem', borderRadius: '10px' }}
                      value={selectedCrmSubId}
                      onChange={(e) => setSelectedCrmSubId(e.target.value)}
                    >
                      <option value="">-- Choisir une formule d'abonnement --</option>
                      {catalog.filter(item => item.service === 'abonnement').map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.article} ({sub.prix.toLocaleString()} F/mois)</option>
                      ))}
                    </CustomSelect>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSubscribeCrm(selectedCrmCustomer.id, selectedCrmSubId)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '10px', background: 'var(--primary)', color: '#fff' }}
                    >
                      Souscrire
                    </button>
                  </div>
                )}
              </div>

              {/* Historique individuel des commandes du client */}
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.3rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, fontFamily: 'var(--font-title)', margin: 0, color: 'var(--text-primary)' }}>
                  Historique des Dépôts du Client
                </h4>

                <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <table style={{ width: '100%', fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Article & Service</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Ticket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const clientOrders = orders.filter(o => o.customer_id === selectedCrmCustomer.id)
                          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                        if (clientOrders.length === 0) {
                          return (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                Aucune commande enregistrée pour ce client.
                              </td>
                            </tr>
                          );
                        }

                        return clientOrders.map(o => {
                          const statusCfg = statusBadgesConfig[o.statut] || { bg: 'rgba(100,116,139,0.1)', color: 'var(--text-secondary)', label: getOrderStatusLabel(o) };
                          return (
                            <tr key={o.id}>
                              <td><strong style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>{o.identifiant_unique_marquage}</strong></td>
                              <td>
                                <span style={{ fontWeight: 600 }}>{o.type_article}</span>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{serviceLabels[o.type_service] || o.type_service}</div>
                              </td>
                              <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{o.prix_total.toLocaleString()} F</td>
                              <td>
                                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: '10px', background: statusCfg.bg, color: statusCfg.color }}>
                                  {getOrderStatusLabel(o)}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.68rem', fontWeight: 700, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                  onClick={() => setCreatedOrder(o)}
                                >
                                  <Ticket size={12} /> Reçu
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '0.75rem', padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={32} />
              </div>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Aucun client sélectionné</h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                Sélectionnez un client dans la liste de gauche pour consulter sa fiche complète, ses abonnements et son historique.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ADMIN FIDÉLITÉ & RÉCOMPENSES */}
      {showRewardModal && selectedCrmCustomer && (
        <ModalPortal>
          <div className="modal-backdrop" onClick={handleCloseRewardModal}>
            <div
              className="card modal-dialog-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '560px',
                minHeight: '580px',
                maxHeight: '92vh',
                background: '#ffffff',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: '24px',
                boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25)',
                border: '1.5px solid #e2e8f0',
                margin: 'auto'
              }}
            >
              {/* Header exact match with Nouvelle Commande modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#09090b', margin: 0, fontFamily: 'inherit' }}>
                  Fidélité & Échange de Points
                </h3>
                <button
                  type="button"
                  onClick={handleCloseRewardModal}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#71717a' }}
                  title="Fermer"
                >
                  <X size={20} color="#71717a" />
                </button>
              </div>

              {/* Scroll Content Container */}
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column' }}>

                {/* Banner Client & Solde */}
                <div style={{
                  backgroundColor: 'rgba(0, 44, 247, 0.04)',
                  border: '1.5px solid rgba(0, 44, 247, 0.12)',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: selectedTier.bgLight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${selectedTier.border}`,
                      flexShrink: 0
                    }}>
                      {renderTierIcon(selectedTier.iconName, 20, selectedTier.color)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#09090b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedCrmCustomer.prenom} {selectedCrmCustomer.nom}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        +{selectedCrmCustomer.indicatif || '229'} {selectedCrmCustomer.telephone} • Statut {selectedTier.name}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: selectedTier.bgLight,
                    border: `1px solid ${selectedTier.border}`,
                    borderRadius: '12px',
                    padding: '6px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    flexShrink: 0
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: selectedTier.color, lineHeight: 1.1 }}>
                      {selectedCrmCustomer.points_fidelite || 0} <span style={{ fontSize: '11px', fontWeight: 700 }}>pts</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Solde disponible</div>
                  </div>
                </div>

                {/* Segmented Control Tabs (Matching Urgence Normal / Express style) */}
                <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setRewardTab('redeem')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: rewardTab === 'redeem' ? '#002cf7' : 'transparent',
                      color: rewardTab === 'redeem' ? '#ffffff' : '#64748b',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Gift size={15} /> Catalogue Récompenses ({REWARD_CATALOG.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRewardTab('adjust')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: rewardTab === 'adjust' ? '#002cf7' : 'transparent',
                      color: rewardTab === 'adjust' ? '#ffffff' : '#64748b',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Zap size={15} /> Ajuster Points
                  </button>
                </div>

                {/* Feedback Message */}
                {modalFeedback && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    marginBottom: '14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: modalFeedback.type === 'success' ? '#f0fdf4' : '#fff1f2',
                    color: modalFeedback.type === 'success' ? '#15803d' : '#ef4444',
                    border: `1px solid ${modalFeedback.type === 'success' ? '#bbf7d0' : '#ffe4e6'}`
                  }}>
                    {modalFeedback.text}
                  </div>
                )}

                {/* Tab 1 : Catalogue Récompenses (Matching item list layout in Nouvelle Commande modal) */}
                {rewardTab === 'redeem' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {REWARD_CATALOG.map((reward) => {
                      const pts = Number(selectedCrmCustomer.points_fidelite || 0);
                      const canAfford = pts >= reward.cost;

                      return (
                        <div
                          key={reward.id}
                          style={{
                            backgroundColor: '#ffffff',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '16px',
                            padding: '12px 16px',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center',
                            opacity: canAfford ? 1 : 0.75,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#09090b' }}>
                              {reward.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              {reward.description}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#002cf7', marginTop: '4px' }}>
                              Coût : {reward.cost} points
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => handleRedeemRewardAdmin(reward)}
                            style={{
                              backgroundColor: canAfford ? 'rgba(0, 44, 247, 0.08)' : '#f1f5f9',
                              color: canAfford ? '#002cf7' : '#94a3b8',
                              fontWeight: 700,
                              fontSize: '13px',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '8px 16px',
                              cursor: canAfford ? 'pointer' : 'not-allowed',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {canAfford ? 'Échanger' : `-${reward.cost - pts} pts`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Tab 2 : Ajustement Points */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' }}>
                        Bonus Rapides :
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[10, 25, 50, 100].map((bonus) => (
                          <button
                            key={bonus}
                            type="button"
                            onClick={() => handleApplyPointsAdjustment(bonus)}
                            style={{
                              backgroundColor: 'rgba(0, 44, 247, 0.06)',
                              color: '#002cf7',
                              fontWeight: 700,
                              fontSize: '12px',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '8px 14px',
                              cursor: 'pointer'
                            }}
                          >
                            +{bonus} pts
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                          Variation Personnalisée (positif ou négatif) :
                        </label>
                        <input
                          type="number"
                          placeholder="Ex: 50 ou -20"
                          value={pointsDeltaInput}
                          onChange={(e) => setPointsDeltaInput(e.target.value)}
                          style={{
                            width: '100%',
                            height: '46px',
                            backgroundColor: '#ffffff',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '0 14px',
                            fontSize: '13px',
                            color: '#09090b',
                            fontWeight: 500,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                          Motif de l'ajustement (optionnel) :
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Offert par la gérance, correction caisse..."
                          value={reasonInput}
                          onChange={(e) => setReasonInput(e.target.value)}
                          style={{
                            width: '100%',
                            height: '46px',
                            backgroundColor: '#ffffff',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '0 14px',
                            fontSize: '13px',
                            color: '#09090b',
                            fontWeight: 500,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyPointsAdjustment()}
                        style={{
                          backgroundColor: '#002cf7',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '14px',
                          border: 'none',
                          borderRadius: '14px',
                          height: '46px',
                          cursor: 'pointer',
                          marginTop: '4px'
                        }}
                      >
                        Valider l'ajustement
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
