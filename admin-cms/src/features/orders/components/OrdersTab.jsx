import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';

export default function OrdersTab({
  orders,
  customers,
  atelierFilter,
  setAtelierFilter,
  isOrderLate,
  serviceLabels,
  handleStatusChange,
  handleStartDelivery,
  copyToClipboard,
  formatDateTime,
  handleCancelOrder,
  setShowOrderRegistrationModal,
  historySearchQuery,
  setHistorySearchQuery,
  historyFilterStatus,
  setHistoryFilterStatus,
  getOrderStatusLabel,
  setCreatedOrder
}) {
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const toggleExpand = (orderId) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const handleCopy = (orderId, text) => {
    copyToClipboard(text);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusLabels = {
    en_attente: 'En attente',
    traitement: 'Traitement',
    en_cours_lavage: 'Lavage',
    en_cours_repassage: 'Repassage',
    pret: 'Prêt',
    a_livrer: 'À livrer',
    a_recuperer: 'À récupérer',
    en_cours_livraison: 'En livraison',
    restitue: 'Récupéré / Livré',
    annule: 'Annulée'
  };

  const statusBadgesConfig = {
    en_attente: { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)', label: 'En attente' },
    traitement: { bg: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', border: 'rgba(124, 58, 237, 0.25)', label: 'Traitement' },
    en_cours_lavage: { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', border: 'rgba(37, 99, 235, 0.25)', label: 'Lavage' },
    en_cours_repassage: { bg: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', border: 'rgba(13, 148, 136, 0.25)', label: 'Repassage' },
    pret: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.25)', label: 'Prêt' },
    a_livrer: { bg: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', border: 'rgba(79, 70, 229, 0.25)', label: 'À livrer' },
    a_recuperer: { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706', border: 'rgba(217, 119, 6, 0.25)', label: 'À récupérer' },
    en_cours_livraison: { bg: 'rgba(15, 23, 42, 0.12)', color: '#0f172a', border: 'rgba(15, 23, 42, 0.25)', label: 'En livraison' },
    restitue: { bg: 'rgba(16, 185, 129, 0.08)', color: '#059669', border: 'rgba(16, 185, 129, 0.2)', label: 'Livré / Récupéré' },
    annule: { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)', label: 'Annulée' }
  };

  // Metrics KPI calculation
  const activeOrders = orders.filter(o => o.statut !== 'restitue' && o.statut !== 'annule');
  const expressOrdersCount = activeOrders.filter(o => o.niveau_urgence === 'Express').length;
  const readyOrdersCount = activeOrders.filter(o => ['pret', 'a_livrer', 'a_recuperer'].includes(o.statut)).length;
  const lateOrdersCount = activeOrders.filter(o => isOrderLate(o)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNIÈRE DE STATISTIQUES EN TÊTE (KPI BAR) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem'
      }}>
        {/* KPI 1 : Commandes Actives en Atelier */}
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
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              En Atelier (Actives)
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '2px' }}>
              {activeOrders.length} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>commandes</span>
            </div>
          </div>
        </div>

        {/* KPI 2 : Traitements Express */}
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
            <Flame size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Traitements Express
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#d97706', lineHeight: 1.1, marginTop: '2px' }}>
              {expressOrdersCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>urgentes</span>
            </div>
          </div>
        </div>

        {/* KPI 3 : Prêtes / À Distribuer */}
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
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Prêtes / À Livrer
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#10b981', lineHeight: 1.1, marginTop: '2px' }}>
              {readyOrdersCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>disponibles</span>
            </div>
          </div>
        </div>

        {/* KPI 4 : Retards en Atelier */}
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
            background: lateOrdersCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(100, 116, 139, 0.1)',
            color: lateOrdersCount > 0 ? '#ef4444' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Alertes Retard
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: lateOrdersCount > 0 ? '#ef4444' : 'var(--text-primary)', lineHeight: 1.1, marginTop: '2px' }}>
              {lateOrdersCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>dépassements</span>
            </div>
          </div>
        </div>
      </div>

      {/* DISPOSITION PRINCIPALE DU FLUX (ATELIER A GAUCHE, HISTORIQUE A DROITE) */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.25fr 0.75fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* COLONNE GAUCHE : SUIVI D'ATELIER & CAISSE TERRAIN */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', borderRadius: '20px' }}>
          
          {/* Header Suivi Atelier */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.9rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Suivi d'Atelier & Caisse Terrain
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Avancement des traitements et encaissements des dépôts actifs
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', gap: '0.25rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setAtelierFilter('all')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  borderRadius: '7px',
                  border: 'none',
                  background: atelierFilter === 'all' ? 'var(--primary)' : 'transparent',
                  color: atelierFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Toutes ({activeOrders.length})
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setAtelierFilter('urgent')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  borderRadius: '7px',
                  border: 'none',
                  background: atelierFilter === 'urgent' ? '#d97706' : 'transparent',
                  color: atelierFilter === 'urgent' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                ⚡ Urgent ({expressOrdersCount})
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setAtelierFilter('retard')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  borderRadius: '7px',
                  border: 'none',
                  background: atelierFilter === 'retard' ? '#ef4444' : 'transparent',
                  color: atelierFilter === 'retard' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                ⚠️ Retard ({lateOrdersCount})
              </button>
            </div>
          </div>

          {/* Liste des cartes Suivi d'Atelier */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '680px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {(() => {
              const filteredAtelierOrders = orders.filter(o => {
                if (o.statut === 'restitue' || o.statut === 'annule') return false;
                if (atelierFilter === 'urgent') return o.niveau_urgence === 'Express';
                if (atelierFilter === 'retard') return isOrderLate(o);
                return true;
              }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

              if (filteredAtelierOrders.length === 0) {
                return (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3.5rem 1.5rem', background: 'var(--bg-app)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                    <CheckCircle2 size={36} style={{ margin: '0 auto 0.6rem', color: 'var(--primary)', opacity: 0.6 }} />
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Aucune commande active</h4>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Toutes les commandes correspondant à ce filtre ont été traitées ou livrées.</p>
                  </div>
                );
              }

              return filteredAtelierOrders.map(order => {
                const customer = customers.find(c => c.id === order.customer_id);
                const clientName = customer ? `${customer.prenom} ${customer.nom}` : 'Client B2B';
                const clientPhone = customer ? customer.telephone : '-';
                const isExpress = order.niveau_urgence === 'Express';
                const isLate = isOrderLate(order);
                const remainingToPay = order.prix_total - order.avance_payee;
                const statusCfg = statusBadgesConfig[order.statut] || { bg: 'rgba(100,116,139,0.1)', color: 'var(--text-secondary)', border: 'rgba(100,116,139,0.2)', label: order.statut };

                return (
                  <div
                    key={order.id}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: isExpress ? '1.5px solid rgba(245, 158, 11, 0.5)' : (isLate ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)'),
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.9rem',
                      background: 'var(--bg-card)',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Order ID, Tags & Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', letterSpacing: '0.2px' }}>
                            {order.identifiant_unique_marquage}
                          </span>
                          {isExpress && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              ⚡ Express
                            </span>
                          )}
                          {isLate && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              ⚠️ RETARD
                            </span>
                          )}
                        </div>
                        
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Package size={15} color="var(--primary)" />
                          <span>{order.type_article}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-app)', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>
                            {serviceLabels[order.type_service] || order.type_service}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge Tag */}
                      <button
                        type="button"
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.3rem 0.75rem',
                          borderRadius: '20px',
                          background: statusCfg.bg,
                          color: statusCfg.color,
                          border: `1px solid ${statusCfg.border}`,
                          cursor: (order.statut === 'a_livrer' || order.statut === 'a_recuperer' || order.statut === 'en_cours_livraison') ? 'pointer' : 'default',
                          fontFamily: 'inherit',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                        disabled={!(order.statut === 'a_livrer' || order.statut === 'a_recuperer' || order.statut === 'en_cours_livraison')}
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
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusCfg.color }}></span>
                        {statusCfg.label}
                      </button>
                    </div>

                    {/* Middle Row: Client info & Deposit Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', padding: '0.5rem 0.75rem', borderRadius: '12px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={14} color="var(--primary)" />
                        <span>Client : <strong style={{ color: 'var(--text-primary)' }}>{clientName}</strong> ({clientPhone})</span>
                      </div>
                      <button 
                        onClick={() => toggleExpand(order.id)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.74rem' }}
                      >
                        {expandedOrderId === order.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        Détails
                      </button>
                    </div>

                    {/* Expanded Drawer: Address, Phone & Quick Copy */}
                    {expandedOrderId === order.id && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', background: 'rgba(59, 130, 246, 0.04)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.15)', fontSize: '0.76rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                          <MapPin size={14} color="var(--primary)" />
                          <span>Adresse : <strong style={{ color: 'var(--text-primary)' }}>{customer?.adresse || 'Non renseignée'}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                          <Phone size={14} color="var(--primary)" />
                          <span>Téléphone : <strong style={{ color: 'var(--text-primary)' }}>{customer ? `+${customer.indicatif || '229'} ${customer.telephone}` : 'Non renseigné'}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                          <Clock size={14} color="var(--primary)" />
                          <span>Dépôt le : <strong style={{ color: 'var(--text-primary)' }}>{formatDateTime(order.created_at)}</strong></span>
                        </div>
                        
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', fontWeight: 700, borderRadius: '8px', width: 'fit-content', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const cName = customer ? `${customer.prenom} ${customer.nom}` : '';
                            const cPhone = customer ? `+${customer.indicatif || '229'} ${customer.telephone}` : '';
                            const cAddr = customer?.adresse || 'Non renseignée';
                            handleCopy(order.id, `Client: ${cName}\nTél: ${cPhone}\nAdresse: ${cAddr}`);
                          }}
                        >
                          {copiedId === order.id ? <Check size={13} /> : <Copy size={13} />}
                          {copiedId === order.id ? 'Copié !' : 'Copier Coordonnées'}
                        </button>
                      </div>
                    )}

                    {/* Financial Progress Bar (Total, Paid, Remaining) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total: <strong style={{ color: 'var(--text-primary)' }}>{order.prix_total.toLocaleString()} F CFA</strong></span>
                        <span style={{ color: 'var(--text-secondary)' }}>Acompte: <strong style={{ color: 'var(--primary)' }}>{order.avance_payee.toLocaleString()} F</strong></span>
                        <div>
                          {remainingToPay > 0 ? (
                            <span style={{ color: '#d97706', fontWeight: 800, background: 'rgba(245, 158, 11, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                              Reste: {remainingToPay.toLocaleString()} F
                            </span>
                          ) : (
                            <span style={{ color: '#10b981', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                              Solde Payé
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Step Buttons Workflow */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                      {order.statut === 'en_attente' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.55rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: '#7c3aed', border: 'none', color: '#fff' }}
                          onClick={() => handleStatusChange(order.id, 'traitement')}
                        >
                          <Zap size={15} /> Passer au traitement
                        </button>
                      )}
                      {order.statut === 'traitement' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.55rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: '#2563eb', border: 'none', color: '#fff' }}
                          onClick={() => handleStatusChange(order.id, 'en_cours_lavage')}
                        >
                          <Sparkles size={15} /> Lancer le lavage
                        </button>
                      )}
                      {order.statut === 'en_cours_lavage' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.55rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: '#0d9488', border: 'none', color: '#fff' }}
                          onClick={() => handleStatusChange(order.id, 'en_cours_repassage')}
                        >
                          <Flame size={15} /> Passer au repassage
                        </button>
                      )}
                      {order.statut === 'en_cours_repassage' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.55rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: '#059669', border: 'none', color: '#fff' }}
                          onClick={() => handleStatusChange(order.id, 'pret')}
                        >
                          <CheckCircle2 size={15} /> Marquer comme Prêt
                        </button>
                      )}
                      {order.statut === 'pret' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '0.55rem', fontSize: '0.76rem', fontWeight: 700, borderRadius: '10px', background: '#4f46e5', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                            onClick={() => handleStatusChange(order.id, 'a_livrer')}
                          >
                            <Truck size={14} /> À livrer
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '0.55rem', fontSize: '0.76rem', fontWeight: 700, borderRadius: '10px', background: '#d97706', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                            onClick={() => handleStatusChange(order.id, 'a_recuperer')}
                          >
                            <Package size={14} /> À récupérer
                          </button>
                        </>
                      )}
                      {order.statut === 'a_livrer' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.55rem', fontSize: '0.76rem', fontWeight: 700, borderRadius: '10px', background: '#4f46e5', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                          onClick={() => handleStatusChange(order.id, 'en_cours_livraison')}
                        >
                          <Truck size={15} /> Démarrer la livraison
                        </button>
                      )}
                      {order.statut === 'a_recuperer' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.55rem', fontSize: '0.76rem', fontWeight: 700, borderRadius: '10px', background: '#d97706', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                          onClick={() => handleStartDelivery(order, 'restitue')}
                        >
                          <CheckCircle2 size={15} /> Marquer comme récupéré
                        </button>
                      )}
                      {order.statut === 'en_cours_livraison' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.55rem', fontSize: '0.76rem', fontWeight: 700, borderRadius: '10px', background: '#0f172a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                          onClick={() => handleStartDelivery(order, 'restitue')}
                        >
                          <CheckCircle2 size={15} /> Terminer la livraison
                        </button>
                      )}

                      {/* Cancel Order Button */}
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '0.55rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Annuler la commande"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <Ban size={15} />
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* COLONNE DROITE : HISTORIQUE DES COMMANDES */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', borderRadius: '20px' }}>
          
          {/* Header Historique & Bouton Nouvelle Commande */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.9rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Historique Global
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Consultation et édition des reçus
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowOrderRegistrationModal(true)}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--primary)', color: '#fff', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
            >
              <Plus size={15} /> Nouvelle
            </button>
          </div>

          {/* Search Bar & Filter Dropdown */}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <div style={{ flexGrow: 1, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: '2.4rem', width: '100%', borderRadius: '10px', fontSize: '0.8rem', padding: '0.5rem 0.5rem 0.5rem 2.4rem' }}
                placeholder="Rechercher par Code/Client..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
              />
            </div>
            <CustomSelect
              className="input-control"
              style={{ borderRadius: '10px', fontSize: '0.78rem', width: '125px', padding: '0.45rem 0.5rem' }}
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

          {/* List of History Items */}
          <div style={{ overflowY: 'auto', maxHeight: '580px', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
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
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2.5rem 1rem', background: 'var(--bg-app)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
                    <Ticket size={28} style={{ margin: '0 auto 0.4rem', color: 'var(--text-muted)' }} />
                    <p style={{ margin: 0, fontSize: '0.78rem' }}>Aucune commande dans l'historique.</p>
                  </div>
                );
              }

              return filteredHistory.map(order => {
                const customer = customers.find(c => c.id === order.customer_id);
                const clientName = customer ? `${customer.prenom} ${customer.nom}` : 'Client B2B';
                const serviceName = serviceLabels[order.type_service] || order.type_service;
                const statusCfg = statusBadgesConfig[order.statut] || { bg: 'rgba(100,116,139,0.1)', color: 'var(--text-secondary)', label: getOrderStatusLabel(order) };

                return (
                  <button
                    type="button"
                    key={order.id}
                    className="card-clickable"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      color: 'inherit',
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setCreatedOrder(order)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                        {order.identifiant_unique_marquage}
                      </span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '12px', background: statusCfg.bg, color: statusCfg.color }}>
                        {getOrderStatusLabel(order)}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {order.type_article} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>|</span> {serviceName}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>Client : <strong style={{ color: 'var(--text-primary)' }}>{clientName}</strong></span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {order.prix_total.toLocaleString()} F
                      </span>
                    </div>

                    <div style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--primary)', textAlign: 'right', borderTop: '1px solid var(--border-color)', paddingTop: '0.35rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                      <Ticket size={12} /> Cliquer pour imprimer / voir ticket
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
