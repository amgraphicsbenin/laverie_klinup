import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronRight,
  ChevronLeft,
  Plus,
  Edit3,
  Layers,
  Settings,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import { db } from '../../../services/db';

const PERMISSIONS_CONFIG = [
  // --- PLATAFORME ADMIN CMS ---
  {
    key: 'can_view_dashboard',
    category: 'admin',
    categoryLabel: '🖥️ Habilitations Admin CMS',
    title: 'Tableau de Bord & KPIs',
    description: 'Visionner les métriques de vente, chiffre d\'affaires et statistiques',
    icon: LayoutDashboard,
    color: '#3b82f6'
  },
  {
    key: 'can_manage_orders',
    category: 'admin',
    categoryLabel: '🖥️ Habilitations Admin CMS',
    title: 'Gestion Caisse & Commandes CMS',
    description: 'Enregistrer, modifier, valider et encaisser les commandes de pressing',
    icon: ShoppingBag,
    color: '#16a34a'
  },
  {
    key: 'can_manage_crm',
    category: 'admin',
    categoryLabel: '🖥️ Habilitations Admin CMS',
    title: 'Répertoire & CRM Clients',
    description: 'Accéder aux fiches clients, solder les dettes et gérer les abonnements',
    icon: Users,
    color: '#0284c7'
  },
  {
    key: 'can_edit_catalog',
    category: 'admin',
    categoryLabel: '🖥️ Habilitations Admin CMS',
    title: 'Catalogue & Tarifications',
    description: 'Ajuster les prix des prestations et créer des forfaits d\'abonnement',
    icon: Tag,
    color: '#d97706'
  },
  {
    key: 'can_manage_stores',
    category: 'admin',
    categoryLabel: '🖥️ Habilitations Admin CMS',
    title: 'Points de Laverie (Multi-Boutiques)',
    description: 'Créer, gérer et basculer entre les différents points de laverie',
    icon: Shield,
    color: '#6366f1'
  },
  {
    key: 'can_view_logs',
    category: 'admin',
    categoryLabel: '🖥️ Habilitations Admin CMS',
    title: 'Journal d\'Audit & Traçabilité',
    description: 'Traçabilité complète des actions effectuées sur le système (Super Admin)',
    icon: ShieldAlert,
    color: '#dc2626',
    requiresSuperAdmin: true
  },
  {
    key: 'can_manage_staff',
    category: 'admin',
    categoryLabel: '🖥️ Habilitations Admin CMS',
    title: 'Gestion du Personnel & Droits',
    description: 'Créer des profils, configurer les accès et réinitialiser les codes PIN',
    icon: UserCheck,
    color: '#8b5cf6',
    requiresSuperAdmin: true
  },

  // --- APPLICATION MOBILE TERRAIN ---
  {
    key: 'can_access_mobile',
    category: 'mobile',
    categoryLabel: '📱 Habilitations Application Mobile Terrain',
    title: 'Connexion & Accès App Mobile',
    description: 'Autoriser l\'authentification sur l\'application mobile terrain',
    icon: Key,
    color: '#10b981'
  },
  {
    key: 'can_create_orders_mobile',
    category: 'mobile',
    categoryLabel: '📱 Habilitations Application Mobile Terrain',
    title: 'Enregistrement Caisse Mobile',
    description: 'Créer des commandes et imprimer des tickets sur l\'app mobile',
    icon: ShoppingBag,
    color: '#002cf7'
  },
  {
    key: 'can_manage_delivery_mobile',
    category: 'mobile',
    categoryLabel: '📱 Habilitations Application Mobile Terrain',
    title: 'Tournées Livreur & Collecte',
    description: 'Accès au module de livraison, ramassage et encaissement à domicile',
    icon: User,
    color: '#f59e0b'
  },
  {
    key: 'can_manage_workshop_mobile',
    category: 'mobile',
    categoryLabel: '📱 Habilitations Application Mobile Terrain',
    title: 'Traitement Atelier (Lavage/Repassage)',
    description: 'Mise à jour des étapes de traitement textile en atelier',
    icon: Sliders,
    color: '#8b5cf6'
  }
];

const PRESET_COLORS = [
  '#2563eb', '#0284c7', '#16a34a', '#d97706', '#8b5cf6', 
  '#dc2626', '#ec4899', '#6366f1', '#14b8a6', '#f59e0b'
];

export default function StaffTab({
  subTab,
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
  editStaffStoreId,
  setEditStaffStoreId,
  editStaffPermissions,
  setEditStaffPermissions
}) {
  // Navigation Sous-menu : 'users' ou 'roles'
  const [activeSubTab, setActiveSubTab] = useState(subTab || 'users');

  useEffect(() => {
    if (subTab) {
      setActiveSubTab(subTab);
    }
  }, [subTab]);

  // États pour la page "Gestion Utilisateurs" (Design & Flow identique au Catalogue)
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const staffPerPage = 15;

  // Reset pagination on filter change (BUG-06)
  useEffect(() => {
    setStaffCurrentPage(1);
  }, [searchTerm, roleFilter, storeFilter, statusFilter]);

  // Modale d'édition de profil utilisateur
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState(null);
  const [editingPin, setEditingPin] = useState('');
  const [visiblePins, setVisiblePins] = useState({});
  const [copiedPinId, setCopiedPinId] = useState(null);

  // États pour "Configuration des Rôles"
  const [rolesList, setRolesList] = useState(() => db.getRoles ? db.getRoles() : []);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [editRoleLabel, setEditRoleLabel] = useState('');
  const [editRoleShortLabel, setEditRoleShortLabel] = useState('');
  const [editRoleColor, setEditRoleColor] = useState('#2563eb');
  const [editRoleDesc, setEditRoleDesc] = useState('');
  const [editRolePermissions, setEditRolePermissions] = useState({});
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newRoleShortLabel, setNewRoleShortLabel] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#2563eb');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [roleSaveSuccess, setRoleSaveSuccess] = useState(false);
  const [userSaveSuccess, setUserSaveSuccess] = useState(false);

  const staffList = staff || [];

  // Rafraîchissement de la liste des rôles
  const refreshRoles = () => {
    if (db.getRoles) {
      const current = db.getRoles();
      setRolesList(current);
    }
  };

  useEffect(() => {
    refreshRoles();
  }, []);

  // Méta rôle helper (BUG-13)
  const getRoleMeta = (roleKey) => {
    const found = rolesList.find(r => r.key === roleKey || r.id === roleKey);
    if (found) {
      return {
        label: found.label,
        shortLabel: found.shortLabel || found.label,
        color: found.color || '#2563eb',
        bg: `${found.color || '#2563eb'}12`,
        badgeBg: found.color || '#2563eb',
        desc: found.description || 'Rôle personnalisé'
      };
    }
    const defaultLabels = {
      super_admin: 'Super Admin',
      manager: 'Gérant (Manager)',
      editeur_catalogue: 'Éditeur Catalogue',
      agent_accueil: 'Agent Caisse & Accueil',
      agent_lavage_repassage: 'Agent Atelier',
      livreur: 'Livreur Terrain',
      repartiteur: 'Répartiteur Logistique'
    };
    const formattedLabel = defaultLabels[roleKey] || (roleKey ? roleKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Agent');
    return {
      label: formattedLabel,
      shortLabel: formattedLabel,
      color: '#64748b',
      bg: 'rgba(100, 116, 139, 0.08)',
      badgeBg: '#64748b',
      desc: 'Membre du personnel'
    };
  };

  // KPIs Utilisateurs
  const totalStaff = staffList.length;
  const superAdmins = staffList.filter(s => s.role === 'super_admin').length;
  const managers = staffList.filter(s => s.role === 'manager').length;
  const fieldStaff = staffList.filter(s => s.role !== 'super_admin' && s.role !== 'manager').length;
  const pendingRequests = (db.getPinResetRequests ? db.getPinResetRequests() : []).filter(r => r.status === 'pending');

  // KPIs Rôles
  const totalRoles = rolesList.length;
  const systemRolesCount = rolesList.filter(r => r.isSystem).length;
  const customRolesCount = rolesList.filter(r => !r.isSystem).length;

  // Filtrage du personnel
  const filteredStaff = staffList.filter(s => {
    const prenom = (s.prenom || '').toLowerCase();
    const nom = (s.nom || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const tel = (s.telephone || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = prenom.includes(query) || nom.includes(query) || email.includes(query) || tel.includes(query);
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStore = storeFilter === 'all' || s.store_id === storeFilter;
    const matchesStatus = statusFilter === 'all' || (s.statut || 'actif') === statusFilter;

    return matchesSearch && matchesRole && matchesStore && matchesStatus;
  });

  // Pagination
  const totalStaffPages = Math.ceil(filteredStaff.length / staffPerPage) || 1;
  const paginatedStaff = filteredStaff.slice(
    (staffCurrentPage - 1) * staffPerPage,
    staffCurrentPage * staffPerPage
  );

  // Rôle sélectionné dans l'éditeur de rôles
  const selectedRoleObj = rolesList.find(r => r.id === selectedRoleId || r.key === selectedRoleId) || rolesList[0];

  useEffect(() => {
    if (selectedRoleObj) {
      if (!selectedRoleId) {
        setSelectedRoleId(selectedRoleObj.id);
      }
      setEditRoleLabel(selectedRoleObj.label || '');
      setEditRoleShortLabel(selectedRoleObj.shortLabel || selectedRoleObj.label || '');
      setEditRoleColor(selectedRoleObj.color || '#2563eb');
      setEditRoleDesc(selectedRoleObj.description || '');
      setEditRolePermissions(selectedRoleObj.permissions || {});
    }
  }, [selectedRoleId, rolesList, selectedRoleObj]);

  const currentUser = db.getCurrentUser ? db.getCurrentUser() : null;
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const handleCopyPin = (pin, staffId) => {
    if (!isSuperAdmin) {
      alert("Accès refusé : Seul le Super Administrateur est autorisé à copier les codes PIN.");
      return;
    }
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedPinId(staffId);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const togglePinVisibility = (staffId) => {
    if (!isSuperAdmin) {
      alert("Accès refusé : Seul le Super Administrateur est autorisé à voir les codes PIN.");
      return;
    }
    setVisiblePins(prev => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  const handleOpenEditUserModal = (staffMember) => {
    setSelectedStaffId(staffMember.id);
    setEditingStaffMember(staffMember);
    setEditingPin(staffMember.code_pin || '000000');
    setShowEditUserModal(true);
  };

  const handleUserModalSave = (e) => {
    const success = handleSaveStaff(e);
    if (success) {
      setUserSaveSuccess(true);
      setTimeout(() => {
        setUserSaveSuccess(false);
        setShowEditUserModal(false);
      }, 1200);
    }
  };

  const handleDeleteStaffBatch = async () => {
    if (selectedStaffIds.length === 0) return;
    const confirmed = await window.confirm(`Voulez-vous vraiment supprimer les ${selectedStaffIds.length} utilisateurs sélectionnés ?`);
    if (confirmed) {
      for (const id of selectedStaffIds) {
        await db.deleteStaff(id);
      }
      setSelectedStaffIds([]);
      refreshAdminData();
    }
  };

  const handleRoleSaveSubmit = (e) => {
    e.preventDefault();
    if (!selectedRoleObj) return;

    db.saveRole({
      id: selectedRoleObj.id,
      key: selectedRoleObj.key,
      label: editRoleLabel,
      shortLabel: editRoleShortLabel,
      color: editRoleColor,
      description: editRoleDesc,
      isSystem: selectedRoleObj.isSystem,
      permissions: editRolePermissions
    });

    refreshRoles();
    setRoleSaveSuccess(true);
    setTimeout(() => setRoleSaveSuccess(false), 2500);
  };

  const handleCreateNewRoleSubmit = (e) => {
    e.preventDefault();
    if (!newRoleLabel) return;

    const newRole = db.saveRole({
      label: newRoleLabel.trim(),
      shortLabel: newRoleShortLabel.trim() || newRoleLabel.trim(),
      color: newRoleColor,
      description: newRoleDesc.trim(),
      isSystem: false,
      permissions: {
        can_access_mobile: true,
        can_create_orders_mobile: true
      }
    });

    const updatedRoles = db.getRoles ? db.getRoles() : [];
    setRolesList(updatedRoles);
    setSelectedRoleId(newRole.id);
    setShowNewRoleModal(false);
    setNewRoleLabel('');
    setNewRoleShortLabel('');
    setNewRoleColor('#2563eb');
    setNewRoleDesc('');
  };

  const handleDeleteRole = (roleId) => {
    if (db.deleteRole(roleId)) {
      refreshRoles();
      setSelectedRoleId('');
    }
  };

  const selectAllPermissionsCategory = (category) => {
    const updated = { ...editRolePermissions };
    PERMISSIONS_CONFIG.filter(p => p.category === category).forEach(p => {
      updated[p.key] = true;
    });
    setEditRolePermissions(updated);
  };

  const clearAllRolePermissions = () => {
    setEditRolePermissions({});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* =========================================================================
         SOUS-MENU 1 : GESTION DES UTILISATEURS (DESIGN & FLOW IDENTIQUE AU CATALOGUE)
         ========================================================================= */}
      {activeSubTab === 'users' && (
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1.25rem',
            minHeight: '600px'
          }}
        >
          
          {/* EN-TÊTE BANNIÈRE DE LA SECTION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Users size={20} color="var(--primary)" />
                Répertoire du Personnel & Gestion des Accès
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Consultez, recherchez et gérez les comptes du personnel et leurs habilitations d'accès.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {selectedStaffIds.length > 0 && (
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '0.45rem 1rem', borderRadius: '10px', background: 'var(--danger)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}
                  onClick={handleDeleteStaffBatch}
                >
                  <Trash2 size={15} />
                  Supprimer la sélection ({selectedStaffIds.length})
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowNewStaffModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'var(--primary)',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                }}
              >
                <UserPlus size={16} /> Nouvel Utilisateur
              </button>
            </div>
          </div>

          {/* BANNER AVERTISSEMENT SI DEMANDES DE RESET PIN EN ATTENTE */}
          {pendingRequests.length > 0 && (
            <div
              style={{
                background: 'rgba(217, 119, 6, 0.06)',
                border: '1px solid rgba(217, 119, 6, 0.3)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Key size={20} color="var(--warning)" />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} de réinitialisation de PIN en attente
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Les employés réclament un nouveau code PIN. Approuvez-les directement dans leur fiche.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BARRE DE FILTRES INTELLIGENTS ET RECHERCHE */}
          <div className="smart-filter-panel">
            
            {/* Zone de Recherche Texte */}
            <div className="search-control-container">
              <Search size={16} className="search-control-icon" />
              <input
                type="text"
                className="search-control-input"
                placeholder="Rechercher par nom, prénom, email, téléphone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setStaffCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="search-control-clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filtre Rôle */}
            <div className="select-control-wrapper" style={{ minWidth: '170px' }}>
              <CustomSelect
                className="input-control"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setStaffCurrentPage(1);
                }}
              >
                <option value="all">Tous les rôles</option>
                {rolesList.map(r => (
                  <option key={r.id || r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </CustomSelect>
            </div>

            {/* Filtre Boutique / Laverie */}
            <div className="select-control-wrapper" style={{ minWidth: '170px' }}>
              <CustomSelect
                className="input-control"
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value);
                  setStaffCurrentPage(1);
                }}
              >
                <option value="all">Toutes les laveries</option>
                {db.getStores().map(st => (
                  <option key={st.id} value={st.id}>
                    {st.nom} ({st.code})
                  </option>
                ))}
              </CustomSelect>
            </div>

            {/* Filtre Statut */}
            <div className="select-control-wrapper" style={{ minWidth: '150px' }}>
              <CustomSelect
                className="input-control"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setStaffCurrentPage(1);
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="actif">Comptes Actifs</option>
                <option value="suspendu">Comptes Suspendus</option>
              </CustomSelect>
            </div>

            {/* Case à cocher "Tout cocher" */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem', marginLeft: 'auto' }}>
              <input
                type="checkbox"
                id="select-all-staff"
                style={{ cursor: 'pointer', scale: '1.1' }}
                checked={paginatedStaff.length > 0 && paginatedStaff.every(item => selectedStaffIds.includes(item.id))}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedStaffIds(prev => {
                      const pageIds = paginatedStaff.map(item => item.id);
                      return [...new Set([...prev, ...pageIds])];
                    });
                  } else {
                    setSelectedStaffIds(prev => prev.filter(id => !paginatedStaff.some(item => item.id === id)));
                  }
                }}
              />
              <label htmlFor="select-all-staff" style={{ fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)', userSelect: 'none' }}>
                Tout cocher
              </label>
            </div>

          </div>

          {/* TABLEAU DES UTILISATEURS (STRUCTURE HAUTE DENSITÉ SIMILAIRE AUX TARIFS) */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div className="table-container" style={{ margin: 0, border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', overflow: 'visible' }}>
              <table style={{ margin: 0, width: '100%' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ width: '40px', textAlign: 'center', padding: '0.75rem' }}>
                      <input
                        type="checkbox"
                        style={{ cursor: 'pointer', scale: '1.1' }}
                        checked={paginatedStaff.length > 0 && paginatedStaff.every(item => selectedStaffIds.includes(item.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStaffIds(prev => {
                              const pageIds = paginatedStaff.map(item => item.id);
                              return [...new Set([...prev, ...pageIds])];
                            });
                          } else {
                            setSelectedStaffIds(prev => prev.filter(id => !paginatedStaff.some(item => item.id === id)));
                          }
                        }}
                      />
                    </th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Membre du Personnel</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Rôle & Tag</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Point de Laverie</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Contact</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Code PIN</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Statut</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStaff.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem' }}>
                        <AlertCircle size={28} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
                        <div style={{ fontWeight: 600 }}>Aucun membre du personnel trouvé avec ces critères.</div>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setShowNewStaffModal(true)}
                          style={{ marginTop: '0.75rem', padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <UserPlus size={14} /> Créer un nouvel utilisateur
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((s) => {
                      const isSelected = selectedStaffIds.includes(s.id);
                      const roleMeta = getRoleMeta(s.role);
                      const isSuspended = s.statut === 'suspendu' || s.statut === 'inactif';
                      const prenom = s.prenom || '';
                      const nom = s.nom || '';
                      const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || 'U';
                      const isPinVisible = !!visiblePins[s.id];
                      const isPinCopied = copiedPinId === s.id;

                      const hasPinRequest = pendingRequests.some(r => r?.email && (r.email.toLowerCase() === (s.email || '').toLowerCase()));

                      return (
                        <tr
                          key={s.id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: isSelected ? 'rgba(0, 44, 247, 0.03)' : 'transparent',
                            opacity: isSuspended ? 0.75 : 1,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                            <input
                              type="checkbox"
                              style={{ cursor: 'pointer', scale: '1.1' }}
                              checked={isSelected}
                              onChange={() => {
                                setSelectedStaffIds(prev =>
                                  prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                                );
                              }}
                            />
                          </td>

                          {/* Membre */}
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '10px',
                                  background: roleMeta.color,
                                  color: '#ffffff',
                                  fontSize: '0.85rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {initiales}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {prenom} {nom}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                  {s.email || `${prenom.toLowerCase()}.${nom.toLowerCase()}@klinup.com`}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Rôle */}
                          <td style={{ padding: '0.75rem' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                background: roleMeta.bg,
                                border: `1px solid ${roleMeta.color}35`,
                                color: roleMeta.color,
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <ShieldCheck size={13} />
                              {roleMeta.label}
                            </span>
                          </td>

                          {/* Point de Laverie */}
                          <td style={{ padding: '0.75rem' }}>
                            {(() => {
                              const stores = db.getStores();
                              const targetId = s.store_id || s.laverie_id || s.store_code || s.laverie;
                              const sStore = stores.find(st => 
                                st.id === targetId || 
                                st.code === targetId || 
                                (st.nom && targetId && st.nom.toLowerCase() === String(targetId).toLowerCase())
                              );
                              
                              let storeLabel = 'Non rattaché';
                              if (sStore) {
                                storeLabel = sStore.nom;
                              } else if (s.store_name || s.laverie_nom || s.boutique) {
                                storeLabel = s.store_name || s.laverie_nom || s.boutique;
                              } else if (targetId === 'all' || s.role === 'super_admin') {
                                storeLabel = 'Tous les points (Accès Global)';
                              } else if (targetId) {
                                storeLabel = targetId;
                              }
                              return (
                                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  📍 {storeLabel}
                                </span>
                              );
                            })()}
                          </td>

                          {/* Contact */}
                          <td style={{ padding: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {s.telephone || 'Non renseigné'}
                          </td>

                          {/* Code PIN */}
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: (isSuperAdmin && isPinVisible) ? '2px' : '3px', color: 'var(--text-primary)' }}>
                                {(isSuperAdmin && isPinVisible) ? (s.code_pin || '000000') : '••••••'}
                              </span>

                              {isSuperAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => togglePinVisibility(s.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
                                    title={isPinVisible ? "Masquer le PIN" : "Afficher le PIN"}
                                  >
                                    {isPinVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyPin(s.code_pin || '000000', s.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: isPinCopied ? 'var(--success)' : 'var(--text-muted)', padding: '2px', display: 'flex' }}
                                    title="Copier le code PIN"
                                  >
                                    {isPinCopied ? <Check size={14} /> : <Copy size={14} />}
                                  </button>
                                </>
                              )}

                              {hasPinRequest && (
                                <span style={{ fontSize: '0.62rem', background: 'var(--warning-light)', color: 'var(--warning)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                                  Demande PIN ⚡
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Statut (Toggle Switch) */}
                          <td style={{ padding: '0.75rem' }}>
                            <button
                              type="button"
                              onClick={async () => {
                                const newStatut = isSuspended ? 'actif' : 'suspendu';
                                let motif = '';

                                if (newStatut === 'suspendu') {
                                  motif = window.prompt(`Désactivation du compte de "${prenom} ${nom}".\n\nVeuillez indiquer obligatoirement le motif de la désactivation :`);
                                  if (!motif || !motif.trim()) {
                                    alert("Action annulée : Le motif de désactivation est obligatoire.");
                                    return;
                                  }
                                }

                                s.statut = newStatut;
                                if (motif) {
                                  db.logAction('SUSPENSION_PERSONNEL', `Désactivation de ${prenom} ${nom} | Motif : ${motif.trim()}`);
                                } else {
                                  db.logAction('REACTIVATION_PERSONNEL', `Réactivation de ${prenom} ${nom}`);
                                }

                                await db.updateStaff(s.id, { statut: newStatut });
                                if (refreshAdminData) refreshAdminData();
                              }}
                              style={{
                                border: 'none',
                                background: isSuspended ? 'rgba(220, 38, 38, 0.08)' : 'rgba(22, 163, 74, 0.08)',
                                color: isSuspended ? 'var(--danger)' : 'var(--success)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '20px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                transition: 'all 0.2s ease'
                              }}
                              title="Cliquez pour changer le statut"
                            >
                              {isSuspended ? (
                                <>
                                  <ToggleLeft size={15} /> Suspendu
                                </>
                              ) : (
                                <>
                                  <ToggleRight size={15} /> Actif
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                onClick={() => handleOpenEditUserModal(s)}
                              >
                                <Edit3 size={14} /> Éditer
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ padding: '0.35rem 0.55rem', fontSize: '0.74rem', borderRadius: '8px', color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.25)' }}
                                onClick={() => handleDeleteStaff(s.id)}
                                title="Supprimer ce membre"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PIED DE PAGE : PAGINATION */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {filteredStaff.length === 0 
                  ? "0 utilisateur (aucun membre ne correspond aux filtres actuels)"
                  : `Affichage de ${paginatedStaff.length} sur ${filteredStaff.length} utilisateur${filteredStaff.length > 1 ? 's' : ''}`
                }
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={staffCurrentPage <= 1}
                  onClick={() => setStaffCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                    opacity: staffCurrentPage <= 1 ? 0.45 : 1,
                    cursor: staffCurrentPage <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={14} /> Précédent
                </button>
                
                <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0 0.5rem', color: 'var(--text-primary)' }}>
                  Page {staffCurrentPage} sur {Math.max(1, totalStaffPages)}
                </span>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={totalStaffPages <= 1 || staffCurrentPage >= totalStaffPages}
                  onClick={() => setStaffCurrentPage(prev => Math.min(totalStaffPages, prev + 1))}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                    opacity: (totalStaffPages <= 1 || staffCurrentPage >= totalStaffPages) ? 0.45 : 1,
                    cursor: (totalStaffPages <= 1 || staffCurrentPage >= totalStaffPages) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
         SOUS-MENU 2 : CONFIGURATION DES RÔLES & ACCÈS RATTACHÉS
         ========================================================================= */}
      {activeSubTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* EN-TÊTE DE LA SECTION RÔLES */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <ShieldCheck size={20} color="var(--primary)" />
                Configuration des Rôles & Habilitations
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Définissez les rôles et associez la matrice des autorisations rattachées par défaut.
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowNewRoleModal(true)}
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.82rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <Plus size={16} /> Créer un Rôle
            </button>
          </div>
          
          {/* BANNIÈRE KPI RÔLES */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem'
            }}
          >
            <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '12px', color: 'var(--primary)', display: 'flex' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Rôles Configurés</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>{totalRoles}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div style={{ background: 'rgba(37, 99, 235, 0.08)', padding: '0.75rem', borderRadius: '12px', color: '#2563eb', display: 'flex' }}>
                <Shield size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rôles Système (Natifs)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-title)' }}>{systemRolesCount}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '0.75rem', borderRadius: '12px', color: '#8b5cf6', display: 'flex' }}>
                <Sparkles size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rôles Sur-mesure</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6', fontFamily: 'var(--font-title)' }}>{customRolesCount}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div style={{ background: 'rgba(22, 163, 74, 0.08)', padding: '0.75rem', borderRadius: '12px', color: '#16a34a', display: 'flex' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Utilisateurs Rattachés</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-title)' }}>{totalStaff}</div>
              </div>
            </div>
          </div>

          {/* DISPOSITION DEUX COLONNES : CATALOGUE DES RÔLES À GAUCHE - ÉDITEUR À DROITE */}
          <div className="grid-2" style={{ gridTemplateColumns: '0.85fr 1.15fr', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* COLONNE GAUCHE : LISTE DES RÔLES */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={18} color="var(--primary)" />
                    Catalogue des Rôles
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {rolesList.length} rôle{rolesList.length > 1 ? 's' : ''} répertorié{rolesList.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Liste défilante des rôles */}
              <div style={{ overflowY: 'auto', maxHeight: '600px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rolesList.map(role => {
                  const isSelected = selectedRoleId === role.id || selectedRoleId === role.key;
                  const assignedCount = staffList.filter(s => s.role === role.key || s.role === role.id).length;
                  const roleColor = role.color || '#2563eb';

                  return (
                    <div
                      key={role.id || role.key}
                      onClick={() => setSelectedRoleId(role.id)}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        border: isSelected ? `2px solid ${roleColor}` : '1px solid var(--border-color)',
                        background: isSelected ? `${roleColor}12` : 'var(--bg-app)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      {isSelected && (
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: roleColor }} />
                      )}

                      <div style={{ display: 'flex', alignItems: 'start', justifyBetween: 'space-between', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: roleColor,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: 800,
                            flexShrink: 0
                          }}
                        >
                          <ShieldCheck size={20} />
                        </div>

                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.92rem', color: isSelected ? roleColor : 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                              {role.label}
                            </strong>

                            <span
                              style={{
                                fontSize: '0.62rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '6px',
                                background: role.isSystem ? 'rgba(37, 99, 235, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                color: role.isSystem ? '#2563eb' : '#8b5cf6',
                                fontWeight: 700
                              }}
                            >
                              {role.isSystem ? 'Système' : 'Sur-mesure'}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0.5rem', lineHeight: '1.3' }}>
                            {role.description || 'Aucune description renseignée.'}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Users size={13} color="var(--primary)" />
                              <strong>{assignedCount}</strong> utilisateur{assignedCount > 1 ? 's' : ''} rattaché{assignedCount > 1 ? 's' : ''}
                            </span>

                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: roleColor }}>
                              Tag: {role.shortLabel || role.key}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLONNE DROITE : ÉDITEUR DU RÔLE SELECTIONNE ET HABILITATIONS */}
            <div className="card" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
              {selectedRoleObj ? (
                <form onSubmit={handleRoleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  
                  {/* EN-TÊTE RÔLE */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      background: `${editRoleColor}15`,
                      padding: '1rem 1.25rem',
                      borderRadius: '16px',
                      border: `1px solid ${editRoleColor}30`
                    }}
                  >
                    <div
                      style={{
                        background: editRoleColor,
                        color: '#ffffff',
                        width: '54px',
                        height: '54px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                      }}
                    >
                      <ShieldCheck size={28} />
                    </div>

                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                          {editRoleLabel || 'Édition du Rôle'}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            background: selectedRoleObj.isSystem ? '#2563eb' : '#8b5cf6',
                            color: '#fff',
                            fontWeight: 700
                          }}
                        >
                          {selectedRoleObj.isSystem ? 'Rôle Système Natif' : 'Rôle Personnalisé'}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                        {selectedRoleObj.isSystem 
                          ? "Ce rôle système natif définit les autorisations standards pour les utilisateurs rattachés."
                          : "Ce rôle personnalisé adapte précisément les accès selon les besoins de votre organisation."}
                      </p>
                    </div>

                    {!selectedRoleObj.isSystem && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '0.55rem', color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.25)', background: '#fff' }}
                        onClick={() => {
                          if (window.confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${selectedRoleObj.label}" ?`)) {
                            handleDeleteRole(selectedRoleObj.id);
                          }
                        }}
                        title="Supprimer ce rôle"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* SECTION 1 : PROPRIÉTÉS DU RÔLE */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      1. Propriétés du Rôle
                    </h5>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.85rem' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Nom du Rôle</label>
                        <input
                          type="text"
                          className="input-control"
                          required
                          value={editRoleLabel}
                          onChange={(e) => setEditRoleLabel(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Libellé Court (Badge)</label>
                        <input
                          type="text"
                          className="input-control"
                          required
                          value={editRoleShortLabel}
                          onChange={(e) => setEditRoleShortLabel(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Description Fonctionnelle</label>
                      <input
                        type="text"
                        className="input-control"
                        placeholder="Ex: Responsable des inventaires textiles et contrôle qualité..."
                        value={editRoleDesc}
                        onChange={(e) => setEditRoleDesc(e.target.value)}
                      />
                    </div>

                    {/* Sélection Couleur d'accentuation */}
                    <div className="form-group">
                      <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Couleur Thème du Rôle</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {PRESET_COLORS.map(c => (
                          <div
                            key={c}
                            onClick={() => setEditRoleColor(c)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: c,
                              cursor: 'pointer',
                              border: editRoleColor === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                              transform: editRoleColor === c ? 'scale(1.15)' : 'scale(1)',
                              transition: 'all 0.15s ease',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}
                          />
                        ))}
                        <input
                          type="color"
                          value={editRoleColor}
                          onChange={(e) => setEditRoleColor(e.target.value)}
                          style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }}
                          title="Couleur personnalisée"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2 : MATRICE DES HABILITATIONS RATTACHÉES */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sliders size={15} color="var(--primary)" />
                        2. Accès & Habilitations Rattachés à ce Rôle
                      </h5>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => selectAllPermissionsCategory('admin')}
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem', borderRadius: '6px' }}
                        >
                          ⚡ Tout Admin
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => selectAllPermissionsCategory('mobile')}
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem', borderRadius: '6px' }}
                        >
                          📱 Tout Mobile
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={clearAllRolePermissions}
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem', borderRadius: '6px', color: 'var(--danger)' }}
                        >
                          🧹 Décocher Tout
                        </button>
                      </div>
                    </div>

                    {/* Admin CMS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(0, 44, 247, 0.06)', padding: '0.35rem 0.75rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        🖥️ Habilitations Admin CMS (Web)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {PERMISSIONS_CONFIG.filter(p => p.category === 'admin').map(perm => {
                          const isChecked = !!editRolePermissions[perm.key];
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
                                border: isChecked ? `1px solid ${editRoleColor}` : '1px solid var(--border-color)',
                                background: isChecked ? `${editRoleColor}0d` : 'var(--bg-app)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => setEditRolePermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                                style={{ marginTop: '0.2rem', accentColor: editRoleColor, width: '16px', height: '16px', cursor: 'pointer' }}
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

                    {/* App Mobile */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.08)', padding: '0.35rem 0.75rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        📱 Habilitations Application Mobile Terrain
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {PERMISSIONS_CONFIG.filter(p => p.category === 'mobile').map(perm => {
                          const isChecked = !!editRolePermissions[perm.key];
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
                                border: isChecked ? `1px solid ${editRoleColor}` : '1px solid var(--border-color)',
                                background: isChecked ? `${editRoleColor}0d` : 'var(--bg-app)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => setEditRolePermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                                style={{ marginTop: '0.2rem', accentColor: editRoleColor, width: '16px', height: '16px', cursor: 'pointer' }}
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
                  </div>

                  {/* SECTION 3 : MEMBRES RATTACHÉS À CE RÔLE */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={15} color="var(--primary)" />
                      3. Utilisateurs rattachés à ce Rôle
                    </h5>

                    {(() => {
                      const attachedUsers = staffList.filter(s => s.role === selectedRoleObj.key || s.role === selectedRoleObj.id);
                      if (attachedUsers.length === 0) {
                        return (
                          <div style={{ padding: '0.85rem', background: 'var(--bg-app)', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            Aucun membre n'est actuellement rattaché à ce rôle.
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {attachedUsers.map(u => (
                            <div
                              key={u.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '20px',
                                background: `${editRoleColor}15`,
                                border: `1px solid ${editRoleColor}30`,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                              }}
                            >
                              <div
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: editRoleColor,
                                  color: '#fff',
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {(u.prenom || 'U')[0]}
                              </div>
                              <span>{u.prenom} {u.nom}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* BOUTON ENREGISTRER LE RÔLE */}
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
                      <CheckCircle2 size={16} /> Enregistrer le Rôle & les Habilitations Rattachées
                    </button>

                    {roleSaveSuccess && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Check size={16} /> Rôle sauvegardé avec succès !
                      </span>
                    )}
                  </div>

                </form>
              ) : (
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '0.75rem', padding: '3rem' }}>
                  <div style={{ background: 'var(--primary-light)', padding: '1.25rem', borderRadius: '50%', color: 'var(--primary)' }}>
                    <ShieldCheck size={48} />
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, textAlign: 'center' }}>
                    Sélectionnez un rôle dans la liste pour consulter ses propriétés et définir ses habilitations rattachées.
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
         MODALE D'ÉDITION DU PROFIL ET ACCÈS D'UN UTILISATEUR
         ========================================================================= */}
      {showEditUserModal && selectedMember && createPortal(
        <div className="modal-backdrop" onClick={() => setShowEditUserModal(false)}>
          <div
            className="card modal-dialog-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '720px',
              maxHeight: '88vh',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              color: 'var(--text-primary)',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25), 0 10px 25px -5px rgba(15, 23, 42, 0.12)',
              border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
              borderRadius: '24px',
              overflow: 'hidden'
            }}
          >
            {/* Header Modale */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: getRoleMeta(selectedMember.role).color, color: '#fff', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(selectedMember.prenom || 'U')[0]}{(selectedMember.nom || 'M')[0]}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Édition du Profil — {selectedMember.prenom} {selectedMember.nom}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {selectedMember.email} • Rôle : {getRoleMeta(selectedMember.role).label}
                  </span>
                </div>
              </div>

              <button type="button" onClick={() => setShowEditUserModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Formulaire défilant dans la modale */}
            <form onSubmit={handleUserModalSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', minHeight: 0, flex: 1, paddingRight: '0.25rem' }}>
              
              {/* SECTION 1 : INFORMATIONS GÉNÉRALES */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 800, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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

              {/* SECTION 2 : RÔLE, STATUT & BOUTIQUE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 800, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  2. Rôle, Statut & Point de Laverie
                </h5>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Rôle Fonctionnel</label>
                    <CustomSelect
                      className="input-control"
                      value={editStaffRole}
                      onChange={(e) => handleRoleChangeInForm(e.target.value)}
                    >
                      {rolesList.map(r => (
                        <option key={r.id || r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Point de Laverie</label>
                    <CustomSelect
                      className="input-control"
                      value={editStaffStoreId || (db.getStores()[0]?.id || 'all')}
                      onChange={(e) => setEditStaffStoreId(e.target.value)}
                    >
                      <option value="all">Tous les points (Accès Global)</option>
                      {db.getStores().map(st => (
                        <option key={st.id} value={st.id}>
                          {st.nom} ({st.code})
                        </option>
                      ))}
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

              {/* SECTION 3 : CODE PIN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 800, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  3. Authentification par Code PIN
                </h5>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="input-control"
                    readOnly
                    disabled
                    value={editingPin || (editingStaffMember ? editingStaffMember.code_pin : (selectedMember.code_pin || '000000'))}
                    style={{
                      background: 'var(--bg-app)',
                      fontWeight: 800,
                      letterSpacing: '4px',
                      textAlign: 'center',
                      fontSize: '1.05rem',
                      height: '40px'
                    }}
                  />

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.55rem', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    onClick={() => {
                      const targetMember = editingStaffMember || selectedMember;
                      if (!targetMember) return;
                      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                      db.resetStaffPin(targetMember.id, newPin);
                      setEditingPin(newPin);
                      alert(`Code PIN réinitialisé pour ${targetMember.prenom} ${targetMember.nom} !\n\nNouveau PIN : ${newPin}`);
                      refreshAdminData();
                    }}
                  >
                    <RefreshCw size={14} /> Régénérer un nouveau PIN
                  </button>
                </div>
              </div>

              {/* SECTION 4 : MATRICE GRANULAIRE DE PERMISSIONS SUR-MESURE */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 800, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sliders size={15} color="var(--primary)" />
                  4. Habilitations Sur-Mesure Bi-Plateforme
                </h5>

                {/* Admin CMS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>🖥️ Habilitations Admin CMS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    {PERMISSIONS_CONFIG.filter(p => p.category === 'admin').map(perm => {
                      const isChecked = !!editStaffPermissions[perm.key];
                      const isDisabled = perm.requiresSuperAdmin && editStaffRole !== 'super_admin';
                      const IconComp = perm.icon;

                      return (
                        <label
                          key={perm.key}
                          style={{
                            display: 'flex',
                            alignItems: 'start',
                            gap: '0.65rem',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: isChecked ? `1px solid ${perm.color}` : '1px solid var(--border-color)',
                            background: isChecked ? `${perm.color}0d` : 'var(--bg-app)',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.55 : 1
                          }}
                        >
                          <input
                            type="checkbox"
                            disabled={isDisabled}
                            checked={isChecked}
                            onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                            style={{ marginTop: '0.15rem', accentColor: perm.color }}
                          />
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <IconComp size={14} color={perm.color} />
                              {perm.title}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{perm.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* App Mobile */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>📱 Habilitations Application Mobile</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    {PERMISSIONS_CONFIG.filter(p => p.category === 'mobile').map(perm => {
                      const isChecked = !!editStaffPermissions[perm.key];
                      const IconComp = perm.icon;

                      return (
                        <label
                          key={perm.key}
                          style={{
                            display: 'flex',
                            alignItems: 'start',
                            gap: '0.65rem',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: isChecked ? `1px solid ${perm.color}` : '1px solid var(--border-color)',
                            background: isChecked ? `${perm.color}0d` : 'var(--bg-app)',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setEditStaffPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                            style={{ marginTop: '0.15rem', accentColor: perm.color }}
                          />
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <IconComp size={14} color={perm.color} />
                              {perm.title}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{perm.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bouton de sauvegarde de la modale */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', flexShrink: 0 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowEditUserModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> Enregistrer le Profil & Permissions
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
         MODALE : CRÉATION D'UN NOUVEAU RÔLE
         ========================================================================= */}
      {showNewRoleModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowNewRoleModal(false)}>
          <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '480px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'var(--text-primary)', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25), 0 10px 25px -5px rgba(15, 23, 42, 0.12)', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={20} /> Créer un nouveau Rôle
              </h3>
              <button type="button" onClick={() => setShowNewRoleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Titre / Nom du Rôle</label>
                  <input
                    type="text"
                    className="input-control"
                    required
                    placeholder="Ex: Responsable Atelier"
                    value={newRoleLabel}
                    onChange={(e) => setNewRoleLabel(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Badge / Tag Court</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Ex: Atelier"
                    value={newRoleShortLabel}
                    onChange={(e) => setNewRoleShortLabel(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Description du rôle</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ex: Supervise le repassage et le contrôle des commandes"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Couleur Thème du Rôle</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {PRESET_COLORS.map(c => (
                    <div
                      key={c}
                      onClick={() => setNewRoleColor(c)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: c,
                        cursor: 'pointer',
                        border: newRoleColor === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                        transform: newRoleColor === c ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={newRoleColor}
                    onChange={(e) => setNewRoleColor(e.target.value)}
                    style={{ width: '30px', height: '30px', border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowNewRoleModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontWeight: 700 }}>Créer le Rôle</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
