import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import MobileView from './components/MobileView';
import { 
  Sun, 
  Moon, 
  ShieldAlert
} from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    // Initialise DB user and staff
    const user = db.getCurrentUser();
    setCurrentUser(user);
    setStaffList(db.getStaff());
  }, []);


  const handleUserRoleChange = (userId) => {
    const targetUser = staffList.find(s => s.id === userId);
    if (targetUser) {
      db.setCurrentUser(targetUser);
      setCurrentUser(targetUser);
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

  const isPreviewMode = currentUser.role === 'super_admin' || currentUser.role === 'manager';

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '1.5rem' }}>
      


      {/* Smartphone Simulator */}
      <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <MobileView />
      </div>

      {/* ================= WIDGET SIMULATEUR RBAC FLOTTANT ================= */}
      <div className="rbac-widget">
        <div className="rbac-widget-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldAlert size={16} color="hsl(38, 95%, 52%)" />
            <span>Simulateur RBAC</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Utilisateur actif :</label>
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
        
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div><strong>Rôle:</strong> {currentUser.role}</div>
          <div><strong>Autorisations:</strong> </div>
          <div style={{ color: 'var(--secondary)' }}>
            {currentUser.role === 'agent_accueil' && "• Rôle standard (Terrain/Caisse)"}
            {isPreviewMode && "• Admin en mode test mobile"}
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
