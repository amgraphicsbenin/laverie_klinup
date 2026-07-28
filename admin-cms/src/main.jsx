import React, { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'material-symbols/rounded.css';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[CRITICAL ERROR BOUNDARY] Unhandled React Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            padding: '2.5rem',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.15)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            alignItems: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>⚠️</div>
            
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Incident d'Affichage Détecté
            </h2>
            
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              L'application a rencontré un incident inattendu. Cliquez sur le bouton ci-dessous pour recharger l'interface administrateur.
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              style={{
                width: '100%',
                padding: '0.85rem 1.5rem',
                background: '#002cf7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Recharger l'Application Admin
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
