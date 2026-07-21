import React from 'react';
import { TrendingUp, Video } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';

export default function DashboardTab({
  earnedRevenue,
  completedOrdersCount,
  activeOrdersCount,
  pendingOrdersCount,
  chartPeriod,
  setChartPeriod,
  daysOfWeek,
  baseLavage,
  baseRepassage,
  restitutionRate,
  averageOrderValue,
  mostPopularService,
  activeSubscriptionsCount,
  nonCancelledOrdersCount,
  totalOrdersCount,
  orders,
  customers,
  staff,
  serviceLabels,
  getOrderStatusLabel,
  setActiveDetailsCard,
  setShowOrderRegistrationModal
}) {
  const renderArrowBtn = () => (
    <span style={{ fontSize: '1rem', color: 'currentColor', opacity: 0.8 }}>→</span>
  );

  return (
    <>
      {/* Cartes KPI Donezo Style */}
      <div className="kpi-container">
        {/* Chiffre d'Affaires - Forest Green Theme */}
        <button
          type="button"
          className="card kpi-card green-theme"
          style={{ cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', textAlign: 'left', border: 'none' }}
          onClick={() => setActiveDetailsCard('ca')}
        >
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
        </button>

        {/* Commandes Livrées - White Theme */}
        <button
          type="button"
          className="card kpi-card white-theme"
          style={{ cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', textAlign: 'left', border: 'none' }}
          onClick={() => setActiveDetailsCard('completed')}
        >
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
        </button>

        {/* Commandes Actives - White Theme */}
        <button
          type="button"
          className="card kpi-card white-theme"
          style={{ cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', textAlign: 'left', border: 'none' }}
          onClick={() => setActiveDetailsCard('active')}
        >
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
        </button>

        {/* Commandes en Attente - White Theme */}
        <button
          type="button"
          className="card kpi-card white-theme"
          style={{ cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', textAlign: 'left', border: 'none' }}
          onClick={() => setActiveDetailsCard('pending')}
        >
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
        </button>
      </div>

      {/* Grille Principale */}
      <div className="grid-2">
        {/* Volume de Linge Traité */}
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

        {/* Rappels & Maintenance */}
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
        {/* Personnel de Service */}
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
              const isOnline = s.role !== 'agent_accueil' && s.role !== 'livreur' && s.role !== 'agent_lavage_repassage';

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

        {/* Taux de Livraison & Performance Services */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Taux de Livraison */}
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

          {/* Performance Services */}
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

      {/* Commandes Récentes */}
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

            let bulletBg = 'var(--status-pending)';
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
  );
}
