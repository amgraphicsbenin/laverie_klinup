import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT : base './' génère des chemins relatifs dans le build,
  // indispensable pour que Capacitor (Android/iOS WebView) trouve les assets.
  base: './',
  server: {
    port: 5174,
    host: true
  },
  build: {
    // Evite les warnings sur les gros chunks (MobileView.jsx)
    chunkSizeWarningLimit: 2000
  }
})

