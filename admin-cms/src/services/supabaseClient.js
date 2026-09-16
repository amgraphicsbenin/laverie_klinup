import { createClient } from '@supabase/supabase-js';

// Configuration officielle des bases Supabase pour chaque environnement
const ENV_CREDENTIALS = {
  test: {
    url: 'https://ryjwrjzggfwglfmyovhk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5andyanpnZ2Z3Z2xmbXlvdmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDE4NDcsImV4cCI6MjEwNTExNzg0N30.SuL0HAWzX2EmISFgf01wt5huArlRw5Dcd4fayMpVt8c',
    label: 'Test / QA'
  },
  staging: {
    url: 'https://ryjwrjzggfwglfmyovhk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5andyanpnZ2Z3Z2xmbXlvdmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDE4NDcsImV4cCI6MjEwNTExNzg0N30.SuL0HAWzX2EmISFgf01wt5huArlRw5Dcd4fayMpVt8c',
    label: 'Staging / Bêta'
  },
  production: {
    url: 'https://ucnqwqkjnlsrbdbmukvz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnF3cWtqbmxzcmJkYm11a3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA1NzEsImV4cCI6MjA5Njg0NjU3MX0.8RdoITBg_AXDqN2DxuZlarrF_sx-ya1DCSyS-FLy0mo',
    label: 'Production'
  }
};

/**
 * Détecte l'environnement actif avec une approche multi-couches :
 * 1. Paramètre URL query (ex: ?env=test ou ?env=staging ou ?env=prod)
 * 2. Hostname du navigateur Vercel (détection automatique par URL de preview)
 * 3. Variable Git injectée par Vercel au build (VERCEL_GIT_COMMIT_REF)
 * 4. Variable Vite VITE_APP_ENV
 * 5. Fallback : 'production'
 */
export function detectAppEnv() {
  // 1. Détection RUNTIME dans le navigateur (garantie sur les URLs Vercel)
  if (typeof window !== 'undefined' && window.location) {
    const hostname = (window.location.hostname || '').toLowerCase();
    const search = (window.location.search || '').toLowerCase();

    // Surcharge manuelle via URL param
    if (search.includes('env=test')) return 'test';
    if (search.includes('env=staging')) return 'staging';
    if (search.includes('env=prod') || search.includes('env=production')) return 'production';

    // Détection via les domaines et sous-domaines Vercel
    // Exemples : laverie-klinup-git-test-xxx.vercel.app, laverie-klinup-test.vercel.app
    if (
      hostname.includes('-git-test') ||
      hostname.includes('-test.') ||
      hostname.includes('.test.') ||
      hostname.startsWith('test-') ||
      hostname.startsWith('test.')
    ) {
      return 'test';
    }

    // Exemples : laverie-klinup-git-staging-xxx.vercel.app, laverie-klinup-staging.vercel.app, *-beta*
    if (
      hostname.includes('-git-staging') ||
      hostname.includes('-staging.') ||
      hostname.includes('.staging.') ||
      hostname.startsWith('staging-') ||
      hostname.startsWith('staging.') ||
      hostname.includes('-beta') ||
      hostname.includes('beta-')
    ) {
      return 'staging';
    }
  }

  // 2. Détection BUILD-TIME via Vercel Git Branch ou variable Vite
  const buildGitBranch = (
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VERCEL_GIT_COMMIT_REF || import.meta.env.VITE_APP_ENV)) || ''
  ).trim().toLowerCase();

  if (buildGitBranch === 'test') return 'test';
  if (buildGitBranch === 'staging' || buildGitBranch === 'beta') return 'staging';
  if (buildGitBranch === 'production' || buildGitBranch === 'main') return 'production';

  return 'production';
}

export const appEnv = detectAppEnv();

// Résolution sécurisée de la base de données
const targetCreds = ENV_CREDENTIALS[appEnv] || ENV_CREDENTIALS.production;

const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
const envKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';

let resolvedUrl = targetCreds.url;
let resolvedKey = targetCreds.anonKey;

// Protection anti-collision : si une variable d'environnement globale a été définie sur Vercel
// mais pointe vers la base de PROD, on l'ignore formellement sur l'environnement de Test/Staging !
if (envUrl && envKey) {
  const isProdDb = envUrl.includes('ucnqwqkjnlsrbdbmukvz');
  if (appEnv === 'test' || appEnv === 'staging') {
    if (!isProdDb) {
      resolvedUrl = envUrl;
      resolvedKey = envKey;
    } else {
      console.warn(`[KLIN UP DB] 🛡️ SÉCURITÉ : VITE_SUPABASE_URL globale de production bloquée sur l'environnement '${appEnv}'. Redirection vers la base de Test/Staging.`);
    }
  } else {
    resolvedUrl = envUrl;
    resolvedKey = envKey;
  }
}

export const supabaseUrl = resolvedUrl;
export const supabaseAnonKey = resolvedKey;

console.log(`[KLIN UP] 🌍 Environnement détecté : ${appEnv.toUpperCase()} | Base Supabase active : ${supabaseUrl}`);

let supabaseInstance = null;

try {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error("[SUPABASE] Erreur lors de la création du client Supabase :", error);
}

export const supabase = supabaseInstance;
