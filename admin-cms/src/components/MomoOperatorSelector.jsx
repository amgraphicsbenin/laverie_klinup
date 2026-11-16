import React from 'react';
import mtnLogo from '../assets/payments/mtn.webp';
import moovLogo from '../assets/payments/moov.png';
import celtisLogo from '../assets/payments/celtis.jpeg';

export const MOMO_OPERATORS = [
  {
    id: 'MTN',
    label: 'MTN',
    logo: mtnLogo,
    gradient: 'linear-gradient(135deg, #FFCC00, #FFA500)',
    textColor: '#1a1a1a'
  },
  {
    id: 'MOOV',
    label: 'MOOV',
    logo: moovLogo,
    gradient: 'linear-gradient(135deg, #0057A8, #003F7F)',
    textColor: '#ffffff'
  },
  {
    id: 'CELTIS',
    label: 'CELTIS',
    logo: celtisLogo,
    gradient: 'linear-gradient(135deg, #E30613, #B50010)',
    textColor: '#ffffff'
  }
];

export default function MomoOperatorSelector({ value = 'MTN', onChange, compact = false }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: compact ? '8px' : '10px' }}>
      {MOMO_OPERATORS.map((op) => {
        const isSelected = String(value || '').toUpperCase() === op.id;
        return (
          <button
            key={op.id}
            type="button"
            onClick={() => onChange(op.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              padding: compact ? '7px 6px' : '9px 8px',
              borderRadius: compact ? '10px' : '12px',
              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
              background: isSelected ? op.gradient : 'var(--bg-card)',
              color: isSelected ? op.textColor : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: compact ? '12px' : '13px',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: isSelected ? '0 4px 12px rgba(0, 44, 247, 0.2)' : 'none'
            }}
          >
            <img
              src={op.logo}
              alt={op.label}
              style={{
                width: compact ? '20px' : '24px',
                height: compact ? '20px' : '24px',
                borderRadius: '6px',
                objectFit: 'cover',
                background: '#fff',
                flexShrink: 0
              }}
            />
            <span>{op.label}</span>
          </button>
        );
      })}
    </div>
  );
}
