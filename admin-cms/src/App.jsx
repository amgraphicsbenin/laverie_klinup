import { useState, useEffect, useRef } from 'react';
import { db } from './services/db';
import AdminView from './components/AdminView';
import CustomSelect from './components/CustomSelect';
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

  // Supabase init loading state
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState(null);

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
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('klin_up_sidebar_collapsed')) || false;
    } catch (e) {
      return false;
    }
  });
  const [pinActionLoading, setPinActionLoading] = useState(null);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Dark mode state & theme switcher persistent
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('klinup_admin_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('klinup_admin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('klinup_admin_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // SEC-08: Inactivity Timeout - Verrouillage automatique après 15 minutes d'inactivité
  useEffect(() => {
    if (!currentUser) return;
    const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
    let timer = null;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        console.warn('[SÉCURITÉ] Session verrouillée après 15 minutes d inactivité');
        setCurrentUser(null);
        localStorage.removeItem('klinup_current_user');
      }, TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser]);

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

  const [clearedNotifIds, setClearedNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('klin_up_cleared_notif_ids')) || [];
    } catch (e) {
      return [];
    }
  });

  // Unified notifications stream
  const allNotifications = (() => {
    const list = [];

    // 1. PIN reset requests
    const pinReqs = (db.getPinResetRequests ? db.getPinResetRequests() : []) || [];
    pinReqs.forEach(req => {
      if (!req) return;
      list.push({
        id: `pin_${req.id || Math.random()}`,
        type: 'pin_reset',
        action: 'DEMANDE_RESET_PIN',
        title: req.status === 'pending' ? 'Demande de reset PIN (En attente)' : `Demande de reset PIN (${req.status === 'approved' ? 'Approuvée' : 'Rejetée'})`,
        message: `L'employé avec l'email ${req.email || 'inconnu'} a demandé la réinitialisation de son code PIN.`,
        timestamp: req.created_at || new Date().toISOString(),
        raw: req
      });
    });

    // 2. Important logs from activity logs
    const logs = (db.getLogs ? db.getLogs() : []) || [];
    const importantActions = ['MISE_A_JOUR_STATUT', 'CREATION_COMMANDE', 'ANNULATION_COMMANDE', 'RÈGLEMENT_DETTE'];
    logs.forEach(log => {
      if (!log || !log.action) return;
      if (importantActions.includes(log.action)) {
        let friendlyTitle = 'Notification';
        if (log.action === 'MISE_A_JOUR_STATUT') friendlyTitle = 'Statut de Commande Mis à Jour';
        else if (log.action === 'CREATION_COMMANDE') friendlyTitle = 'Nouvelle Commande';
        else if (log.action === 'ANNULATION_COMMANDE') friendlyTitle = 'Commande Annulée';
        else if (log.action === 'RÈGLEMENT_DETTE') friendlyTitle = 'Règlement de Dette';

        list.push({
          id: `log_${log.id || Math.random()}`,
          type: 'log_event',
          action: log.action,
          title: friendlyTitle,
          message: log.details || '',
          timestamp: log.timestamp || new Date().toISOString(),
          raw: log
        });
      }
    });

    // Sort by timestamp desc and limit to 25 items
    return list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)).slice(0, 25);
  })();

  const notifications = allNotifications.filter(n => !clearedNotifIds.includes(n.id));
  const unreadCount = notifications.filter(n => !readNotifIds.includes(n.id)).length;

  // Bip sonore pour toute nouvelle notification reçue
  const playNotificationBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.08); // G5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {
      // Ignorer si bloqué par auto-play
    }
  };

  const prevLatestNotifIdRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (notifications.length > 0) {
      const latestId = notifications[0].id;
      if (isInitialLoadRef.current) {
        prevLatestNotifIdRef.current = latestId;
        isInitialLoadRef.current = false;
      } else if (prevLatestNotifIdRef.current && prevLatestNotifIdRef.current !== latestId) {
        prevLatestNotifIdRef.current = latestId;
        playNotificationBeep();
      } else {
        prevLatestNotifIdRef.current = latestId;
      }
    }
  }, [notifications]);

  const handleClearAllNotifications = (e) => {
    e.stopPropagation();
    const idsToClear = notifications.map(n => n.id);
    const updatedCleared = Array.from(new Set([...clearedNotifIds, ...idsToClear]));
    setClearedNotifIds(updatedCleared);
    localStorage.setItem('klin_up_cleared_notif_ids', JSON.stringify(updatedCleared));
  };

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

  const handleApprovePin = async (reqId) => {
    setPinActionLoading(reqId);
    try {
      const result = db.approvePinResetRequest(reqId);
      if (result) {
        alert(`PIN réinitialisé avec succès ! Nouveau PIN : ${result.newPin}. Un email de confirmation a été envoyé à ${result.staffMember.email}`);
        setDbTick(prev => prev + 1);
      }
    } catch (e) {
      alert('Erreur lors de l\'approbation : ' + (e?.message || 'Erreur inconnue'));
    } finally {
      setPinActionLoading(null);
    }
  };

  const handleRejectPin = async (reqId) => {
    setPinActionLoading(reqId);
    try {
      db.rejectPinResetRequest(reqId);
      alert("Demande de réinitialisation de PIN rejetée.");
      setDbTick(prev => prev + 1);
    } catch (e) {
      alert('Erreur lors du rejet : ' + (e?.message || 'Erreur inconnue'));
    } finally {
      setPinActionLoading(null);
    }
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

        setCustomDialog(prev => {
          if (prev && typeof prev.resolve === 'function') {
            prev.resolve(false);
          }
          return {
            message: msgStr,
            title: isError ? 'Erreur' : isSuccess ? 'Succès' : 'Information',
            type: isError ? 'error' : isSuccess ? 'success' : 'info',
            isConfirm: false,
            resolve
          };
        });
      });
    };

    window.confirm = (message) => {
      const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);
      return new Promise((resolve) => {
        setCustomDialog(prev => {
          if (prev && typeof prev.resolve === 'function') {
            prev.resolve(false);
          }
          return {
            message: msgStr,
            title: 'Confirmation',
            type: 'confirm',
            isConfirm: true,
            resolve
          };
        });
      });
    };

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, []);

  const [selectedStoreId, setSelectedStoreIdState] = useState(() => db.getSelectedStoreId());

  useEffect(() => {
    // Subscribe to memory store changes first
    const unsubscribe = db.subscribe(() => {
      setCurrentUser(db.getCurrentUser());
      setStaffList(db.getAllStaff ? db.getAllStaff() : db.getStaff());
      setDbTick(prev => prev + 1);
      setDbIsRemote(db.isRemote());
      setSelectedStoreIdState(db.getSelectedStoreId());
    });

    // Load all data from Supabase
    db.init()
      .then(() => {
        setCurrentUser(db.getCurrentUser());
        setStaffList(db.getAllStaff ? db.getAllStaff() : db.getStaff());
        setDbIsRemote(db.isRemote());
        setSelectedStoreIdState(db.getSelectedStoreId());
        setIsInitializing(false);
      })
      .catch(err => {
        console.error('[App] Initialisation échouée:', err);
        setInitError(err?.message || 'Impossible de joindre le serveur Supabase.');
        // Still show data from defaults even on error
        setCurrentUser(db.getCurrentUser());
        setStaffList(db.getAllStaff ? db.getAllStaff() : db.getStaff());
        setDbIsRemote(db.isRemote());
        setSelectedStoreIdState(db.getSelectedStoreId());
        setIsInitializing(false);
      });

    return () => unsubscribe();
  }, []);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail) return;

    const currentStaff = db.getAllStaff ? db.getAllStaff() : db.getStaff();
    let matchedUser = currentStaff.find(s => s.email && s.email.toLowerCase() === loginEmail.trim().toLowerCase());

    if (!matchedUser) {
      try {
        await db.refreshStaff();
        const refreshedStaff = db.getAllStaff ? db.getAllStaff() : db.getStaff();
        matchedUser = refreshedStaff.find(s => s.email && s.email.toLowerCase() === loginEmail.trim().toLowerCase());
      } catch (err) {
        console.warn("Failed to refresh staff on login:", err);
      }
    }

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

  // Auto-logout after 15 minutes of inactivity (Session Timeout)
  useEffect(() => {
    if (!currentUser) return;
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        db.setCurrentUser(null);
        alert("Session expirée suite à 15 minutes d'inactivité. Veuillez vous reconnecter.");
      }, 15 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [currentUser]);

  // Global Keyboard Shortcuts (ESC: Close Dialogs)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (customDialog) setCustomDialog(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [customDialog]);

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
        if (newCode === '000000') {
          alert("🔒 Sécurité : Vous êtes connecté avec le PIN par défaut (000000). Pensez à réinitialiser votre PIN.");
        }
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


  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('klin_up_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // ── Supabase loading screen ──────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        gap: '2rem',
        fontFamily: 'var(--font-body, Inter, sans-serif)',
      }}>
        <img src={logoGold} alt="KLIN UP" style={{ width: '180px', opacity: 0.9 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px', height: '48px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #f59e0b',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: 0, letterSpacing: '0.05em' }}>
            Connexion à Supabase en cours…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Supabase connection error screen ─────────────────────────────────────
  if (initError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        gap: '1.5rem',
        padding: '2rem',
        fontFamily: 'var(--font-body, Inter, sans-serif)',
      }}>
        <img src={logoGold} alt="KLIN UP" style={{ width: '160px', opacity: 0.8 }} />
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          display: 'flex', flexDirection: 'column', gap: '1rem'
        }}>
          <div style={{ color: '#ef4444', fontSize: '2rem' }}>⚠️</div>
          <h2 style={{ color: '#fca5a5', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Connexion Supabase impossible
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
            {initError}
          </p>
          <button
            onClick={() => { setInitError(null); setIsInitializing(true); db.init().then(() => { setCurrentUser(db.getCurrentUser()); setStaffList(db.getStaff()); setDbIsRemote(db.isRemote()); setSelectedStoreIdState(db.getSelectedStoreId()); setIsInitializing(false); }).catch(err => { setInitError(err?.message || 'Erreur de connexion.'); setIsInitializing(false); }); }}
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#f59e0b',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Réessayer la connexion
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="lockscreen-container">
        <div className="lockscreen-logo-area" style={{ textAlign: 'center', marginBottom: '0.8rem' }}>
          <h1 style={{ color: '#ffffff', fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.5px' }}>
            Laverie - Admin
          </h1>
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
                onChange={(e) => setLoginEmail(e.target.value.trimStart())}
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
            <p className="pin-user-role">
              {selectedLoginUser.role === 'super_admin' ? 'Super Administrateur'
                : selectedLoginUser.role === 'manager' ? 'Gestionnaire'
                  : selectedLoginUser.role === 'livreur' ? 'Livreur'
                    : selectedLoginUser.role === 'agent_lavage_repassage' ? 'Agent de lavage / Repassage'
                      : "Agent d'accueil"}
            </p>

            <div className={`pin-dots-row ${pinError ? 'shake' : ''}`}>
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div
                  key={idx}
                  className={`pin-dot ${pinCode.length > idx ? 'filled' : ''} ${pinError ? 'error' : ''}`}
                />
              ))}
            </div>

            <p style={{
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '0.85rem',
              textAlign: 'center',
              marginTop: '1.5rem',
              marginBottom: '1rem',
              lineHeight: 1.4
            }}>
              Saisissez votre code PIN à 6 chiffres à l'aide de votre clavier physique.
            </p>

            <button
              type="button"
              onClick={() => setSelectedLoginUser(null)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.8)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '0.5rem'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
            >
              Annuler / Changer de compte
            </button>
          </div>
        )}

        {showResetPinModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '360px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-primary)', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.22), 0 10px 25px -5px rgba(15, 23, 42, 0.10)', border: '1px solid rgba(0,0,0,0.08)' }}>
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

  const hasAdminAccess = currentUser?.role === 'super_admin' || currentUser?.role === 'manager';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const selectMenu = (menuKey) => {
    setAdminMenu(menuKey);
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">

      {/* ================= OVERLAY MOBILE SIDEBAR ================= */}
      {hasAdminAccess && sidebarOpen && (
        <div className="sidebar-mobile-overlay sidebar-overlay-open" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ================= SIDEBAR DESKTOP & MOBILE ================= */}
      {hasAdminAccess && (
        <aside className={`sidebar theme-dark-blue${sidebarOpen ? ' sidebar-open' : ''}${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>

          {/* ── Header: Title ── */}
          <div className="sidebar-header">
            <div className="sidebar-title-text">
              Laverie - Admin
            </div>
          </div>

          {/* ── Search bar ── */}
          <div className="sidebar-search-wrap">
            <MIcon name="search" size={16} className="sidebar-search-icon" />
            <input
              type="text"
              className="sidebar-search-input"
              placeholder="Rechercher..."
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
            />
          </div>

          {/* ── Scrollable nav ── */}
          <nav className="sidebar-nav">

            {/* Section PRINCIPAL */}
            <div className="sidebar-section-label">PRINCIPAL</div>
            <ul className="sidebar-menu">

              <li className={`sidebar-nav-item${adminMenu === 'dashboard' ? ' active' : ''}`}
                onClick={() => selectMenu('dashboard')}
                data-tooltip="Vue d'Ensemble">
                <div className="sidebar-nav-icon"><MIcon name="dashboard" size={19} /></div>
                <span className="sidebar-nav-label">Vue d'Ensemble</span>
              </li>

              <li className={`sidebar-nav-item${adminMenu === 'orders_management' ? ' active' : ''}`}
                onClick={() => selectMenu('orders_management')}
                data-tooltip="Gestion Commandes">
                <div className="sidebar-nav-icon"><MIcon name="shopping_bag" size={19} /></div>
                <span className="sidebar-nav-label">Gestion Commandes</span>
              </li>

              <li className={`sidebar-nav-item${adminMenu === 'crm_management' ? ' active' : ''}`}
                onClick={() => selectMenu('crm_management')}
                data-tooltip="Clients CRM">
                <div className="sidebar-nav-icon"><MIcon name="group" size={19} /></div>
                <span className="sidebar-nav-label">Clients CRM</span>
              </li>

              <li className={`sidebar-nav-item${adminMenu === 'catalog' ? ' active' : ''}`}
                onClick={() => selectMenu('catalog')}
                data-tooltip="Catalogue Tarifs">
                <div className="sidebar-nav-icon"><MIcon name="price_change" size={19} /></div>
                <span className="sidebar-nav-label">Catalogue Tarifs</span>
              </li>

              {isSuperAdmin && (
                <>
                  <li className={`sidebar-nav-item${adminMenu === 'laundry_points' ? ' active' : ''}`}
                    onClick={() => selectMenu('laundry_points')}
                    data-tooltip="Points de Laverie">
                    <div className="sidebar-nav-icon"><MIcon name="store" size={19} /></div>
                    <span className="sidebar-nav-label">Points de Laverie</span>
                  </li>

                  {/* Gestion des Accès — expandable + flyout for collapsed mode */}
                  <div className="sidebar-nav-group">
                    <li className={`sidebar-nav-item sidebar-nav-expandable${['staff_management','staff_users','staff_roles'].includes(adminMenu) ? ' active' : ''}${openSubmenus?.staff ? ' open' : ''}`}
                      onClick={() => setOpenSubmenus(prev => ({ ...prev, staff: !prev.staff }))}
                      data-tooltip="Gestion des Accès">
                      <div className="sidebar-nav-icon"><MIcon name="admin_panel_settings" size={19} /></div>
                      <span className="sidebar-nav-label">Gestion des Accès</span>
                      <MIcon name="keyboard_arrow_down" size={16} className="sidebar-nav-chevron" />
                    </li>
                    {/* Flyout: always rendered, visible on hover in collapsed mode */}
                    <div className="sidebar-flyout">
                      <div className="sidebar-flyout-title">Gestion des Accès</div>
                      <div className={`sidebar-flyout-item${(adminMenu === 'staff_users' || adminMenu === 'staff_management') ? ' active' : ''}`}
                        onClick={() => selectMenu('staff_users')}>
                        Gestion Utilisateurs
                      </div>
                      <div className={`sidebar-flyout-item${adminMenu === 'staff_roles' ? ' active' : ''}`}
                        onClick={() => selectMenu('staff_roles')}>
                        Config. des Rôles
                      </div>
                    </div>
                    {/* Inline submenu: visible in expanded mode */}
                    {openSubmenus?.staff && (
                      <div className="sidebar-submenu">
                        <div className="sidebar-submenu-rail" />
                        <div className="sidebar-submenu-items">
                          <div className={`sidebar-submenu-item${(adminMenu === 'staff_users' || adminMenu === 'staff_management') ? ' active' : ''}`}
                            onClick={() => selectMenu('staff_users')}>
                            Gestion Utilisateurs
                          </div>
                          <div className={`sidebar-submenu-item${adminMenu === 'staff_roles' ? ' active' : ''}`}
                            onClick={() => selectMenu('staff_roles')}>
                            Config. des Rôles
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <li className={`sidebar-nav-item${adminMenu === 'logs' ? ' active' : ''}`}
                    onClick={() => selectMenu('logs')}
                    data-tooltip="Journal d'Audit">
                    <div className="sidebar-nav-icon"><MIcon name="history" size={19} /></div>
                    <span className="sidebar-nav-label">Journal d'Audit</span>
                  </li>
                </>
              )}
            </ul>

            {/* Section GÉNÉRAL */}
            <div className="sidebar-section-label">GÉNÉRAL</div>
            <ul className="sidebar-menu">

              {/* Paramètres — expandable + flyout for collapsed mode */}
              <div className="sidebar-nav-group">
                <li className={`sidebar-nav-item sidebar-nav-expandable${adminMenu.startsWith('settings') ? ' active' : ''}${openSubmenus?.settings ? ' open' : ''}`}
                  onClick={() => setOpenSubmenus(prev => ({ ...prev, settings: !prev.settings }))}
                  data-tooltip="Paramètres">
                  <div className="sidebar-nav-icon"><MIcon name="settings" size={19} /></div>
                  <span className="sidebar-nav-label">Paramètres</span>
                  <MIcon name="keyboard_arrow_down" size={16} className="sidebar-nav-chevron" />
                </li>
                {/* Flyout: always rendered, visible on hover in collapsed mode */}
                <div className="sidebar-flyout">
                  <div className="sidebar-flyout-title">Paramètres</div>
                  <div className={`sidebar-flyout-item${(adminMenu === 'settings_delays' || adminMenu === 'settings') ? ' active' : ''}`}
                    onClick={() => selectMenu('settings_delays')}>
                    Délais &amp; Majorations
                  </div>
                  <div className={`sidebar-flyout-item${adminMenu === 'settings_reward' ? ' active' : ''}`}
                    onClick={() => selectMenu('settings_reward')}>
                    Reward &amp; Fidélité
                  </div>
                  <div className={`sidebar-flyout-item${adminMenu === 'settings_receipt' ? ' active' : ''}`}
                    onClick={() => selectMenu('settings_receipt')}>
                    Modèles de Reçus
                  </div>
                  <div className={`sidebar-flyout-item${adminMenu === 'settings_delivery' ? ' active' : ''}`}
                    onClick={() => selectMenu('settings_delivery')}>
                    Frais Récupération &amp; Livraison
                  </div>
                  <div className={`sidebar-flyout-item${adminMenu === 'settings_cloud' ? ' active' : ''}`}
                    onClick={() => selectMenu('settings_cloud')}>
                    Configuration Système
                  </div>
                </div>
                {/* Inline submenu: visible in expanded mode */}
                {openSubmenus?.settings && (
                  <div className="sidebar-submenu">
                    <div className="sidebar-submenu-rail" />
                    <div className="sidebar-submenu-items">
                      <div className={`sidebar-submenu-item${(adminMenu === 'settings_delays' || adminMenu === 'settings') ? ' active' : ''}`}
                        onClick={() => selectMenu('settings_delays')}>
                        Délais & Majorations
                      </div>
                      <div className={`sidebar-submenu-item${adminMenu === 'settings_reward' ? ' active' : ''}`}
                        onClick={() => selectMenu('settings_reward')}>
                        Reward & Fidélité
                      </div>
                      <div className={`sidebar-submenu-item${adminMenu === 'settings_receipt' ? ' active' : ''}`}
                        onClick={() => selectMenu('settings_receipt')}>
                        Modèles de Reçus
                      </div>
                      <div className={`sidebar-submenu-item${adminMenu === 'settings_delivery' ? ' active' : ''}`}
                        onClick={() => selectMenu('settings_delivery')}>
                        Frais Récupération & Livraison
                      </div>
                      <div className={`sidebar-submenu-item${adminMenu === 'settings_cloud' ? ' active' : ''}`}
                        onClick={() => selectMenu('settings_cloud')}>
                        Configuration Système
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <li className={`sidebar-nav-item${adminMenu === 'help' ? ' active' : ''}`}
                onClick={() => selectMenu('help')}
                data-tooltip="Aide & Support">
                <div className="sidebar-nav-icon"><MIcon name="help" size={19} /></div>
                <span className="sidebar-nav-label">Aide & Support</span>
              </li>

              <li className="sidebar-nav-item sidebar-nav-logout"
                onClick={() => setShowLogoutConfirm(true)}
                data-tooltip="Déconnexion">
                <div className="sidebar-nav-icon"><MIcon name="logout" size={19} /></div>
                <span className="sidebar-nav-label">Déconnexion</span>
              </li>
            </ul>
          </nav>

          {/* ── User Profile Card at bottom ── */}
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {currentUser?.prenom?.[0]?.toUpperCase() || currentUser?.nom?.[0]?.toUpperCase() || 'K'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser?.prenom} {currentUser?.nom}</div>
              <div className="sidebar-user-role">{currentUser?.role?.replace('_', ' ')}</div>
            </div>
            <MIcon name="unfold_more" size={16} className="sidebar-user-expand" />
          </div>

        </aside>
      )}

      {/* ================= CONTENU PRINCIPAL DESKTOP ================= */}
      <main className="main-content">

        {/* Topbar Donezo Style */}
        <div className="topbar">
          {/* B-002: Bouton hamburger pour mobile */}
          {hasAdminAccess && (
            <button className="sidebar-mobile-toggle" onClick={() => setSidebarOpen(true)} title="Ouvrir le menu">
              <MIcon name="menu" size={22} />
            </button>
          )}
          <div className="page-title">
            <h1>
              {!hasAdminAccess && "Accès non autorisé"}
              {hasAdminAccess && adminMenu === 'dashboard' && "Tableau de Bord"}
              {hasAdminAccess && adminMenu === 'orders_management' && "Gestion des Commandes"}
              {hasAdminAccess && adminMenu === 'crm_management' && "Clients CRM"}
              {hasAdminAccess && adminMenu === 'catalog' && "Catalogue Tarifs"}
              {hasAdminAccess && adminMenu === 'laundry_points' && "Points de Laverie"}
              {hasAdminAccess && (adminMenu === 'staff_management' || adminMenu === 'staff_users') && "Gestion Utilisateurs"}
              {hasAdminAccess && adminMenu === 'staff_roles' && "Configuration des Rôles"}
              {hasAdminAccess && adminMenu === 'logs' && "Journal d'Audit"}
              {hasAdminAccess && adminMenu === 'help' && "Aide & Assistance Technique"}
              {hasAdminAccess && adminMenu.startsWith('settings') && (
                adminMenu === 'settings_reward' ? "Paramètres - Reward & Fidélité" :
                  adminMenu === 'settings_receipt' ? "Paramètres - Reçus & Imprimante" :
                    adminMenu === 'settings_delivery' ? "Paramètres - Frais de Livraison par Zone (GPS)" :
                      adminMenu === 'settings_cloud' ? "Paramètres - Configuration Système" :
                        "Paramètres Système"
              )}
            </h1>
            <p style={{ marginTop: '0.15rem' }}>
              {!hasAdminAccess && "Cet espace est restreint aux administrateurs."}
              {hasAdminAccess && adminMenu === 'dashboard' && "Suivi des indicateurs clés et productivité de la laverie."}
              {hasAdminAccess && adminMenu === 'orders_management' && "Enregistrement, suivi d'atelier et facturation des commandes."}
              {hasAdminAccess && adminMenu === 'crm_management' && "Fiches clients, encours financiers et fidélité."}
              {hasAdminAccess && adminMenu === 'catalog' && "Gestion de la grille de prix de traitement de laverie B2B."}
              {hasAdminAccess && adminMenu === 'laundry_points' && "Gestion des différents points de vente, boutiques et ateliers de laverie."}
              {hasAdminAccess && (adminMenu === 'staff_management' || adminMenu === 'staff_users') && "Habilitations du personnel, gestion des rôles et autorisations d'accès."}
              {hasAdminAccess && adminMenu === 'staff_roles' && "Définition et configuration des permissions des rôles système."}
              {hasAdminAccess && adminMenu === 'logs' && "Traçabilité des actions et sécurité des transactions."}
              {hasAdminAccess && adminMenu === 'help' && "Formulaire de demande de support, signalement de bug et suivi de tickets."}
              {hasAdminAccess && adminMenu.startsWith('settings') && (
                adminMenu === 'settings_reward' ? "Configuration du programme de fidélité et catalogue de récompenses." :
                  adminMenu === 'settings_receipt' ? "Personnalisation des entêtes, pieds de page et formats d'impression." :
                    adminMenu === 'settings_delivery' ? "Tarification des frais de livraison par zone kilométrique et coordonnées GPS." :
                      adminMenu === 'settings_cloud' ? "Base de données, synchronisation cloud et intégrations système (Trello, API)." :
                        "Configuration globale des délais et majorations d'urgence de la laverie."
              )}
            </p>
          </div>

          {hasAdminAccess && (
            <div className="topbar-actions">
              {/* Sélecteur de Point de Laverie (Seul le Super Admin peut naviguer entre les laveries et voir la Vue Globale) */}
              {isSuperAdmin ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', padding: '0.25rem 0.65rem', borderRadius: '12px', minWidth: '220px' }}>
                  <MIcon name="storefront" size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <CustomSelect
                    value={selectedStoreId}
                    onChange={(e) => {
                      db.setSelectedStoreId(e.target.value);
                      setSelectedStoreIdState(e.target.value);
                    }}
                    className=""
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      outline: 'none',
                      padding: 0,
                      height: 'auto',
                      boxShadow: 'none'
                    }}
                    dropdownStyle={{
                      minWidth: '230px',
                      right: 0,
                      left: 'auto',
                      top: 'calc(100% + 8px)'
                    }}
                  >
                    <option value="all">Tous les points (Vue Globale)</option>
                    {db.getStores().map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nom} ({s.code})
                      </option>
                    ))}
                  </CustomSelect>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.2)', padding: '0.35rem 0.75rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                  <MIcon name="storefront" size={18} style={{ color: 'var(--primary)' }} />
                  <span>
                    {(() => {
                      const userStoreId = currentUser?.store_id || currentUser?.laverie_id || 'store_central';
                      const currentStore = db.getStores().find(s => s.id === userStoreId || s.code === userStoreId);
                      return currentStore ? `${currentStore.nom} (${currentStore.code})` : 'Mon Point de Laverie';
                    })()}
                  </span>
                </div>
              )}
              {/* Raccourcis Icônes (Bouton Mode Sombre & Notifications) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Bouton Mode Sombre */}
                <div
                  className="topbar-icon-btn"
                  title={isDarkMode ? "Activer le mode clair" : "Activer le mode sombre"}
                  onClick={toggleDarkMode}
                  style={{
                    borderColor: isDarkMode ? 'rgba(251, 191, 36, 0.4)' : 'var(--border-color)',
                    background: isDarkMode ? 'rgba(251, 191, 36, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.25s var(--ease-emphasized)'
                  }}
                >
                  <MIcon
                    name={isDarkMode ? 'light_mode' : 'dark_mode'}
                    size={18}
                    style={{ color: isDarkMode ? '#fbbf24' : 'var(--text-secondary)', transition: 'color 0.25s ease' }}
                  />
                </div>

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
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, cursor: 'default' }}
                        onClick={() => setShowNotifDropdown(false)}
                      />
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: '48px',
                          right: 0,
                          width: '360px',
                          maxWidth: 'calc(100vw - 2rem)',
                          background: 'var(--bg-card)',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '16px',
                          boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.25), 0 10px 20px -5px rgba(15, 23, 42, 0.12)',
                          zIndex: 9999,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-app)' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>Notifications</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {notifications.length > 0 && (
                              <button
                                type="button"
                                onClick={handleClearAllNotifications}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  color: 'var(--danger)',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Effacer toutes les notifications"
                              >
                                <MIcon name="delete_sweep" size={15} /> Effacer tout
                              </button>
                            )}
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                              {notifications.length} au total
                            </span>
                          </div>
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
                                          className={`btn btn-primary${pinActionLoading === n.raw.id ? ' btn-loading' : ''}`}
                                          disabled={pinActionLoading === n.raw.id}
                                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderRadius: '6px', flex: 1, height: 'auto', minHeight: 'unset' }}
                                        >
                                          Approuver
                                        </button>
                                        <button
                                          onClick={() => handleRejectPin(n.raw.id)}
                                          className={`btn btn-outline${pinActionLoading === n.raw.id ? ' btn-loading' : ''}`}
                                          disabled={pinActionLoading === n.raw.id}
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
              </div>

              {/* Profil Utilisateur Donezo Header Style */}
              <div className="topbar-profile">
                <div className="topbar-profile-avatar" role="img" aria-label={`Avatar de ${currentUser?.prenom || ''} ${currentUser?.nom || 'Utilisateur'}`}>
                  <div className="user-avatar" style={{ margin: 0, width: '36px', height: '36px', fontSize: '0.8rem' }}>
                    {(currentUser?.prenom?.charAt(0) || 'U')}{(currentUser?.nom?.charAt(0) || '')}
                  </div>
                </div>
                <div className="topbar-profile-info">
                  <span className="topbar-profile-name">{currentUser?.prenom || ''} {currentUser?.nom || 'Utilisateur'}</span>
                  <span className="topbar-profile-email">
                    {currentUser?.email || `${(currentUser?.prenom || 'user').toLowerCase()}.${(currentUser?.nom || 'admin').toLowerCase()}@klinup.com`}
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
                Désolé <strong>{currentUser?.prenom} {currentUser?.nom}</strong>, votre rôle <strong>{currentUser?.role}</strong> ne vous autorise pas à accéder au CMS Administrateur.<br />
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
          <AdminView
            activeTab={adminMenu}
            onManageStaff={() => setAdminMenu('staff_management')}
          />
        )}

      </main>

      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '360px', padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-primary)', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.22), 0 10px 25px -5px rgba(15, 23, 42, 0.10)', border: '1px solid rgba(0,0,0,0.08)' }}>
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
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{
            width: '100%',
            maxWidth: '380px',
            background: 'var(--bg-card)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.22), 0 10px 25px -5px rgba(15, 23, 42, 0.10)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid rgba(0,0,0,0.08)',
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
