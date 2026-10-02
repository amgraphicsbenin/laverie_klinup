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
import MultiSearchInput from '../../../components/ui/MultiSearchInput';
import { IconUser, IconMail, IconPhone, IconShieldCheck, IconFileText, IconTag } from '@tabler/icons-react';
import { db } from '../../../services/db';
import StatefulButton from '../../../components/ui/StatefulButton';

const STAFF_SEARCH_TYPES = [
  { id: 'name', label: 'Nom & Prénom', icon: IconUser, placeholder: 'Nom ou prénom du collaborateur...' },
  { id: 'email', label: 'Email', icon: IconMail, placeholder: 'Adresse email professionnelle...' },
  { id: 'phone', label: 'Téléphone', icon: IconPhone, placeholder: 'Numéro de téléphone...', inputType: 'tel' },
  { id: 'role', label: 'Rôle / Poste', icon: IconShieldCheck, placeholder: 'Intitulé de poste ou rôle...' }
];

const ROLE_SEARCH_TYPES = [
  { id: 'name', label: 'Nom du Rôle', icon: IconShieldCheck, placeholder: 'Nom ou intitulé du rôle...' },
  { id: 'description', label: 'Description', icon: IconFileText, placeholder: 'Mots-clés dans la description...' },
  { id: 'key', label: 'Identifiant / Clé', icon: IconTag, placeholder: 'Clé technique du rôle...' }
];

const PERMISSIONS_CONFIG = [
  // --- PLATAFORME ADMIN CMS ---
  {
    key: 'can_view_dashboard',
    category: 'admin',
    categoryLabel: 'Habilitations Admin CMS',
    title: 'Tableau de Bord & KPIs',
    description: 'Visionner les métriques de vente, chiffre d\'affaires et statistiques',
    icon: LayoutDashboard,
    color: '#3b82f6'
  },
  {
    key: 'can_manage_orders',
    category: 'admin',
    categoryLabel: 'Habilitations Admin CMS',
    title: 'Gestion Caisse & Commandes CMS',
    description: 'Enregistrer, modifier, valider et encaisser les commandes de pressing',
    icon: ShoppingBag,
    color: '#16a34a'
  },
  {
    key: 'can_manage_crm',
    category: 'admin',
    categoryLabel: 'Habilitations Admin CMS',
    title: 'Répertoire & CRM Clients',
    description: 'Accéder aux fiches clients, solder les dettes et gérer les abonnements',
    icon: Users,
    color: '#0284c7'
  },
  {
    key: 'can_edit_catalog',
    category: 'admin',
    categoryLabel: 'Habilitations Admin CMS',
    title: 'Catalogue & Tarifications',
    description: 'Ajuster les prix des prestations et créer des forfaits d\'abonnement',
    icon: Tag,
    color: '#d97706'
  },
  {
    key: 'can_manage_stores',
    category: 'admin',
    categoryLabel: 'Habilitations Admin CMS',
    title: 'Points de Laverie (Multi-Boutiques)',
    description: 'Créer, gérer et basculer entre les différents points de laverie',
    icon: Shield,
    color: '#6366f1'
  },
  {
    key: 'can_view_logs',
    category: 'admin',
    categoryLabel: 'Habilitations Admin CMS',
    title: 'Journal d\'Audit & Traçabilité',
    description: 'Traçabilité complète des actions effectuées sur le système (Super Admin)',
    icon: ShieldAlert,
    color: '#dc2626',
    requiresSuperAdmin: true
  },
  {
    key: 'can_manage_staff',
    category: 'admin',
    categoryLabel: 'Habilitations Admin CMS',
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
    categoryLabel: 'Habilitations Application Mobile Terrain',
    title: 'Connexion & Accès App Mobile',
    description: 'Autoriser l\'authentification sur l\'application mobile terrain',
    icon: Key,
    color: '#10b981'
  },
  {
    key: 'can_create_orders_mobile',
    category: 'mobile',
    categoryLabel: 'Habilitations Application Mobile Terrain',
    title: 'Enregistrement Caisse Mobile',
    description: 'Créer des commandes et imprimer des tickets sur l\'app mobile',
    icon: ShoppingBag,
    color: '#002cf7'
  },
  {
    key: 'can_manage_delivery_mobile',
    category: 'mobile',
    categoryLabel: 'Habilitations Application Mobile Terrain',
    title: 'Tournées Livreur & Collecte',
    description: 'Accès au module de livraison, ramassage et encaissement à domicile',
    icon: User,
    color: '#f59e0b'
  },
  {
    key: 'can_manage_workshop_mobile',
    category: 'mobile',
    categoryLabel: 'Habilitations Application Mobile Terrain',
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
  stores = [],
  storeFilter: propStoreFilter,
  setStoreFilter: propSetStoreFilter,
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
  const [staffSearchType, setStaffSearchType] = useState('name'); // 'name' | 'email' | 'phone' | 'role'
  const [roleFilter, setRoleFilter] = useState('all');
  const [localStoreFilter, setLocalStoreFilter] = useState('all');
  const storeFilter = propStoreFilter !== undefined ? propStoreFilter : localStoreFilter;
  const setStoreFilter = propSetStoreFilter !== undefined ? propSetStoreFilter : setLocalStoreFilter;
  const storesList = stores && stores.length > 0 ? stores : (db.getStores ? db.getStores() : []);

  const getStoreName = (storeId) => {
    if (!storeId || storeId === 'all') return 'Tous les points';
    const found = storesList.find(st => st.id === storeId || st.code === storeId);
    return found ? `${found.nom} (${found.code})` : storeId;
  };

  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const staffPerPage = 15;

  // Reset pagination on filter change (BUG-06)
  useEffect(() => {
    setStaffCurrentPage(1);
  }, [searchTerm, staffSearchType, roleFilter, storeFilter, statusFilter]);

  // Modale d'édition de profil utilisateur
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState(null);
  const [editingPin, setEditingPin] = useState('');
  const [visiblePins, setVisiblePins] = useState({});
  const [copiedPinId, setCopiedPinId] = useState(null);

  // États pour "Configuration des Rôles"
  const [rolesList, setRolesList] = useState(() => db.getRoles ? db.getRoles() : []);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [viewingRoleId, setViewingRoleId] = useState(null);
  const [showViewRoleModal, setShowViewRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [roleSearchType, setRoleSearchType] = useState('name'); // 'name' | 'description' | 'key'
  const [roleTypeFilter, setRoleTypeFilter] = useState('all');
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
  const [isSavingUser, setIsSavingUser] = useState(false);

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
    if (typeof db.subscribe === 'function') {
      const unsubscribe = db.subscribe(() => {
        refreshRoles();
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
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

  const storeStaffCount = staffList.filter(s => {
    const sStoreId = s.store_id || s.laverie_id || s.store_code || s.laverie;
    return storeFilter === 'all' ||
      sStoreId === storeFilter ||
      storesList.some(st => (st.id === storeFilter && (st.code === sStoreId || st.id === sStoreId)) || (st.code === storeFilter && st.id === sStoreId));
  }).length;

  // Filtrage du personnel
  const filteredStaff = staffList.filter(s => {
    const prenom = (s.prenom || '').toLowerCase();
    const nom = (s.nom || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const tel = (s.telephone || '').toLowerCase();
    const query = searchTerm.toLowerCase().trim();

    let matchesSearch = true;
    if (query) {
      if (staffSearchType === 'email') {
        matchesSearch = email.includes(query);
      } else if (staffSearchType === 'phone') {
        matchesSearch = tel.includes(query);
      } else if (staffSearchType === 'role') {
        const roleObj = rolesList.find(r => r.key === s.role || r.id === s.role);
        const roleLabel = (roleObj?.label || roleObj?.shortLabel || s.role || '').toLowerCase();
        matchesSearch = roleLabel.includes(query);
      } else {
        // 'name'
        const fullName = `${prenom} ${nom}`.trim();
        const reverseName = `${nom} ${prenom}`.trim();
        matchesSearch = prenom.includes(query) || nom.includes(query) || fullName.includes(query) || reverseName.includes(query);
      }
    }

    const matchesRole = roleFilter === 'all' || s.role === roleFilter || (rolesList.some(r => (r.key === roleFilter || r.id === roleFilter) && (r.key === s.role || r.id === s.role)));
    const sStoreId = s.store_id || s.laverie_id || s.store_code || s.laverie;
    const matchesStore = storeFilter === 'all' ||
      sStoreId === storeFilter ||
      storesList.some(st => (st.id === storeFilter && (st.code === sStoreId || st.id === sStoreId)) || (st.code === storeFilter && st.id === sStoreId));
    const matchesStatus = statusFilter === 'all' || (s.statut || 'actif') === statusFilter;

    return matchesSearch && matchesRole && matchesStore && matchesStatus;
  });

  // Pagination
  const totalStaffPages = Math.ceil(filteredStaff.length / staffPerPage) || 1;
  const paginatedStaff = filteredStaff.slice(
    (staffCurrentPage - 1) * staffPerPage,
    staffCurrentPage * staffPerPage
  );

  // Rôle actuellement consulté en modale de visualisation
  const viewingRole = rolesList.find(r => r.id === viewingRoleId || r.key === viewingRoleId) || null;

  // Filtrage intelligent des rôles (recherche textuelle + type natif/sur-mesure)
  const filteredRoles = rolesList.filter(role => {
    const query = roleSearch.trim().toLowerCase();
    const label = (role.label || '').toLowerCase();
    const shortLabel = (role.shortLabel || '').toLowerCase();
    const desc = (role.description || '').toLowerCase();
    const key = (role.key || '').toLowerCase();

    let matchesSearch = true;
    if (query) {
      if (roleSearchType === 'description') {
        matchesSearch = desc.includes(query);
      } else if (roleSearchType === 'key') {
        matchesSearch = key.includes(query);
      } else {
        // 'name'
        matchesSearch = label.includes(query) || shortLabel.includes(query);
      }
    }

    const matchesType =
      roleTypeFilter === 'all' ||
      (roleTypeFilter === 'system' && role.isSystem) ||
      (roleTypeFilter === 'custom' && !role.isSystem);

    return matchesSearch && matchesType;
  });

  // Rôle sélectionné dans l'éditeur de rôles
  const selectedRoleObj = rolesList.find(r => r.id === selectedRoleId || r.key === selectedRoleId) || rolesList[0];

  useEffect(() => {
    if (selectedRoleObj) {
      if (!selectedRoleId || (selectedRoleId !== selectedRoleObj.id && selectedRoleId !== selectedRoleObj.key)) {
        setSelectedRoleId(selectedRoleObj.id || selectedRoleObj.key);
      }
      setEditRoleLabel(selectedRoleObj.label || '');
      setEditRoleShortLabel(selectedRoleObj.shortLabel || selectedRoleObj.label || '');
      setEditRoleColor(selectedRoleObj.color || '#2563eb');
      setEditRoleDesc(selectedRoleObj.description || '');
      setEditRolePermissions(selectedRoleObj.permissions || {});
    } else {
      setSelectedRoleId('');
      setEditRoleLabel('');
      setEditRoleShortLabel('');
      setEditRoleColor('#2563eb');
      setEditRoleDesc('');
      setEditRolePermissions({});
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

  const handleUserModalSave = async (e) => {
    setIsSavingUser(true);
    try {
      const success = await handleSaveStaff(e);
      if (success) {
        setUserSaveSuccess(true);
        setTimeout(() => {
          setUserSaveSuccess(false);
          setShowEditUserModal(false);
        }, 1200);
      }
    } finally {
      setIsSavingUser(false);
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

  const openViewRole = (role) => {
    setViewingRoleId(role.id || role.key);
    setShowViewRoleModal(true);
  };

  const openEditRole = (role) => {
    const roleId = role.id || role.key;
    setSelectedRoleId(roleId);
    setEditRoleLabel(role.label || '');
    setEditRoleShortLabel(role.shortLabel || role.label || '');
    setEditRoleColor(role.color || '#2563eb');
    setEditRoleDesc(role.description || '');
    setEditRolePermissions(role.permissions || {});
    setShowEditRoleModal(true);
  };

  const handleSwitchToEdit = (role) => {
    setShowViewRoleModal(false);
    openEditRole(role);
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
    setTimeout(() => {
      setRoleSaveSuccess(false);
      setShowEditRoleModal(false);
    }, 1000);
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
    setShowNewRoleModal(false);
    setNewRoleLabel('');
    setNewRoleShortLabel('');
    setNewRoleColor('#2563eb');
    setNewRoleDesc('');

    if (newRole) {
      openEditRole(newRole);
    }
  };

  const handleDeleteRole = (roleId) => {
    const roleToDelete = rolesList.find(r => r.id === roleId || r.key === roleId);
    if (!roleToDelete) return;

    if (roleToDelete.isSystem) {
      alert("Ce rôle système natif est indispensable et ne peut pas être supprimé car il structure les accès fondamentaux.");
      return;
    }

    const assignedCount = staffList.filter(s => s.role === roleToDelete.key || s.role === roleToDelete.id).length;
    let confirmMsg = `Êtes-vous sûr de vouloir supprimer le rôle "${roleToDelete.label}" ?`;
    if (assignedCount > 0) {
      confirmMsg += `\n\nAttention : ${assignedCount} utilisateur(s) du personnel sont actuellement rattaché(s) à ce rôle.`;
    }
    if (!window.confirm(confirmMsg)) return;

    if (db.deleteRole(roleId)) {
      refreshRoles();
      if (selectedRoleId === roleId) {
        setSelectedRoleId('');
        setShowEditRoleModal(false);
      }
      if (viewingRoleId === roleId) {
        setViewingRoleId(null);
        setShowViewRoleModal(false);
      }
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
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
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
            
            {/* Barre de Recherche Multi-Critères */}
            <MultiSearchInput
              searchTypes={STAFF_SEARCH_TYPES}
              searchType={staffSearchType}
              onSearchTypeChange={(type) => {
                setStaffSearchType(type);
                setStaffCurrentPage(1);
              }}
              searchQuery={searchTerm}
              onSearchQueryChange={(query) => {
                setSearchTerm(query);
                setStaffCurrentPage(1);
              }}
              width="390px"
              minWidth="280px"
            />

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

            {/* Filtre Point de Laverie */}
            <div className="select-control-wrapper" style={{ minWidth: '170px' }}>
              <CustomSelect
                className="input-control"
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value);
                  setStaffCurrentPage(1);
                }}
              >
                <option value="all">Tous les points</option>
                {storesList.map(st => (
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
                                  {s.email || `${prenom.toLowerCase()}.${nom.toLowerCase()}@pressingpro.com`}
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
                              const stores = storesList;
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
                                  {storeLabel}
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
                                  Demande PIN
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
                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>{totalRoles}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div style={{ background: 'rgba(37, 99, 235, 0.08)', padding: '0.75rem', borderRadius: '12px', color: '#2563eb', display: 'flex' }}>
                <Shield size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rôles Système (Natifs)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#2563eb', fontFamily: 'var(--font-title)' }}>{systemRolesCount}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '0.75rem', borderRadius: '12px', color: '#8b5cf6', display: 'flex' }}>
                <Sparkles size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rôles Sur-mesure</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#8b5cf6', fontFamily: 'var(--font-title)' }}>{customRolesCount}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div style={{ background: 'rgba(22, 163, 74, 0.08)', padding: '0.75rem', borderRadius: '12px', color: '#16a34a', display: 'flex' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {storeFilter !== 'all' ? 'Utilisateurs du Point' : 'Utilisateurs Rattachés'}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#16a34a', fontFamily: 'var(--font-title)' }}>
                  {storeFilter !== 'all' ? storeStaffCount : totalStaff}
                </div>
              </div>
            </div>
          </div>

          {/* CARTE TABLEAU PRINCIPALE DES RÔLES */}
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              padding: '1.5rem',
              borderRadius: '20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {/* Header Tableau */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.9rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    margin: 0,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <ShieldCheck size={20} color="var(--primary)" />
                  Catalogue des Rôles & Accès
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '12px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)'
                  }}
                >
                  {filteredRoles.length} {filteredRoles.length > 1 ? 'rôles' : 'rôle'}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowNewRoleModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
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
                <Plus size={16} /> Nouveau Rôle
              </button>
            </div>

            {/* Barre de Recherche Multi-Critères & Filtres par type et point de laverie */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <MultiSearchInput
                searchTypes={ROLE_SEARCH_TYPES}
                searchType={roleSearchType}
                onSearchTypeChange={setRoleSearchType}
                searchQuery={roleSearch}
                onSearchQueryChange={setRoleSearch}
                width="380px"
                minWidth="260px"
              />

              {/* Filtre Point de Laverie */}
              <div className="select-control-wrapper" style={{ minWidth: '170px' }}>
                <CustomSelect
                  className="input-control"
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                >
                  <option value="all">Tous les points</option>
                  {storesList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.nom} ({st.code})
                    </option>
                  ))}
                </CustomSelect>
              </div>

              {/* Pilules de filtrage type de rôle */}
              <div className="filter-pills-group" style={{ flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`filter-pill-btn ${roleTypeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setRoleTypeFilter('all')}
                  style={{ minWidth: '90px', justifyContent: 'center' }}
                >
                  Tous ({rolesList.length})
                </button>
                <button
                  type="button"
                  className={`filter-pill-btn ${roleTypeFilter === 'system' ? 'active' : ''}`}
                  onClick={() => setRoleTypeFilter('system')}
                  style={{ minWidth: '100px', justifyContent: 'center', gap: '0.3rem' }}
                >
                  <Shield size={13} /> Système ({systemRolesCount})
                </button>
                <button
                  type="button"
                  className={`filter-pill-btn ${roleTypeFilter === 'custom' ? 'active' : ''}`}
                  onClick={() => setRoleTypeFilter('custom')}
                  style={{ minWidth: '110px', justifyContent: 'center', gap: '0.3rem' }}
                >
                  <Sparkles size={13} /> Sur-mesure ({customRolesCount})
                </button>
              </div>
            </div>

            {/* Structure Tableau Responsive */}
            <div className="table-container" style={{ width: '100%', overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Rôle & Intitulé</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Type</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Libellé Court</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Habilitations (CMS / Mobile)</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Utilisateurs Rattachés</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)' }}>
                        <ShieldCheck size={36} style={{ margin: '0 auto 0.6rem', color: 'var(--text-muted)', opacity: 0.6 }} />
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Aucun rôle trouvé</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          Modifiez vos critères de recherche ou créez un nouveau rôle personnalisé.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map(role => {
                      const roleColor = role.color || '#2563eb';
                      const assignedUsers = staffList.filter(s => {
                        const isRole = s.role === role.key || s.role === role.id;
                        if (!isRole) return false;
                        if (storeFilter === 'all') return true;
                        const sStoreId = s.store_id || s.laverie_id || s.store_code || s.laverie;
                        return sStoreId === storeFilter ||
                          storesList.some(st => (st.id === storeFilter && (st.code === sStoreId || st.id === sStoreId)) || (st.code === storeFilter && st.id === sStoreId));
                      });
                      const assignedCount = assignedUsers.length;
                      
                      const adminPerms = PERMISSIONS_CONFIG.filter(p => p.category === 'admin');
                      const mobilePerms = PERMISSIONS_CONFIG.filter(p => p.category === 'mobile');
                      const rolePerms = role.permissions || {};
                      const adminCount = adminPerms.filter(p => !!rolePerms[p.key]).length;
                      const mobileCount = mobilePerms.filter(p => !!rolePerms[p.key]).length;

                      return (
                        <tr
                          key={role.id || role.key}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* 1. Rôle & Intitulé */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '10px',
                                  background: roleColor,
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                }}
                              >
                                <ShieldCheck size={18} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                                  {role.label}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-muted)',
                                    maxWidth: '280px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    marginTop: '2px'
                                  }}
                                  title={role.description}
                                >
                                  {role.description || 'Rôle standard sans description spécifique'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Type */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '8px',
                                background: role.isSystem ? 'rgba(37, 99, 235, 0.08)' : 'rgba(139, 92, 246, 0.08)',
                                color: role.isSystem ? '#2563eb' : '#8b5cf6',
                                border: role.isSystem ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(139, 92, 246, 0.25)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              {role.isSystem ? <Shield size={11} /> : <Sparkles size={11} />}
                              {role.isSystem ? 'Système' : 'Sur-mesure'}
                            </span>
                          </td>

                          {/* 3. Libellé Court / Badge */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '8px',
                                background: `${roleColor}14`,
                                color: roleColor,
                                border: `1px solid ${roleColor}35`,
                                display: 'inline-block'
                              }}
                            >
                              {role.shortLabel || role.key}
                            </span>
                          </td>

                          {/* 4. Habilitations (CMS / Mobile) */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.18rem 0.5rem',
                                  borderRadius: '6px',
                                  background: 'rgba(59, 130, 246, 0.08)',
                                  color: 'var(--primary)',
                                  border: '1px solid rgba(59, 130, 246, 0.2)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                title={`${adminCount} autorisations CMS actives sur ${adminPerms.length}`}
                              >
                                {adminCount}/{adminPerms.length} admin
                              </span>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.18rem 0.5rem',
                                  borderRadius: '6px',
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  color: '#10b981',
                                  border: '1px solid rgba(16, 185, 129, 0.2)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                title={`${mobileCount} autorisations Mobile actives sur ${mobilePerms.length}`}
                              >
                                {mobileCount}/{mobilePerms.length} mobile
                              </span>
                            </div>
                          </td>

                          {/* 5. Utilisateurs Rattachés */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {assignedCount > 0 ? (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {assignedUsers.slice(0, 3).map((u, i) => (
                                      <div
                                        key={u.id || i}
                                        style={{
                                          width: '24px',
                                          height: '24px',
                                          borderRadius: '50%',
                                          background: roleColor,
                                          color: '#fff',
                                          fontSize: '0.62rem',
                                          fontWeight: 800,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          marginLeft: i > 0 ? '-6px' : 0,
                                          border: '2px solid var(--bg-card)',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                        title={`${u.prenom} ${u.nom}`}
                                      >
                                        {(u.prenom || 'U')[0]}
                                      </div>
                                    ))}
                                  </div>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>{assignedCount}</strong> {assignedCount > 1 ? 'membres' : 'membre'}
                                    {storeFilter !== 'all' && (
                                      <span style={{ marginLeft: '0.35rem', fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600 }}>
                                        ({getStoreName(storeFilter).split(' (')[0]})
                                      </span>
                                    )}
                                  </span>
                                </>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {storeFilter !== 'all' ? '0 sur ce point' : '0 membre'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Actions */}
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => openViewRole(role)}
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                title="Consulter les détails et habilitations"
                              >
                                <Eye size={13} /> Voir
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => openEditRole(role)}
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                title="Modifier ce rôle et ses habilitations"
                              >
                                <Edit3 size={13} /> Modifier
                              </button>
                              {!role.isSystem ? (
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => handleDeleteRole(role.id)}
                                  style={{ padding: '0.35rem 0.55rem', fontSize: '0.72rem', color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.25)', borderRadius: '8px' }}
                                  title="Supprimer ce rôle"
                                >
                                  <Trash2 size={13} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  disabled
                                  style={{ padding: '0.35rem 0.55rem', fontSize: '0.72rem', opacity: 0.35, cursor: 'not-allowed', borderRadius: '8px' }}
                                  title="Rôle système natif protégé"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
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
              width: '100%',
              maxWidth: '840px',
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
                  <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
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
                <h5 style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                <h5 style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                      value={editStaffStoreId || (storesList[0]?.id || 'all')}
                      onChange={(e) => setEditStaffStoreId(e.target.value)}
                    >
                      <option value="all">Tous les points (Accès Global)</option>
                      {storesList.map(st => (
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
                <h5 style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  3. Authentification par Code PIN
                </h5>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Réinitialisation du code PIN
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Générez un nouveau code PIN sécurisé à 6 chiffres pour cet utilisateur.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.55rem 1rem', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                    onClick={async () => {
                      const targetMember = editingStaffMember || selectedMember;
                      if (!targetMember) return;
                      const newPin = await db.resetStaffPin(targetMember.id);
                      setEditingPin(newPin);
                      alert(`✅ Code PIN réinitialisé pour ${targetMember.prenom} ${targetMember.nom} !\n\nNouveau Code PIN : ${newPin}`);
                      if (refreshAdminData) refreshAdminData();
                    }}
                  >
                    <RefreshCw size={14} /> Régénérer un nouveau PIN
                  </button>
                </div>
              </div>

              {/* SECTION 4 : MATRICE GRANULAIRE DE PERMISSIONS SUR-MESURE */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sliders size={15} color="var(--primary)" />
                  4. Habilitations Sur-Mesure Bi-Plateforme
                </h5>

                {/* Admin CMS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>Habilitations Admin CMS</div>
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
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>Habilitations Application Mobile</div>
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
                <StatefulButton
                  type="submit"
                  variant="primary"
                  state={userSaveSuccess ? 'success' : isSavingUser ? 'loading' : 'idle'}
                  loadingText="Enregistrement..."
                  successText="Profil Enregistré !"
                  style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}
                >
                  <CheckCircle2 size={16} /> Enregistrer le Profil & Permissions
                </StatefulButton>
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
          <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'var(--text-primary)', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25), 0 10px 25px -5px rgba(15, 23, 42, 0.12)', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 600, margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                <StatefulButton type="submit" variant="primary" style={{ padding: '0.6rem 1.25rem', fontWeight: 700 }} loadingText="Création...">Créer le Rôle</StatefulButton>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
         MODALE : CONSULTATION DÉTAILLÉE D'UN RÔLE (VIEW MODAL)
         ========================================================================= */}
      {showViewRoleModal && viewingRole && createPortal(
        <div
          onClick={() => setShowViewRoleModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px', boxSizing: 'border-box'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '880px', maxWidth: '100%', maxHeight: '92vh',
              background: 'var(--bg-card)',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 60px -12px rgba(15,23,42,0.3)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            {/* ── HEADER (style admin standard) ── */}
            {(() => {
              const rc = viewingRole.color || '#2563eb';
              const adminPerms = PERMISSIONS_CONFIG.filter(p => p.category === 'admin');
              const mobilePerms = PERMISSIONS_CONFIG.filter(p => p.category === 'mobile');
              const rolePerms = viewingRole.permissions || {};
              const adminCount = adminPerms.filter(p => !!rolePerms[p.key]).length;
              const mobileCount = mobilePerms.filter(p => !!rolePerms[p.key]).length;
              const assignedCount = staffList.filter(s => s.role === viewingRole.key || s.role === viewingRole.id).length;
              return (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1.1rem 1.5rem',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'var(--bg-app)',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    {/* Color dot + icon */}
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0,
                      background: `${rc}18`,
                      border: `1.5px solid ${rc}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ShieldCheck size={22} color={rc} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                          {viewingRole.label}
                        </h4>
                        <span style={{
                          fontSize: '0.67rem', fontWeight: 700, padding: '0.18rem 0.55rem', borderRadius: '20px',
                          background: viewingRole.isSystem ? 'rgba(37,99,235,0.1)' : 'rgba(139,92,246,0.1)',
                          color: viewingRole.isSystem ? '#2563eb' : '#8b5cf6',
                          border: viewingRole.isSystem ? '1px solid rgba(37,99,235,0.22)' : '1px solid rgba(139,92,246,0.22)'
                        }}>
                          {viewingRole.isSystem ? 'Système Natif' : 'Sur-mesure'}
                        </span>
                        <span style={{
                          fontSize: '0.67rem', fontWeight: 700, padding: '0.18rem 0.55rem', borderRadius: '20px',
                          background: `${rc}12`, color: rc,
                          border: `1px solid ${rc}30`, fontFamily: 'monospace'
                        }}>
                          {viewingRole.shortLabel || viewingRole.key}
                        </span>
                      </div>
                      {/* Stats inline */}
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <ShieldCheck size={11} color="var(--primary)" /> {adminCount}/{adminPerms.length} admin
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Users size={11} color="#10b981" /> {mobileCount}/{mobilePerms.length} mobile
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Users size={11} color="var(--text-muted)" /> {assignedCount} membre(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleSwitchToEdit(viewingRole)}
                      style={{
                        padding: '0.45rem 0.9rem', fontSize: '0.76rem', fontWeight: 700,
                        borderRadius: '10px', border: '1.5px solid var(--primary)',
                        background: 'var(--primary)', color: '#fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem'
                      }}
                    >
                      <Edit3 size={13} /> Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowViewRoleModal(false)}
                      style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        border: '1.5px solid var(--border-color)',
                        background: 'transparent', color: 'var(--text-muted)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── SCROLLABLE BODY ── */}
            <div style={{ overflowY:'auto', flex:1, padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.5rem' }}>

              {/* Permissions — Admin CMS */}
              {(() => {
                const rc = viewingRole.color || '#2563eb';
                const rolePerms = viewingRole.permissions || {};
                const adminPerms = PERMISSIONS_CONFIG.filter(p => p.category === 'admin');
                const mobilePerms = PERMISSIONS_CONFIG.filter(p => p.category === 'mobile');

                const PermSection = ({ perms, accent, label }) => (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.85rem' }}>
                      <span style={{ fontSize:'0.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', color: accent }}>{label}</span>
                      <div style={{ flex:1, height:'1px', background:`linear-gradient(to right, ${accent}40, transparent)` }} />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.55rem' }}>
                      {perms.map(p => {
                        const isActive = !!rolePerms[p.key];
                        const IconC = p.icon;
                        return (
                          <div key={p.key} style={{
                            display:'flex', alignItems:'center', gap:'0.65rem',
                            padding:'0.75rem 1rem',
                            borderRadius:'14px',
                            border: isActive ? `1.5px solid ${p.color}35` : '1.5px solid var(--border-color)',
                            background: isActive ? `${p.color}09` : 'var(--bg-app)',
                            transition:'all 0.2s ease',
                            position:'relative', overflow:'hidden'
                          }}>
                            
                            <div style={{
                              width:'32px', height:'32px', borderRadius:'10px', flexShrink:0,
                              background: isActive ? `${p.color}18` : 'var(--border-color)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color: isActive ? p.color : 'var(--text-muted)'
                            }}>
                              <IconC size={16} />
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:'0.78rem', fontWeight:700, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom:'1px' }}>
                                {p.title}
                              </div>
                              <div style={{ fontSize:'0.66rem', color:'var(--text-muted)', lineHeight:1.3 }}>{p.description}</div>
                            </div>
                            <div style={{
                              width:'20px', height:'20px', borderRadius:'50%', flexShrink:0,
                              background: isActive ? '#16a34a' : 'var(--border-color)',
                              display:'flex', alignItems:'center', justifyContent:'center'
                            }}>
                              {isActive && <Check size={11} color="#fff" strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );

                return (
                  <>
                    <PermSection perms={adminPerms} accent={rc} label="Habilitations Admin CMS" />
                    <PermSection perms={mobilePerms} accent="#10b981" label="Habilitations App Mobile Terrain" />
                  </>
                );
              })()}

              {/* Membres rattachés */}
              {(() => {
                const rc = viewingRole.color || '#2563eb';
                const assignedUsers = staffList.filter(s => {
                  const isRole = s.role === viewingRole.key || s.role === viewingRole.id;
                  if (!isRole) return false;
                  if (storeFilter === 'all') return true;
                  const sStoreId = s.store_id || s.laverie_id || s.store_code || s.laverie;
                  return sStoreId === storeFilter ||
                    storesList.some(st => (st.id === storeFilter && (st.code === sStoreId || st.id === sStoreId)) || (st.code === storeFilter && st.id === sStoreId));
                });
                const allStores = storesList;

                return (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.85rem' }}>
                      <span style={{ fontSize:'0.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-secondary)' }}>
                        Membres Rattachés ({assignedUsers.length}) {storeFilter !== 'all' && `- ${getStoreName(storeFilter)}`}
                      </span>
                      <div style={{ flex:1, height:'1px', background:'linear-gradient(to right, var(--border-color), transparent)' }} />
                    </div>

                    {assignedUsers.length === 0 ? (
                      <div style={{
                        padding:'1.5rem', borderRadius:'16px', textAlign:'center',
                        background:'var(--bg-app)', border:'1.5px dashed var(--border-color)',
                        color:'var(--text-muted)', fontSize:'0.8rem'
                      }}>
                        Aucun membre du personnel n'est encore rattaché à ce rôle.
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                        {assignedUsers.map(u => {
                          const storeObj = allStores.find(st => st.id === u.store_id);
                          return (
                            <div key={u.id} style={{
                              display:'flex', alignItems:'center', gap:'0.5rem',
                              padding:'0.4rem 0.85rem 0.4rem 0.4rem',
                              borderRadius:'24px',
                              background: `${rc}10`,
                              border: `1.5px solid ${rc}28`,
                              fontSize:'0.76rem', fontWeight:600, color:'var(--text-primary)'
                            }}>
                              <div style={{
                                width:'26px', height:'26px', borderRadius:'50%',
                                background: rc, color:'#fff',
                                fontSize:'0.62rem', fontWeight:900,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                boxShadow:`0 0 0 2px ${rc}30`
                              }}>
                                {(u.prenom||'U')[0]}
                              </div>
                              <div>
                                <div style={{ lineHeight:1.2 }}>{u.prenom} {u.nom}</div>
                                {storeObj && <div style={{ fontSize:'0.64rem', color:'var(--text-muted)', fontWeight:500 }}>{storeObj.nom}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ── FOOTER ── */}
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'1rem 1.75rem',
              borderTop:'1px solid var(--border-color)',
              background:'var(--bg-app)', flexShrink:0
            }}>
              <button
                type="button"
                onClick={() => setShowViewRoleModal(false)}
                style={{
                  padding:'0.55rem 1.25rem', fontSize:'0.8rem', fontWeight:600,
                  borderRadius:'12px', border:'1.5px solid var(--border-color)',
                  background:'transparent', color:'var(--text-secondary)', cursor:'pointer'
                }}
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => handleSwitchToEdit(viewingRole)}
                style={{
                  padding:'0.6rem 1.5rem', fontSize:'0.84rem', fontWeight:700,
                  borderRadius:'12px', border:'none',
                  background: viewingRole.color || 'var(--primary)',
                  color:'#fff', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:'0.45rem',
                  boxShadow:`0 4px 16px ${viewingRole.color || '#2563eb'}40`
                }}
              >
                <Edit3 size={15} /> Modifier ce Rôle
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* =========================================================================
         MODALE : MODIFICATION D'UN RÔLE & HABILITATIONS (EDIT MODAL)
         ========================================================================= */}
      {showEditRoleModal && selectedRoleObj && createPortal(
        <div
          onClick={() => { if (!roleSaveSuccess) setShowEditRoleModal(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px', boxSizing: 'border-box'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '940px', maxWidth: '100%', maxHeight: '92vh',
              background: 'var(--bg-card)',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 60px -12px rgba(15,23,42,0.3)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            {/* ── HEADER (style admin standard) ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.1rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-app)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0,
                  background: `${editRoleColor}18`,
                  border: `1.5px solid ${editRoleColor}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ShieldCheck size={22} color={editRoleColor} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                      {editRoleLabel || selectedRoleObj.label}
                    </h4>
                    <span style={{
                      fontSize: '0.67rem', fontWeight: 700, padding: '0.18rem 0.55rem', borderRadius: '20px',
                      background: selectedRoleObj.isSystem ? 'rgba(37,99,235,0.1)' : 'rgba(139,92,246,0.1)',
                      color: selectedRoleObj.isSystem ? '#2563eb' : '#8b5cf6',
                      border: selectedRoleObj.isSystem ? '1px solid rgba(37,99,235,0.22)' : '1px solid rgba(139,92,246,0.22)'
                    }}>
                      {selectedRoleObj.isSystem ? 'Système Natif' : 'Sur-mesure'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    Modifier les propriétés & autorisations du rôle
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditRoleModal(false)}
                style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  border: '1.5px solid var(--border-color)',
                  background: 'transparent', color: 'var(--text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── FORM ── */}
            <form onSubmit={handleRoleSaveSubmit} style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
              <div style={{ overflowY:'auto', flex:1, padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.5rem' }}>

                {/* ── SECTION 1 : Propriétés ── */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
                    <span style={{ fontSize:'0.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-secondary)' }}>
                      1. Propriétés du Rôle
                    </span>
                    <div style={{ flex:1, height:'1px', background:'linear-gradient(to right, var(--border-color), transparent)' }} />
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:'1rem', marginBottom:'1rem' }}>
                    <div className="form-group" style={{ margin:0 }}>
                      <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'0.4rem', display:'block' }}>Nom du Rôle</label>
                      <input
                        type="text"
                        className="input-control"
                        required
                        value={editRoleLabel}
                        onChange={(e) => setEditRoleLabel(e.target.value)}
                        style={{ borderRadius:'12px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin:0 }}>
                      <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'0.4rem', display:'block' }}>Libellé Court (Badge)</label>
                      <input
                        type="text"
                        className="input-control"
                        required
                        value={editRoleShortLabel}
                        onChange={(e) => setEditRoleShortLabel(e.target.value)}
                        style={{ borderRadius:'12px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin:0 }}>
                    <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'0.4rem', display:'block' }}>Description Fonctionnelle</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Ex: Responsable des inventaires textiles et contrôle qualité..."
                      value={editRoleDesc}
                      onChange={(e) => setEditRoleDesc(e.target.value)}
                      style={{ borderRadius:'12px' }}
                    />
                  </div>

                  {/* Color picker — premium swatch strip */}
                  <div style={{ marginTop:'1rem' }}>
                    <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'0.75rem', display:'block' }}>
                      Couleur d'Identité du Rôle
                    </label>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', flexWrap:'wrap' }}>
                      {PRESET_COLORS.map(c => (
                        <div
                          key={c}
                          onClick={() => setEditRoleColor(c)}
                          style={{
                            width:'30px', height:'30px', borderRadius:'50%',
                            background: c, cursor:'pointer',
                            outline: editRoleColor === c ? `3px solid ${c}` : '3px solid transparent',
                            outlineOffset: editRoleColor === c ? '2px' : '0',
                            transform: editRoleColor === c ? 'scale(1.2)' : 'scale(1)',
                            transition:'all 0.18s ease',
                            boxShadow: editRoleColor === c ? `0 4px 14px ${c}60` : '0 2px 6px rgba(0,0,0,0.12)'
                          }}
                        />
                      ))}
                      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                        <input
                          type="color"
                          value={editRoleColor}
                          onChange={(e) => setEditRoleColor(e.target.value)}
                          style={{ width:'30px', height:'30px', borderRadius:'50%', border:'none', cursor:'pointer', padding:0, background:'none' }}
                          title="Couleur personnalisée"
                        />
                      </div>
                      {/* Live preview chip */}
                      <div style={{
                        display:'flex', alignItems:'center', gap:'0.4rem',
                        padding:'0.3rem 0.85rem', borderRadius:'20px',
                        background:`${editRoleColor}18`,
                        border:`1.5px solid ${editRoleColor}40`,
                        fontSize:'0.75rem', fontWeight:700,
                        color: editRoleColor,
                        marginLeft:'auto'
                      }}>
                        <span style={{ width:'10px', height:'10px', borderRadius:'50%', background: editRoleColor, display:'inline-block', boxShadow:`0 0 0 2px ${editRoleColor}30` }} />
                        {editRoleShortLabel || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2 : Habilitations ── */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:'0.5rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <span style={{ fontSize:'0.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-secondary)' }}>
                        2. Accès & Habilitations
                      </span>
                      <div style={{ height:'1px', width:'60px', background:'var(--border-color)' }} />
                    </div>
                    <div style={{ display:'flex', gap:'0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => selectAllPermissionsCategory('admin')}
                        style={{
                          padding:'0.3rem 0.65rem', fontSize:'0.7rem', fontWeight:700, borderRadius:'8px',
                          border:`1px solid ${editRoleColor}35`, background:`${editRoleColor}10`,
                          color: editRoleColor, cursor:'pointer'
                        }}
                      >Admin</button>
                      <button
                        type="button"
                        onClick={() => selectAllPermissionsCategory('mobile')}
                        style={{
                          padding:'0.3rem 0.65rem', fontSize:'0.7rem', fontWeight:700, borderRadius:'8px',
                          border:'1px solid rgba(16,185,129,0.3)', background:'rgba(16,185,129,0.07)',
                          color:'#10b981', cursor:'pointer'
                        }}
                      >Mobile</button>
                      <button
                        type="button"
                        onClick={clearAllRolePermissions}
                        style={{
                          padding:'0.3rem 0.65rem', fontSize:'0.7rem', fontWeight:700, borderRadius:'8px',
                          border:'1px solid rgba(220,38,38,0.25)', background:'rgba(220,38,38,0.05)',
                          color:'var(--danger)', cursor:'pointer'
                        }}
                      >Vider</button>
                    </div>
                  </div>

                  {/* Admin CMS permissions */}
                  <div style={{ marginBottom:'1rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:'0.6rem' }}>
                      <span style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--primary)', background:'rgba(59,130,246,0.08)', padding:'0.25rem 0.6rem', borderRadius:'6px' }}>
                        Admin CMS (Web)
                      </span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                      {PERMISSIONS_CONFIG.filter(p => p.category === 'admin').map(perm => {
                        const isChecked = !!editRolePermissions[perm.key];
                        const IconComp = perm.icon;
                        return (
                          <label
                            key={perm.key}
                            style={{
                              display:'flex', alignItems:'center', gap:'0.7rem',
                              padding:'0.75rem 1rem',
                              borderRadius:'14px',
                              border: isChecked ? `1.5px solid ${editRoleColor}50` : '1.5px solid var(--border-color)',
                              background: isChecked ? `${editRoleColor}09` : 'var(--bg-app)',
                              cursor:'pointer', transition:'all 0.18s ease',
                              position:'relative', overflow:'hidden'
                            }}
                          >
                            
                            {/* Custom toggle */}
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => setEditRolePermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                              style={{ display:'none' }}
                            />
                            <div style={{
                              width:'36px', height:'20px', borderRadius:'10px', flexShrink:0,
                              background: isChecked ? editRoleColor : 'var(--border-color)',
                              position:'relative', transition:'background 0.2s ease',
                              cursor:'pointer'
                            }}>
                              <div style={{
                                position:'absolute', top:'2px',
                                left: isChecked ? '18px' : '2px',
                                width:'16px', height:'16px', borderRadius:'50%',
                                background:'#fff',
                                boxShadow:'0 1px 4px rgba(0,0,0,0.25)',
                                transition:'left 0.2s ease'
                              }} />
                            </div>
                            <div style={{
                              width:'28px', height:'28px', borderRadius:'9px', flexShrink:0,
                              background: isChecked ? `${perm.color}1a` : 'var(--border-color)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color: isChecked ? perm.color : 'var(--text-muted)',
                              transition:'all 0.18s ease'
                            }}>
                              <IconComp size={14} />
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:'0.78rem', fontWeight:700, color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight:1.2 }}>
                                {perm.title}
                              </div>
                              <div style={{ fontSize:'0.66rem', color:'var(--text-muted)', lineHeight:1.3, marginTop:'1px' }}>
                                {perm.description}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile permissions */}
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:'0.6rem' }}>
                      <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#10b981', background:'rgba(16,185,129,0.08)', padding:'0.25rem 0.6rem', borderRadius:'6px' }}>
                        Application Mobile Terrain
                      </span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                      {PERMISSIONS_CONFIG.filter(p => p.category === 'mobile').map(perm => {
                        const isChecked = !!editRolePermissions[perm.key];
                        const IconComp = perm.icon;
                        return (
                          <label
                            key={perm.key}
                            style={{
                              display:'flex', alignItems:'center', gap:'0.7rem',
                              padding:'0.75rem 1rem',
                              borderRadius:'14px',
                              border: isChecked ? '1.5px solid rgba(16,185,129,0.4)' : '1.5px solid var(--border-color)',
                              background: isChecked ? 'rgba(16,185,129,0.07)' : 'var(--bg-app)',
                              cursor:'pointer', transition:'all 0.18s ease',
                              position:'relative', overflow:'hidden'
                            }}
                          >
                            
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => setEditRolePermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                              style={{ display:'none' }}
                            />
                            <div style={{
                              width:'36px', height:'20px', borderRadius:'10px', flexShrink:0,
                              background: isChecked ? '#10b981' : 'var(--border-color)',
                              position:'relative', transition:'background 0.2s ease',
                              cursor:'pointer'
                            }}>
                              <div style={{
                                position:'absolute', top:'2px',
                                left: isChecked ? '18px' : '2px',
                                width:'16px', height:'16px', borderRadius:'50%',
                                background:'#fff',
                                boxShadow:'0 1px 4px rgba(0,0,0,0.25)',
                                transition:'left 0.2s ease'
                              }} />
                            </div>
                            <div style={{
                              width:'28px', height:'28px', borderRadius:'9px', flexShrink:0,
                              background: isChecked ? `${perm.color}1a` : 'var(--border-color)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color: isChecked ? perm.color : 'var(--text-muted)',
                              transition:'all 0.18s ease'
                            }}>
                              <IconComp size={14} />
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:'0.78rem', fontWeight:700, color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight:1.2 }}>
                                {perm.title}
                              </div>
                              <div style={{ fontSize:'0.66rem', color:'var(--text-muted)', lineHeight:1.3, marginTop:'1px' }}>
                                {perm.description}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── SECTION 3 : Membres ── */}
                {(() => {
                  const attachedUsers = staffList.filter(s => s.role === selectedRoleObj.key || s.role === selectedRoleObj.id);
                  if (attachedUsers.length === 0) return null;
                  return (
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
                        <span style={{ fontSize:'0.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-secondary)' }}>
                          3. Membres Rattachés ({attachedUsers.length})
                        </span>
                        <div style={{ flex:1, height:'1px', background:'linear-gradient(to right, var(--border-color), transparent)' }} />
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.45rem' }}>
                        {attachedUsers.map(u => (
                          <div
                            key={u.id}
                            style={{
                              display:'flex', alignItems:'center', gap:'0.4rem',
                              padding:'0.3rem 0.65rem 0.3rem 0.3rem',
                              borderRadius:'24px',
                              background:`${editRoleColor}12`,
                              border:`1.5px solid ${editRoleColor}28`,
                              fontSize:'0.74rem', fontWeight:600, color:'var(--text-primary)'
                            }}
                          >
                            <div style={{
                              width:'22px', height:'22px', borderRadius:'50%',
                              background: editRoleColor, color:'#fff',
                              fontSize:'0.62rem', fontWeight:800,
                              display:'flex', alignItems:'center', justifyContent:'center'
                            }}>
                              {(u.prenom||'U')[0]}
                            </div>
                            {u.prenom} {u.nom}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── FOOTER ── */}
              <div style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'1rem 1.75rem',
                borderTop:'1px solid var(--border-color)',
                background:'var(--bg-app)', flexShrink:0
              }}>
                <div>
                  {!selectedRoleObj.isSystem && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(selectedRoleObj.id)}
                      style={{
                        padding:'0.55rem 1rem', fontSize:'0.78rem', fontWeight:700, borderRadius:'12px',
                        border:'1.5px solid rgba(220,38,38,0.28)', background:'rgba(220,38,38,0.05)',
                        color:'var(--danger)', cursor:'pointer',
                        display:'flex', alignItems:'center', gap:'0.4rem'
                      }}
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  )}
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  {roleSaveSuccess && (
                    <span style={{ fontSize:'0.78rem', color:'var(--success)', fontWeight:700, display:'flex', alignItems:'center', gap:'0.3rem' }}>
                      <Check size={15} /> Enregistré !
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowEditRoleModal(false)}
                    style={{
                      padding:'0.55rem 1.2rem', fontSize:'0.8rem', fontWeight:600, borderRadius:'12px',
                      border:'1.5px solid var(--border-color)', background:'transparent',
                      color:'var(--text-secondary)', cursor:'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding:'0.6rem 1.5rem', fontSize:'0.84rem', fontWeight:700, borderRadius:'12px',
                      border:'none',
                      background: editRoleColor,
                      color:'#fff', cursor:'pointer',
                      display:'flex', alignItems:'center', gap:'0.45rem',
                      boxShadow:`0 4px 16px ${editRoleColor}40`
                    }}
                  >
                    <CheckCircle2 size={15} /> Enregistrer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
