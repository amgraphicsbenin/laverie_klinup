        {activeTab === 'accueil' && (() => {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const activeOrders = orders.filter(o => o.statut !== 'restitue' && o.statut !== 'annule');
          const completedThisMonth = orders.filter(o => o.statut === 'restitue' && new Date(o.updated_at || o.created_at) >= startOfMonth);
          const lateOrders = activeOrders.filter(o => isOrderLate(o));
          const expressOrders = activeOrders.filter(o => o.niveau_urgence === 'Express');
          const revenueTotal = orders.filter(o => o.statut !== 'annule').reduce((s, o) => s + (o.prix_total || 0), 0);
          const encaisseTotal = orders.filter(o => o.statut !== 'annule').reduce((s, o) => s + (o.avance_payee || 0), 0);
          const resteTotal = revenueTotal - encaisseTotal;
          const revenueMonth = orders.filter(o => o.statut !== 'annule' && new Date(o.created_at) >= startOfMonth).reduce((s, o) => s + (o.prix_total || 0), 0);
          const pipeline = [
            { label: 'Reçu / Tri', key: 'en_attente', color: '#6366f1', icon: '📥' },
            { label: 'En Lavage', key: 'en_cours_lavage', color: '#3b82f6', icon: '🫧' },
            { label: 'Prêt', key: 'pret', color: '#10b981', icon: '✅' },
          ];
          const pipelineCounts = pipeline.map(s => ({ ...s, count: activeOrders.filter(o => o.statut === s.key).length }));
          const pipelineMax = Math.max(...pipelineCounts.map(p => p.count), 1);
          const last7 = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === d.toDateString());
            return { label: d.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2), count: dayOrders.length };
          });
          const maxBarCount = Math.max(...last7.map(d => d.count), 1);
          const topCustomers = customers.map(c => ({
            ...c,
            orderCount: orders.filter(o => o.customer_id === c.id && o.statut !== 'annule').length,
            totalSpent: orders.filter(o => o.customer_id === c.id && o.statut !== 'annule').reduce((s, o) => s + (o.prix_total || 0), 0)
          })).sort((a, b) => b.orderCount - a.orderCount).slice(0, 3);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bonjour,</p>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>{currentUser.prenom} {currentUser.nom}</h2>
                </div>
                <button className="btn btn-primary" style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0, flexShrink: 0 }} onClick={() => setShowOrderRegistrationModal(true)}>
                  <Plus size={18} />
                </button>
              </div>

              {/* ALERTE RETARDS */}
              {lateOrders.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TriangleAlert size={15} color="#d97706" />
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#92400e' }}>{lateOrders.length} commande{lateOrders.length > 1 ? 's' : ''} en retard de livraison !</span>
                </div>
              )}

              {/* CA PRINCIPAL */}
              <div className="dashboard-main-card" style={{ borderRadius: '20px', padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: '0.2rem' }}>Chiffre d'Affaires Total</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, fontFamily: 'var(--font-title)', letterSpacing: '-1px', lineHeight: 1.1 }}>{revenueTotal.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>FCFA</span></div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.67rem', opacity: 0.88 }}>
                  <span>✅ Encaissé : <strong>{encaisseTotal.toLocaleString()} F</strong></span>
                  <span>⏳ Reste : <strong>{resteTotal.toLocaleString()} F</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '38px', marginTop: '0.8rem' }}>
                  {last7.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ width: '100%', background: i === 6 ? '#fff' : 'rgba(255,255,255,0.35)', borderRadius: '3px 3px 0 0', height: `${Math.max(3, (d.count / maxBarCount) * 34)}px` }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                  {last7.map((d, i) => (<div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.48rem', opacity: 0.7 }}>{d.label}</div>))}
                </div>
              </div>

              {/* KPI GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {[
                  { label: 'Actives', value: activeOrders.length, color: 'var(--primary)', bg: 'var(--primary-light)', icon: <Activity size={15} color="var(--primary)" />, sub: 'commandes en cours' },
                  { label: 'Livrées / Mois', value: completedThisMonth.length, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={15} color="#10b981" />, sub: 'ce mois-ci' },
                  { label: 'Express', value: expressOrders.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <Zap size={15} color="#f59e0b" />, sub: 'commandes urgentes' },
                  { label: 'CA Mois', value: revenueMonth >= 1000 ? `${(revenueMonth/1000).toFixed(1)}k` : revenueMonth, color: 'var(--secondary)', bg: 'var(--secondary-light)', icon: <TrendingUp size={15} color="var(--secondary)" />, sub: 'FCFA ce mois' },
                ].map((kpi, i) => (
                  <div key={i} className="card" style={{ padding: '0.8rem', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{kpi.label}</p>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '1.55rem', fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
                      </div>
                      <div style={{ background: kpi.bg, borderRadius: '8px', padding: '0.38rem' }}>{kpi.icon}</div>
                    </div>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* PIPELINE ATELIER */}
              <div className="card" style={{ padding: '0.9rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>Pipeline Atelier</h4>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Temps réel</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pipelineCounts.map(p => (
                    <div key={p.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.18rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.icon} {p.label}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: p.color }}>{p.count}</span>
                      </div>
                      <div style={{ height: '7px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.max(p.count > 0 ? 6 : 0, (p.count / pipelineMax) * 100)}%`, background: p.color, borderRadius: '10px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIVITÉ 7 JOURS */}
              <div className="card" style={{ padding: '0.9rem', borderRadius: '16px' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>Activité — 7 derniers jours</h4>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '55px' }}>
                  {last7.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <div style={{ width: '100%', background: i === 6 ? 'var(--primary)' : 'var(--primary-light)', borderRadius: '4px 4px 0 0', height: `${Math.max(d.count > 0 ? 5 : 2, (d.count / maxBarCount) * 50)}px`, transition: 'height 0.5s ease', position: 'relative' }}>
                        {d.count > 0 && i >= 5 && <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.52rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{d.count}</div>}
                      </div>
                      <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)' }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP CLIENTS */}
              {topCustomers.length > 0 && (
                <div className="card" style={{ padding: '0.9rem', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>🏆 Top Clients</h4>
                    <Award size={14} color="var(--secondary)" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {topCustomers.map((c, idx) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.4rem 0.5rem', background: idx === 0 ? 'var(--primary-light)' : 'transparent', borderRadius: '10px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: idx === 0 ? 'var(--primary)' : 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: idx === 0 ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.73rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.prenom} {c.nom}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{c.orderCount} commande{c.orderCount > 1 ? 's' : ''}</div>
                        </div>
                        <span style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{c.totalSpent.toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COMMANDES EN COURS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>Commandes en cours</h4>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Mise à jour auto</span>
                </div>
                <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="input-control" style={{ paddingLeft: '2rem', width: '100%', borderRadius: '12px', fontSize: '0.77rem', padding: '0.38rem 1rem 0.38rem 2rem' }} placeholder="Code, article, client..." value={homeSearchQuery} onChange={(e) => setHomeSearchQuery(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredHomeOrders.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.77rem', textAlign: 'center', padding: '1rem' }}>Aucune commande active.</p>
                  ) : filteredHomeOrders.map(order => {
                    const client = customers.find(c => c.id === order.customer_id);
                    const clientName = client ? `${client.prenom} ${client.nom}` : 'Client';
                    const isLate = isOrderLate(order);
                    return (
                      <div className="mobile-order-row" key={order.id} style={{ borderLeft: isLate ? '3px solid #f59e0b' : undefined }}>
                        <div className="mobile-order-icon"><Sparkles size={15} /></div>
                        <div className="mobile-order-info">
                          <div className="mobile-order-title">{order.type_article} • {serviceLabels[order.type_service]}</div>
                          <div className="mobile-order-desc">{clientName} • {order.identifiant_unique_marquage}</div>
                        </div>
                        <div className="mobile-order-right">
                          <span className="mobile-order-price">{order.prix_total.toLocaleString()} F</span>
                          <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.52rem', padding: '0.1rem 0.3rem' }}>{statusLabels[order.statut]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })()}
