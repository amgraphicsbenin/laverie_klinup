import React, { useState } from 'react';
import {
  User,
  UserPlus,
  ShieldCheck,
  Trash2,
  Sliders,
  Search,
  Filter,
  ShieldAlert,
  Key,
  Mail,
  Phone,
  Lock,
  Unlock,
  Check,
  X,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Tag,
  AlertCircle,
  RefreshCw,
  Copy,
  CheckCircle2,
  UserCheck,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  UserX,
  ChevronRight
} from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import { db } from '../../../services/db';

const ROLE_CONFIG = {
  super_admin: {
    label: 'Super Administrateur',
    shortLabel: 'Admin',
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.08)',
    badgeBg: '#2563eb',
    desc: 'Accès complet au CMS, gestion du personnel, paramètres système et audit.'
  },
  manager: {
    label: 'Manager Caisse',
    shortLabel: 'Manager',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.08)',
    badgeBg: '#0284c7',
    desc: 'Gestion des encaissements, commandes, clients et catalogue d\'articles.'
  },
  agent_accueil: {
    label: 'Agent d\'accueil',
    shortLabel: 'Accueil',
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.08)',
    badgeBg: '#16a34a',
    desc: 'Réception des clients et enregistrement des commandes (App Mobile).'
  },
  livreur: {
    label: 'Livreur',
    shortLabel: 'Livreur',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.08)',
    badgeBg: '#d97706',
    desc: 'Collecte et livraison des colis textiles à domicile (App Mobile).'
  },
  agent_lavage_repassage: {
    label: 'Agent Atelier (Lavage/Repassage)',
    shortLabel: 'Atelier',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.08)',
    badgeBg: '#8b5cf6',
    desc: 'Traitement des textiles, lavage, séchage et repassage (App Mobile).'
  }
};

const PERMISSIONS_CONFIG = [
  {
    key: 'can_view_dashboard',
    title: 'Tableau de Bord & KPIs',
    description: 'Visionner les métriques de vente, chiffre d\'affaires et statistiques',
    icon: LayoutDashboard,
    color: '#3b82f6'
  },
  {
    key: 'can_manage_orders',
    title: 'Gestion Caisse & Commandes',
    description: 'Enregistrer, modifier, valider et encaisser les commandes de pressing',
    icon: ShoppingBag,
    color: '#16a34a'
  },
  {
    key: 'can_manage_crm',
    title: 'Répertoire & CRM Clients',
    description: 'Accéder aux fiches clients, solder les dettes et gérer les abonnements',
    icon: Users,
    color: '#0284c7'
  },
  {
    key: 'can_edit_catalog',
    title: 'Catalogue & Tarifications',
    description: 'Ajuster les prix des prestations et créer des forfaits d\'abonnement',
    icon: Tag,
    color: '#d97706'
  },
  {
    key: 'can_view_logs',
    title: 'Journal d\'Audit & Sécurité',
    description: 'Traçabilité complète des actions effectuées sur le système (Super Admin)',
    icon: ShieldAlert,
    color: '#dc2626',
    requiresSuperAdmin: true
  },
  {
    key: 'can_manage_staff',
    title: 'Gestion du Personnel & Droits',
    description: 'Créer des profils, configurer les accès et réinitialiser les codes PIN',
    icon: UserCheck,
    color: '#8b5cf6',
    requiresSuperAdmin: true
  }
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPinSecret, setShowPinSecret] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const staffList = staff || [];

  // Statistiques KPI
  const totalStaff = staffList.length;
  const superAdmins = staffList.filter(s => s.role === 'super_admin').length;
  const managers = staffList.filter(s => s.role === 'manager').length;
  const fieldStaff = staffList.filter(s => s.role !== 'super_admin' && s.role !== 'manager').length;
  const pendingRequests = (db.getPinResetRequests ? db.getPinResetRequests() : []).filter(r => r.status === 'pending');

  // Filtrage du personnel
  const filteredStaff = staffList.filter(s => {
    const prenom = (s.prenom || '').toLowerCase();
    const nom = (s.nom || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const tel = (s.telephone || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = prenom.includes(query) || nom.includes(query) || email.includes(query) || tel.includes(query);
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (s.statut || 'actif') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCopyPin = (pin) => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleFormSubmit = (e) => {
    handleSaveStaff(e);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const activeRoleConfig = ROLE_CONFIG[editStaffRole] || ROLE_CONFIG.agent_accueil;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 📊 EN-TÊTE : BANNIÈRE DE STATISTIQUES ET KPIS HABILITATIONS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* KPI Total */}
        <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '12px', color: 'var(--primary)', display: 'flex' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Effectif</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>{totalStaff}</div>
          </div>
        </div>

        {/* KPI Super Admins */}
        <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ background: 'rgba(37, 99, 235, 0.08)', padding: '0.75rem', borderRadius: '12px', color: '#2563eb', display: 'flex' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Super Administrateurs</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-title)' }}>{superAdmins}</div>
          </div>
        </div>

        {/* KPI Managers Caisse */}
        <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ background: 'rgba(2, 132, 199, 0.08)', padding: '0.75rem', borderRadius: '12px', color: '#0284c7', display: 'flex' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Managers Caisse</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-title)' }}>{managers}</div>
          </div>
        </div>

        {/* KPI Agents Terrain */}
        <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ background: 'rgba(22, 163, 74, 0.08)', padding: '0.75rem', borderRadius: '12px', color: '#16a34a', display: 'flex' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Agents de Terrain (Mobile)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-title)' }}>{fieldStaff}</div>
          </div>
        </div>

        {/* KPI Reset PIN Pending */}
        <div
          className="card"
          style={{
            padding: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: pendingRequests.length > 0 ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-card)',
            border: pendingRequests.length > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color)'
          }}
        >
          <div style={{ background: pendingRequests.length > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(142, 142, 147, 0.1)', padding: '0.75rem', borderRadius: '12px', color: pendingRequests.length > 0 ? 'var(--danger)' : 'var(--text-muted)', display: 'flex' }}>
            <Key size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Demandes Reset PIN</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: pendingRequests.length > 0 ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
              {pendingRequests.length}
            </div>
          </div>
        </div>
      </div>

      {/* 🔄 DISPOSITION DEUX COLONNES : RECHERCHE/LISTE À GAUCHE - ÉDITEUR/PERMISSIONS À DROITE */}
      <div className="grid-2" style={{ gridTemplateColumns: '0.85fr 1.15fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* ========================================================
           COLONNE GAUCHE : RECHERCHE, FILTRES, LISTE & DEMANDES PIN
           ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* CARTE : LISTE DES EMPLOYÉS & RECHERCHE */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
            
            {/* Header de la liste */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={18} color="var(--primary)" />
                  Équipe & Habilitations
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {filteredStaff.length} membre{filteredStaff.length > 1 ? 's' : ''} répertorié{filteredStaff.length > 1 ? 's' : ''}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowNewStaffModal(true)}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
              >
                <UserPlus size={15} /> Nouveau Membre
              </button>
            </div>

            {/* Champ de recherche texte */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Rechercher par nom, email, téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.4rem', fontSize: '0.82rem', height: '38px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filtres Rapides par Rôle */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              {[
                { key: 'all', label: 'Tous' },
                { key: 'super_admin', label: 'Admins' },
                { key: 'manager', label: 'Managers' },
                { key: 'agent_accueil', label: 'Accueil' },
                { key: 'livreur', label: 'Livreurs' },
                { key: 'agent_lavage_repassage', label: 'Atelier' }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setRoleFilter(f.key)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.68rem',
                    borderRadius: '8px',
                    border: roleFilter === f.key ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    background: roleFilter === f.key ? 'var(--primary-light)' : 'transparent',
                    color: roleFilter === f.key ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: roleFilter === f.key ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Liste défilante des employés */}
            <div style={{ overflowY: 'auto', maxHeight: '410px', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '0.15rem' }}>
              {filteredStaff.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <UserX size={32} style={{ opacity: 0.5 }} />
                  <span>Aucun membre ne correspond à votre recherche.</span>
                </div>
              ) : (
                filteredStaff.map(s => {
                  const isSelected = selectedStaffId === s.id;
                  const roleMeta = ROLE_CONFIG[s.role] || ROLE_CONFIG.agent_accueil;
                  const prenom = s.prenom || '';
                  const nom = s.nom || '';
                  const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || 'U';
                  const isSuspended = s.statut === 'suspendu';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStaffId(s.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '14px',
                        border: isSelected ? `2px solid ${roleMeta.color}` : '1px solid var(--border-color)',
                        background: isSelected ? roleMeta.bg : 'var(--bg-app)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isSuspended ? 0.7 : 1,
                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Barre latérale colorée si sélectionné */}
                      {isSelected && (
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: roleMeta.color }} />
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {/* Avatar avec initiales */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: roleMeta.color,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        >
                          {initiales}
                        </div>

                        {/* Infos membre */}
                        <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ fontSize: '0.88rem', color: isSelected ? roleMeta.color : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {prenom} {nom}
                            </strong>
                            <span
                              style={{
                                fontSize: '0.62rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '6px',
                                background: roleMeta.badgeBg,
                                color: '#ffffff',
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {roleMeta.shortLabel}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.email || `${prenom.toLowerCase()}.${nom.toLowerCase()}@klinup.com`}
                            </span>
                            
                            {isSuspended ? (
                              <span style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                • Suspendu
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                • Actif
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CARTE : DEMANDES DE RÉINITIALISATION DE PIN */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Key size={16} color="var(--warning)" />
                Demandes de Reset PIN
              </h4>
              {pendingRequests.length > 0 && (
                <span className="badge" style={{ background: 'var(--warning-light)', color: 'var(--warning)', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '8px' }}>
                  {pendingRequests.length} en attente
                </span>
              )}
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '220px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {pendingRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Aucune demande en attente
                </div>
              ) : (
                pendingRequests.map(req => (
                  <div
                    key={req.id}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(217, 119, 6, 0.25)',
                      background: 'rgba(217, 119, 6, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{req.staff_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{req.email}</div>
                      </div>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                        {new Date(req.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.72rem', borderRadius: '8px', background: 'var(--success)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
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
                        <Check size={13} /> Approuver (Nouveau PIN)
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem', borderRadius: '8px', color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.3)' }}
                        onClick={async () => {
                          if (window.confirm("Rejeter cette demande de réinitialisation ?")) {
                            db.rejectPinResetRequest(req.id);
                            refreshAdminData();
                          }
                        }}
                      >
                        <X size={13} /> Rejeter
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ========================================================
           COLONNE DROITE : FICHE ÉDITION DE PROFIL & MATRICE ACCÈS
           ======================================================== */}
        <div className="card" style={{ minHeight: '520px', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          {selectedMember ? (
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              
              {/* EN-TÊTE DU PROFIL SÉLECTIONNÉ */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '1.2rem',
                  background: activeRoleConfig.bg,
                  padding: '1rem',
                  borderRadius: '16px',
                  border: `1px solid ${activeRoleConfig.color}25`
                }}
              >
                {/* Avatar principal grand format */}
                <div
                  style={{
                    background: activeRoleConfig.color,
                    color: '#ffffff',
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                  }}
                >
                  {(selectedMember.prenom || 'U').charAt(0)}{(selectedMember.nom || 'M').charAt(0)}
                </div>

                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                      {selectedMember.prenom} {selectedMember.nom}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: activeRoleConfig.badgeBg,
                        color: '#fff',
                        fontWeight: 700
                      }}
                    >
                      {activeRoleConfig.label}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                    {activeRoleConfig.desc}
                  </p>
                </div>

                {/* Bouton Supprimer profil */}
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '0.55rem', color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.25)', background: '#fff' }}
                  onClick={() => {
                    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le profil de ${selectedMember.prenom} ${selectedMember.nom} ?`)) {
                      handleDeleteStaff(selectedMember.id);
                    }
                  }}
                  title="Supprimer définitivement ce profil"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* SECTION 1 : INFORMATIONS GÉNÉRALES DU FORMULAIRE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  1. Informations Générales
                </h5>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Prénom</label>
                    <input
                      type="text"
                      className="input-control"
                      required
                      value={editStaffPrenom}
                      onChange={(e) => setEditStaffPrenom(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Nom</label>
                    <input
                      type="text"
                      className="input-control"
                      required
                      value={editStaffNom}
                      onChange={(e) => setEditStaffNom(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Email Professionnel</label>
                    <input
                      type="email"
                      className="input-control"
                      required
                      value={editStaffEmail}
                      onChange={(e) => setEditStaffEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Téléphone</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Ex: +229 97979797"
                      value={editStaffTel}
                      onChange={(e) => setEditStaffTel(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2 : RÔLE SYSTÈME & STATUT D'ACCÈS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  2. Rôle & Statut de Connexion
                </h5>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Rôle Fonctionnel</label>
                    <CustomSelect
                      className="input-control"
                      value={editStaffRole}
                      onChange={(e) => handleRoleChangeInForm(e.target.value)}
                    >
                      <option value="super_admin">Super Administrateur (CMS)</option>
                      <option value="manager">Manager Caisse (CMS)</option>
                      <option value="agent_accueil">Agent d'accueil (Mobile App)</option>
                      <option value="livreur">Livreur (Mobile App)</option>
                      <option value="agent_lavage_repassage">Agent Atelier / Lavage (Mobile App)</option>
                    </CustomSelect>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Statut du Compte</label>
                    <CustomSelect
                      className="input-control"
                      value={editStaffStatut}
                      onChange={(e) => setEditStaffStatut(e.target.value)}
                      style={{
                        borderColor: editStaffStatut === 'suspendu' ? 'var(--danger)' : 'var(--border-color)',
                        color: editStaffStatut === 'suspendu' ? 'var(--danger)' : 'var(--text-primary)',
                        fontWeight: 700
                      }}
                    >
                      <option value="actif">Compte Actif (Autorisé)</option>
                      <option value="suspendu">Compte Suspendu (Bloqué)</option>
                    </CustomSelect>
                  </div>
                </div>
              </div>

              {/* SECTION 3 : CODE PIN ET SÉCURITÉ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  3. Authentification par Code PIN
                </h5>

                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '0.85rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPinSecret ? "text" : "password"}
                      className="input-control"
                      readOnly
                      disabled
                      value={selectedMember.code_pin || '123456'}
                      style={{
                        background: 'var(--bg-app)',
                        cursor: 'default',
                        fontWeight: 800,
                        letterSpacing: '4px',
                        textAlign: 'center',
                        fontSize: '1rem',
                        paddingRight: '2.5rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinSecret(!showPinSecret)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      title={showPinSecret ? "Masquer le PIN" : "Afficher le PIN"}
                    >
                      {showPinSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.55rem 0.65rem', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                      onClick={() => {
                        const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                        db.resetStaffPin(selectedMember.id, newPin);
                        alert(`Code PIN réinitialisé pour ${selectedMember.prenom} ${selectedMember.nom} !\n\nNouveau PIN : ${newPin}\n(Un email à été notifié à ${selectedMember.email})`);
                        refreshAdminData();
                      }}
                    >
                      <RefreshCw size={14} /> Générer PIN
                    </button>
                    {selectedMember.code_pin && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '0.55rem', fontSize: '0.76rem' }}
                        onClick={() => handleCopyPin(selectedMember.code_pin)}
                        title="Copier le code PIN"
                      >
                        {copiedPin ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4 : MATRICE GRANULAIRE DE PERMISSIONS */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sliders size={15} color="var(--primary)" />
                    4. Matrice de Permissions Granulaires
                  </h5>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Cocher pour accorder le droit d'accès
                  </span>
                </div>

                {/* Grille de cartes de permissions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {PERMISSIONS_CONFIG.map(perm => {
                    const isChecked = !!editStaffPermissions[perm.key];
                    const isDisabled = perm.requiresSuperAdmin && editStaffRole !== 'super_admin';
                    const IconComp = perm.icon;

                    return (
                      <label
                        key={perm.key}
                        style={{
                          display: 'flex',
                          alignItems: 'start',
                          gap: '0.75rem',
                          padding: '0.85rem',
                          borderRadius: '12px',
                          border: isChecked ? `1px solid ${perm.color}` : '1px solid var(--border-color)',
                          background: isChecked ? `${perm.color}0d` : 'var(--bg-app)',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.55 : 1,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={isDisabled}
                          checked={isChecked}
                          onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                          style={{ marginTop: '0.2rem', accentColor: perm.color, width: '16px', height: '16px', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <IconComp size={15} color={perm.color} />
                            {perm.title}
                          </div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.3' }}>
                            {perm.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* BOUTON DE SAUVEGARDE ET MESSAGE DE SUCCÈS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '0.65rem 1.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <CheckCircle2 size={16} /> Enregistrer le Profil & Permissions
                </button>

                {saveSuccess && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Check size={16} /> Modifications enregistrées !
                  </span>
                )}
              </div>

            </form>
          ) : (
            /* État vide si aucun membre sélectionné */
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '0.75rem', padding: '3rem' }}>
              <div style={{ background: 'var(--primary-light)', padding: '1.25rem', borderRadius: '50%', color: 'var(--primary)' }}>
                <User size={48} />
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, textAlign: 'center' }}>
                Sélectionnez un membre dans la liste pour consulter son profil et ajuster ses habilitations.
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
