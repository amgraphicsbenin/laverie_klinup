import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';

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
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'abonne', 'dette'
  const [copiedId, setCopiedId] = useState(null);

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

  // Status badges mapping
  const statusBadgesConfig = {
    en_attente: { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', label: 'En attente' },
    traitement: { bg: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', label: 'Traitement' },
    en_cours_lavage: { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', label: 'Lavage' },
    en_cours_repassage: { bg: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', label: 'Repassage' },
    pret: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', label: 'Prêt' },
    a_livrer: { bg: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', label: 'À livrer' },
    a_recuperer: { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706', label: 'À récupérer' },
    en_cours_livraison: { bg: 'rgba(15, 23, 42, 0.12)', color: '#0f172a', label: 'En livraison' },
    restitue: { bg: 'rgba(16, 185, 129, 0.08)', color: '#059669', label: 'Livré / Récupéré' },
    annule: { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', label: 'Annulée' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* BANNIÈRE DE STATISTIQUES CRM (KPI BAR) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
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
              Abonnés VIP / Premium
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#10b981', lineHeight: 1.1, marginTop: '2px' }}>
              {activeSubscribers} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>actifs</span>
            </div>
          </div>
        </div>

        {/* KPI 3 : Clients en Dette */}
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
            background: indebtedCustomers.length > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(100, 116, 139, 0.1)',
            color: indebtedCustomers.length > 0 ? '#ef4444' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Comptes en Dette
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: indebtedCustomers.length > 0 ? '#ef4444' : 'var(--text-primary)', lineHeight: 1.1, marginTop: '2px' }}>
              {indebtedCustomers.length} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>clients</span>
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
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Total Dettes à Recouvrer
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#d97706', lineHeight: 1.1, marginTop: '2px' }}>
              {totalDebtAmount.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>FCFA</span>
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
                Fiches CRM & historiques de fréquentation
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowNewCustomerModal(true)}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--primary)', color: '#fff', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
            >
              <UserPlus size={15} /> Nouveau
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-control"
              style={{ paddingLeft: '2.4rem', width: '100%', borderRadius: '10px', fontSize: '0.8rem', padding: '0.5rem 0.5rem 0.5rem 2.4rem' }}
              placeholder="Rechercher par Nom, Prénom ou Téléphone..."
              value={crmSearch}
              onChange={(e) => setCrmSearch(e.target.value)}
            />
          </div>

          {/* Filter Chips Pills */}
          <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              style={{
                flex: 1,
                padding: '0.35rem 0.5rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                borderRadius: '7px',
                border: 'none',
                background: filterMode === 'all' ? 'var(--primary)' : 'transparent',
                color: filterMode === 'all' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Tous ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('abonne')}
              style={{
                flex: 1,
                padding: '0.35rem 0.5rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                borderRadius: '7px',
                border: 'none',
                background: filterMode === 'abonne' ? '#10b981' : 'transparent',
                color: filterMode === 'abonne' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Abonnés ({activeSubscribers})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('dette')}
              style={{
                flex: 1,
                padding: '0.35rem 0.5rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                borderRadius: '7px',
                border: 'none',
                background: filterMode === 'dette' ? '#ef4444' : 'transparent',
                color: filterMode === 'dette' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Dettes ({indebtedCustomers.length})
            </button>
          </div>

          {/* List of Customers */}
          <div style={{ overflowY: 'auto', maxHeight: '580px', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
            {(() => {
              const query = crmSearch.toLowerCase();
              const filteredCrm = customers.filter(c => {
                const matchesQuery = c.nom.toLowerCase().includes(query) ||
                  c.prenom.toLowerCase().includes(query) ||
                  c.telephone.includes(query);
                
                if (!matchesQuery) return false;
                if (filterMode === 'abonne') return !!c.active_subscription;
                if (filterMode === 'dette') return c.solde_dette > 0;
                return true;
              });

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
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.1rem 0.4rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                          <Star size={11} fill="var(--primary)" /> {c.points_fidelite} pts
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

        {/* COLONNE DROITE : PROFIL CLIENT DETAILE & HISTORIQUE */}
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
                
                {/* 1. Points Fidélité */}
                <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-app)', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={13} color="var(--primary)" /> Points Fidélité
                  </span>
                  <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', color: 'var(--primary)', fontWeight: 900 }}>
                    {selectedCrmCustomer.points_fidelite} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>pts</span>
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
    </div>
  );
}
