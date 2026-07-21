import React, { useState } from 'react';
import { AlertCircle, Search, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
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
  // État d'expansion des cartes de commande
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const toggleExpand = (orderId) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
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
    restitue: 'Récupéré / Livré'
  };

  return (
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
                      <button
                        type="button"
                        className={`badge badge-${order.statut}`}
                        style={{
                          fontSize: '0.65rem',
                          cursor: (order.statut === 'a_livrer' || order.statut === 'a_recuperer' || order.statut === 'en_cours_livraison') ? 'pointer' : 'default',
                          border: 'none',
                          fontFamily: 'inherit',
                          display: 'inline-block'
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
                        {statusLabels[order.statut] || order.statut.replaceAll('_', ' ')}
                      </button>
                      {isLate && (
                        <span className="badge badge-en_retard" style={{ fontSize: '0.55rem', padding: '0.05rem 0.25rem' }}>
                          RETARD
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '0.35rem 0.6rem', borderRadius: '8px' }}>
                    <span>Dépôt: {formatDateTime(order.created_at)}</span>
                    <button onClick={() => toggleExpand(order.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--primary)' }}>
                      {expandedOrderId === order.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      Détails
                    </button>
                  </div>

                  {expandedOrderId === order.id && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
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
                          const cName = customer ? `${customer.prenom} ${customer.nom}` : '';
                          const cPhone = customer ? `+${customer.indicatif || '229'} ${customer.telephone}` : '';
                          const cAddr = customer?.adresse || 'Non renseignée';
                          copyToClipboard(`Client: ${cName}\nTél: ${cPhone}\nAdresse: ${cAddr}`);
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
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', background: '#7c3aed', border: 'none', color: '#fff' }}
                        onClick={() => handleStatusChange(order.id, 'traitement')}
                      >
                        Passer au traitement
                      </button>
                    )}
                    {order.statut === 'traitement' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', background: '#002cf7', border: 'none', color: '#fff' }}
                        onClick={() => handleStatusChange(order.id, 'en_cours_lavage')}
                      >
                        Lancer le lavage
                      </button>
                    )}
                    {order.statut === 'en_cours_lavage' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', background: '#0d9488', border: 'none', color: '#fff' }}
                        onClick={() => handleStatusChange(order.id, 'en_cours_repassage')}
                      >
                        Passer au repassage
                      </button>
                    )}
                    {order.statut === 'en_cours_repassage' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', background: '#059669', border: 'none', color: '#fff' }}
                        onClick={() => handleStatusChange(order.id, 'pret')}
                      >
                        Prêt
                      </button>
                    )}
                    {order.statut === 'pret' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: '#4f46e5', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                          onClick={() => handleStatusChange(order.id, 'a_livrer')}
                        >
                          À livrer
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: '#d97706', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
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
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: '#4f46e5', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                        onClick={() => handleStatusChange(order.id, 'en_cours_livraison')}
                      >
                        Démarrer la livraison
                      </button>
                    )}
                    {order.statut === 'a_recuperer' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: '#d97706', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                        onClick={() => handleStartDelivery(order, 'restitue')}
                      >
                        Marquer comme récupéré
                      </button>
                    )}
                    {order.statut === 'en_cours_livraison' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.72rem', borderRadius: '8px', background: '#09090b', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                        onClick={() => handleStartDelivery(order, 'restitue')}
                      >
                        Terminer la livraison
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
                <button
                  type="button"
                  key={order.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    color: 'inherit',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-app)',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setCreatedOrder(order)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{order.identifiant_unique_marquage}</span>
                    <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                      {getOrderStatusLabel(order)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {order.type_article} | {serviceName}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>Client: {clientName}</span>
                    <span>Total: <strong>{order.prix_total.toLocaleString()} F</strong></span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '0.25rem', width: '100%' }}>
                    Cliquer pour Voir Ticket
                  </div>
                </button>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
