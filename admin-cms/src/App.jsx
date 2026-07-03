import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import AdminView from './components/AdminView';
import logoDark from './assets/logo_dark.png';
import logoGold from './assets/logo_gold.png';
// Composant utilitaire pour les icônes Google Material Symbols
const MIcon = ({ name, size = 20, style = {}, className = '', filled = false }) => (
  <span
    className={`material-symbols-rounded${className ? ' ' + className : ''}`}
    style={{
      fontSize: size,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      userSelect: 'none',
      ...style
    }}
  >
    {name}
  </span>
);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [adminMenu, setAdminMenu] = useState('dashboard'); // dashboard, catalog, logs
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Authentication states
  const [selectedLoginUser, setSelectedLoginUser] = useState(null);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [customDialog, setCustomDialog] = useState(null); // { message, title, type, isConfirm, resolve }

  // Notifications states & helper functions
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [dbTick, setDbTick] = useState(0);
  const [dbIsRemote, setDbIsRemote] = useState(() => db.isRemote());
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('klin_up_read_notif_ids')) || [];
    } catch (e) {
      return [];
    }
  });

  // Unified notifications stream
  const notifications = (() => {
    const list = [];
    
    // 1. PIN reset requests
    const pinReqs = db.getPinResetRequests();
    pinReqs.forEach(req => {
      list.push({
        id: `pin_${req.id}`,
        type: 'pin_reset',
        action: 'DEMANDE_RESET_PIN',
        title: req.status === 'pending' ? 'Demande de reset PIN (En attente)' : `Demande de reset PIN (${req.status === 'approved' ? 'Approuvée' : 'Rejetée'})`,
        message: `L'employé avec l'email ${req.email} a demandé la réinitialisation de son code PIN.`,
        timestamp: req.created_at,
        raw: req
      });
    });

    // 2. Important logs from activity logs
    const logs = db.getLogs();
    const importantActions = ['MISE_A_JOUR_STATUT', 'CREATION_COMMANDE', 'ANNULATION_COMMANDE', 'RÈGLEMENT_DETTE'];
    logs.forEach(log => {
      if (importantActions.includes(log.action)) {
        let friendlyTitle = 'Notification';
        if (log.action === 'MISE_A_JOUR_STATUT') friendlyTitle = 'Statut de Commande Mis à Jour';
        else if (log.action === 'CREATION_COMMANDE') friendlyTitle = 'Nouvelle Commande';
        else if (log.action === 'ANNULATION_COMMANDE') friendlyTitle = 'Commande Annulée';
        else if (log.action === 'RÈGLEMENT_DETTE') friendlyTitle = 'Règlement de Dette';

        list.push({
          id: `log_${log.id}`,
          type: 'log_event',
          action: log.action,
          title: friendlyTitle,
          message: log.details,
          timestamp: log.timestamp,
          raw: log
        });
      }
    });

    // Sort by timestamp desc and limit to 25 items
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 25);
  })();

  const unreadCount = notifications.filter(n => !readNotifIds.includes(n.id)).length;

  const handleToggleNotifDropdown = () => {
    const nextShow = !showNotifDropdown;
    setShowNotifDropdown(nextShow);
    if (nextShow) {
      // Mark all current notifications as read
      const allIds = notifications.map(n => n.id);
      const updated = Array.from(new Set([...readNotifIds, ...allIds]));
      setReadNotifIds(updated);
      localStorage.setItem('klin_up_read_notif_ids', JSON.stringify(updated));
    }
  };

  const handleApprovePin = (reqId) => {
    const result = db.approvePinResetRequest(reqId);
    if (result) {
      alert(`PIN réinitialisé avec succès ! Nouveau PIN : ${result.newPin}. Un email de confirmation a été envoyé à ${result.staffMember.email}`);
      setDbTick(prev => prev + 1);
    }
  };

  const handleRejectPin = (reqId) => {
    db.rejectPinResetRequest(reqId);
    alert("Demande de réinitialisation de PIN rejetée.");
    setDbTick(prev => prev + 1);
  };

  const getNotifIconConfig = (action) => {
    switch (action) {
      case 'DEMANDE_RESET_PIN':
        return { name: 'lock_reset', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'MISE_A_JOUR_STATUT':
        return { name: 'sync_alt', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      case 'CREATION_COMMANDE':
        return { name: 'assignment_add', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' };
      case 'ANNULATION_COMMANDE':
        return { name: 'cancel', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' };
      case 'RÈGLEMENT_DETTE':
        return { name: 'payments', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)' };
      default:
        return { name: 'notifications', color: 'var(--text-secondary)', bg: 'rgba(0,0,0,0.05)' };
    }
  };

  const formatNotifDate = (isoStr) => {
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

    window.alert = (message) => {
      const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);
      return new Promise((resolve) => {
        const isError = msgStr.toLowerCase().includes('erreur') || 
                        msgStr.toLowerCase().includes('impossible') || 
                        msgStr.toLowerCase().includes('invalide') || 
                        msgStr.toLowerCase().includes('suspendu') ||
                        msgStr.toLowerCase().includes('insuffisant') ||
                        msgStr.toLowerCase().includes('incorrect');
        const isSuccess = msgStr.toLowerCase().includes('succès') || 
                          msgStr.toLowerCase().includes('enregistré') || 
                          msgStr.toLowerCase().includes('mis à jour') || 
                          msgStr.toLowerCase().includes('réinitialisé') || 
                          msgStr.toLowerCase().includes('synchronisés') ||
                          msgStr.toLowerCase().includes('démarré');
        
        setCustomDialog({
          message: msgStr,
          title: isError ? 'Erreur' : isSuccess ? 'Succès' : 'Information',
          type: isError ? 'error' : isSuccess ? 'success' : 'info',
          isConfirm: false,
          resolve
        });
      });
    };

    window.confirm = (message) => {
      const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);
      return new Promise((resolve) => {
        setCustomDialog({
          message: msgStr,
          title: 'Confirmation',
          type: 'confirm',
          isConfirm: true,
          resolve
        });
      });
    };

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, []);

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    setStaffList(db.getStaff());
    setDbIsRemote(db.isRemote());

    const unsubscribe = db.subscribe(() => {
      setCurrentUser(db.getCurrentUser());
      setStaffList(db.getStaff());
      setDbTick(prev => prev + 1);
      setDbIsRemote(db.isRemote());
    });
    return () => unsubscribe();
  }, []);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!loginEmail) return;
    
    const matchedUser = db.getStaff().find(s => s.email && s.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (matchedUser) {
      if (matchedUser.statut === 'suspendu') {
        alert("Votre compte a été suspendu par un administrateur.");
        return;
      }
      setSelectedLoginUser(matchedUser);
      setPinCode('');
    } else {
      alert("Aucun employé trouvé avec cette adresse email.");
    }
  };

  const handleRequestPinResetSubmit = (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    db.createPinResetRequest(resetEmail.trim());
    alert(`Demande de réinitialisation envoyée pour ${resetEmail} ! Veuillez demander à un administrateur d'approuver votre demande.`);
    setShowResetPinModal(false);
    setResetEmail('');
  };

  const handleKeypadPress = (val) => {
    if (pinError || isUnlocking) return;
    
    if (val === 'delete') {
      setPinCode(prev => prev.slice(0, -1));
      return;
    }
    
    if (pinCode.length >= 6) return;
    
    const newCode = pinCode + val;
    setPinCode(newCode);
    
    if (newCode.length === 6) {
      if (selectedLoginUser.code_pin === newCode) {
        setIsUnlocking(true);
        setTimeout(() => {
          db.setCurrentUser(selectedLoginUser);
          setSelectedLoginUser(null);
          setPinCode('');
          setIsUnlocking(false);
        }, 300);
      } else {
        setPinError(true);
        setTimeout(() => {
          setPinCode('');
          setPinError(false);
        }, 800);
      }
    }
  };

  useEffect(() => {
    if (!selectedLoginUser) return;
    
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeypadPress('delete');
      } else if (e.key === 'Escape') {
        setSelectedLoginUser(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLoginUser, pinCode, pinError, isUnlocking]);

  if (!dbIsRemote) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-app, #f8fafc)',
        fontFamily: 'var(--font-main, sans-serif)',
        padding: '2rem'
      }}>
        <div className="card" style={{
          maxWidth: '420px',
          width: '100%',
          padding: '2.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          border: '1px solid var(--border-color, #e2e8f0)'
        }}>
          <div style={{
            fontSize: '3rem',
            lineHeight: 1
          }}>🔌</div>
          <h2 style={{
            color: '#ef4444',
            margin: 0,
            fontSize: '1.3rem',
            fontWeight: 800,
            fontFamily: 'var(--font-title, sans-serif)'
          }}>Erreur de connexion</h2>
          <p style={{
            color: 'var(--text-secondary, #64748b)',
            fontSize: '0.88rem',
            lineHeight: 1.5,
            margin: 0
          }}>
            Impossible de communiquer avec la base de données Supabase. L'administration requiert une connexion internet active pour fonctionner.
          </p>
          <button
            type="button"
            onClick={async () => {
              alert("Tentative de reconnexion...");
              const res = await db.testConnection();
              if (res.success) {
                alert("Succès ! Connexion établie avec le cloud Supabase. L'administration est maintenant en ligne !");
                setDbIsRemote(true);
              } else {
                alert("Échec de connexion : " + res.error);
              }
            }}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <MIcon name="sync" size={16} />
            Réessayer
          </button>

        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="lockscreen-container">
        <div className="lockscreen-logo-area" style={{ textAlign: 'center', marginBottom: '0.4rem' }}>
          <img 
            src={logoGold} 
            alt="KLIN UP Logo" 
            style={{ width: '220px', objectFit: 'contain', display: 'block', margin: '0 auto 0.75rem' }} 
          />
          <p className="lockscreen-subtitle" style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Plateforme Laverie Admin CMS
          </p>
        </div>

        {!selectedLoginUser ? (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '320px', animation: 'fadeIn 0.3s ease-out forwards' }}>
            <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textAlign: 'center', marginBottom: '0.5rem' }}>
              Connexion Administration
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input 
                type="email"
                required
                placeholder="Email de l'administrateur"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.95rem 1.25rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
              />
            </div>

            <button 
              type="submit"
              className="btn"
              style={{
                background: '#ffffff',
                color: '#1a1a5e',
                padding: '0.95rem',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              Continuer
            </button>

            <button
              type="button"
              onClick={() => setShowResetPinModal(true)}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '0.5rem',
                textAlign: 'center',
                transition: 'color 0.2s ease'
              }}
            >
              Réinitialiser le PIN
            </button>
          </form>
        ) : (
          <div className="pin-view-container" style={{ maxWidth: '320px' }}>
            <button 
              type="button" 
              className="pin-view-back"
              onClick={() => setSelectedLoginUser(null)}
            >
              ← Retour
            </button>

            <div 
              className="pin-user-avatar" 
              style={{ 
                background: selectedLoginUser.role === 'super_admin' ? 'hsl(224, 76%, 48%)' : selectedLoginUser.role === 'manager' ? 'hsl(271, 76%, 53%)' : 'hsl(162, 76%, 38%)' 
              }}
            >
              {selectedLoginUser.prenom[0]}{selectedLoginUser.nom[0]}
            </div>
            <h3 className="pin-user-name">{selectedLoginUser.prenom} {selectedLoginUser.nom}</h3>
            <p className="pin-user-role">{selectedLoginUser.role === 'super_admin' ? 'Super Administrateur' : selectedLoginUser.role === 'manager' ? 'Gestionnaire' : "Agent d'accueil"}</p>

            <div className={`pin-dots-row ${pinError ? 'shake' : ''}`}>
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div 
                  key={idx} 
                  className={`pin-dot ${pinCode.length > idx ? 'filled' : ''} ${pinError ? 'error' : ''}`}
                />
              ))}
            </div>

            <div className="keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num} 
                  type="button" 
                  className="keypad-btn"
                  onClick={() => handleKeypadPress(num.toString())}
                >
                  {num}
                </button>
              ))}
              <button 
                type="button" 
                className="keypad-btn action-btn"
                onClick={() => setSelectedLoginUser(null)}
              >
                Annuler
              </button>
              <button 
                type="button" 
                className="keypad-btn"
                onClick={() => handleKeypadPress('0')}
              >
                0
              </button>
              <button 
                type="button" 
                className="keypad-btn action-btn"
                style={{ fontSize: '0.85rem' }}
                onClick={() => handleKeypadPress('delete')}
              >
                Effacer
              </button>
            </div>
          </div>
        )}

        {showResetPinModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div className="card" style={{ width: '360px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>Réinitialiser le PIN</h3>
                <button type="button" onClick={() => setShowResetPinModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <MIcon name="close" size={20} />
                </button>
              </div>
              
              <form onSubmit={handleRequestPinResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Saisissez votre email professionnel. Une demande de réinitialisation sera envoyée à l'administrateur pour approbation.
                </p>
                <input 
                  type="email"
                  required
                  placeholder="votre.email@klinup.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowResetPinModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary">Envoyer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const hasAdminAccess = currentUser.role === 'super_admin' || currentUser.role === 'manager';
  const isSuperAdmin = currentUser.role === 'super_admin';

  return (
    <div className="app-container">
      
      {/* ================= SIDEBAR DESKTOP ================= */}
      {hasAdminAccess && (
        <aside className="sidebar">
          <div>
            <div className="sidebar-logo" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '0', 
              marginTop: '1.25rem', 
              marginBottom: '1.25rem' 
            }}>
              <img 
                src={logoDark} 
                alt="KLIN UP Logo" 
                style={{ width: '100%', maxWidth: '130px', height: 'auto', objectFit: 'contain', display: 'block' }} 
              />
            </div>
            
            <div className="menu-section-title">MENU</div>
            <ul className="menu-list">
              <li 
                className={`menu-item ${adminMenu === 'dashboard' ? 'active' : ''}`}
                onClick={() => setAdminMenu('dashboard')}
              >
                <MIcon name="dashboard" size={20} />
                Vue d'Ensemble
              </li>
              <li 
                className={`menu-item ${adminMenu === 'orders_management' ? 'active' : ''}`}
                onClick={() => setAdminMenu('orders_management')}
              >
                <MIcon name="shopping_bag" size={20} />
                Gestion Commandes
              </li>
              <li 
                className={`menu-item ${adminMenu === 'crm_management' ? 'active' : ''}`}
                onClick={() => setAdminMenu('crm_management')}
              >
                <MIcon name="group" size={20} />
                Clients CRM
              </li>
              <li 
                className={`menu-item ${adminMenu === 'catalog' ? 'active' : ''}`}
                onClick={() => setAdminMenu('catalog')}
              >
                <MIcon name="price_change" size={20} />
                Catalogue Tarifs
              </li>
              {isSuperAdmin && (
                <>
                  <li 
                    className={`menu-item ${adminMenu === 'staff_management' ? 'active' : ''}`}
                    onClick={() => setAdminMenu('staff_management')}
                  >
                    <MIcon name="admin_panel_settings" size={20} />
                    Gestion des Accès
                  </li>
                  <li 
                    className={`menu-item ${adminMenu === 'logs' ? 'active' : ''}`}
                    onClick={() => setAdminMenu('logs')}
                  >
                    <MIcon name="history" size={20} />
                    Journal d'Audit
                  </li>
                </>
              )}
            </ul>

            <div className="menu-section-title">GÉNÉRAL</div>
            <ul className="menu-list">
              <li 
                className={`menu-item ${adminMenu === 'settings' ? 'active' : ''}`}
                onClick={() => setAdminMenu('settings')}
              >
                <MIcon name="settings" size={20} />
                Paramètres
              </li>
              <li className="menu-item" onClick={() => alert('Support / Aide en ligne')}>
                <MIcon name="help" size={20} />
                Aide
              </li>
              <li className="menu-item" onClick={() => setShowLogoutConfirm(true)}>
                <MIcon name="logout" size={20} />
                Déconnexion
              </li>
            </ul>
          </div>

        </aside>
      )}

      {/* ================= CONTENU PRINCIPAL DESKTOP ================= */}
      <main className="main-content">
        
        {/* Topbar Donezo Style */}
        <div className="topbar">
          <div className="page-title">
            <h1>
              {!hasAdminAccess && "Accès non autorisé"}
              {hasAdminAccess && adminMenu === 'dashboard' && "Tableau de Bord"}
              {hasAdminAccess && adminMenu === 'orders_management' && "Gestion des Commandes"}
              {hasAdminAccess && adminMenu === 'crm_management' && "Clients CRM"}
              {hasAdminAccess && adminMenu === 'catalog' && "Catalogue Tarifs"}
              {hasAdminAccess && adminMenu === 'staff_management' && "Gestion des Accès"}
              {hasAdminAccess && adminMenu === 'logs' && "Journal d'Audit"}
              {hasAdminAccess && adminMenu === 'settings' && "Paramètres Système"}
            </h1>
            <p style={{ marginTop: '0.15rem' }}>
              {!hasAdminAccess && "Cet espace est restreint aux administrateurs."}
              {hasAdminAccess && adminMenu === 'dashboard' && "Suivi des indicateurs clés et productivité de la laverie."}
              {hasAdminAccess && adminMenu === 'orders_management' && "Enregistrement, suivi d'atelier et facturation des commandes."}
              {hasAdminAccess && adminMenu === 'crm_management' && "Fiches clients, encours financiers et fidélité."}
              {hasAdminAccess && adminMenu === 'catalog' && "Gestion de la grille de prix de traitement de laverie B2B."}
              {hasAdminAccess && adminMenu === 'staff_management' && "Habilitations du personnel, gestion des rôles et autorisations d'accès."}
              {hasAdminAccess && adminMenu === 'logs' && "Traçabilité des actions et sécurité des transactions."}
              {hasAdminAccess && adminMenu === 'settings' && "Configuration globale des délais et majorations d'urgence de la laverie."}
            </p>
          </div>

          {hasAdminAccess && (
            <div className="topbar-actions">
              {/* Recherche pill avec badge raccourci */}
              <div className="search-pill-wrapper">
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MIcon name="search" size={18} className="search-pill-icon" />
              </div>

              {/* Raccourcis Icônes */}
              <div style={{ position: 'relative' }}>
                <div 
                  className="topbar-icon-btn" 
                  title="Notifications" 
                  onClick={handleToggleNotifDropdown}
                  style={{ borderColor: showNotifDropdown ? 'var(--primary)' : 'var(--border-color)', position: 'relative' }}
                >
                  <MIcon name="notifications" size={18} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      background: 'var(--accent)',
                      color: 'white',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid var(--bg-card)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </div>

                {showNotifDropdown && (
                  <>
                    <div 
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1099 }} 
                      onClick={() => setShowNotifDropdown(false)}
                    />
                    <div style={{ 
                      position: 'absolute', 
                      top: '45px', 
                      right: 0, 
                      width: '340px', 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
                      zIndex: 1100, 
                      display: 'flex', 
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-app)' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>Notifications</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {notifications.length} au total
                        </span>
                      </div>

                      <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {notifications.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                            <MIcon name="notifications_off" size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }} />
                            Aucune notification importante pour le moment.
                          </div>
                        ) : (
                          notifications.map(n => {
                            const config = getNotifIconConfig(n.action);
                            const isUnread = !readNotifIds.includes(n.id);
                            return (
                              <div 
                                key={n.id} 
                                style={{ 
                                  padding: '0.75rem 1rem', 
                                  borderBottom: '1px solid var(--border-color)', 
                                  display: 'flex', 
                                  gap: '0.75rem',
                                  background: isUnread ? 'rgba(var(--primary-rgb), 0.03)' : 'transparent',
                                  transition: 'background 0.2s ease',
                                  textAlign: 'left'
                                }}
                              >
                                <div style={{ 
                                  width: '32px', 
                                  height: '32px', 
                                  borderRadius: '8px', 
                                  background: config.bg, 
                                  color: config.color, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <MIcon name={config.name} size={18} />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)' }}>{n.title}</span>
                                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatNotifDate(n.timestamp)}</span>
                                  </div>
                                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.25' }}>{n.message}</p>
                                  
                                  {/* Direct Actions inside Dropdown for PIN reset requests */}
                                  {n.action === 'DEMANDE_RESET_PIN' && n.raw.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                                      <button 
                                        onClick={() => handleApprovePin(n.raw.id)}
                                        className="btn btn-primary"
                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderRadius: '6px', flex: 1, height: 'auto', minHeight: 'unset' }}
                                      >
                                        Approuver
                                      </button>
                                      <button 
                                        onClick={() => handleRejectPin(n.raw.id)}
                                        className="btn btn-outline"
                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderRadius: '6px', flex: 1, borderColor: '#ef4444', color: '#ef4444', height: 'auto', minHeight: 'unset' }}
                                      >
                                        Rejeter
                                      </button>
                                    </div>
                                  )}

                                  {n.action === 'DEMANDE_RESET_PIN' && n.raw.status !== 'pending' && (
                                    <div style={{ 
                                      fontSize: '0.68rem', 
                                      marginTop: '0.25rem', 
                                      fontWeight: 600, 
                                      color: n.raw.status === 'approved' ? '#10b981' : '#ef4444',
                                      background: n.raw.status === 'approved' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                      padding: '0.2rem 0.4rem',
                                      borderRadius: '4px',
                                      display: 'inline-block',
                                      alignSelf: 'flex-start'
                                    }}>
                                      {n.raw.status === 'approved' ? `Approuvée (Nouveau PIN: ${n.raw.resolved_pin})` : 'Rejetée'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Status de la Base de Données */}
              <span 
                title={db.isRemote() ? "Connecté à Supabase Cloud" : "Mode Local / Hors-ligne (Supabase déconnecté)"}
                style={{ 
                  fontSize: '0.68rem', 
                  fontWeight: 800, 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '6px', 
                  background: db.isRemote() ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                  color: db.isRemote() ? '#10b981' : '#d97706',
                  border: db.isRemote() ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: db.isRemote() ? '#10b981' : '#f59e0b', display: 'inline-block' }} />
                {db.isRemote() ? 'Supabase' : 'Local'}
              </span>

              {/* Profil Utilisateur Donezo Header Style */}
              <div className="topbar-profile">
                <div className="topbar-profile-avatar">
                  <div className="user-avatar" style={{ margin: 0, width: '36px', height: '36px', fontSize: '0.8rem' }}>
                    {currentUser.prenom.charAt(0)}{currentUser.nom.charAt(0)}
                  </div>
                </div>
                <div className="topbar-profile-info">
                  <span className="topbar-profile-name">{currentUser.prenom} {currentUser.nom}</span>
                  <span className="topbar-profile-email">
                    {currentUser.email || `${currentUser.prenom.toLowerCase()}.${currentUser.nom.toLowerCase()}@klinup.com`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Condition d'affichage RBAC */}
        {!hasAdminAccess ? (
          <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: '480px', padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{ background: 'var(--status-late-light)', padding: '1rem', borderRadius: '50%', color: 'var(--status-late)' }}>
                <MIcon name="gpp_bad" size={48} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 700 }}>Espace Réservé</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Désolé <strong>{currentUser.prenom} {currentUser.nom}</strong>, votre rôle <strong>{currentUser.role}</strong> ne vous autorise pas à accéder au CMS Administrateur.<br />
                Veuillez utiliser l'application de terrain sur le port <strong>5174</strong>.
              </p>
              <button 
                className="btn btn-outline" 
                style={{ marginTop: '1rem', width: '100%' }}
                onClick={() => db.setCurrentUser(null)}
              >
                Changer de compte
              </button>
            </div>
          </div>
        ) : (
          <AdminView activeTab={adminMenu} searchQuery={searchQuery} />
        )}

      </main>

      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card" style={{ width: '360px', padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-primary)' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 700 }}>Confirmer la déconnexion</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Êtes-vous sûr de vouloir vous déconnecter de la plateforme Admin CMS ?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setShowLogoutConfirm(false)}>Annuler</button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--accent)' }} onClick={() => {
                db.setCurrentUser(null);
                setShowLogoutConfirm(false);
              }}>Déconnexion</button>
            </div>
          </div>
        </div>
      )}

      {customDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '380px',
            background: 'var(--bg-card)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-card)',
            animation: 'scaleIn 0.2s ease-out',
            color: 'var(--text-primary)',
            transform: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {customDialog.type === 'success' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--success-light)', color: 'var(--success)', padding: '0.4rem', borderRadius: '50%' }}>
                  <MIcon name="check_circle" size={22} filled />
                </div>
              )}
              {customDialog.type === 'error' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.4rem', borderRadius: '50%' }}>
                  <MIcon name="error" size={22} filled />
                </div>
              )}
              {customDialog.type === 'info' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem', borderRadius: '50%' }}>
                  <MIcon name="info" size={22} filled />
                </div>
              )}
              {customDialog.type === 'confirm' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warning-light)', color: 'var(--warning)', padding: '0.4rem', borderRadius: '50%' }}>
                  <MIcon name="help" size={22} filled />
                </div>
              )}
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0 }}>
                {customDialog.title}
              </h3>
            </div>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {customDialog.message}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {customDialog.isConfirm ? (
                <>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '0.55rem 1rem', borderRadius: '12px', fontSize: '0.85rem' }}
                    onClick={() => {
                      customDialog.resolve(false);
                      setCustomDialog(null);
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      padding: '0.55rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      background: customDialog.message.toLowerCase().includes('supprimer') || customDialog.message.toLowerCase().includes('résilier') || customDialog.message.toLowerCase().includes('annuler') || customDialog.message.toLowerCase().includes('rejeter') ? 'var(--danger)' : 'var(--primary)'
                    }}
                    onClick={() => {
                      customDialog.resolve(true);
                      setCustomDialog(null);
                    }}
                  >
                    Confirmer
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.55rem 1rem', borderRadius: '12px', fontSize: '0.85rem' }}
                  onClick={() => {
                    customDialog.resolve();
                    setCustomDialog(null);
                  }}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
