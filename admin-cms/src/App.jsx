import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import AdminView from './components/AdminView';
import { 
  Sun, 
  Moon, 
  ShieldAlert, 
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
  Users
} from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [adminMenu, setAdminMenu] = useState('dashboard'); // dashboard, catalog, logs
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Initialise theme
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(systemPrefersDark);
    if (systemPrefersDark) {
      document.body.classList.add('dark-mode');
    }

    // Initialise DB user and staff
    const user = db.getCurrentUser();
    setCurrentUser(user);
    setStaffList(db.getStaff());
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const handleUserRoleChange = (userId) => {
    const targetUser = staffList.find(s => s.id === userId);
    if (targetUser) {
      db.setCurrentUser(targetUser);
      setCurrentUser(targetUser);
      setAdminMenu('dashboard');
    }
  };

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div className="card" style={{ width: '320px', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', marginBottom: '1.5rem' }}>Chargement...</h2>
        </div>
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
                <li 
                  className={`menu-item ${adminMenu === 'logs' ? 'active' : ''}`}
                  onClick={() => setAdminMenu('logs')}
                >
                  <History size={18} />
                  Journal d'Audit
                </li>
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
              {hasAdminAccess && adminMenu === 'logs' && "Journal d'Audit"}
            </h1>
            <p style={{ marginTop: '0.15rem' }}>
              {!hasAdminAccess && "Cet espace est restreint aux administrateurs."}
              {hasAdminAccess && adminMenu === 'dashboard' && "Suivi des indicateurs clés et productivité de la laverie."}
              {hasAdminAccess && adminMenu === 'orders_management' && "Enregistrement, suivi d'atelier et facturation des commandes."}
              {hasAdminAccess && adminMenu === 'crm_management' && "Fiches clients, encours financiers et fidélité."}
              {hasAdminAccess && adminMenu === 'catalog' && "Gestion de la grille de prix de traitement de laverie B2B."}
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

              {/* Mode Sombre */}
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>

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
            </div>
          </div>
        ) : (
          <AdminView activeTab={adminMenu} searchQuery={searchQuery} />
        )}

      </main>

      {/* ================= WIDGET SIMULATEUR RBAC FLOTTANT ================= */}
      <div className="rbac-widget">
        <div className="rbac-widget-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldAlert size={15} color="hsl(38, 95%, 52%)" />
            <span style={{ fontSize: '0.8rem' }}>Simulateur RBAC</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Utilisateur actif :</label>
          <select 
            className="rbac-role-select"
            value={currentUser.id}
            onChange={(e) => handleUserRoleChange(e.target.value)}
          >
            {staffList.map(s => (
              <option key={s.id} value={s.id}>
                {s.prenom} {s.nom} ({s.role === 'super_admin' ? 'Admin' : s.role === 'manager' ? 'Manager' : 'Accueil'})
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <div><strong>Rôle:</strong> {currentUser.role}</div>
          <div><strong>Autorisations:</strong> </div>
          <div style={{ color: 'var(--secondary)', fontWeight: 600 }}>
            {currentUser.role === 'super_admin' && "• Accès Total (CMS)"}
            {currentUser.role === 'manager' && "• Dashboard, Catalogue"}
            {currentUser.role === 'agent_accueil' && "• Bloqué (Utiliser Port 5174)"}
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
