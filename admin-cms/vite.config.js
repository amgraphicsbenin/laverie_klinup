import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Détection de la branche Git lors du build Vercel ou local
const gitBranch = (process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || process.env.VITE_APP_ENV || '').trim().toLowerCase();
const buildEnv = (gitBranch === 'test' || gitBranch === 'staging' || gitBranch === 'production')
  ? gitBranch
  : ((process.env.VITE_APP_ENV || '').trim().toLowerCase());

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_ENV': JSON.stringify(buildEnv),
    'import.meta.env.VERCEL_GIT_COMMIT_REF': JSON.stringify(process.env.VERCEL_GIT_COMMIT_REF || ''),
  },
  server: {
    host: true,
    port: 5174
  }
})
