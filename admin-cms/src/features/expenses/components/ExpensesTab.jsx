import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Edit3,
  ExternalLink,
  FileText,
  Monitor,
  Plus,
  Receipt,
  Search,
  Smartphone,
  Store,
  Tag,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import CustomDatePicker from '../../../components/CustomDatePicker';
import CustomSelect from '../../../components/CustomSelect';
import MomoOperatorSelector from '../../../components/MomoOperatorSelector';
import { db } from '../../../services/db';

export const EXPENSE_CATEGORIES = [
  { id: 'produits', label: 'Produits & Lessives', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
  { id: 'electricite_eau', label: 'Électricité & Eau', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  { id: 'maintenance', label: 'Maintenance & Machines', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
  { id: 'fournitures', label: 'Fournitures & Emballages', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.12)' },
  { id: 'transport', label: 'Transport & Livraison', color: '#0891b2', bg: 'rgba(8, 145, 178, 0.12)' },
  { id: 'autres', label: 'Autres (Laverie)', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' }
];

export const PAYMENT_METHODS = [
  { id: 'especes', label: 'Espèces' },
  { id: 'mobile_money', label: 'Mobile Money' }
];

const formatCurrency = (val) => `${Math.round(Number(val) || 0).toLocaleString('fr-FR')} FCFA`;

const getCategoryMeta = (catId) =>
  EXPENSE_CATEGORIES.find((c) => c.id === catId) || {
    id: catId || 'autres',
    label: catId || 'Autres',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)'
  };

const getPaymentLabel = (methodId) => {
  if (methodId === 'momo' || methodId === 'mobile_money') return 'Mobile Money';
  return PAYMENT_METHODS.find((m) => m.id === methodId)?.label || 'Espèces';
};

export default function ExpensesTab({ currentUser, stores = [] }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const userRole = String(currentUser?.role || '').toLowerCase();
  const isSuperAdmin = userRole === 'super_admin';
  const userStoreId = currentUser?.store_id && currentUser.store_id !== 'all' ? currentUser.store_id : 'store_central';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState(() => (isSuperAdmin ? 'all' : userStoreId));
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formStoreId, setFormStoreId] = useState(userStoreId);
  const [formCategory, setFormCategory] = useState('produits');
  const [formLabel, setFormLabel] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPayment, setFormPayment] = useState('especes');
  const [formMomoOp, setFormMomoOp] = useState('MTN');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formReference, setFormReference] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formReceiptFile, setFormReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [detailExpenseId, setDetailExpenseId] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteReasonError, setDeleteReasonError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const expenses = db.getExpenses ? db.getExpenses() : [];
  const detailExpense = useMemo(
    () => (detailExpenseId ? expenses.find((e) => e.id === detailExpenseId) || null : null),
    [expenses, detailExpenseId]
  );

  const storeMap = useMemo(() => {
    const map = {};
    stores.forEach((s) => {
      map[s.id] = s.nom || s.name || s.id;
    });
    return map;
  }, [stores]);

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return expenses.filter((exp) => {
      if (!isSuperAdmin && exp.store_id && exp.store_id !== userStoreId) return false;
      if (storeFilter !== 'all' && exp.store_id !== storeFilter) return false;
      if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
      if (paymentFilter !== 'all' && exp.payment_method !== paymentFilter) return false;
      if (dateFrom && (exp.expense_date || '').slice(0, 10) < dateFrom) return false;
      if (dateTo && (exp.expense_date || '').slice(0, 10) > dateTo) return false;
      if (q) {
        const hay = `${exp.label || ''} ${exp.description || ''} ${exp.reference || ''} ${exp.created_by_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, isSuperAdmin, userStoreId, storeFilter, categoryFilter, paymentFilter, dateFrom, dateTo, searchQuery]);

  const stats = useMemo(() => {
    const valid = filteredExpenses.filter((e) => e.status !== 'rejetee');
    const total = valid.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const count = valid.length;
    const avg = count > 0 ? total / count : 0;
    const byCat = {};
    valid.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + (Number(e.amount) || 0);
    });
    let topCat = null;
    let topCatVal = 0;
    Object.entries(byCat).forEach(([cat, val]) => {
      if (val > topCatVal) {
        topCatVal = val;
        topCat = cat;
      }
    });
    return { total, count, avg, topCat, topCatVal };
  }, [filteredExpenses]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setFormStoreId(storeFilter !== 'all' ? storeFilter : userStoreId);
    setFormCategory('produits');
    setFormLabel('');
    setFormAmount('');
    setFormPayment('especes');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormReference('');
    setFormDescription('');
    setFormReceiptFile(null);
    setShowModal(true);
  };

  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setFormStoreId(exp.store_id || userStoreId);
    setFormCategory(exp.category || 'autres');
    setFormLabel(exp.label || '');
    setFormAmount(String(exp.amount || ''));
    setFormPayment(exp.payment_method || 'especes');
    setFormDate((exp.expense_date || new Date().toISOString()).slice(0, 10));
    setFormReference(exp.reference || '');
    setFormDescription(exp.description || '');
    setFormReceiptFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const amt = Number(formAmount);
    if (!formLabel.trim()) {
      setFeedback({ type: 'error', text: 'Veuillez saisir un libellé de dépense.' });
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setFeedback({ type: 'error', text: 'Veuillez saisir un montant valide (> 0 FCFA).' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      let targetExpenseId = editingExpense?.id;
      if (editingExpense) {
        await db.updateExpense(editingExpense.id, {
          store_id: formStoreId,
          category: formCategory,
          label: formLabel.trim(),
          description: formDescription.trim() || null,
          amount: amt,
          payment_method: formPayment,
          expense_date: formDate,
          reference: formReference.trim() || null
        });
      } else {
        const created = await db.createExpense({
          store_id: formStoreId,
          category: formCategory,
          label: formLabel.trim(),
          description: formDescription.trim() || undefined,
          amount: amt,
          payment_method: formPayment,
          expense_date: formDate,
          reference: formReference.trim() || undefined
        });
        targetExpenseId = created?.id;
      }

      if (formReceiptFile && targetExpenseId) {
        await db.uploadExpenseReceipt(targetExpenseId, formReceiptFile);
      }

      setFeedback({
        type: 'success',
        text: editingExpense
          ? `Dépense "${formLabel.trim()}" mise à jour.`
          : `Dépense "${formLabel.trim()}" enregistrée (${formatCurrency(amt)}).`
      });
      setFormReceiptFile(null);
      setShowModal(false);
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || "Erreur lors de l'enregistrement de la dépense." });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (exp) => {
    setDeleteTarget(exp);
    setDeleteReason('');
    setDeleteReasonError('');
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!deleteTarget || deleting) return;
    const cleanReason = deleteReason.trim();
    if (!cleanReason) {
      setDeleteReasonError('Le motif de suppression est obligatoire.');
      return;
    }
    setDeleting(true);
    setFeedback(null);
    try {
      await db.deleteExpense(deleteTarget.id, cleanReason);
      if (detailExpenseId === deleteTarget.id) setDetailExpenseId(null);
      setFeedback({ type: 'success', text: `Dépense "${deleteTarget.label}" supprimée.` });
      setDeleteTarget(null);
      setDeleteReason('');
    } catch (err) {
      setDeleteReasonError(err?.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadReceipt = async (expenseId, file) => {
    if (!file || uploadingReceipt) return;
    setUploadingReceipt(true);
    setFeedback(null);
    try {
      await db.uploadExpenseReceipt(expenseId, file);
      setFeedback({ type: 'success', text: 'Facture téléversée avec succès.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Échec du téléversement de la facture.' });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleRemoveReceipt = async (expenseId) => {
    if (uploadingReceipt) return;
    setUploadingReceipt(true);
    setFeedback(null);
    try {
      await db.deleteExpenseReceipt(expenseId);
      setFeedback({ type: 'success', text: 'Facture retirée de la dépense.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Impossible de retirer la facture.' });
    } finally {
      setUploadingReceipt(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* En-tête + bouton Nouvelle Dépense */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <DollarSign size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
              Dépenses de la Laverie
            </h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Suivi unifié en temps réel entre l&apos;application mobile et l&apos;administration
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          Nouvelle Dépense
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className="card"
          style={{
            padding: '0.8rem 1rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: feedback.type === 'error' ? '#ef4444' : '#10b981',
            border: `1px solid ${feedback.type === 'error' ? 'rgba(239, 68, 68, 0.28)' : 'rgba(16, 185, 129, 0.28)'}`
          }}
        >
          {feedback.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Cartes KPI (Style Admin CMS) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.9rem'
        }}
      >
        <div className="card" style={{ padding: '1rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.85rem', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={21} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Dépenses</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', lineHeight: 1.15, marginTop: '2px' }}>
              {formatCurrency(stats.total)}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.85rem', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Receipt size={21} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre d&apos;opérations</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', lineHeight: 1.15, marginTop: '2px' }}>
              {stats.count} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>saisies</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.85rem', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(8, 145, 178, 0.12)', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={21} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Dépense Moyenne</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', lineHeight: 1.15, marginTop: '2px' }}>
              {formatCurrency(stats.avg)}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.85rem', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Tag size={21} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Poste Principal</div>
            <div style={{ fontSize: '0.96rem', fontWeight: 600, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', lineHeight: 1.15, marginTop: '2px' }}>
              {stats.topCat ? getCategoryMeta(stats.topCat).label : '—'}
            </div>
            {stats.topCat && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {formatCurrency(stats.topCatVal)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtres (Style Admin CMS - harmonisé avec OrdersTab) */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.65rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.55rem', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', width: '250px', maxWidth: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="input-control"
                placeholder="Rechercher libellé, réf, auteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '0.76rem',
                  padding: '0.42rem 0.65rem 0.42rem 2rem',
                  borderRadius: '9px',
                  background: 'var(--bg-app)'
                }}
              />
            </div>

            <div style={{ width: '175px' }}>
              <CustomSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ fontSize: '0.76rem', padding: '0.42rem 0.65rem', borderRadius: '9px', background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}
              >
                <option value="all">Toutes catégories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </CustomSelect>
            </div>

            <div style={{ width: '155px' }}>
              <CustomSelect
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                style={{ fontSize: '0.76rem', padding: '0.42rem 0.65rem', borderRadius: '9px', background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}
              >
                <option value="all">Tous règlements</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </CustomSelect>
            </div>

            {isSuperAdmin && (
              <div style={{ width: '175px' }}>
                <CustomSelect
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  style={{ fontSize: '0.76rem', padding: '0.42rem 0.65rem', borderRadius: '9px', background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}
                >
                  <option value="all">Tous les points</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.nom || s.name || s.id}</option>
                  ))}
                </CustomSelect>
              </div>
            )}

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.22rem 0.55rem',
                background: 'var(--bg-app)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}
            >
              <CustomDatePicker
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Début"
                allowClear
                title="Date début"
                style={{
                  width: '126px',
                  fontSize: '0.76rem',
                  padding: '0.32rem 0.5rem',
                  borderRadius: '8px',
                  background: 'var(--bg-card)'
                }}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>au</span>
              <CustomDatePicker
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Fin"
                allowClear
                alignRight
                title="Date fin"
                style={{
                  width: '126px',
                  fontSize: '0.76rem',
                  padding: '0.32rem 0.5rem',
                  borderRadius: '8px',
                  background: 'var(--bg-card)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des dépenses */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {filteredExpenses.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Receipt size={36} style={{ opacity: 0.4, marginBottom: '0.6rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
              Aucune dépense trouvée
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem' }}>
              Enregistrez une dépense depuis cet espace ou depuis l&apos;onglet Gestion &gt; Dépenses de l&apos;application mobile.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Libellé &amp; Détails</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Catégorie</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Point</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Règlement</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Facture</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Source / Auteur</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Montant</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => {
                  const cat = getCategoryMeta(exp.category);
                  const hasReceipt = Boolean(exp.receipt_url);
                  const isPdf =
                    String(exp.receipt_mime_type || '').toLowerCase() === 'application/pdf' ||
                    String(exp.receipt_name || exp.receipt_url || '').toLowerCase().includes('.pdf');
                  return (
                    <tr
                      key={exp.id}
                      onClick={() => setDetailExpenseId(exp.id)}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} />
                          {(exp.expense_date || exp.created_at || '').slice(0, 10)}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{exp.label}</div>
                        {exp.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {exp.description}
                          </div>
                        )}
                        {exp.reference && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            Réf: {exp.reference}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: cat.color,
                            background: cat.bg
                          }}
                        >
                          {cat.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Store size={14} />
                          {storeMap[exp.store_id] || exp.store_id || 'Central'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CreditCard size={14} />
                          {getPaymentLabel(exp.payment_method)}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {hasReceipt ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.22rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: isPdf ? '#dc2626' : '#16a34a',
                              background: isPdf ? 'rgba(220, 38, 38, 0.12)' : 'rgba(22, 163, 74, 0.12)'
                            }}
                          >
                            {isPdf ? <FileText size={12} /> : <Receipt size={12} />}
                            {isPdf ? 'PDF' : 'Image'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {exp.source === 'app' ? <Smartphone size={13} /> : <Monitor size={13} />}
                          {exp.source === 'app' ? 'App Mobile' : 'Admin Web'}
                        </div>
                        {exp.created_by_name && <div>{exp.created_by_name}</div>}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#ef4444', whiteSpace: 'nowrap' }}>
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td
                        style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openEditModal(exp)}
                          title="Modifier"
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.35rem',
                            marginRight: '0.35rem',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(exp)}
                          title="Supprimer"
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: '8px',
                            padding: '0.35rem',
                            cursor: 'pointer',
                            color: '#ef4444'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modale Création / Édition (Harmonisée avec AdminView & OrderFormModal) */}
      {showModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="card modal-dialog-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '560px',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25), 0 10px 25px -5px rgba(15, 23, 42, 0.12)',
              cursor: 'default'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                {editingExpense ? 'Modifier la Dépense' : 'Nouvelle Dépense'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              {isSuperAdmin && stores.length > 0 && (
                <div className="form-group" style={{ margin: 0, zIndex: 40, position: 'relative' }}>
                  <label style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    Point de Laverie d&apos;Enregistrement
                  </label>
                  <CustomSelect
                    className="input-control"
                    value={formStoreId}
                    onChange={(e) => setFormStoreId(e.target.value)}
                    style={{ borderColor: 'var(--primary)', fontWeight: 600 }}
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.nom || s.name || s.id}</option>
                    ))}
                  </CustomSelect>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0, zIndex: 35, position: 'relative' }}>
                  <label>Catégorie <span style={{ color: '#ef4444' }}>*</span></label>
                  <CustomSelect
                    className="input-control"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="form-group" style={{ margin: 0, zIndex: 35, position: 'relative' }}>
                  <label>Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <CustomDatePicker
                    className="input-control"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    alignRight
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Libellé de la dépense <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ex: Achat bidon lessive 20L, Facture SBEE..."
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Montant (FCFA) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    className="input-control"
                    min="1"
                    step="1"
                    placeholder="Ex: 15000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0, zIndex: 30, position: 'relative' }}>
                  <label>Mode de règlement</label>
                  <CustomSelect
                    className="input-control"
                    value={formPayment}
                    onChange={(e) => setFormPayment(e.target.value)}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </CustomSelect>
                </div>
              </div>

              {(formPayment === 'mobile_money' || formPayment === 'momo') && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Opérateur Mobile Money <span style={{ color: '#ef4444' }}>*</span></label>
                  <MomoOperatorSelector value={formMomoOp} onChange={setFormMomoOp} compact />
                </div>
              )}

              <div className="form-group" style={{ margin: 0 }}>
                <label>Référence / N° Reçu (optionnel)</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ex: FAC-2026-041"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Notes / Description (optionnel)</label>
                <textarea
                  rows={2}
                  className="input-control"
                  placeholder="Détails complémentaires..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Facture / Justificatif (Image ou PDF, max 10 Mo)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="input-control"
                  onChange={(e) => setFormReceiptFile(e.target.files?.[0] || null)}
                />
                {formReceiptFile && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Fichier prêt : <strong>{formReceiptFile.name}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Enregistrement...' : editingExpense ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Détail de la dépense + Facture (Image & PDF) */}
      {detailExpense && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => !uploadingReceipt && setDetailExpenseId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '580px',
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {(() => {
              const cat = getCategoryMeta(detailExpense.category);
              const receiptUrl = detailExpense.receipt_url || '';
              const isPdf =
                String(detailExpense.receipt_mime_type || '').toLowerCase() === 'application/pdf' ||
                String(detailExpense.receipt_name || receiptUrl).toLowerCase().includes('.pdf');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Détail de la dépense
                    </h3>
                    <button
                      type="button"
                      onClick={() => !uploadingReceipt && setDetailExpenseId(null)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div
                    style={{
                      padding: '1rem 1.15rem',
                      borderRadius: '14px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.22rem 0.65rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: cat.color,
                          background: cat.bg
                        }}
                      >
                        {cat.label}
                      </span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {detailExpense.source === 'app' ? 'App Mobile' : 'Admin Web'}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {detailExpense.label}
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ef4444' }}>
                      -{formatCurrency(detailExpense.amount)}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      <span>Date : <strong>{(detailExpense.expense_date || detailExpense.created_at || '').slice(0, 10)}</strong></span>
                      <span>Règlement : <strong>{getPaymentLabel(detailExpense.payment_method)}</strong></span>
                      <span>Point : <strong>{storeMap[detailExpense.store_id] || detailExpense.store_id || 'Central'}</strong></span>
                    </div>
                    {detailExpense.reference && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Référence : <strong>{detailExpense.reference}</strong>
                      </div>
                    )}
                    {detailExpense.description && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Notes : {detailExpense.description}
                      </div>
                    )}
                    {detailExpense.created_by_name && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Enregistrée par {detailExpense.created_by_name}
                      </div>
                    )}
                  </div>

                  {/* Section Facture / Justificatif */}
                  <div
                    style={{
                      padding: '1rem 1.15rem',
                      borderRadius: '14px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        Facture / Justificatif
                      </strong>
                      {receiptUrl && (
                        <span
                          style={{
                            padding: '0.18rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: isPdf ? '#dc2626' : '#16a34a',
                            background: isPdf ? 'rgba(220, 38, 38, 0.12)' : 'rgba(22, 163, 74, 0.12)'
                          }}
                        >
                          {isPdf ? 'PDF' : 'Image'}
                        </span>
                      )}
                    </div>

                    {receiptUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {detailExpense.receipt_name || 'Facture jointe'}
                          </span>
                          <a
                            href={receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              color: 'var(--primary)',
                              textDecoration: 'none'
                            }}
                          >
                            <ExternalLink size={14} /> Ouvrir
                          </a>
                        </div>

                        {!isPdf && (
                          <img
                            src={receiptUrl}
                            alt="Aperçu facture"
                            style={{
                              width: '100%',
                              maxHeight: '260px',
                              objectFit: 'contain',
                              borderRadius: '10px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-app)'
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        Aucune facture téléversée pour cette dépense.
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                      <label
                        className="btn btn-primary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          cursor: uploadingReceipt ? 'not-allowed' : 'pointer',
                          opacity: uploadingReceipt ? 0.7 : 1
                        }}
                      >
                        <Upload size={15} />
                        {uploadingReceipt
                          ? 'Téléversement...'
                          : receiptUrl
                            ? 'Remplacer la facture'
                            : 'Téléverser la facture'}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={uploadingReceipt}
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) handleUploadReceipt(detailExpense.id, f);
                          }}
                        />
                      </label>

                      {receiptUrl && (
                        <button
                          type="button"
                          disabled={uploadingReceipt}
                          onClick={() => handleRemoveReceipt(detailExpense.id)}
                          className="btn btn-outline"
                          style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Formats supportés : Image (JPG, PNG, WEBP) et PDF (max 10 Mo)
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                      onClick={() => openDeleteModal(detailExpense)}
                    >
                      Supprimer
                    </button>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setDetailExpenseId(null);
                          openEditModal(detailExpense);
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setDetailExpenseId(null)}
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* Modal Confirmation Suppression avec Motif Obligatoire */}
      {deleteTarget && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--bg-card)',
              borderRadius: '18px',
              border: '1px solid var(--border-color)',
              padding: '1.4rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Supprimer la dépense ?
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Voulez-vous vraiment supprimer « {deleteTarget.label} » ({formatCurrency(deleteTarget.amount)}) ?
            </p>
            <form onSubmit={confirmDelete} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Motif de la suppression <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={2}
                  className="input-control"
                  placeholder="Ex : Erreur de saisie, doublon..."
                  value={deleteReason}
                  onChange={(e) => {
                    setDeleteReason(e.target.value);
                    if (deleteReasonError && e.target.value.trim()) setDeleteReasonError('');
                  }}
                  style={{
                    resize: 'vertical',
                    borderColor: deleteReasonError ? '#ef4444' : undefined
                  }}
                />
                {deleteReasonError && (
                  <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                    {deleteReasonError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  disabled={deleting}
                  className="btn btn-outline"
                  onClick={() => setDeleteTarget(null)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="btn"
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    opacity: deleting || !deleteReason.trim() ? 0.65 : 1,
                    cursor: deleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
