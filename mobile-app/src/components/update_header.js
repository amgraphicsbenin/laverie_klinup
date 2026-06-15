const fs = require('fs');
let content = fs.readFileSync('MobileView.jsx', 'utf8');

// 1. Update status bar time
content = content.replace('<span>10:40</span>', '<span style={{ fontSize: "0.78rem", fontWeight: 800 }}>9:41</span>');

// 2. Update dashboard HEADER section inside the accueil tab
// Find and replace the old header div inside the accueil IIFE
const oldHeader = `              {/* HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bonjour,</p>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>{currentUser.prenom} {currentUser.nom}</h2>
                </div>
                <button className="btn btn-primary" style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0, flexShrink: 0 }} onClick={() => setShowOrderRegistrationModal(true)}>
                  <Plus size={18} />
                </button>
              </div>`;

const newHeader = `              {/* HEADER — Style image: avatar + name + actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div className="user-avatar">
                    {currentUser.prenom?.[0]}{currentUser.nom?.[0]}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bienvenue</p>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>{currentUser.prenom} {currentUser.nom}</h2>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
                    <Bell size={15} />
                    {lateOrders.length > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', background: '#ef4444', borderRadius: '50%', border: '1.5px solid #fff' }} />}
                  </button>
                  <button style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                    <Settings size={15} />
                  </button>
                </div>
              </div>`;

if (content.includes(oldHeader)) {
  content = content.replace(oldHeader, newHeader);
  console.log('Header updated');
} else {
  console.log('Header pattern not found — searching fragment...');
  const fragment = "Bienvenue\n                </div>";
  if (content.includes('Bonjour,')) {
    console.log('Bonjour found, will try partial replace');
  }
}

fs.writeFileSync('MobileView.jsx', content, 'utf8');
console.log('Done');
