import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../../services/db';

export default function StoresTab({ onShowSuccess }) {
  useEffect(() => {
    if (db.refreshStores) {
      db.refreshStores();
    }
  }, []);

  const stores = db.getStores();
  const selectedStoreId = db.getSelectedStoreId();
  const staff = db.getStaff();
  const orders = db.getOrders();
  const isSuperAdmin = db.getCurrentUser()?.role === 'super_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous'); // tous, actif, inactif

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formNom, setFormNom] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formAdresse, setFormAdresse] = useState('');
  const [formVille, setFormVille] = useState('Cotonou');
  const [formTelephone, setFormTelephone] = useState('');
  const [formResponsableId, setFormResponsableId] = useState('');
  const [formStatut, setFormStatut] = useState('actif');

  const openCreateModal = () => {
    setEditingStore(null);
    setFormNom('');
    setFormCode('KLP-' + Math.floor(100 + Math.random() * 900));
    setFormAdresse('');
    setFormVille('Cotonou');
    setFormTelephone('');
    setFormResponsableId('');
    setFormStatut('actif');
    setShowModal(true);
  };

  const openEditModal = (store) => {
    setEditingStore(store);
    setFormNom(store.nom || '');
    setFormCode(store.code || '');
    setFormAdresse(store.adresse || '');
    setFormVille(store.ville || 'Cotonou');
    setFormTelephone(store.telephone || '');
    setFormResponsableId(store.responsable_id || '');
    setFormStatut(store.statut || 'actif');
    setShowModal(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!formNom.trim()) {
      alert("Le nom du point de laverie est obligatoire.");
      return;
    }

    if (editingStore && editingStore.statut === 'actif' && formStatut === 'inactif') {
      const confirmed = await window.confirm(`⚠️ CONFIRMATION DE DÉSACTIVATION :\n\nVoulez-vous vraiment désactiver le point de laverie "${formNom}" ? Ce point ne sera plus disponible pour l'accueil des clients ni les opérations quotidiennes.`);
      if (!confirmed) return;
    }

    const selectedStaff = staff.find(s => s.id === formResponsableId);
    const storePayload = {
      nom: formNom.trim(),
      code: formCode.trim() || ('KLP-' + Math.floor(100 + Math.random() * 900)),
      adresse: formAdresse.trim(),
      ville: formVille.trim() || 'Cotonou',
      telephone: formTelephone.trim(),
      responsable_id: formResponsableId || null,
      responsable_nom: selectedStaff ? `${selectedStaff.prenom} ${selectedStaff.nom}` : '',
      statut: formStatut
    };

    setIsSubmitting(true);
    try {
      setShowModal(false);
      if (editingStore) {
        await db.updateStore(editingStore.id, storePayload);
        if (onShowSuccess) onShowSuccess(`Point de laverie "${formNom}" mis à jour avec succès dans la base de données.`);
        else alert(`Point de laverie "${formNom}" mis à jour avec succès dans la base de données.`);
      } else {
        await db.addStore(storePayload);
        if (onShowSuccess) onShowSuccess(`Point de laverie "${formNom}" créé avec succès dans la base de données.`);
        else alert(`Point de laverie "${formNom}" créé avec succès dans la base de données.`);
      }
    } catch (err) {
      alert("Erreur lors de l'enregistrement du point de laverie : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStoreStatus = async (store) => {
    const nextStatut = store.statut === 'actif' ? 'inactif' : 'actif';
    if (nextStatut === 'inactif') {
      const confirmed = await window.confirm(`⚠️ CONFIRMATION DE DÉSACTIVATION :\n\nVoulez-vous vraiment désactiver le point de laverie "${store.nom}" ? Ce point ne sera plus actif pour les opérations.`);
      if (!confirmed) return;
    } else {
      const confirmed = await window.confirm(`Voulez-vous réactiver le point de laverie "${store.nom}" ?`);
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      await db.updateStore(store.id, { statut: nextStatut });
      if (onShowSuccess) onShowSuccess(`Le point "${store.nom}" est désormais ${nextStatut}.`);
    } catch (err) {
      alert("Erreur de mise à jour du statut : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStore = async (store) => {
    const confirmed = await window.confirm(`⚠️ ATTENTION : SUPPRESSION DÉFINITIVE !\n\nVoulez-vous vraiment supprimer définitivement le point de laverie "${store.nom}" (${store.code}) ? Cette action est irréversible.`);
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await db.deleteStore(store.id);
      if (onShowSuccess) onShowSuccess(`Point de laverie "${store.nom}" supprimé avec succès de la base de données.`);
    } catch (err) {
      alert("Erreur lors de la suppression : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectStore = (storeId) => {
    db.setSelectedStoreId(storeId);
    const store = stores.find(s => s.id === storeId);
    const label = store ? store.nom : 'Tous les points (Global)';
    if (onShowSuccess) onShowSuccess(`Connexion établie avec le point : ${label}`);
    else alert(`Vous êtes maintenant connecté au point : ${label}`);
  };

  const filteredStores = stores.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (s.nom && s.nom.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.ville && s.ville.toLowerCase().includes(q)) ||
      (s.adresse && s.adresse.toLowerCase().includes(q))
    );
    const matchesStatus = statusFilter === 'tous' || s.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalActive = stores.filter(s => s.statut === 'actif').length;
  const currentActiveStoreObj = stores.find(s => s.id === selectedStoreId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* KPI STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 44, 247, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '26px' }}>store</span>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Points Laverie</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>{stores.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '26px' }}>check_circle</span>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Points Actifs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-title)' }}>{totalActive} / {stores.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '26px' }}>group</span>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Staff Actif Enregistré</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1', fontFamily: 'var(--font-title)' }}>{staff.length} agents</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: selectedStoreId !== 'all' ? '1.5px solid var(--primary)' : '1px solid var(--border-color)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: selectedStoreId !== 'all' ? 'var(--primary)' : 'rgba(245, 158, 11, 0.1)', color: selectedStoreId !== 'all' ? '#ffffff' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '26px' }}>hub</span>
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Contexte Connecté</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: selectedStoreId !== 'all' ? 'var(--primary)' : 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
              {currentActiveStoreObj ? currentActiveStoreObj.nom : 'Tous les points (Vue Globale)'}
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR & SEARCH */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span className="material-symbols-rounded" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '20px' }}>search</span>
            <input
              type="text"
              placeholder="Rechercher un point par nom, code, ville, adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.4rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '0.88rem',
                background: 'var(--bg-app)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-app)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('tous')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: statusFilter === 'tous' ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === 'tous' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: statusFilter === 'tous' ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('actif')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: statusFilter === 'actif' ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === 'actif' ? '#10b981' : 'var(--text-secondary)',
                fontWeight: statusFilter === 'actif' ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Actifs
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactif')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: statusFilter === 'inactif' ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === 'inactif' ? '#ef4444' : 'var(--text-secondary)',
                fontWeight: statusFilter === 'inactif' ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Inactifs
            </button>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 700 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>add_location_alt</span>
            Nouveau Point de Laverie
          </button>
        )}
      </div>

      {/* STORES GRID / TABLE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredStores.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>storefront</span>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>Aucun point de laverie trouvé</div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Essayez de modifier votre recherche ou ajoutez un nouveau point de laverie.</p>
          </div>
        ) : (
          filteredStores.map(store => {
            const isConnected = selectedStoreId === store.id;
            const storeOrdersCount = orders.filter(o => o.store_id === store.id || (!o.store_id && store.id === 'store_central')).length;
            
            return (
              <div
                key={store.id}
                className="card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  border: isConnected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  background: isConnected ? 'rgba(var(--primary-rgb, 0, 44, 247), 0.02)' : 'var(--bg-card)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: isConnected ? 'var(--primary)' : 'rgba(0, 44, 247, 0.08)',
                      color: isConnected ? '#ffffff' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}>
                      <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>domain</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', margin: 0 }}>
                        {store.nom}
                      </h3>
                      <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, background: 'rgba(0, 44, 247, 0.08)', padding: '0.15rem 0.5rem', borderRadius: '4px', marginTop: '0.2rem', display: 'inline-block' }}>
                        Code : {store.code}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => isSuperAdmin && handleToggleStoreStatus(store)}
                    title={isSuperAdmin ? (store.statut === 'actif' ? 'Cliquer pour désactiver ce point' : 'Cliquer pour réactiver ce point') : ''}
                    style={{
                      border: 'none',
                      cursor: isSuperAdmin ? 'pointer' : 'default',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      background: store.statut === 'actif' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: store.statut === 'actif' ? '#10b981' : '#ef4444',
                      textTransform: 'uppercase'
                    }}
                  >
                    {store.statut === 'actif' ? 'Actif' : 'Inactif'}
                  </button>
                </div>

                {/* Details list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', paddingVertical: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>location_on</span>
                    <span>{store.adresse || 'Adresse non renseignée'} ({store.ville || 'Cotonou'})</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>call</span>
                    <span>{store.telephone || 'Non renseigné'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>person</span>
                    <span>Responsable : <strong>{store.responsable_nom || 'Non assigné'}</strong></span>
                  </div>

                  {/* Micro stats per store */}
                  {(() => {
                    const allOrders = db.getAllOrders ? db.getAllOrders() : db.getOrders();
                    const allCustomers = db.getAllCustomers ? db.getAllCustomers() : db.getCustomers();
                    const allStaff = db.getAllStaff ? db.getAllStaff() : db.getStaff();

                    const sOrders = allOrders.filter(o => o.store_id === store.id || (!o.store_id && store.id === 'store_central'));
                    const sCust = allCustomers.filter(c => c.store_id === store.id || (!c.store_id && store.id === 'store_central'));
                    const sStaff = allStaff.filter(s => s.store_id === store.id || (!s.store_id && store.id === 'store_central') || s.role === 'super_admin');

                    return (
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', background: 'var(--bg-app)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600, border: '1px solid var(--border-color)' }}>
                          📦 {sOrders.length} Commande{sOrders.length > 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'var(--bg-app)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600, border: '1px solid var(--border-color)' }}>
                          👥 {sCust.length} Client{sCust.length > 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'var(--bg-app)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600, border: '1px solid var(--border-color)' }}>
                          👔 {sStaff.length} Agent{sStaff.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  {isConnected ? (
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check_circle</span>
                      Point Connecté Actif
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConnectStore(store.id)}
                      className="btn btn-outline"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>login</span>
                      Se connecter à ce point
                    </button>
                  )}

                  {isSuperAdmin && (
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(store)}
                        className="btn btn-outline"
                        style={{ padding: '0.4rem', borderRadius: '8px' }}
                        title="Éditer le point"
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStore(store)}
                        className="btn btn-outline"
                        style={{ padding: '0.4rem', borderRadius: '8px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                        title="Supprimer le point"
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT MODAL (PORTAL) */}
      {showModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem',
          boxSizing: 'border-box'
        }} onClick={() => setShowModal(false)}>
          <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'var(--text-primary)', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-rounded">store</span>
                {editingStore ? "Modifier le Point de Laverie" : "Nouveau Point de Laverie"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveStore} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Nom de la boutique *</label>
                  <input
                    type="text"
                    required
                    className="input-control"
                    placeholder="Ex: Point Akpakpa - St Jean"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Code Boutique</label>
                  <input
                    type="text"
                    required
                    className="input-control"
                    placeholder="KLP-AKP"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Adresse complète</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Ex: Carrefour St Jean"
                    value={formAdresse}
                    onChange={(e) => setFormAdresse(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Ville</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Cotonou"
                    value={formVille}
                    onChange={(e) => setFormVille(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Téléphone boutique</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="+229 97 00 00 00"
                    value={formTelephone}
                    onChange={(e) => setFormTelephone(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Statut Opérationnel</label>
                  <select
                    className="input-control"
                    value={formStatut}
                    onChange={(e) => setFormStatut(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-card)', cursor: 'pointer' }}
                  >
                    <option value="actif">Actif (Ouvert)</option>
                    <option value="inactif">Inactif (Fermé/Maintenance)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', boxSizing: 'border-box' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Gérant / Responsable du Point</label>
                <select
                  className="input-control"
                  value={formResponsableId}
                  onChange={(e) => setFormResponsableId(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-card)', cursor: 'pointer' }}
                >
                  <option value="">-- Aucun responsable assigné --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.prenom} {s.nom} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}>
                  {editingStore ? "Enregistrer les modifications" : "Créer le point de laverie"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
