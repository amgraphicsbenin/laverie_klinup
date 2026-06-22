import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Capture globale des erreurs React — évite l'écran vide silencieux sur Android
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem', fontFamily: 'sans-serif', background: '#fff',
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '1rem'
        }}>
          <div style={{ fontSize: '2.5rem' }}>⚠️</div>
          <h2 style={{ color: '#dc2626', margin: 0, fontSize: '1rem' }}>Erreur de chargement</h2>
          <p style={{ color: '#52525b', fontSize: '0.8rem', textAlign: 'center', maxWidth: 280 }}>
            {this.state.error?.message || 'Une erreur inattendue s\'est produite.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#3b82f6', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '0.6rem 1.4rem',
              fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            Recharger l'application
          </button>
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
)

