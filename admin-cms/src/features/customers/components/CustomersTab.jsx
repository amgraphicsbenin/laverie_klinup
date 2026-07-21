import React from 'react';
import { User, UserPlus, Search, Award } from 'lucide-react';
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
  return (
    <div className="grid-2" style={{ gridTemplateColumns: '0.8fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
      {/* COLONNE GAUCHE : LISTE DES CLIENTS + RECHERCHE */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Fiches Clients
          </h3>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowNewCustomerModal(true)}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <UserPlus size={14} /> Nouveau
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-control"
            style={{ paddingLeft: '2.2rem', width: '100%', borderRadius: '10px', fontSize: '0.8rem' }}
            placeholder="Nom, prénom ou téléphone..."
            value={crmSearch}
            onChange={(e) => setCrmSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowY: 'auto', maxHeight: '550px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(() => {
            const query = crmSearch.toLowerCase();
            const filteredCrm = customers.filter(c =>
              c.nom.toLowerCase().includes(query) ||
              c.prenom.toLowerCase().includes(query) ||
              c.telephone.includes(query)
            );

            if (filteredCrm.length === 0) {
              return (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  Aucun client correspondant.
                </div>
              );
            }

            return filteredCrm.map(c => {
              const isSelected = selectedCrmCustomer?.id === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    color: 'inherit',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setSelectedCrmCustomer(c)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {c.prenom} {c.nom}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {c.points_fidelite} pts
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                    <span>Tel: {c.telephone}</span>
                    {c.solde_dette > 0 && (
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Dette: {c.solde_dette.toLocaleString()} F</span>
                    )}
                  </div>
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* COLONNE DROITE : PROFIL CLIENT SÉLECTIONNÉ & HISTORIQUE PERSONNEL */}
      <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        {selectedCrmCustomer ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            {/* Header profil */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div className="user-avatar" style={{ background: 'var(--primary)', color: '#fff', width: '48px', height: '48px', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {selectedCrmCustomer.prenom.charAt(0)}{selectedCrmCustomer.nom.charAt(0)}
              </div>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {selectedCrmCustomer.prenom} {selectedCrmCustomer.nom}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                  Téléphone : <strong>{selectedCrmCustomer.telephone}</strong>
                </p>
              </div>
            </div>

            {/* KPI mini-cards client */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'var(--bg-app)', border: 'none', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Points Fidélité</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>{selectedCrmCustomer.points_fidelite} pts</strong>
              </div>

              <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'var(--bg-app)', border: 'none', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Dette Restante</span>
                <strong style={{ fontSize: '1.15rem', color: selectedCrmCustomer.solde_dette > 0 ? 'var(--accent)' : 'var(--success)' }}>
                  {selectedCrmCustomer.solde_dette.toLocaleString()} F
                </strong>
                {selectedCrmCustomer.solde_dette > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setDebtPaymentAmount(selectedCrmCustomer.solde_dette.toString());
                      setShowDebtPaymentModal(true);
                    }}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', borderRadius: '6px', marginTop: '0.4rem' }}
                  >
                    Régler dette
                  </button>
                )}
              </div>

              <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'var(--bg-app)', border: 'none', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Préférence Pliage</span>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{selectedCrmCustomer.preferences_pliage}</strong>
              </div>
            </div>

            {/* Section Abonnement CRM */}
            <div className="card" style={{ padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Award size={15} color="var(--primary)" />
                  Forfait d'Abonnement
                </span>
                {selectedCrmCustomer.active_subscription && (
                  <span className="badge badge-pret" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>Actif</span>
                )}
              </div>

              {selectedCrmCustomer.active_subscription ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{selectedCrmCustomer.active_subscription.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Solde : {selectedCrmCustomer.active_subscription.remaining_clothes} / {selectedCrmCustomer.active_subscription.total_clothes} vêtements
                    </span>
                  </div>

                  {(() => {
                    const remaining = selectedCrmCustomer.active_subscription.remaining_clothes;
                    const total = selectedCrmCustomer.active_subscription.total_clothes;
                    const percentUsed = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percentUsed}%`, background: 'var(--primary)', borderRadius: '10px', transition: 'width 0.4s ease' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                          <span>Consommé : {percentUsed}%</span>
                          <span>Disponible : {remaining} vêtements</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', marginTop: '0.1rem' }}>
                    <span>Souscrit le : {new Date(selectedCrmCustomer.active_subscription.subscribed_at).toLocaleDateString('fr-FR')}</span>
                    <span>Expire le : {new Date(selectedCrmCustomer.active_subscription.expires_at).toLocaleDateString('fr-FR')}</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleUnsubscribeCrm(selectedCrmCustomer.id)}
                    style={{ padding: '0.4rem', fontSize: '0.72rem', borderRadius: '8px', color: 'var(--status-late)', borderColor: '#fecaca', background: '#fff5f5', marginTop: '0.2rem' }}
                  >
                    Résilier l'abonnement
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <CustomSelect
                    className="input-control"
                    style={{ flexGrow: 1, padding: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
                    value={selectedCrmSubId}
                    onChange={(e) => setSelectedCrmSubId(e.target.value)}
                  >
                    <option value="">-- Choisir une formule --</option>
                    {catalog.filter(item => item.service === 'abonnement').map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.article} ({sub.prix.toLocaleString()} F/mois)</option>
                    ))}
                  </CustomSelect>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSubscribeCrm(selectedCrmCustomer.id, selectedCrmSubId)}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '8px' }}
                  >
                    Souscrire
                  </button>
                </div>
              )}
            </div>

            {/* Historique individuel */}
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Historique des Commandes</h4>

              <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Article / Service</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const clientOrders = orders.filter(o => o.customer_id === selectedCrmCustomer.id)
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                      if (clientOrders.length === 0) {
                        return (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                              Aucune commande enregistrée pour ce client.
                            </td>
                          </tr>
                        );
                      }

                      return clientOrders.map(o => (
                        <tr key={o.id}>
                          <td><strong>{o.identifiant_unique_marquage}</strong></td>
                          <td style={{ fontSize: '0.8rem' }}>
                            {o.type_article}
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{serviceLabels[o.type_service] || o.type_service}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{o.prix_total.toLocaleString()} F</td>
                          <td>
                            <span className={`badge badge-${o.statut}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                              {getOrderStatusLabel(o)}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem', borderRadius: '6px' }}
                              onClick={() => setCreatedOrder(o)}
                            >
                              Reçu
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '0.5rem' }}>
            <User size={48} style={{ color: 'var(--text-muted)' }} />
            <span>Sélectionnez un client dans la liste pour voir sa fiche détaillée.</span>
          </div>
        )}
      </div>
    </div>
  );
}
