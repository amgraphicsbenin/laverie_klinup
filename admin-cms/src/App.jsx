import { useState, useEffect, useRef } from 'react';
import { db } from './services/db';
import AdminView from './components/AdminView';
import CustomSelect from './components/CustomSelect';
import { appEnv } from './services/supabaseClient';
import logoBrand from './assets/logo_brand.png';
import logoDark from './assets/logo_dark.png';
import TablerIcon from './components/icons/tablerIcons';
import {
  getPinLockoutState,
  recordFailedPinAttempt,
  clearPinLockout,
  PIN_SECURITY_CONFIG
} from './utils/securityUtils';
import {
  IconShieldLock,
  IconAlertTriangle,
  IconClock,
  IconLock,
  IconMail,
  IconArrowRight,
  IconArrowLeft,
  IconBackspace,
  IconX,
  IconShield,
  IconShieldCheck,
  IconCheck,
  IconShirt,
  IconBuildingStore,
  IconSparkles,
  IconReceipt,
  IconUsers,
  IconChartBar,
  IconTrendingUp,
  IconShoppingBag
} from '@tabler/icons-react';

// Composant utilitaire basé sur la bibliothèque Tabler Lined (remplace Material Symbols)
const MIcon = ({ name, size = 20, style = {}, className = '', stroke = 1.8, strokeWidth, filled, ...rest }) => (
  <TablerIcon
    name={name}
    size={size}
    stroke={strokeWidth !== undefined ? strokeWidth : stroke}
    style={style}
    className={className}
    {...rest}
  />
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
  const [pinLockoutState, setPinLockoutState] = useState({
    isLocked: false,
    remainingSeconds: 0,
    failedAttempts: 0,
    totalFailures: 0
  });
  const hiddenPinInputRef = useRef(null);

  const formatLockoutDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0s';
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const remaining = seconds % 60;
      return `${mins}m ${remaining < 10 ? '0' : ''}${remaining}s`;
    }
    return `${seconds}s`;
  };

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

  // Synchronisation du Security Guard PIN pour l'utilisateur sélectionné
  useEffect(() => {
    if (selectedLoginUser) {
      const userKey = selectedLoginUser.id || selectedLoginUser.email;
      const currentLockout = getPinLockoutState(userKey);
      setPinLockoutState(currentLockout);
      setPinCode('');
      setPinError(false);
    } else {
      setPinLockoutState({ isLocked: false, remainingSeconds: 0, failedAttempts: 0, totalFailures: 0 });
      setPinCode('');
      setPinError(false);
    }
  }, [selectedLoginUser]);

  // Compte à rebours temps réel pendant le verrouillage Security Guard
  useEffect(() => {
    if (!pinLockoutState.isLocked || !selectedLoginUser) return;

    const timer = setInterval(() => {
      const userKey = selectedLoginUser.id || selectedLoginUser.email;
      const current = getPinLockoutState(userKey);
      setPinLockoutState(current);
    }, 1000);

    return () => clearInterval(timer);
  }, [pinLockoutState.isLocked, selectedLoginUser]);

  const verifyPinCode = (code) => {
    if (pinError || isUnlocking || pinLockoutState.isLocked || !selectedLoginUser) return;
    const userKey = selectedLoginUser?.id || selectedLoginUser?.email;

    if (selectedLoginUser.code_pin === code) {
      // Authentification réussie : réinitialiser le compteur de tentatives
      clearPinLockout(userKey);
      setPinLockoutState({ isLocked: false, remainingSeconds: 0, failedAttempts: 0, totalFailures: 0 });
      setIsUnlocking(true);

      if (code === '000000') {
        alert("Sécurité : Vous êtes connecté avec le PIN par défaut (000000). Pensez à réinitialiser votre PIN.");
      }
      setTimeout(() => {
        db.setCurrentUser(selectedLoginUser);
        setSelectedLoginUser(null);
        setPinCode('');
        setIsUnlocking(false);
      }, 300);
    } else {
      // Code PIN erroné : enregistrement et calcul du verrouillage progressif
      const lockoutResult = recordFailedPinAttempt(userKey);
      setPinLockoutState(lockoutResult);
      setPinError(true);

      // Journalisation de sécurité
      if (lockoutResult.isLocked) {
        try {
          db.logAction?.(
            'BLOCAGE_SECURITE_PIN',
            `Compte ${selectedLoginUser.prenom} ${selectedLoginUser.nom} (${selectedLoginUser.email}) bloqué temporairement pour ${lockoutResult.remainingSeconds}s après ${lockoutResult.failedAttempts} tentatives consécutives incorrectes.`
          );
        } catch (logErr) {
          console.warn('[SECURITY GUARD] Échec logAction:', logErr);
        }
      } else if (lockoutResult.failedAttempts >= PIN_SECURITY_CONFIG.WARNING_THRESHOLD) {
        try {
          db.logAction?.(
            'ALERTE_PIN_INCORRECT',
            `Alerte sécurité : ${lockoutResult.failedAttempts}/5 tentatives échouées pour ${selectedLoginUser.prenom} ${selectedLoginUser.nom} (${selectedLoginUser.email}).`
          );
        } catch (logErr) {
          console.warn('[SECURITY GUARD] Échec logAction:', logErr);
        }
      }

      setTimeout(() => {
        setPinCode('');
        setPinError(false);
      }, 800);
    }
  };

  const handleKeypadPress = (val) => {
    if (pinError || isUnlocking || pinLockoutState.isLocked) return;

    if (val === 'delete') {
      setPinCode(prev => prev.slice(0, -1));
      return;
    }

    if (val === '') {
      if (pinCode.length === 6) {
        verifyPinCode(pinCode);
      }
      return;
    }

    if (pinCode.length >= 6) return;

    const newCode = pinCode + val;
    setPinCode(newCode);

    if (newCode.length === 6) {
      verifyPinCode(newCode);
    }
  };

  useEffect(() => {
    if (selectedLoginUser && !pinLockoutState.isLocked) {
      setTimeout(() => {
        if (hiddenPinInputRef.current) hiddenPinInputRef.current.focus();
      }, 100);
    }
  }, [selectedLoginUser, pinLockoutState.isLocked]);

  useEffect(() => {
    if (!selectedLoginUser) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedLoginUser(null);
        return;
      }

      // Si l'événement provient de l'input masqué, ne pas le traiter ici pour éviter tout doublon
      if (e.target === hiddenPinInputRef.current) return;

      // Bloquer la saisie si le compte est verrouillé
      if (pinLockoutState.isLocked) return;

      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeypadPress('delete');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLoginUser, pinCode, pinError, isUnlocking, pinLockoutState.isLocked]);


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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '22px',
            overflow: 'hidden',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45), 0 0 24px rgba(59, 130, 246, 0.3)',
            border: '1.5px solid rgba(255, 255, 255, 0.18)',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img src={logoBrand} alt="Pressing Pro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
                Pressing
              </span>
              <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
                Pro
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: '3px' }}>
              Administration &amp; Caisse
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px', height: '44px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #38bdf8',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: 0, letterSpacing: '0.05em' }}>
            Connexion au serveur en cours…
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.4)',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img src={logoBrand} alt="Pressing Pro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>PRESSING</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.5px' }}>PRO</span>
          </div>
        </div>
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
          <div style={{ color: '#ef4444', display: 'flex', justifyContent: 'center' }}>
            <MIcon name="error" size={44} />
          </div>
          <h2 style={{ color: '#fca5a5', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Connexion impossible
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
            {initError}
          </p>
          <button
            onClick={() => { setInitError(null); setIsInitializing(true); db.init().then(() => { setCurrentUser(db.getCurrentUser()); setStaffList(db.getStaff()); setDbIsRemote(db.isRemote()); setSelectedStoreIdState(db.getSelectedStoreId()); setIsInitializing(false); }).catch(err => { setInitError(err?.message || 'Erreur de connexion.'); setIsInitializing(false); }); }}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
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
      <div className="lockscreen-container" style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 15%, #ffffff 0%, #f0f7ff 35%, #dbeafe 70%, #93c5fd 100%)',
        padding: '2.5rem 1.5rem',
        position: 'relative',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        fontFamily: 'var(--font-body, Inter, sans-serif)'
      }}>
        <style>{`
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
          }
          @keyframes blinkCursor {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>


        {/* Pilule Flottante Haute Droite (Environnement / Domaine) */}
        <div style={{
          position: 'absolute',
          top: '24px',
          right: '28px',
          padding: '8px 18px',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
          color: '#475569',
          fontSize: '0.8rem',
          fontWeight: 600,
          zIndex: 10
        }}>
          {appEnv && appEnv !== 'production' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: appEnv === 'test' ? '#eab308' : '#f97316' }} />
              <strong style={{ color: appEnv === 'test' ? '#b45309' : '#c2410c' }}>ENVIRONNEMENT {appEnv.toUpperCase()}</strong>
            </span>
          ) : (
            <span>@klinup.ci</span>
          )}
        </div>

        {/* Halo lumineux d'arrière-plan pour profondeur spatiale */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '750px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(147, 197, 253, 0.35) 0%, rgba(191, 219, 254, 0.15) 50%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* CARTE CENTRALE SPLIT (2 COLONNES DESKTOP WEB) */}
        <div style={{
          width: '100%',
          maxWidth: '960px',
          background: '#ffffff',
          borderRadius: '32px',
          boxShadow: '0 25px 80px -15px rgba(37, 99, 235, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.9)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          minHeight: '560px',
          margin: 'auto',
          position: 'relative',
          zIndex: 1,
          animation: 'lockscreenFadeIn 0.35s ease-out forwards'
        }}>

          {/* ========================================================
             COLONNE GAUCHE : FLUX D'AUTHENTIFICATION INTERACTIF
             ======================================================== */}
          <div style={{
            padding: '3.5rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#ffffff',
            boxSizing: 'border-box'
          }}>
            <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              {!selectedLoginUser ? (
                /* ── ÉTAPE 1 : IDENTIFICATION EMAIL ── */
                <form onSubmit={handleEmailSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Logo Officiel Pressing Pro en noir pur sans fond sombre */}
                  <div style={{
                    width: '58px',
                    height: '58px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem'
                  }}>
                    <img
                      src={logoDark}
                      alt="Pressing Pro"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'brightness(0)'
                      }}
                    />
                  </div>

                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0', letterSpacing: '-0.4px', textAlign: 'center' }}>
                    Accès Administration
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', margin: '0 0 1.8rem 0', lineHeight: 1.45 }}>
                    Entrez votre email professionnel pour vous identifier et accéder à la caisse.
                  </p>

                  <div style={{ width: '100%', marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                      Adresse email
                    </label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <IconMail size={18} stroke={1.8} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                      <input
                        type="email"
                        required
                        placeholder="prenom.nom@pressingpro.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value.trimStart())}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem 0.85rem 2.6rem',
                          borderRadius: '12px',
                          border: '1.5px solid #e2e8f0',
                          background: '#f8fafc',
                          color: '#0f172a',
                          fontSize: '0.9rem',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#2563eb';
                          e.target.style.background = '#ffffff';
                          e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.background = '#f8fafc';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: '#2563eb',
                      color: '#ffffff',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                  >
                    <span>Continuer vers le code PIN</span>
                    <IconArrowRight size={18} stroke={2} />
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '1.25rem', fontSize: '0.78rem' }}>
                    <span style={{ color: '#94a3b8' }}>Problème d'accès ?</span>
                    <button
                      type="button"
                      onClick={() => setShowResetPinModal(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Réinitialiser le PIN
                    </button>
                  </div>
                </form>
              ) : (
                /* ── ÉTAPE 2 : SAISIE CODE PIN (STYLE IMAGE : 6 BOÎTES) ── */
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Bouton Changer de compte */}
                  <button
                    type="button"
                    onClick={() => setSelectedLoginUser(null)}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: 0,
                      marginBottom: '1.25rem',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                  >
                    <IconArrowLeft size={15} stroke={2} />
                    <span>Changer de compte</span>
                  </button>

                  {/* Logo Officiel Pressing Pro en noir pur sans fond sombre */}
                  <div style={{
                    width: '54px',
                    height: '54px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <img
                      src={logoDark}
                      alt="Pressing Pro"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'brightness(0)'
                      }}
                    />
                  </div>

                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0', letterSpacing: '-0.4px', textAlign: 'center' }}>
                    Authentification PIN
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', margin: '0 0 1.5rem 0', lineHeight: 1.45 }}>
                    Code requis pour <strong>{selectedLoginUser.prenom} {selectedLoginUser.nom}</strong><br />
                    <span style={{ color: '#94a3b8' }}>{selectedLoginUser.email}</span>
                  </p>

                  {pinLockoutState.isLocked ? (
                    /* ── ÉTAT VERROUILLÉ (USER-FRIENDLY & CLAIR) ── */
                    <div style={{
                      width: '100%',
                      background: '#fff1f2',
                      border: '1.5px solid #fecdd3',
                      borderRadius: '18px',
                      padding: '1.5rem 1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '0.75rem',
                      animation: 'fadeIn 0.2s ease-out',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: '#ffe4e6',
                        border: '1px solid #fda4af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#e11d48'
                      }}>
                        <IconShieldLock size={24} stroke={2} />
                      </div>

                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#9f1239' }}>
                          Compte temporairement bloqué
                        </h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#be123c', lineHeight: 1.4 }}>
                          Trop de tentatives de code incorrectes ({pinLockoutState.failedAttempts} échecs).
                        </p>
                      </div>

                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#ffe4e6',
                        border: '1px solid #fca5a5',
                        padding: '0.5rem 1rem',
                        borderRadius: '10px',
                        color: '#9f1239',
                        fontWeight: 700,
                        fontSize: '0.88rem'
                      }}>
                        <IconClock size={16} stroke={2.2} />
                        <span>Réessayez dans {formatLockoutDuration(pinLockoutState.remainingSeconds)}</span>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#be123c', opacity: 0.85 }}>
                        La saisie est suspendue quelques instants pour protéger votre compte.
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(selectedLoginUser.email || '');
                          setShowResetPinModal(true);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          marginTop: '0.2rem'
                        }}
                      >
                        Code oublié ? Réinitialiser le PIN
                      </button>
                    </div>
                  ) : (
                    /* ── ÉTAT NORMAL : 6 CASES PIN DU STYLE RÉFÉRENCE ── */
                    <>
                      {/* Alerte si 3+ tentatives infructueuses */}
                      {pinLockoutState.failedAttempts >= PIN_SECURITY_CONFIG.WARNING_THRESHOLD && (
                        <div style={{
                          width: '100%',
                          background: '#fef3c7',
                          border: '1px solid #fde68a',
                          borderRadius: '10px',
                          padding: '0.5rem 0.75rem',
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#b45309',
                          fontSize: '0.75rem',
                          textAlign: 'left',
                          boxSizing: 'border-box'
                        }}>
                          <IconAlertTriangle size={16} stroke={2} style={{ flexShrink: 0, color: '#d97706' }} />
                          <span>
                            <strong>Attention :</strong> {pinLockoutState.failedAttempts}/5 tentatives. Verrouillage après 5 échecs.
                          </span>
                        </div>
                      )}

                      {/* Message d'erreur de PIN */}
                      {pinError && (
                        <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.5rem', animation: 'fadeIn 0.15s ease' }}>
                          Code PIN incorrect
                        </div>
                      )}

                      {/* Les 6 Boîtes de saisie PIN */}
                      <div
                        onClick={() => {
                          if (hiddenPinInputRef.current) hiddenPinInputRef.current.focus();
                        }}
                        className={pinError ? 'shake' : ''}
                        style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center',
                          width: '100%',
                          marginBottom: '1rem',
                          cursor: 'text'
                        }}
                      >
                        {[0, 1, 2, 3, 4, 5].map(idx => {
                          const isFilled = pinCode.length > idx;
                          const isActive = pinCode.length === idx;
                          return (
                            <div
                              key={idx}
                              style={{
                                width: '46px',
                                height: '54px',
                                borderRadius: '12px',
                                border: pinError
                                  ? '1.5px solid #ef4444'
                                  : isActive
                                    ? '2px solid #2563eb'
                                    : isFilled
                                      ? '1.5px solid #94a3b8'
                                      : '1.5px solid #e2e8f0',
                                background: pinError
                                  ? '#fff1f2'
                                  : isActive
                                    ? '#ffffff'
                                    : '#ffffff',
                                boxShadow: isActive
                                  ? '0 0 0 3px rgba(37, 99, 235, 0.14)'
                                  : '0 2px 4px rgba(0,0,0,0.02)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isFilled ? (
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0f172a' }} />
                              ) : isActive ? (
                                <span style={{ width: '2px', height: '18px', background: '#2563eb', animation: 'blinkCursor 1s infinite' }} />
                              ) : (
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Input invisible pour capture clavier physique ou virtuel */}
                      <input
                        ref={hiddenPinInputRef}
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoFocus
                        value={pinCode}
                        disabled={pinLockoutState.isLocked}
                        onChange={(e) => {
                          if (pinError || isUnlocking || pinLockoutState.isLocked) return;
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setPinCode(val);
                          if (val.length === 6) {
                            verifyPinCode(val);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          pointerEvents: 'none',
                          width: '1px',
                          height: '1px'
                        }}
                      />

                      {/* Liens sous les boîtes */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.5rem', fontSize: '0.78rem' }}>
                        <span style={{ color: '#94a3b8' }}>Code PIN oublié ?</span>
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(selectedLoginUser.email || '');
                            setShowResetPinModal(true);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          Réinitialiser le PIN
                        </button>
                      </div>

                      {/* Bouton de confirmation principal */}
                      <button
                        type="button"
                        onClick={() => {
                          if (pinCode.length === 6) {
                            verifyPinCode(pinCode);
                          }
                        }}
                        disabled={pinCode.length < 6}
                        style={{
                          width: '100%',
                          background: pinCode.length === 6 ? '#2563eb' : '#94a3b8',
                          color: '#ffffff',
                          padding: '0.85rem',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          cursor: pinCode.length === 6 ? 'pointer' : 'default',
                          border: 'none',
                          boxShadow: pinCode.length === 6 ? '0 4px 14px rgba(37, 99, 235, 0.3)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>Vérifier l'identité</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
             COLONNE DROITE : VISUEL SPATIAL & SHOWCASE ATOUTS GESTION ADMIN
             ======================================================== */}
          <div style={{
            background: 'linear-gradient(155deg, #f0f7ff 0%, #e0effe 45%, #eff6ff 100%)',
            padding: '3.5rem 2.8rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            borderLeft: '1px solid rgba(226, 232, 240, 0.7)',
            boxSizing: 'border-box'
          }}>
            {/* Titre & Sous-titre Épuré */}
            <div style={{ textAlign: 'center', margin: '0.5rem 0 1rem 0' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.8px',
                lineHeight: 1.18,
                margin: '0 0 0.5rem 0',
                fontFamily: 'var(--font-title, Inter, sans-serif)'
              }}>
                Gestion Caisse &amp; Pressing <br />
                <span style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Performante &amp; Intuitive.
                </span>
              </h2>
              <p style={{
                fontSize: '0.82rem',
                color: '#64748b',
                maxWidth: '330px',
                margin: '0 auto',
                lineHeight: 1.5
              }}>
                Commandes, catalogue de tarifs, gestion clients et suivi financier centralisés en temps réel.
              </p>
            </div>

            {/* Carte Flottante Centrale & Satellites (Atouts de gestion Admin) */}
            <div style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '1.25rem 0'
            }}>
              {/* Satellite Flottant Haut-Droite : Catalogue & Services Pressing */}
              <div style={{
                position: 'absolute',
                top: '-14px',
                right: '18px',
                padding: '8px 12px',
                borderRadius: '16px',
                background: '#ffffff',
                boxShadow: '0 14px 30px -6px rgba(37, 99, 235, 0.16), 0 0 0 1px rgba(226, 232, 240, 0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 2,
                animation: 'floatSlow 4s ease-in-out infinite'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb'
                }}>
                  <IconShirt size={18} stroke={1.8} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Tarifs &amp; Articles</div>
                  <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>Catalogue pressing</div>
                </div>
              </div>

              {/* Carte Centrale Principale : Caisse & Commandes en direct */}
              <div style={{
                width: '240px',
                borderRadius: '24px',
                background: '#ffffff',
                boxShadow: '0 22px 50px -12px rgba(37, 99, 235, 0.16), 0 0 0 1px rgba(226, 232, 240, 0.8)',
                padding: '1.4rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 1
              }}>
                {/* Entête Carte Caisse */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '11px',
                      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7'
                    }}>
                      <IconReceipt size={20} stroke={2} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Caisse Direct</div>
                      <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Dépôts &amp; Retraits</div>
                    </div>
                  </div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#059669',
                    fontSize: '0.64rem',
                    fontWeight: 700
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                    En direct
                  </span>
                </div>

                {/* KPI & Graphique d'activité */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '14px',
                  padding: '0.8rem 0.9rem',
                  border: '1px solid #f1f5f9',
                  marginBottom: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>
                      24 Dépôts
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      color: '#10b981',
                      fontSize: '0.7rem',
                      fontWeight: 800
                    }}>
                      <IconTrendingUp size={13} stroke={2.5} />
                      +18.4%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px' }}>
                    Commandes du jour enregistrées
                  </div>
                </div>

                {/* Mini Indicateur de Flux */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', fontWeight: 600, color: '#64748b' }}>
                    <span>Traitement &amp; Repassage</span>
                    <span style={{ color: '#0284c7', fontWeight: 700 }}>88% prêt</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: '88%', height: '100%', background: 'linear-gradient(90deg, #38bdf8, #2563eb)', borderRadius: '9999px' }} />
                  </div>
                </div>
              </div>

              {/* Satellite Flottant Bas-Gauche : Gestion & Fichier Clients */}
              <div style={{
                position: 'absolute',
                bottom: '-12px',
                left: '14px',
                padding: '8px 12px',
                borderRadius: '16px',
                background: '#ffffff',
                boxShadow: '0 14px 30px -6px rgba(99, 102, 241, 0.16), 0 0 0 1px rgba(226, 232, 240, 0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 2,
                animation: 'floatSlow 4s ease-in-out infinite 2s'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4f46e5'
                }}>
                  <IconUsers size={18} stroke={1.8} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Fichier Clients</div>
                  <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>Historique &amp; soldes</div>
                </div>
              </div>

              {/* Satellite Flottant Bas-Droite : Statistiques & Clôture */}
              <div style={{
                position: 'absolute',
                bottom: '-16px',
                right: '16px',
                padding: '7px 13px',
                borderRadius: '14px',
                background: '#ffffff',
                boxShadow: '0 12px 28px -5px rgba(16, 185, 129, 0.2), 0 0 0 1px rgba(226, 232, 240, 0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                color: '#059669',
                fontSize: '0.72rem',
                fontWeight: 700,
                zIndex: 3
              }}>
                <IconChartBar size={16} stroke={2} />
                <span>Statistiques &amp; Rapports</span>
              </div>
            </div>

            {/* Indicateur de Défilement Inférieur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1rem' }}>
              <span style={{ width: '28px', height: '4px', borderRadius: '4px', background: '#cbd5e1' }} />
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
            </div>
          </div>
        </div>

        {/* Modal Réinitialiser le PIN */}
        {showResetPinModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div className="card modal-dialog-card" onClick={(e) => e.stopPropagation()} style={{ width: '380px', maxWidth: '90%', padding: '1.75rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#0f172a', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0, color: '#0f172a' }}>Réinitialiser le code PIN</h3>
                <button type="button" onClick={() => setShowResetPinModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '4px' }}>
                  <IconX size={18} stroke={2} />
                </button>
              </div>

              <form onSubmit={handleRequestPinResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: '1.45', margin: 0 }}>
                  Saisissez votre email professionnel. Une demande sera transmise pour réinitialiser votre code d'accès.
                </p>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="email"
                    required
                    placeholder="prenom.nom@pressingpro.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      outline: 'none',
                      fontSize: '0.88rem',
                      background: '#f8fafc',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowResetPinModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.82rem' }}>Annuler</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}>Envoyer la demande</button>
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

          {/* ── Header: Title & Environment Pill ── */}
          <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '0.35rem' }}>
            <div className="sidebar-title-text" style={{ lineHeight: 1.2 }}>
              Pressing Pro - Admin
            </div>
            {appEnv && (appEnv === 'test' || appEnv === 'staging' || appEnv === 'beta') && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  background: appEnv === 'test' ? 'rgba(234, 179, 8, 0.16)' : 'rgba(249, 115, 22, 0.16)',
                  color: appEnv === 'test' ? '#facc15' : '#fb923c',
                  border: `1px solid ${appEnv === 'test' ? 'rgba(234, 179, 8, 0.35)' : 'rgba(249, 115, 22, 0.35)'}`,
                  lineHeight: 1.4,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: appEnv === 'test' ? '#facc15' : '#fb923c',
                    boxShadow: `0 0 6px ${appEnv === 'test' ? '#facc15' : '#fb923c'}`,
                  }}
                />
                {appEnv === 'test' ? 'Test' : 'Staging'}
              </span>
            )}
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
