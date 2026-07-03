import React from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function VueKanban({
  filteredAtelierOrders,
  customers,
  serviceLabels,
  getOrderStatusLabel,
  isOrderLate,
  formatDateTime,
  handleStatusChange,
  handleCompleteDelivery,
  handleCancelOrder,
  copyToClipboard,
  currentUser
}) {
  const userRole = currentUser?.role || 'agent_accueil';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {filteredAtelierOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CheckCircle size={28} color="var(--status-ready)" style={{ marginBottom: '0.5rem' }} />
          Aucun vêtement en traitement.
        </div>
      ) : (
        filteredAtelierOrders.map(order => {
          const client = customers.find(c => c.id === order.customer_id);
          const isLate = isOrderLate(order);
          const isExpress = order.niveau_urgence === 'Express';

          const isBadgeClickable = 
            (userRole === 'super_admin' || userRole === 'manager' || userRole === 'agent_accueil') 
              ? (order.statut === 'a_livrer' || order.statut === 'a_recuperer')
              : (userRole === 'livreur' && order.statut === 'a_livrer');

          return (
            <div 
              key={order.id} 
              className={`${isExpress ? 'pulse-express' : ''}`}
              style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', borderRadius: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {order.identifiant_unique_marquage}
                  </span>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0.1rem 0 0' }}>
                    {order.type_article} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.7rem' }}>({serviceLabels[order.type_service]})</span>
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {client ? `${client.prenom} ${client.nom}` : 'Inconnu'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.2rem' }}>
                  <span 
                    className={`badge badge-${order.statut}`} 
                    style={{ 
                      fontSize: '0.55rem', 
                      padding: '0.1rem 0.35rem',
                      cursor: isBadgeClickable ? 'pointer' : 'default'
                    }}
                    onClick={(e) => {
                      if (isBadgeClickable) {
                        e.stopPropagation();
                        handleCompleteDelivery(order, order.statut);
                      }
                    }}
                  >
                    {getOrderStatusLabel(order)}
                  </span>
                  {isLate && (
                    <span className="badge badge-en_retard" style={{ fontSize: '0.52rem', padding: '0.05rem 0.25rem' }}>
                      RETARD
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '0.3rem 0.5rem', borderRadius: '8px' }}>
                <span>Dépôt: {formatDateTime(order.created_at)}</span>
                <span>Éch: {formatDateTime(order.due_date)}</span>
              </div>

              {order.statut === 'a_livrer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--primary-light)', padding: '0.45rem 0.6rem', borderRadius: '10px', marginTop: '0.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <span>📍 Adresse :</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{client?.adresse || 'Non renseignée'}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <span>📞 Téléphone :</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{client ? `+${client.indicatif || '229'} ${client.telephone}` : 'Non renseigné'}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.6rem', borderRadius: '6px', width: 'fit-content', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(`Client: ${client ? `${client.prenom} ${client.nom}` : ''}\nTél: ${client ? `+${client.indicatif || '229'} ${client.telephone}` : ''}\nAdresse: ${client?.adresse || 'Non renseignée'}`);
                    }}
                  >
                    Copier
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.15rem' }}>
                {/* 1. Atelier/Treatment Buttons */}
                {(userRole === 'super_admin' || userRole === 'manager' || userRole === 'agent_lavage_repassage') && (
                  <>
                    {order.statut === 'en_attente' && (
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', borderRadius: '8px' }}
                        onClick={() => handleStatusChange(order.id, 'en_cours_lavage')}
                      >
                        Lancer le traitement
                      </button>
                    )}
                    {order.statut === 'en_cours_lavage' && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', borderRadius: '8px', background: '#8b5cf6', color: '#fff' }}
                        onClick={() => handleStatusChange(order.id, 'en_cours_repassage')}
                      >
                        Lancer le repassage
                      </button>
                    )}
                    {order.statut === 'en_cours_repassage' && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', borderRadius: '8px' }}
                        onClick={() => handleStatusChange(order.id, 'pret')}
                      >
                        Marquer comme prêt
                      </button>
                    )}
                  </>
                )}

                {/* 2. Dispatch/Delivery Assignment Buttons */}
                {(userRole === 'super_admin' || userRole === 'manager' || userRole === 'agent_accueil') && (
                  <>
                    {order.statut === 'pret' && (
                      <>
                        <button 
                          className="btn btn-primary" 
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.66rem', borderRadius: '8px', background: '#2B82F0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
                          onClick={() => handleStatusChange(order.id, 'a_livrer')}
                        >
                          À livrer
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.66rem', borderRadius: '8px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
                          onClick={() => handleStatusChange(order.id, 'a_recuperer')}
                        >
                          À récupérer
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* 3. Delivery Finalization Buttons */}
                {order.statut === 'a_livrer' && (userRole === 'super_admin' || userRole === 'manager' || userRole === 'agent_accueil' || userRole === 'livreur') && (
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', borderRadius: '8px', background: '#2B82F0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
                    onClick={() => handleCompleteDelivery(order, 'a_livrer')}
                  >
                    Valider la livraison
                  </button>
                )}
                {order.statut === 'a_recuperer' && (userRole === 'super_admin' || userRole === 'manager' || userRole === 'agent_accueil') && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', borderRadius: '8px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
                    onClick={() => handleCompleteDelivery(order, 'a_recuperer')}
                  >
                    En attente de récupération
                  </button>
                )}
                
                {/* 4. Cancel Button */}
                {(userRole === 'super_admin' || userRole === 'manager') && (
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.4rem', color: 'var(--status-late)', borderRadius: '8px' }}
                    onClick={() => handleCancelOrder(order.id)}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
