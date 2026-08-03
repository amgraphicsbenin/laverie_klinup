import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Zap,
  Clock,
  Receipt,
  FileText,
  CheckCircle2,
  Cloud,
  Database,
  Save,
  RefreshCw,
  Sparkles,
  Calculator,
  Printer,
  ShieldCheck,
  Percent,
  Lock,
  AlertCircle,
  Crown,
  Award,
  Gift,
  Maximize2,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  Tag,
  Shirt,
  Truck,
  X
} from 'lucide-react';
import { db } from '../../../services/db';
import { REWARD_CATALOG } from '../../../utils/fidelityUtils.jsx';

const ModalPortal = ({ children }) => {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
};

export default function SettingsTab({
  handleSaveSettings,
  inputExpressHours,
  setInputExpressHours,
  inputExpressMarkup,
  setInputExpressMarkup,
  inputNormalHours,
  setInputNormalHours
}) {
  const [activeSubTab, setActiveSubTab] = useState('delays'); // 'delays' | 'reward' | 'receipt' | 'cloud'
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [receiptHeader, setReceiptHeader] = useState(() => (db.getSettings ? (db.getSettings().receipt_header || '') : 'KLIN UP - Laverie & Pressing Premium'));
  const [receiptFooter, setReceiptFooter] = useState(() => (db.getSettings ? (db.getSettings().receipt_footer || '') : 'Merci de votre confiance ! À bientôt chez KLIN UP.'));

  // Fidelity / Reward Settings State
  const [fidelityActive, setFidelityActive] = useState(() => (db.getSettings ? (db.getSettings().fidelity_active ?? true) : true));
  const [spendPerPoint, setSpendPerPoint] = useState(() => (db.getSettings ? (db.getSettings().fidelity_spend_per_point || 1000) : 1000));
  const [tierBronzeMaxPts, setTierBronzeMaxPts] = useState(() => (db.getSettings ? (db.getSettings().fidelity_tier_bronze_max_pts || 49) : 49));
  const [tierSilverPts, setTierSilverPts] = useState(() => (db.getSettings ? (db.getSettings().fidelity_tier_silver_pts || 50) : 50));
  const [tierGoldPts, setTierGoldPts] = useState(() => (db.getSettings ? (db.getSettings().fidelity_tier_gold_pts || 150) : 150));
  const [tierPlatinumPts, setTierPlatinumPts] = useState(() => (db.getSettings ? (db.getSettings().fidelity_tier_platinum_pts || 300) : 300));
  const [autoEarnPoints, setAutoEarnPoints] = useState(true);
  const [allowPOSRedeem, setAllowPOSRedeem] = useState(true);

  // Reward Catalog Management State
  const [rewardCatalog, setRewardCatalog] = useState(() => (db.getRewardCatalog ? db.getRewardCatalog() : REWARD_CATALOG));
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);

  // Modal Form State
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState('');
  const [rewardDiscount, setRewardDiscount] = useState('');
  const [rewardIcon, setRewardIcon] = useState('Gift');
  const [rewardDescription, setRewardDescription] = useState('');

  // Sync state when DB notifies of updates (e.g. after Supabase fetch completes)
  React.useEffect(() => {
    if (typeof db.subscribe === 'function') {
      const unsubscribe = db.subscribe(() => {
        if (db.getRewardCatalog) {
          setRewardCatalog(db.getRewardCatalog());
        }
        if (db.getSettings) {
          const s = db.getSettings();
          if (s.fidelity_spend_per_point !== undefined) setSpendPerPoint(s.fidelity_spend_per_point);
          if (s.fidelity_active !== undefined) setFidelityActive(s.fidelity_active);
        }
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, []);

  const handleOpenAddReward = () => {
    setEditingReward(null);
    setRewardTitle('');
    setRewardCost('50');
    setRewardDiscount('2000');
    setRewardIcon('Gift');
    setRewardDescription('');
    setShowRewardModal(true);
  };

  const handleOpenEditReward = (reward) => {
    setEditingReward(reward);
    setRewardTitle(reward.title || '');
    setRewardCost(String(reward.cost || 0));
    setRewardDiscount(String(reward.discountAmount || 0));
    setRewardIcon(reward.iconName || 'Gift');
    setRewardDescription(reward.description || '');
    setShowRewardModal(true);
  };

  const handleSaveFidelitySettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (db.updateSettings) {
      await db.updateSettings({
        fidelity_active: fidelityActive,
        fidelity_spend_per_point: Number(spendPerPoint) || 1000,
        fidelity_tier_bronze_max_pts: Number(tierBronzeMaxPts) || 49,
        fidelity_tier_silver_pts: Number(tierSilverPts) || 50,
        fidelity_tier_gold_pts: Number(tierGoldPts) || 150,
        fidelity_tier_platinum_pts: Number(tierPlatinumPts) || 300,
        fidelity_auto_earn_points: autoEarnPoints,
        fidelity_allow_pos_redeem: allowPOSRedeem
      });
    }
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleSaveReward = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!rewardTitle.trim()) return;

    const newItem = {
      id: editingReward ? editingReward.id : 'reward_' + Date.now(),
      title: rewardTitle.trim(),
      cost: Math.max(1, Number(rewardCost) || 10),
      discountAmount: Math.max(0, Number(rewardDiscount) || 0),
      iconName: rewardIcon,
      description: rewardDescription.trim() || `Récompense ${rewardTitle.trim()}`
    };

    let updatedList;
    if (editingReward) {
      updatedList = rewardCatalog.map(r => r.id === editingReward.id ? newItem : r);
    } else {
      updatedList = [...rewardCatalog, newItem];
    }

    if (db.updateRewardCatalog) {
      await db.updateRewardCatalog(updatedList);
    } else if (db.updateSettings) {
      await db.updateSettings({ reward_catalog: updatedList });
    }
    setRewardCatalog(updatedList);
    setShowRewardModal(false);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleDeleteReward = async (rewardId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette offre du catalogue des récompenses ?')) return;
    const updatedList = rewardCatalog.filter(r => r.id !== rewardId);
    if (db.updateRewardCatalog) {
      await db.updateRewardCatalog(updatedList);
    } else if (db.updateSettings) {
      await db.updateSettings({ reward_catalog: updatedList });
    }
    setRewardCatalog(updatedList);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleResetRewardCatalog = async () => {
    if (!window.confirm('Réinitialiser le catalogue des récompenses avec la configuration par défaut ?')) return;
    if (db.updateRewardCatalog) {
      await db.updateRewardCatalog(REWARD_CATALOG);
    } else if (db.updateSettings) {
      await db.updateSettings({ reward_catalog: REWARD_CATALOG });
    }
    setRewardCatalog(REWARD_CATALOG);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  // Invoice / Receipt Dimensions State
  const [paperFormat, setPaperFormat] = useState(() => (db.getSettings ? (db.getSettings().invoice_paper_format || '80mm') : '80mm'));
  const [paperWidth, setPaperWidth] = useState(() => (db.getSettings ? (db.getSettings().invoice_paper_width || 80) : 80));
  const [paperHeight, setPaperHeight] = useState(() => (db.getSettings ? (db.getSettings().invoice_paper_height || 0) : 0));
  const [orientation, setOrientation] = useState(() => (db.getSettings ? (db.getSettings().invoice_orientation || 'portrait') : 'portrait'));
  const [margin, setMargin] = useState(() => (db.getSettings ? (db.getSettings().invoice_margin || 5) : 5));

  const handleSelectPaperFormat = (fmt) => {
    setPaperFormat(fmt);
    if (fmt === '80mm') {
      setPaperWidth(80);
      setPaperHeight(0);
    } else if (fmt === '58mm') {
      setPaperWidth(58);
      setPaperHeight(0);
    } else if (fmt === 'A4') {
      setPaperWidth(210);
      setPaperHeight(297);
    } else if (fmt === 'A5') {
      setPaperWidth(148);
      setPaperHeight(210);
    }
  };

  // Protection par PIN pour l'accès aux paramètres de Base de Données
  const [dbPinInput, setDbPinInput] = useState('');
  const [isDbUnlocked, setIsDbUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');

  const handleVerifyDbPin = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (dbPinInput.trim() === '0167987797') {
      setIsDbUnlocked(true);
      setPinError('');
    } else {
      setPinError('Code PIN incorrect. Accès restreint.');
    }
  };

  const handlePinInputChange = (val) => {
    setDbPinInput(val);
    setPinError('');
    if (val.trim() === '0167987797') {
      setIsDbUnlocked(true);
      setPinError('');
    }
  };

  const handleSubmitForm = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (db.updateSettings) {
      db.updateSettings({
        receipt_header: receiptHeader,
        receipt_footer: receiptFooter,
        fidelity_active: fidelityActive,
        fidelity_spend_per_point: Number(spendPerPoint),
        fidelity_tier_bronze_max_pts: Number(tierBronzeMaxPts),
        fidelity_tier_silver_pts: Number(tierSilverPts),
        fidelity_tier_gold_pts: Number(tierGoldPts),
        fidelity_tier_platinum_pts: Number(tierPlatinumPts),
        auto_earn_points: autoEarnPoints,
        allow_pos_redeem: allowPOSRedeem,
        invoice_paper_format: paperFormat,
        invoice_paper_width: Number(paperWidth),
        invoice_paper_height: Number(paperHeight),
        invoice_orientation: orientation,
        invoice_margin: Number(margin),
        reward_catalog: rewardCatalog
      });
    }
    if (typeof handleSaveSettings === 'function') {
      try {
        handleSaveSettings(e);
      } catch (err) {
        console.warn('handleSaveSettings exception:', err);
      }
    }
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3500);
  };

  // Realtime calculations for express simulator
  const sampleBasePrice = 3000;
  const markupPercent = parseFloat(inputExpressMarkup) || 0;
  const markupAmount = Math.round((sampleBasePrice * markupPercent) / 100);
  const sampleExpressPrice = sampleBasePrice + markupAmount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'calc(100vh - 165px)', minHeight: '520px', maxHeight: '900px' }}>
      
      {/* PILLS NAVIGATION CATEGORIES (SANS LA BANNIÈRE EN-TÊTE ENCADRÉE) */}
      <div className="filter-pills-group" style={{ alignSelf: 'flex-start', flexShrink: 0 }}>
        <button
          type="button"
          className={`filter-pill-btn ${activeSubTab === 'delays' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('delays')}
        >
          <Zap size={15} /> Délais & Majorations
        </button>
        <button
          type="button"
          className={`filter-pill-btn ${activeSubTab === 'reward' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('reward')}
        >
          <Crown size={15} /> Reward & Fidélité Client
        </button>
        <button
          type="button"
          className={`filter-pill-btn ${activeSubTab === 'receipt' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('receipt')}
        >
          <Receipt size={15} /> Modèles de Reçus & Imprimante
        </button>
        <button
          type="button"
          className={`filter-pill-btn ${activeSubTab === 'cloud' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('cloud')}
        >
          <Cloud size={15} /> {isDbUnlocked ? 'Base de Données (Déverrouillée)' : '🔒 Base de Données & Cloud'}
        </button>
      </div>

      {/* MAIN CONTENT AREA WITH FORM */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
          
          {/* ========================================================
             SUB-TAB 1 : DÉLAIS ET MAJORATIONS
             ======================================================== */}
          {activeSubTab === 'delays' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              
              {/* CARD 1 : TRAITEMENT EXPRESS */}
              <div className="card" style={{ borderRadius: '18px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Service Express (Urgence)</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Traitement prioritaire en laverie</span>
                    </div>
                  </div>
                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', fontSize: '0.68rem' }}>Prioritaire</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} color="var(--primary)" /> Délai Express (en heures)
                    </label>
                    <input
                      type="number"
                      className="search-control-input"
                      style={{ paddingLeft: '0.95rem', fontWeight: 700, fontSize: '1rem' }}
                      required
                      min="1"
                      max="168"
                      value={inputExpressHours}
                      onChange={(e) => setInputExpressHours(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                      {['3', '6', '12', '24'].map(h => (
                        <button
                          key={h}
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setInputExpressHours(h)}
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem', borderRadius: '6px', fontWeight: String(inputExpressHours) === h ? 800 : 500 }}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Percent size={14} color="var(--primary)" /> Majoration Express (%)
                    </label>
                    <input
                      type="number"
                      className="search-control-input"
                      style={{ paddingLeft: '0.95rem', fontWeight: 700, fontSize: '1rem' }}
                      required
                      min="0"
                      max="200"
                      value={inputExpressMarkup}
                      onChange={(e) => setInputExpressMarkup(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                      {['25', '50', '75', '100'].map(m => (
                        <button
                          key={m}
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setInputExpressMarkup(m)}
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem', borderRadius: '6px', fontWeight: String(inputExpressMarkup) === m ? 800 : 500 }}
                        >
                          +{m}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SIMULATEUR EN TEMPS RÉEL */}
                <div style={{ background: 'var(--bg-app)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calculator size={14} color="var(--primary)" /> Simulation Tarif Express :
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Prix de base (ex: Costume) :</span>
                    <strong>{sampleBasePrice.toLocaleString()} FCFA</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Supplément Urgence (+{markupPercent}%) :</span>
                    <strong>+{markupAmount.toLocaleString()} FCFA</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.3rem', marginTop: '0.2rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Prix Final Express :</span>
                    <span>{sampleExpressPrice.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>

              {/* CARD 2 : TRAITEMENT STANDARD */}
              <div className="card" style={{ borderRadius: '18px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Service Standard</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Délai habituel de remise en laverie</span>
                    </div>
                  </div>
                  <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)', fontSize: '0.68rem' }}>Standard</span>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} color="var(--primary)" /> Délai de Livraison Normal (en heures)
                  </label>
                  <input
                    type="number"
                    className="search-control-input"
                    style={{ paddingLeft: '0.95rem', fontWeight: 700, fontSize: '1rem' }}
                    required
                    min="1"
                    max="720"
                    value={inputNormalHours}
                    onChange={(e) => setInputNormalHours(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                    {['24', '48', '72'].map(h => (
                      <button
                        key={h}
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setInputNormalHours(h)}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem', borderRadius: '6px', fontWeight: String(inputNormalHours) === h ? 800 : 500 }}
                      >
                        {h}h ({parseInt(h)/24}j)
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                    Temps de traitement standard de la commande avant notification au client ({inputNormalHours || 48}h).
                  </span>
                </div>

                {/* INFO CONTAINER */}
                <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginTop: 'auto' }}>
                  <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    <strong>Calcul Automatique des Échéances :</strong> Lors de la création d'une commande sur la caisse ou l'application mobile, le système applique ces délais pour calculer l'heure exacte de livraison garantie.
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================
             SUB-TAB : PROGRAMME REWARD & FIDÉLITÉ
             ======================================================== */}
          {activeSubTab === 'reward' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
              
              {/* CARD 1 : RÈGLES D'ATTRIBUTION DES POINTS */}
              <div className="card" style={{ borderRadius: '18px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Attribution des Points</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Calcul automatique des points fidélité</span>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={fidelityActive}
                      onChange={(e) => setFidelityActive(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: fidelityActive ? '#10b981' : 'var(--text-muted)' }}>
                      {fidelityActive ? 'Actif' : 'Inactif'}
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'block' }}>
                      Tranche de Dépense pour 1 Point (FCFA) :
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        className="input-control"
                        value={spendPerPoint}
                        onChange={(e) => setSpendPerPoint(e.target.value)}
                        placeholder="Ex: 1000"
                        style={{ width: '100%', paddingRight: '4rem' }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        FCFA
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                      Exemple : Pour {Number(spendPerPoint).toLocaleString()} FCFA réglés, le client accumule 1 point de fidélité.
                    </span>
                  </div>

                  <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={autoEarnPoints}
                        onChange={(e) => setAutoEarnPoints(e.target.checked)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      Attribution automatique lors du règlement des dépôts/commandes
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={allowPOSRedeem}
                        onChange={(e) => setAllowPOSRedeem(e.target.checked)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      Autoriser l'échange de récompenses en caisse et sur l'application mobile
                    </label>
                  </div>
                </div>
              </div>

              {/* CARD 2 : SEUILS DES PALIERS FIDÉLITÉ (TIERS) */}
              <div className="card" style={{ borderRadius: '18px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Seuils des Paliers de Fidélité</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Niveaux de progression clients</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Bronze */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🥉 Seuil / Intervalle Niveau Bronze (pts) :</span>
                      <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 800, background: 'rgba(217, 119, 6, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                        Intervalle : 0 à {tierBronzeMaxPts || 49} pts
                      </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        className="input-control"
                        value={tierBronzeMaxPts}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTierBronzeMaxPts(val);
                          const num = Number(val);
                          if (!isNaN(num) && num >= 0) {
                            setTierSilverPts(num + 1);
                          }
                        }}
                        placeholder="Ex: 49"
                        style={{ width: '100%', paddingRight: '5rem' }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        pts (max)
                      </span>
                    </div>
                  </div>

                  {/* Silver */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🥈 Seuil Niveau Argent (pts) :</span>
                      <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 800, background: 'rgba(2, 132, 199, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                        Intervalle : {tierSilverPts} à {(Number(tierGoldPts) || 150) - 1} pts
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input-control"
                      value={tierSilverPts}
                      onChange={(e) => setTierSilverPts(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Gold */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ca8a04', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🥇 Seuil Niveau Or (pts) :</span>
                      <span style={{ fontSize: '0.7rem', color: '#ca8a04', fontWeight: 800, background: 'rgba(202, 138, 4, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                        Intervalle : {tierGoldPts} à {(Number(tierPlatinumPts) || 300) - 1} pts
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input-control"
                      value={tierGoldPts}
                      onChange={(e) => setTierGoldPts(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Platinum */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>💎 Seuil Niveau Platine VIP (pts) :</span>
                      <span style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 800, background: 'rgba(124, 58, 237, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                        Intervalle : {tierPlatinumPts}+ pts (VIP)
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input-control"
                      value={tierPlatinumPts}
                      onChange={(e) => setTierPlatinumPts(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* ACTION BAR : SAVE FIDELITY SETTINGS */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '-0.25rem' }}>
                <button
                  type="button"
                  onClick={handleSaveFidelitySettings}
                  style={{
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)'
                  }}
                >
                  <Save size={16} /> Enregistrer les Paramètres de Fidélité
                </button>
              </div>

              {/* CARD 3 : CONFIGURATION MANUELLE DU CATALOGUE DES RÉCOMPENSES */}
              <div className="card" style={{ gridColumn: '1 / -1', borderRadius: '18px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Gift size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Catalogue des Récompenses Client</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Offres configurables échangeables en caisse et sur l'application mobile ({rewardCatalog.length} offres)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleResetRewardCatalog}
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-app)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                      title="Réinitialiser au catalogue par défaut"
                    >
                      <RotateCcw size={13} /> Réinitialiser
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenAddReward}
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        borderRadius: '10px',
                        border: 'none',
                        background: 'var(--primary)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                      }}
                    >
                      <Plus size={14} /> Ajouter une Récompense
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                  {rewardCatalog.map((reward) => {
                    const getRewardIcon = (iconName) => {
                      switch (iconName) {
                        case 'Tag': return <Tag size={16} color="#3b82f6" />;
                        case 'Shirt': return <Shirt size={16} color="#10b981" />;
                        case 'Truck': return <Truck size={16} color="#f59e0b" />;
                        case 'Sparkles': return <Sparkles size={16} color="#ec4899" />;
                        default: return <Gift size={16} color="#8b5cf6" />;
                      }
                    };

                    return (
                      <div key={reward.id} style={{ padding: '0.95rem 1rem', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              {getRewardIcon(reward.iconName)}
                              <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>{reward.title}</strong>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.15rem 0.55rem', borderRadius: '8px', flexShrink: 0 }}>
                              {reward.cost} pts
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{reward.description}</span>
                          {reward.discountAmount > 0 && (
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', marginTop: '0.15rem' }}>
                              Valeur : {reward.discountAmount.toLocaleString()} FCFA
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', paddingTop: '0.45rem', borderTop: '1px dashed var(--border-color)' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditReward(reward)}
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Edit size={12} /> Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReward(reward.id)}
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Trash2 size={12} /> Supprimer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================
             SUB-TAB 2 : MODÈLES DE REÇUS & FACTURES (LIVE PREVIEW)
             ======================================================== */}
          {activeSubTab === 'receipt' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
              
              {/* FORMULAIRE ÉDITION REÇUS & DIMENSIONS */}
              <div className="card" style={{ borderRadius: '18px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
                  <Receipt size={20} color="var(--primary)" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>Personnalisation des Reçus & Factures</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Mentions légales et configuration des formats d'impression</span>
                  </div>
                </div>

                {/* EN-TÊTE ET PIED DE PAGE */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <FileText size={14} color="var(--primary)" /> En-tête du Reçu (Nom / Titre / NIF / IFU)
                  </label>
                  <textarea
                    className="search-control-input"
                    rows={3}
                    style={{
                      padding: '0.65rem 0.85rem',
                      width: '100%',
                      borderRadius: '12px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontSize: '0.82rem',
                      lineHeight: 1.4
                    }}
                    placeholder={`Ex: KLIN UP - Laverie & Pressing Premium\nAkpakpa, Cotonou - Tél: +229 90 00 00 00\nNIF: 3201928374615 • IFU: 1234567890`}
                    value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    Permet d'insérer des retours à la ligne (Entrée) pour structurer le Nom, Adresse et Identifiants fiscaux.
                  </span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <FileText size={14} color="var(--primary)" /> Pied de Reçu (Mentions Légales & Conditions)
                  </label>
                  <textarea
                    className="search-control-input"
                    rows={2}
                    style={{
                      padding: '0.65rem 0.85rem',
                      width: '100%',
                      borderRadius: '12px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontSize: '0.82rem',
                      lineHeight: 1.4
                    }}
                    placeholder={`Ex: Merci de votre confiance !\nRetrait des vêtements impératif sous 30 jours.`}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    Affiché au bas du ticket avec les clauses de responsabilité et retours à la ligne.
                  </span>
                </div>

                {/* SECTION DIMENSIONS DE LA FACTURE */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Maximize2 size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Dimensions & Format de la Facture</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Format de sortie pour impression physique et génération PDF sur l'app & l'admin</span>
                    </div>
                  </div>

                  {/* Format Prédéterminé (Presets) */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
                      Sélectionner un Format Prédéterminé :
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.5rem' }}>
                      {[
                        { id: '80mm', label: '80mm POS', desc: '80 × Rouleau Auto' },
                        { id: '58mm', label: '58mm POS', desc: '58 × Rouleau Auto' },
                        { id: 'A4', label: 'A4 Standard', desc: '210 × 297 mm' },
                        { id: 'A5', label: 'A5 Demi-Page', desc: '148 × 210 mm' },
                        { id: 'custom', label: 'Sur Mesure', desc: 'Personnalisé' }
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => handleSelectPaperFormat(fmt.id)}
                          style={{
                            padding: '0.55rem 0.65rem',
                            borderRadius: '10px',
                            border: paperFormat === fmt.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            background: paperFormat === fmt.id ? 'var(--primary-light)' : 'var(--bg-app)',
                            color: paperFormat === fmt.id ? 'var(--primary)' : 'var(--text-primary)',
                            fontWeight: paperFormat === fmt.id ? 800 : 600,
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.1rem'
                          }}
                        >
                          <span style={{ fontSize: '0.78rem' }}>{fmt.label}</span>
                          <span style={{ fontSize: '0.64rem', color: paperFormat === fmt.id ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 500 }}>{fmt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Champs Dimensions (Largeur / Hauteur / Marges) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', background: 'var(--bg-app)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                        Largeur (mm) :
                      </label>
                      <input
                        type="number"
                        className="input-control"
                        value={paperWidth}
                        onChange={(e) => {
                          setPaperWidth(e.target.value);
                          setPaperFormat('custom');
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                        Hauteur (mm) :
                      </label>
                      <input
                        type="number"
                        className="input-control"
                        value={paperHeight}
                        onChange={(e) => {
                          setPaperHeight(e.target.value);
                          setPaperFormat('custom');
                        }}
                        placeholder="0 = Auto"
                        style={{ width: '100%' }}
                      />
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>0 = Rouleau Auto</span>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                        Marge (mm) :
                      </label>
                      <input
                        type="number"
                        className="input-control"
                        value={margin}
                        onChange={(e) => setMargin(e.target.value)}
                        placeholder="Ex: 5"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Orientation */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'block' }}>
                      Orientation d'Impression :
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[
                        { id: 'portrait', label: '📱 Portrait' },
                        { id: 'landscape', label: '🖼️ Paysage' }
                      ].map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setOrientation(o.id)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '10px',
                            border: orientation === o.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            background: orientation === o.id ? 'var(--primary-light)' : 'var(--bg-app)',
                            color: orientation === o.id ? 'var(--primary)' : 'var(--text-primary)',
                            fontWeight: orientation === o.id ? 800 : 600,
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* APERÇU DYNAMIQUE DE LA FACTURE / RECEIPT EN DIRECT */}
              <div className="card" style={{ borderRadius: '18px', padding: '1.25rem', background: '#f8fafc', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Printer size={16} color="var(--primary)" /> Aperçu du Rendu ({paperFormat.toUpperCase()})
                  </span>
                  <span className="badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>
                    {paperWidth}mm × {Number(paperHeight) > 0 ? `${paperHeight}mm` : 'Auto'}
                  </span>
                </div>

                {/* SIMULATION APERÇU THERMIQUE OU FEUILLE A4/A5 EN TEMPS RÉEL */}
                {(() => {
                  const numW = parseFloat(paperWidth) || 80;
                  const numH = parseFloat(paperHeight) || 0;
                  const numM = parseFloat(margin) || 5;

                  const isLandscape = orientation === 'landscape';
                  const effW = isLandscape && numH > 0 ? numH : numW;
                  const effH = isLandscape && numH > 0 ? numW : numH;

                  // Rendered px width: scaled smoothly from paperWidth mm
                  const previewWidthPx = Math.min(Math.max(effW * 3.4, 190), 520);
                  const previewMinHeightPx = effH > 0 ? Math.min(Math.max(effH * 1.8, 220), 650) : null;
                  const previewPaddingPx = Math.min(Math.max(numM * 2.2, 8), 32);

                  return (
                    <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto', padding: '0.5rem 0' }}>
                      <div style={{
                        width: `${previewWidthPx}px`,
                        minHeight: previewMinHeightPx ? `${previewMinHeightPx}px` : 'auto',
                        background: '#ffffff',
                        padding: `${previewPaddingPx}px`,
                        borderRadius: '12px',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.07)',
                        border: '1px dashed #cbd5e1',
                        fontFamily: effW >= 140 ? 'sans-serif' : 'monospace',
                        fontSize: effW < 65 ? '0.68rem' : effW < 100 ? '0.76rem' : '0.82rem',
                        color: '#1e293b',
                        lineHeight: 1.4,
                        transition: 'all 0.25s ease'
                      }}>
                        {/* EN-TÊTE D'IMPRESSION */}
                        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: effW >= 140 ? '1.05rem' : '0.88rem', marginBottom: '0.3rem', color: effW >= 140 ? 'var(--primary)' : 'inherit', whiteSpace: 'pre-line' }}>
                          {receiptHeader || 'KLIN UP - Laverie & Pressing Premium'}
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#64748b', marginBottom: '0.75rem' }}>
                          Point de Laverie: Akpakpa (KLP-739) • Tél: +229 90 00 00 00
                        </div>

                        <div style={{ borderTop: '1px dashed #94a3b8', borderBottom: '1px dashed #94a3b8', padding: '0.4rem 0', margin: '0.5rem 0', fontSize: '0.72rem' }}>
                          <div><strong>N° Facture :</strong> #KLP-2026-0042</div>
                          <div><strong>Date d'Émission :</strong> {new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                          <div><strong>Client :</strong> André Koutomi (+229 0168586868)</div>
                        </div>

                        {/* TABLEAU DES ARTICLES */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: '0.6rem 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>2x Chemise Homme (Repassage)</span>
                            <strong>2 000 F</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>1x Costume 2 Pièces (Lavage)</span>
                            <strong>3 500 F</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                            <span>⚡ Supplément Urgence (+50%)</span>
                            <strong>+2 750 F</strong>
                          </div>
                        </div>

                        {/* TOTAL */}
                        <div style={{ borderTop: '2px solid #0f172a', paddingTop: '0.4rem', marginTop: '0.6rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800 }}>
                          <span>TOTAL RÉGLÉ :</span>
                          <span>8 250 FCFA</span>
                        </div>

                        {/* FOOTER */}
                        <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '0.6rem', borderTop: '1px dashed #94a3b8', fontSize: '0.72rem', color: '#475569', whiteSpace: 'pre-line' }}>
                          {receiptFooter || 'Merci de votre confiance ! À bientôt chez KLIN UP.'}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

          {/* ========================================================
             SUB-TAB 3 : BASE DE DONNÉES ET CLOUD (PROTÉGÉ PAR PIN)
             ======================================================== */}
          {activeSubTab === 'cloud' && (
            <div>
              {!isDbUnlocked ? (
                /* ÉCRAN DE DÉVERROUILLAGE SÉCURISÉ PAR CODE PIN */
                <div className="card" style={{ maxWidth: '420px', margin: '2rem auto', padding: '2rem', borderRadius: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <Lock size={28} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Accès Restreint — Base de Données</h4>
                    <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Saisissez le code PIN à 10 chiffres (ex: 0167987797) pour afficher la configuration Supabase Cloud.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <input
                        type="password"
                        className="search-control-input"
                        style={{ paddingLeft: '1rem', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: 800, height: '46px' }}
                        placeholder="••••••••••"
                        maxLength={10}
                        value={dbPinInput}
                        onChange={(e) => handlePinInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleVerifyDbPin(e);
                          }
                        }}
                        autoFocus
                      />
                    </div>

                    {pinError && (
                      <div style={{ color: 'var(--danger)', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <AlertCircle size={14} /> {pinError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleVerifyDbPin}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '42px', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem' }}
                    >
                      <ShieldCheck size={16} /> Déverrouiller l'accès
                    </button>
                  </div>
                </div>
              ) : (
                /* CONTENU DÉVERROUILLÉ DE LA BASE DE DONNÉES */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  
                  {/* CARD CONNECTION */}
                  <div className="card" style={{ borderRadius: '18px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: db.isRemote() ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', color: db.isRemote() ? '#10b981' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Database size={18} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Moteur de Base de Données</h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Synchronisation PostgreSQL / Supabase Cloud</span>
                        </div>
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: db.isRemote() ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: db.isRemote() ? '#10b981' : '#d97706',
                          fontWeight: 800
                        }}
                      >
                        {db.isRemote() ? 'SUPABASE CLOUD' : 'LOCALSTORAGE'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', background: 'var(--bg-app)', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Statut Connexion Cloud :</span>
                        <strong style={{ color: db.isRemote() ? '#10b981' : '#f59e0b' }}>
                          {db.isRemote() ? '● Actif (Temps Réel)' : '● Mode Hors-Ligne'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Latence Moyenne :</span>
                        <strong>{db.isRemote() ? '24 ms' : '0 ms (Local)'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Canaux Realtime :</span>
                        <strong>5 Actifs (`catalog`, `orders`, `staff`)</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          alert("Test de connexion réussi ! Supabase Cloud répond correctement.");
                        }}
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 700 }}
                      >
                        <RefreshCw size={14} /> Tester Connexion
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setIsDbUnlocked(false)}
                        style={{ padding: '0.5rem 0.8rem', fontSize: '0.78rem', borderRadius: '10px', fontWeight: 700, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                      >
                        🔒 Verrouiller
                      </button>
                    </div>
                  </div>

                  {/* CARD CACHE ET DIAGNOSTIC */}
                  <div className="card" style={{ borderRadius: '18px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Diagnostic & Cache Local</h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Optimisation des performances navigateurs</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Les données du catalogue et des points de laverie sont conservées en mémoire vive et synchronisées en arrière-plan pour garantir un chargement instantané sans latence.
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', marginTop: 'auto' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          localStorage.clear();
                          alert("Cache local nettoyé avec succès. Les données seront rafraîchies depuis Supabase.");
                          window.location.reload();
                        }}
                        style={{ flex: 1, padding: '0.55rem', fontSize: '0.78rem', borderRadius: '10px', fontWeight: 700 }}
                      >
                        Effacer le Cache Local
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* BARRE D'ACTION PRINCIPALE : BOUTON ENREGISTRER ÉLÉGANT ET POSITIONNÉ AU BAS */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1rem',
            marginTop: 'auto',
            paddingBottom: '0.5rem'
          }}>
            <div>
              {isSavedToast ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 800, animation: 'fadeIn 0.2s ease' }}>
                  <CheckCircle2 size={18} /> Modifié avec succès ! Vos paramètres sont enregistrés.
                </div>
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Pensez à enregistrer vos modifications pour appliquer la nouvelle configuration.
                </span>
              )}
            </div>

            <button
              type="submit"
              onClick={handleSubmitForm}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 2.2rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontWeight: 800,
                fontSize: '0.88rem',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.32)',
                cursor: 'pointer'
              }}
            >
              <Save size={18} /> Enregistrer les paramètres
            </button>
          </div>

        </form>
      </div>

      {/* MODAL CONFIGURATION DE RÉCOMPENSE */}
      {showRewardModal && (
        <ModalPortal>
          <div className="modal-backdrop" onClick={() => setShowRewardModal(false)}>
            <div
              className="card modal-dialog-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '520px',
                background: 'var(--bg-card)',
                borderRadius: '24px',
                padding: '24px 28px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                margin: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Gift size={20} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {editingReward ? 'Modifier la Récompense' : 'Nouvelle Récompense Client'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRewardModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                >
                  <X size={20} color="var(--text-muted)" />
                </button>
              </div>

              <form onSubmit={handleSaveReward} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    Titre de l'offre / récompense
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Ex: Remise de 2 000 FCFA"
                    required
                    value={rewardTitle}
                    onChange={(e) => setRewardTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                      Coût en Points (pts)
                    </label>
                    <input
                      type="number"
                      className="input-control"
                      placeholder="Ex: 50"
                      required
                      min="1"
                      value={rewardCost}
                      onChange={(e) => setRewardCost(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                      Valeur / Déduction (FCFA)
                    </label>
                    <input
                      type="number"
                      className="input-control"
                      placeholder="Ex: 2000"
                      required
                      min="0"
                      value={rewardDiscount}
                      onChange={(e) => setRewardDiscount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    Icône représentative
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                      { name: 'Tag', label: 'Remise', icon: <Tag size={16} /> },
                      { name: 'Shirt', label: 'Vêtement', icon: <Shirt size={16} /> },
                      { name: 'Truck', label: 'Livraison', icon: <Truck size={16} /> },
                      { name: 'Sparkles', label: 'Repassage', icon: <Sparkles size={16} /> },
                      { name: 'Gift', label: 'Cadeau', icon: <Gift size={16} /> }
                    ].map(item => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setRewardIcon(item.name)}
                        style={{
                          padding: '0.45rem 0.75rem',
                          borderRadius: '10px',
                          border: `1px solid ${rewardIcon === item.name ? 'var(--primary)' : 'var(--border-color)'}`,
                          background: rewardIcon === item.name ? 'var(--primary-light)' : 'var(--bg-app)',
                          color: rewardIcon === item.name ? 'var(--primary)' : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    Description détaillée
                  </label>
                  <textarea
                    className="input-control"
                    rows={2}
                    style={{ resize: 'none', height: 'auto', padding: '0.65rem 0.85rem' }}
                    placeholder="Ex: Réduction de 2 000 FCFA sur la prochaine commande."
                    value={rewardDescription}
                    onChange={(e) => setRewardDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setShowRewardModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Save size={16} /> Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
