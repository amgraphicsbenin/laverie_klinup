import React from 'react';
import { CheckCircle2, X, MapPin, Phone, Copy, Zap, Clock, ArrowRight } from 'lucide-react';

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

  // Status color mapping
  const statusMeta = {
    en_attente:          { color: '#d97706', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.2)'   },
    en_cours_lavage:     { color: '#2563eb', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)'   },
    en_cours_repassage:  { color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)'  },
    pret:                { color: '#059669', bg: 'rgba(5,150,105,0.08)',   border: 'rgba(5,150,105,0.2)'   },
    a_livrer:            { color: '#0284c7', bg: 'rgba(2,132,199,0.08)',   border: 'rgba(2,132,199,0.2)'   },
    a_recuperer:         { color: '#059669', bg: 'rgba(5,150,105,0.08)',   border: 'rgba(5,150,105,0.2)'   },
    en_cours_livraison:  { color: '#0284c7', bg: 'rgba(2,132,199,0.08)',   border: 'rgba(2,132,199,0.2)'   },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {filteredAtelierOrders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.65rem',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '16px',
            background: 'rgba(5,150,105,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle2 size={26} color="#059669" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '4px' }}>
              Aucune commande en cours
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              L'atelier est à jour. Toutes les commandes sont traitées.
            </div>
          </div>
        </div>
      ) : (
        filteredAtelierOrders.map(order => {
          const client = customers.find(c => c.id === order.customer_id);
          const isLate = isOrderLate(order);
          const isExpress = order.niveau_urgence === 'Express';
          const meta = statusMeta[order.statut] || { color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' };

          const isBadgeClickable =
            (userRole === 'super_admin' || userRole === 'manager' || userRole === 'agent_accueil')
              ? (order.statut === 'a_livrer' || order.statut === 'a_recuperer')
              : (userRole === 'livreur' && order.statut === 'a_livrer');

          // Article items text
          const articleText = order.items && order.items.length > 0
            ? order.items.map(it => `${it.quantite}x ${it.article}`).join(', ')
            : order.type_article;

          const serviceText = order.items && order.items.length > 0
            ? serviceLabels[order.items[0]?.service] || order.type_service
            : serviceLabels[order.type_service] || order.type_service;

          return (
            <div
              key={order.id}
              className={`order-detail-card-modern kanban-card ${isExpress ? 'pulse-express' : ''}`}
              style={{
                border: isLate
                  ? '1.5px solid rgba(220,38,38,0.35)'
                  : isExpress
                  ? '1.5px solid rgba(217,119,6,0.35)'
                  : '1px solid var(--border-color)',
                boxShadow: isLate
                  ? '0 8px 24px rgba(220,38,38,0.06)'
                  : '0 8px 24px rgba(0,0,0,0.02)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Top color accent bar based on status */}
              <div style={{
                height: '3px',
                background: isLate
                  ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                  : `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)`,
                width: '100%',
                flexShrink: 0
              }} />

              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Code marquage + badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: 'var(--primary)',
                        background: 'var(--primary-light)',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        letterSpacing: '0.3px',
                        border: '1px solid rgba(59, 130, 246, 0.12)'
                      }}>
                        {order.identifiant_unique_marquage}
                      </span>
                      {isExpress && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: '2px',
                          fontSize: '0.55rem', fontWeight: 700,
                          color: '#d97706', background: 'rgba(217,119,6,0.08)',
                          padding: '2px 6px', borderRadius: '20px',
                          border: '1px solid rgba(217,119,6,0.18)'
                        }}>
                          <Zap size={8} /> EXPRESS
                        </span>
                      )}
                      {isLate && (
                        <span style={{
                          fontSize: '0.55rem', fontWeight: 700,
                          color: '#dc2626', background: 'rgba(220,38,38,0.06)',
                          padding: '2px 6px', borderRadius: '20px',
                          border: '1px solid rgba(220,38,38,0.18)'
                        }}>
                          ⏰ RETARD
                        </span>
                      )}
                    </div>

                    {/* Client name with circular initials badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.3rem', marginBottom: '0.2rem' }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%', 
                        background: 'linear-gradient(135deg, var(--primary-light) 0%, rgba(59, 130, 246, 0.15) 100%)',
                        color: 'var(--primary)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '0.58rem', fontWeight: 800, flexShrink: 0,
                        border: '1px solid rgba(59, 130, 246, 0.1)'
                      }}>
                        {client ? `${client.prenom[0] || ''}${client.nom[0] || ''}`.toUpperCase() : '??'}
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {client ? `${client.prenom} ${client.nom}` : 'Client inconnu'}
                      </span>
                    </div>
                  </div>

                  {/* Status badge (right) */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.58rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '20px',
                      background: meta.bg,
                      color: meta.color,
                      border: `1px solid ${meta.border}`,
                      whiteSpace: 'nowrap',
                      cursor: isBadgeClickable ? 'pointer' : 'default',
                      flexShrink: 0
                    }}
                    onClick={(e) => {
                      if (isBadgeClickable) {
                        e.stopPropagation();
                        handleCompleteDelivery(order, order.statut);
                      }
                    }}
                  >
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                    {getOrderStatusLabel(order)}
                  </span>
                </div>

                {/* Articles Box (translucent details box) */}
                <div style={{
                  background: '#f8fafc',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 600, 
                    color: 'var(--text-primary)', 
                    lineHeight: 1.3 
                  }}>
                    {articleText}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '0.58rem', 
                      fontWeight: 700, 
                      color: 'var(--primary)', 
                      background: 'var(--primary-light)',
                      padding: '1px 6px',
                      borderRadius: '6px',
                      border: '1px solid rgba(59, 130, 246, 0.08)'
                    }}>
                      {serviceText}
                    </span>
                  </div>
                </div>

                {/* Dates row */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  background: isLate ? 'rgba(220,38,38,0.03)' : '#f8fafc',
                  borderRadius: '12px',
                  padding: '0.5rem 0.75rem',
                  border: isLate ? '1.5px solid rgba(220,38,38,0.1)' : '1px solid rgba(0, 0, 0, 0.03)',
                }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={10} color="var(--text-muted)" /> Dépôt
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {formatDateTime(order.created_at)}
                    </div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--border-color)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '0.55rem', color: isLate ? '#dc2626' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={10} color={isLate ? '#dc2626' : 'var(--text-muted)'} /> Échéance
                    </div>
                    <div style={{ fontSize: '0.68rem', color: isLate ? '#dc2626' : 'var(--text-primary)', fontWeight: 600 }}>
                      {formatDateTime(order.due_date)}
                    </div>
                  </div>
                </div>

                {/* Delivery info block */}
                {order.statut === 'a_livrer' && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    background: 'rgba(2,132,199,0.05)',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(2,132,199,0.15)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <MapPin size={12} color="#0284c7" />
                      <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 700 }}>Adresse</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-primary)', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client?.adresse || 'Non renseignée'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Phone size={12} color="#0284c7" />
                      <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 700 }}>Téléphone</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>
                        {client ? `+${client.indicatif || '229'} ${client.telephone}` : 'Non renseigné'}
                      </span>
                    </div>
                    <button
                      type="button"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.3rem 0.65rem', fontSize: '0.62rem',
                        background: 'transparent', border: '1px solid rgba(2,132,199,0.35)',
                        borderRadius: '8px', color: '#0284c7', cursor: 'pointer',
                        fontWeight: 700, width: 'fit-content'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(`Client: ${client ? `${client.prenom} ${client.nom}` : ''}\nTél: ${client ? `+${client.indicatif || '229'} ${client.telephone}` : ''}\nAdresse: ${client?.adresse || 'Non renseignée'}`);
                      }}
                    >
                      <Copy size={9} /> Copier les infos
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  {/* Atelier/Treatment Buttons */}
                  {(userRole === 'super_admin' || userRole === 'manager' || userRole === 'agent_lavage_repassage') && (
                    <>
                      {order.statut === 'en_attente' && (
                        <button
                          type="button"
                          style={{
                            flex: 1, padding: '0.65rem 0.5rem',
                            fontSize: '0.74rem', fontWeight: 700,
                            borderRadius: '14px', border: 'none', cursor: 'pointer',
                            background: 'var(--primary-gradient)',
                            color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                            boxShadow: '0 6px 18px rgba(59,130,246,0.22)'
                          }}
                          onClick={() => handleStatusChange(order.id, 'en_cours_lavage')}
                        >
                          Lancer le traitement <ArrowRight size={14} />
                        </button>
                      )}
                      {order.statut === 'en_cours_lavage' && (
                        <button
                          type="button"
                          style={{
                            flex: 1, padding: '0.65rem 0.5rem',
                            fontSize: '0.74rem', fontWeight: 700,
                            borderRadius: '14px', border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #7c3aed, #9f60f0)',
                            color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                            boxShadow: '0 6px 18px rgba(124,58,237,0.22)'
                          }}
                          onClick={() => handleStatusChange(order.id, 'en_cours_repassage')}
                        >
                          Lancer le repassage <ArrowRight size={14} />
                        </button>
                      )}
                      {order.statut === 'en_cours_repassage' && (
                        <button
                          type="button"
                          style={{
                            flex: 1, padding: '0.65rem 0.5rem',
                            fontSize: '0.74rem', fontWeight: 700,
                            borderRadius: '14px', border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                            color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                            boxShadow: '0 6px 18px rgba(5,150,105,0.22)'
                          }}
                          onClick={() => handleStatusChange(order.id, 'pret')}
                        >
                          Marquer comme prêt <ArrowRight size={14} />
                        </button>
                      )}
                    </>
                  )}

                  {/* Dispatch Buttons */}
                  {(userRole === 'super_admin' || userRole === 'manager' || userRole === 'agent_accueil') && (
                    <>
                      {order.statut === 'pret' && (
                        <>
                          <button
                            type="button"
                            style={{
                              flex: 1, padding: '0.65rem 0.4rem',
                              fontSize: '0.72rem', fontWeight: 700,
                              borderRadius: '14px', border: 'none', cursor: 'pointer',
                              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                              color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                              boxShadow: '0 6px 18px rgba(2,132,199,0.22)'
                            }}
                            onClick={() => handleStatusChange(order.id, 'a_livrer')}
                          >
                            <ArrowRight size={13} /> À livrer
                          </button>
                          <button
                            type="button"
                            style={{
                              flex: 1, padding: '0.65rem 0.4rem',
                              fontSize: '0.72rem', fontWeight: 700,
                              borderRadius: '14px', border: 'none', cursor: 'pointer',
                              background: 'linear-gradient(135deg, #059669, #10b981)',
                              color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                              boxShadow: '0 6px 18px rgba(5,150,105,0.22)'
                            }}
                            onClick={() => handleStatusChange(order.id, 'a_recuperer')}
                          >
                            <ArrowRight size={13} /> À récupérer
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {/* Delivery Finalization */}
                  {order.statut === 'a_livrer' && (userRole === 'super_admin' || userRole === 'manager' || userRole === 'agent_accueil' || userRole === 'livreur') && (
                    <button
                      type="button"
                      style={{
                        flex: 1, padding: '0.65rem 0.5rem',
                        fontSize: '0.74rem', fontWeight: 700,
                        borderRadius: '14px', border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                        color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                        boxShadow: '0 6px 18px rgba(2,132,199,0.22)'
                      }}
                      onClick={() => handleCompleteDelivery(order, 'a_livrer')}
                    >
                      Valider la livraison <ArrowRight size={14} />
                    </button>
                  )}
                  {order.statut === 'a_recuperer' && (userRole === 'super_admin' || userRole === 'manager' || userRole === 'agent_accueil') && (
                    <button
                      type="button"
                      style={{
                        flex: 1, padding: '0.65rem 0.5rem',
                        fontSize: '0.74rem', fontWeight: 700,
                        borderRadius: '14px', border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #059669, #10b981)',
                        color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                        boxShadow: '0 6px 18px rgba(5,150,105,0.22)'
                      }}
                      onClick={() => handleCompleteDelivery(order, 'a_recuperer')}
                    >
                      Valider récupération <ArrowRight size={14} />
                    </button>
                  )}

                  {/* Cancel button (circular outline) */}
                  {(userRole === 'super_admin' || userRole === 'manager') && (
                    <button
                      type="button"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(220,38,38,0.06)',
                        border: '1px solid rgba(220,38,38,0.18)',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.25s ease'
                      }}
                      onClick={() => handleCancelOrder(order.id)}
                      title="Annuler la commande"
                    >
                      <X size={15} strokeWidth={2.5} />
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
