import React from 'react';
import { User, UserPlus, ShieldCheck, Trash2, Sliders } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import { db } from '../../../services/db';

export default function StaffTab({
  staff,
  selectedStaffId,
  setSelectedStaffId,
  setShowNewStaffModal,
  refreshAdminData,
  selectedMember,
  handleSaveStaff,
  handleDeleteStaff,
  editStaffPrenom,
  setEditStaffPrenom,
  editStaffNom,
  setEditStaffNom,
  editStaffEmail,
  setEditStaffEmail,
  editStaffTel,
  setEditStaffTel,
  editStaffRole,
  handleRoleChangeInForm,
  editStaffStatut,
  setEditStaffStatut,
  editStaffPermissions,
  setEditStaffPermissions
}) {
  return (
    <div className="grid-2" style={{ gridTemplateColumns: '0.8fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
      {/* COLONNE GAUCHE : LISTE DES EMPLOYÉS & DEMANDES DE PIN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Membres de l'Équipe */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              Membres de l'Équipe
            </h3>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowNewStaffModal(true)}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <UserPlus size={14} /> Ajouter
            </button>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '380px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {staff.map(s => {
              const isSelected = selectedStaffId === s.id;
              const isSuper = s.role === 'super_admin';
              const isMgr = s.role === 'manager';
              const roleLabel = isSuper ? 'Admin' : isMgr ? 'Manager' : s.role === 'livreur' ? 'Livreur' : s.role === 'agent_lavage_repassage' ? 'Atelier' : "Accueil";
              const isSuspended = s.statut === 'suspendu';

              return (
                <div
                  key={s.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: isSuspended ? 0.65 : 1
                  }}
                  onClick={() => setSelectedStaffId(s.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {s.prenom} {s.nom}
                    </strong>
                    <span
                      className="badge"
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '6px',
                        background: isSuper ? 'var(--primary)' : isMgr ? 'var(--secondary)' : '#64748b',
                        color: '#fff'
                      }}
                    >
                      {roleLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                    <span>{s.email || `${s.prenom.toLowerCase()}.${s.nom.toLowerCase()}@klinup.com`}</span>
                    {isSuspended ? (
                      <span style={{ color: 'var(--status-late)', fontWeight: 700 }}>Suspendu</span>
                    ) : (
                      <span style={{ color: 'var(--status-ready)', fontWeight: 700 }}>Actif</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Demandes de réinitialisation PIN */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color="var(--primary)" />
              Demandes de Reset PIN
            </h3>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '250px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {db.getPinResetRequests().filter(r => r.status === 'pending').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Aucune demande en attente
              </div>
            ) : (
              db.getPinResetRequests().filter(r => r.status === 'pending').map(req => (
                <div
                  key={req.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-app)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{req.staff_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{req.email}</div>
                    </div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      {new Date(req.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', borderRadius: '6px', background: 'var(--status-ready)' }}
                      onClick={() => {
                        const res = db.approvePinResetRequest(req.id);
                        if (res) {
                          alert(`Demande approuvée pour ${res.staffMember.prenom} ${res.staffMember.nom} !\n\nNouveau PIN généré : ${res.newPin}\n(Envoyé par email à ${res.staffMember.email})`);
                          refreshAdminData();
                        } else {
                          alert("Erreur: Impossible d'approuver (l'employé n'existe plus ou l'email est invalide).");
                        }
                      }}
                    >
                      Approuver
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', borderRadius: '6px', color: 'var(--status-late)', borderColor: '#fee2e2' }}
                      onClick={async () => {
                        if (window.confirm("Rejeter cette demande de réinitialisation ?")) {
                          db.rejectPinResetRequest(req.id);
                          refreshAdminData();
                        }
                      }}
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* COLONNE DROITE : FICHE DÉTAILLÉE ET CONFIGURATION DES ACCÈS */}
      <div className="card" style={{ minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
        {selectedMember ? (
          <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Profil */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div className="user-avatar" style={{ background: selectedMember.role === 'super_admin' ? 'var(--primary)' : selectedMember.role === 'manager' ? 'var(--secondary)' : selectedMember.role === 'livreur' ? '#3b82f6' : selectedMember.role === 'agent_lavage_repassage' ? '#8b5cf6' : '#64748b', color: '#fff', width: '48px', height: '48px', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {selectedMember.prenom.charAt(0)}{selectedMember.nom.charAt(0)}
              </div>
              <div style={{ flexGrow: 1 }}>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {selectedMember.prenom} {selectedMember.nom}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                  Rôle principal : <strong style={{ color: 'var(--primary)' }}>{selectedMember.role === 'super_admin' ? 'Super Administrateur' : selectedMember.role === 'manager' ? 'Manager Caisse' : selectedMember.role === 'livreur' ? 'Livreur' : selectedMember.role === 'agent_lavage_repassage' ? 'Agent Lavage/Repassage' : "Agent d'accueil"}</strong>
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.45rem', color: 'var(--status-late)', borderColor: '#fee2e2' }}
                onClick={() => handleDeleteStaff(selectedMember.id)}
                title="Supprimer le profil"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Formulaire d'information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  className="input-control"
                  required
                  value={editStaffPrenom}
                  onChange={(e) => setEditStaffPrenom(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  className="input-control"
                  required
                  value={editStaffNom}
                  onChange={(e) => setEditStaffNom(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Email professionnel</label>
                <input
                  type="email"
                  className="input-control"
                  required
                  value={editStaffEmail}
                  onChange={(e) => setEditStaffEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Non renseigné"
                  value={editStaffTel}
                  onChange={(e) => setEditStaffTel(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Rôle Système</label>
                <CustomSelect
                  className="input-control"
                  value={editStaffRole}
                  onChange={(e) => handleRoleChangeInForm(e.target.value)}
                >
                  <option value="super_admin">Super Administrateur (CMS)</option>
                  <option value="manager">Manager Caisse (CMS)</option>
                  <option value="agent_accueil">Agent d'accueil (Mobile App)</option>
                  <option value="livreur">Livreur (Mobile App)</option>
                  <option value="agent_lavage_repassage">Agent de lavage / Repassage (Mobile App)</option>
                </CustomSelect>
              </div>
              <div className="form-group">
                <label>Statut d'Accès</label>
                <CustomSelect
                  className="input-control"
                  value={editStaffStatut}
                  onChange={(e) => setEditStaffStatut(e.target.value)}
                >
                  <option value="actif">Compte Actif (Autorisé)</option>
                  <option value="suspendu">Compte Suspendu (Bloqué)</option>
                </CustomSelect>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem', alignItems: 'end' }}>
              <div className="form-group">
                <label>Code PIN actuel</label>
                <input
                  type="text"
                  className="input-control"
                  readOnly
                  disabled
                  value={selectedMember.code_pin || 'Non défini'}
                  style={{ background: '#f1f5f9', cursor: 'not-allowed', fontWeight: 'bold', letterSpacing: '2px', textAlign: 'center' }}
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.55rem', fontSize: '0.78rem', fontWeight: 700, width: '100%' }}
                onClick={() => {
                  const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                  db.resetStaffPin(selectedMember.id, newPin);
                  alert(`Code PIN réinitialisé pour ${selectedMember.prenom} ${selectedMember.nom} !\n\nNouveau PIN : ${newPin}\n(Un email a été envoyé à ${selectedMember.email})`);
                  refreshAdminData();
                }}
              >
                Générer nouveau PIN
              </button>
            </div>

            {/* Habilitations Détaillées */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <Sliders size={16} color="var(--primary)" />
                Matrice de Permissions Granulaires
              </h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                Configurez précisément les droits d'accès de cet utilisateur au sein de la plateforme.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.65rem',
                background: 'var(--bg-app)',
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={!!editStaffPermissions.can_view_dashboard}
                    onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_view_dashboard: e.target.checked }))}
                  />
                  Accès Tableau de Bord
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={!!editStaffPermissions.can_manage_orders}
                    onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_manage_orders: e.target.checked }))}
                  />
                  Gérer les Commandes
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={!!editStaffPermissions.can_manage_crm}
                    onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_manage_crm: e.target.checked }))}
                  />
                  Consulter le CRM Clients
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={!!editStaffPermissions.can_edit_catalog}
                    onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_edit_catalog: e.target.checked }))}
                  />
                  Modifier les Tarifs
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={!!editStaffPermissions.can_view_logs}
                    disabled={editStaffRole !== 'super_admin'}
                    onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_view_logs: e.target.checked }))}
                  />
                  Voir Journal d'Audit
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={!!editStaffPermissions.can_manage_staff}
                    disabled={editStaffRole !== 'super_admin'}
                    onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, can_manage_staff: e.target.checked }))}
                  />
                  Gérer le Personnel
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem' }}>
                Sauvegarder les modifications
              </button>
            </div>
          </form>
        ) : (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '0.5rem' }}>
            <User size={48} style={{ color: 'var(--text-muted)' }} />
            <span>Sélectionnez un employé pour gérer son profil et ses droits d'accès.</span>
          </div>
        )}
      </div>
    </div>
  );
}
