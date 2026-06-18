import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import AdminView from './components/AdminView';
import { 
  Sun, 
  Moon, 
  ShieldAlert, 
  ShieldCheck,
  LayoutDashboard, 
  ListFilter, 
  History, 
  ShieldX,
  Search,
  Bell,
  Mail,
  HelpCircle,
  Settings,
  ShoppingBag,
  Users,
  Lock,
  LogOut,
  X
} from 'lucide-react';

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

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    setStaffList(db.getStaff());

    const unsubscribe = db.subscribe(() => {
      setCurrentUser(db.getCurrentUser());
      setStaffList(db.getStaff());
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

  if (!currentUser) {
    return (
      <div className="lockscreen-container">
        <div className="lockscreen-logo-area">
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1rem', borderRadius: '20px', display: 'inline-flex', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Lock size={36} color="#ffffff" strokeWidth={1.5} />
          </div>
          <h2 className="lockscreen-title">KLIN UP</h2>
          <p className="lockscreen-subtitle">Plateforme Laverie Admin CMS</p>
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
                  <X size={20} />
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
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                </svg>
              </div>
              <div className="sidebar-logo-text">Klin UP</div>
            </div>
            
            <div className="menu-section-title">MENU</div>
            <ul className="menu-list">
              <li 
                className={`menu-item ${adminMenu === 'dashboard' ? 'active' : ''}`}
                onClick={() => setAdminMenu('dashboard')}
              >
                <LayoutDashboard size={18} />
                Vue d'Ensemble
              </li>
              <li 
                className={`menu-item ${adminMenu === 'orders_management' ? 'active' : ''}`}
                onClick={() => setAdminMenu('orders_management')}
              >
                <ShoppingBag size={18} />
                Gestion Commandes
              </li>
              <li 
                className={`menu-item ${adminMenu === 'crm_management' ? 'active' : ''}`}
                onClick={() => setAdminMenu('crm_management')}
              >
                <Users size={18} />
                Clients CRM
              </li>
              <li 
                className={`menu-item ${adminMenu === 'catalog' ? 'active' : ''}`}
                onClick={() => setAdminMenu('catalog')}
              >
                <ListFilter size={18} />
                Catalogue Tarifs
              </li>
              {isSuperAdmin && (
                <>
                  <li 
                    className={`menu-item ${adminMenu === 'staff_management' ? 'active' : ''}`}
                    onClick={() => setAdminMenu('staff_management')}
                  >
                    <ShieldCheck size={18} />
                    Gestion des Accès
                  </li>
                  <li 
                    className={`menu-item ${adminMenu === 'logs' ? 'active' : ''}`}
                    onClick={() => setAdminMenu('logs')}
                  >
                    <History size={18} />
                    Journal d'Audit
                  </li>
                </>
              )}
            </ul>

            <div className="menu-section-title">GÉNÉRAL</div>
            <ul className="menu-list">
              <li className="menu-item" onClick={() => alert('Configuration système Klin UP')}>
                <Settings size={18} />
                Paramètres
              </li>
              <li className="menu-item" onClick={() => alert('Support / Aide en ligne')}>
                <HelpCircle size={18} />
                Aide
              </li>
              <li className="menu-item" onClick={() => setShowLogoutConfirm(true)}>
                <LogOut size={18} />
                Déconnexion
              </li>
            </ul>
          </div>

          <div>
            {/* Promo Card Mobile App */}
            <div className="sidebar-promo-card">
              <h4>Caisse & Atelier Terrain</h4>
              <p>Ouvrir l'application sur le port 5174.</p>
              <button 
                className="sidebar-promo-btn" 
                onClick={() => window.open('http://localhost:5174/', '_blank')}
              >
                Lancer l'App
              </button>
            </div>
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
            </h1>
            <p style={{ marginTop: '0.15rem' }}>
              {!hasAdminAccess && "Cet espace est restreint aux administrateurs."}
              {hasAdminAccess && adminMenu === 'dashboard' && "Suivi des indicateurs clés et productivité de la laverie."}
              {hasAdminAccess && adminMenu === 'orders_management' && "Enregistrement, suivi d'atelier et facturation des commandes."}
              {hasAdminAccess && adminMenu === 'crm_management' && "Fiches clients, encours financiers et fidélité."}
              {hasAdminAccess && adminMenu === 'catalog' && "Gestion de la grille de prix de traitement de laverie B2B."}
              {hasAdminAccess && adminMenu === 'staff_management' && "Habilitations du personnel, gestion des rôles et autorisations d'accès."}
              {hasAdminAccess && adminMenu === 'logs' && "Traçabilité des actions et sécurité des transactions."}
            </p>
          </div>

          {hasAdminAccess && (
            <div className="topbar-actions">
              {/* Recherche pill avec badge raccourci */}
              <div className="search-pill-wrapper">
                <Search size={16} className="search-pill-icon" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="search-shortcut-badge">⌘ F</span>
              </div>

              {/* Raccourcis Icônes */}
              <div className="topbar-icon-btn" title="Messages" onClick={() => alert('Boîte de réception vide.')}>
                <Mail size={16} />
              </div>
              
              <div className="topbar-icon-btn" title="Notifications" onClick={() => alert('Aucune nouvelle notification.')}>
                <Bell size={16} />
              </div>


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
                <ShieldX size={48} />
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

    </div>
  );
}

export default App;
