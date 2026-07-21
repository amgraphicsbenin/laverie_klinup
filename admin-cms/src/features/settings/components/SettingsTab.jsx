import React from 'react';
import { Sliders } from 'lucide-react';
import { db } from '../../../services/db';

export default function SettingsTab({
  handleSaveSettings,
  inputExpressHours,
  setInputExpressHours,
  inputExpressMarkup,
  setInputExpressMarkup,
  inputNormalHours,
  setInputNormalHours
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Sliders size={18} color="var(--primary)" />
          Configuration Délais & Majorations
        </h3>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Délai Express (heures)</label>
            <input
              type="number"
              className="input-control"
              required
              min="1"
              max="168"
              value={inputExpressHours}
              onChange={(e) => setInputExpressHours(e.target.value)}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temps de traitement en urgence (ex: 6)</span>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Majoration Express (%)</label>
            <input
              type="number"
              className="input-control"
              required
              min="0"
              max="200"
              value={inputExpressMarkup}
              onChange={(e) => setInputExpressMarkup(e.target.value)}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Taux additionnel sur les prix de base (ex: 50)</span>
          </div>
        </div>

        <div className="form-group" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
          <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Délai de Livraison Normal (heures)</label>
          <input
            type="number"
            className="input-control"
            required
            min="1"
            max="720"
            value={inputNormalHours}
            onChange={(e) => setInputNormalHours(e.target.value)}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temps de traitement standard de laverie (ex: 48)</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 2rem', fontWeight: 700, fontSize: '0.85rem' }}>
            Enregistrer les paramètres
          </button>
        </div>

        <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>État de la Connexion</h4>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 0, 0, 0.02)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Base de données principale</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {db.isRemote() ? "Connecté en temps réel au cloud Supabase" : "Exécution sur le stockage local (LocalStorage de secours)"}
              </span>
            </div>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.15rem 0.6rem',
                borderRadius: '20px',
                background: db.isRemote() ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: db.isRemote() ? '#10b981' : '#f59e0b',
                border: db.isRemote() ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                textTransform: 'uppercase'
              }}
            >
              {db.isRemote() ? 'Supabase Cloud' : 'Mode Local'}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
