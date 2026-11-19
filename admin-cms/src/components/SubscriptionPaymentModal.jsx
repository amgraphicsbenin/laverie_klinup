import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone } from './icons/tablerIcons';
import MomoOperatorSelector from './MomoOperatorSelector';

export default function SubscriptionPaymentModal({
  isOpen,
  plan,
  customerName,
  isSubmitting = false,
  onClose,
  onConfirm
}) {
  const planPrice = Number(plan?.prix || 0);
  const [amountText, setAmountText] = useState(String(Math.round(planPrice)));
  const [paymentMethod, setPaymentMethod] = useState('especes');
  const [momoOperator, setMomoOperator] = useState('MTN');
  const [momoRef, setMomoRef] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && plan) {
      setAmountText(String(Math.round(Number(plan.prix || 0))));
      setPaymentMethod('especes');
      setMomoOperator('MTN');
      setMomoRef('');
      setErrorMessage('');
    }
  }, [isOpen, plan]);

  if (!isOpen || !plan) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const paidVal = Number(amountText) || 0;
    if (paidVal <= 0) {
      setErrorMessage('Veuillez saisir le montant encaissé.');
      return;
    }
    if (paidVal < planPrice) {
      setErrorMessage(`Le règlement complet de ${planPrice.toLocaleString('fr-FR')} FCFA est requis.`);
      return;
    }
    if (paymentMethod === 'mobile_money') {
      const refTrimmed = momoRef.trim();
      if (!refTrimmed) {
        setErrorMessage('Le numéro de référence Mobile Money est obligatoire.');
        return;
      }
      if (!/^\d{8,15}$/.test(refTrimmed)) {
        setErrorMessage('La référence Mobile Money doit contenir entre 8 et 15 chiffres.');
        return;
      }
    }
    onConfirm({
      amountPaid: paidVal,
      paymentMethod,
      momoRef: paymentMethod === 'mobile_money' ? momoRef.trim() : null,
      momoOperator: paymentMethod === 'mobile_money' ? momoOperator : null
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 12000,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-card)',
          borderRadius: '22px',
          border: '1px solid var(--border-color)',
          padding: '22px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.22)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Règlement de l'abonnement
            </h3>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>
              {plan.article}
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.28)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Client :</span>
              <strong style={{ color: 'var(--text-primary)' }}>{customerName || '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Formule :</span>
              <strong style={{ color: 'var(--text-primary)' }}>{plan.article}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginTop: '2px' }}>
              <span style={{ fontWeight: 700, color: '#d97706' }}>Montant à payer :</span>
              <strong style={{ fontWeight: 800, color: '#d97706' }}>{planPrice.toLocaleString('fr-FR')} FCFA</strong>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Montant encaissé (FCFA) *
            </label>
            <input
              type="number"
              className="input-control"
              value={amountText}
              onChange={(e) => {
                setAmountText(e.target.value.replace(/\D/g, ''));
                setErrorMessage('');
              }}
              style={{ width: '100%', height: '42px', borderRadius: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Mode de paiement *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { key: 'especes', label: 'Espèce', Icon: DollarSign },
                { key: 'mobile_money', label: 'Mobile Money', Icon: Smartphone }
              ].map(({ key, label, Icon }) => {
                const selected = paymentMethod === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(key);
                      setErrorMessage('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      height: '42px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: selected ? 700 : 500,
                      fontSize: '0.82rem',
                      background: selected ? 'rgba(0, 44, 247, 0.08)' : 'var(--bg-app)',
                      border: selected ? '1.5px solid #0000FF' : '1px solid var(--border-color)',
                      color: selected ? '#0000FF' : 'var(--text-primary)'
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMethod === 'mobile_money' && (
            <>
              <MomoOperatorSelector
                value={momoOperator}
                onChange={(op) => {
                  setMomoOperator(op);
                  setErrorMessage('');
                }}
                compact
              />
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Numéro de référence Mobile Money *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-control"
                  placeholder="Ex: 1234567890"
                  maxLength={15}
                  value={momoRef}
                  onChange={(e) => {
                    setMomoRef(e.target.value.replace(/\D/g, '').slice(0, 15));
                    setErrorMessage('');
                  }}
                  style={{ width: '100%', height: '42px', borderRadius: '12px' }}
                />
              </div>
            </>
          )}

          {errorMessage && (
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ef4444' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              className="btn btn-outline"
              disabled={isSubmitting}
              onClick={onClose}
              style={{ borderRadius: '12px', padding: '0.55rem 1rem' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                borderRadius: '12px',
                padding: '0.55rem 1.15rem',
                background: '#0000FF',
                color: '#fff',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CreditCard size={15} />
              {isSubmitting ? 'Validation...' : 'Valider le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
