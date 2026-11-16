import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Store,
  User,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { db } from '../../../services/db';

const ALLOWED_ROLES = ['super_admin', 'manager', 'gestionnaire', 'gestionnaire_laverie'];

export default function ValidationsTab({ currentUser, stores = [] }) {
  const [filterStatus, setFilterStatus] = useState('pending');
  const [busyId, setBusyId] = useState(null);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState(null);

  const userRole = String(currentUser?.role || '').toLowerCase();
  const canValidate = ALLOWED_ROLES.includes(userRole);
  const isSuperAdmin = userRole === 'super_admin';

  const adjustments = db.getRewardPointAdjustments ? db.getRewardPointAdjustments() : [];

  const storeMap = useMemo(() => {
    const map = {};
    stores.forEach((s) => {
      map[s.id] = s.name || s.nom || s.id;
    });
    return map;
  }, [stores]);

  const scopedAdjustments = useMemo(() => {
    return adjustments.filter((adj) => {
      if (isSuperAdmin || !currentUser?.store_id || currentUser.store_id === 'all') return true;
      return adj.store_id === currentUser.store_id;
    });
  }, [adjustments, isSuperAdmin, currentUser]);

  const visibleList = useMemo(() => {
    if (filterStatus === 'all') return scopedAdjustments;
    return scopedAdjustments.filter((a) => a.status === filterStatus);
  }, [scopedAdjustments, filterStatus]);

  const pendingCount = useMemo(
    () => scopedAdjustments.filter((a) => a.status === 'pending').length,
    [scopedAdjustments]
  );

  const handleApprove = async (adj) => {
    if (!canValidate || busyId) return;
    setBusyId(adj.id);
    setFeedback(null);
    try {
      await db.validateRewardPointAdjustment(adj.id, 'approve');
      setFeedback({
        type: 'success',
        text: `Ajustement de ${adj.points_delta > 0 ? `+${adj.points_delta}` : adj.points_delta} pts validé pour ${adj.customer_name || 'le client'}. Notification envoyée au point de laverie.`
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors de la validation.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalItem || !canValidate || busyId) return;
    setBusyId(rejectModalItem.id);
    setFeedback(null);
    try {
      await db.validateRewardPointAdjustment(rejectModalItem.id, 'reject', rejectReason);
      setFeedback({
        type: 'success',
        text: `Demande refusée pour ${rejectModalItem.customer_name || 'le client'}.`
      });
      setRejectModalItem(null);
      setRejectReason('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors du refus.' });
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          padding: '1.25rem 1.4rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Tâches de Validation — Points Reward
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Validation réservée au Super Administrateur et au Gestionnaire de laverie ({pendingCount} en attente)
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'pending', label: `En attente (${pendingCount})` },
            { id: 'approved', label: 'Validés' },
            { id: 'rejected', label: 'Refusés' },
            { id: 'all', label: 'Tout' }
          ].map((tab) => {
            const active = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: active ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: active ? 'var(--primary)' : 'var(--bg-app)',
                  color: active ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {!canValidate && (
        <div
          style={{
            padding: '0.9rem 1.1rem',
            borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertCircle size={16} />
          Seuls les comptes Super Administrateur et Gestionnaire de laverie peuvent approuver ou refuser ces ajustements.
        </div>
      )}

      {feedback && (
        <div
          style={{
            padding: '0.85rem 1.1rem',
            borderRadius: '14px',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            color: feedback.type === 'success' ? '#059669' : '#dc2626',
            fontSize: '0.84rem',
            fontWeight: 600
          }}
        >
          {feedback.text}
        </div>
      )}

      {visibleList.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '18px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}
        >
          <Sparkles size={28} style={{ opacity: 0.45, marginBottom: '0.5rem' }} />
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Aucune tâche de validation dans cette catégorie
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Les demandes d&apos;ajustement de points fidélité apparaîtront ici en temps réel.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {visibleList.map((adj) => {
            const isPending = adj.status === 'pending';
            const isApproved = adj.status === 'approved';
            const sign = adj.points_delta > 0 ? `+${adj.points_delta}` : `${adj.points_delta}`;
            const statusStyle = isPending
              ? { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', label: 'En attente' }
              : isApproved
              ? { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', label: 'Validé' }
              : { bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', label: 'Refusé' };

            return (
              <div
                key={adj.id}
                style={{
                  background: 'var(--bg-card)',
                  border: isPending ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        background: adj.points_delta >= 0 ? 'rgba(37, 99, 235, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: adj.points_delta >= 0 ? '#2563eb' : '#dc2626'
                      }}
                    >
                      {sign} pts
                    </span>
                    <strong style={{ fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                      {adj.customer_name || adj.customer_id}
                    </strong>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      {isPending ? <Clock size={12} /> : isApproved ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {statusStyle.label}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-app)',
                      padding: '0.55rem 0.8rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <strong>Motif :</strong> {adj.reason}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <User size={13} /> Demandé par : {adj.requested_by_name || 'Agent'} ({adj.requested_by_role || 'staff'})
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Store size={13} /> {storeMap[adj.store_id] || adj.store_id || 'Point Central'}
                    </span>
                    <span>Le {formatDate(adj.created_at)}</span>
                  </div>

                  {!isPending && adj.validated_by_name && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {isApproved ? 'Validé' : 'Refusé'} par <strong>{adj.validated_by_name}</strong> le {formatDate(adj.validated_at)}
                      {adj.rejection_reason ? ` — Raison : ${adj.rejection_reason}` : ''}
                    </div>
                  )}
                </div>

                {isPending && canValidate && (
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={busyId === adj.id}
                      onClick={() => setRejectModalItem(adj)}
                      style={{
                        padding: '0.55rem 0.95rem',
                        borderRadius: '11px',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#dc2626',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <XCircle size={15} /> Refuser
                    </button>
                    <button
                      type="button"
                      disabled={busyId === adj.id}
                      onClick={() => handleApprove(adj)}
                      style={{
                        padding: '0.55rem 1.05rem',
                        borderRadius: '11px',
                        border: 'none',
                        background: '#059669',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <CheckCircle2 size={15} /> {busyId === adj.id ? 'Validation...' : 'Valider'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejectModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '18px',
              border: '1px solid var(--border-color)',
              width: '100%',
              maxWidth: '420px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem'
            }}
          >
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Refuser l&apos;ajustement ({rejectModalItem.points_delta > 0 ? `+${rejectModalItem.points_delta}` : rejectModalItem.points_delta} pts)
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Client : <strong>{rejectModalItem.customer_name}</strong>
            </p>
            <input
              type="text"
              placeholder="Raison du refus (optionnel)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                padding: '0 12px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => {
                  setRejectModalItem(null);
                  setRejectReason('');
                }}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busyId === rejectModalItem.id}
                onClick={handleConfirmReject}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
