import React, { useState } from 'react';
import { CustomSelect } from './CustomSelect';

export default function FicheClient({
  selectedCrmCustomer,
  setSelectedCrmCustomer,
  catalog,
  db,
  refreshData
}) {
  const [selectedCrmSubId, setSelectedCrmSubId] = useState('');

  if (!selectedCrmCustomer) return null;

  const handleSubscribeCrm = () => {
    if (!selectedCrmSubId) {
      alert("Veuillez sélectionner un forfait d'abonnement.");
      return;
    }
    const updated = db.subscribeCustomer(selectedCrmCustomer.id, selectedCrmSubId);
    if (updated) {
      refreshData();
      const updatedCustomers = db.getCustomers();
      const updatedCust = updatedCustomers.find(c => c.id === selectedCrmCustomer.id);
      setSelectedCrmCustomer(updatedCust);
      setSelectedCrmSubId('');
      alert("Abonnement souscrit avec succès !");
    }
  };

  const handleUnsubscribeCrm = () => {
    if (confirm("Êtes-vous sûr de vouloir résilier cet abonnement ?")) {
      const updated = db.unsubscribeCustomer(selectedCrmCustomer.id);
      if (updated) {
        refreshData();
        const updatedCustomers = db.getCustomers();
        const updatedCust = updatedCustomers.find(c => c.id === selectedCrmCustomer.id);
        setSelectedCrmCustomer(updatedCust);
        alert("Abonnement résilié avec succès !");
      }
    }
  };

  return (
    <div style={{ background: 'var(--bg-app)', padding: '0.7rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.45rem', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>{selectedCrmCustomer.prenom} {selectedCrmCustomer.nom}</span>
        <button 
          type="button" 
          onClick={() => setSelectedCrmCustomer(null)}
          style={{ border: 'none', background: 'transparent', fontSize: '0.65rem', color: 'var(--status-late)', fontWeight: 700, cursor: 'pointer' }}
        >
          Fermer
        </button>
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Tél : {selectedCrmCustomer.telephone}</div>
      
      {selectedCrmCustomer.active_subscription ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
            <strong style={{ color: 'var(--primary)' }}>{selectedCrmCustomer.active_subscription.name}</strong>
            <span style={{ fontWeight: 600 }}>{selectedCrmCustomer.active_subscription.remaining_clothes} / {selectedCrmCustomer.active_subscription.total_clothes} vêt.</span>
          </div>
          
          {(() => {
            const remaining = selectedCrmCustomer.active_subscription.remaining_clothes;
            const total = selectedCrmCustomer.active_subscription.total_clothes;
            const percentUsed = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
            return (
              <div className="progress-bar-track" style={{ background: '#f1f5f9' }}>
                <div className="progress-bar-fill" style={{ width: `${percentUsed}%`, background: 'var(--primary)' }}></div>
              </div>
            );
          })()}
          
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
            Expire le : {new Date(selectedCrmCustomer.active_subscription.expires_at).toLocaleDateString('fr-FR')}
          </div>

          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={handleUnsubscribeCrm}
            style={{ padding: '0.25rem', fontSize: '0.65rem', color: 'var(--status-late)', borderColor: '#f5c6c6', background: 'var(--status-late-light)', borderRadius: '6px', marginTop: '0.15rem' }}
          >
            Résilier l'abonnement
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Aucun forfait actif.</div>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <CustomSelect
              value={selectedCrmSubId}
              onChange={setSelectedCrmSubId}
              placeholder="-- Choisir --"
              options={catalog.filter(i => i.service === 'abonnement').map(sub => ({
                value: sub.id,
                label: `${sub.article} (${sub.prix} F)`
              }))}
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSubscribeCrm}
              style={{ padding: '0.28rem 0.55rem', fontSize: '0.68rem', borderRadius: '6px' }}
            >
              Souscrire
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
