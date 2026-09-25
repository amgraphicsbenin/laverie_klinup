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
 * 1. Surcharge manuelle via URL query (ex: ?env=test ou ?env=staging ou ?env=prod)
 * 2. Détection LOCALHOST / DEV -> Toujours 'test' pour isoler la production
 * 3. Hostname du navigateur Vercel (détection automatique par URL de preview)
 * 4. Variable Git injectée par Vercel au build (VERCEL_GIT_COMMIT_REF)
 * 5. Variable Vite VITE_APP_ENV
 * 6. Fallback par défaut : 'test' (Principe de précaution : jamais prod par défaut)
 */
export function detectAppEnv() {
  // 1. Détection RUNTIME dans le navigateur
  if (typeof window !== 'undefined' && window.location) {
    const hostname = (window.location.hostname || '').toLowerCase();
    const search = (window.location.search || '').toLowerCase();

    // Surcharge manuelle via URL param
    if (search.includes('env=test')) return 'test';
    if (search.includes('env=staging') || search.includes('env=beta')) return 'staging';
    if (search.includes('env=prod') || search.includes('env=production')) return 'production';

    // 🔒 SÉCURITÉ LOCALE : Tout environnement local (localhost, 127.0.0.1, réseau local)
    // DOIT STRICTEMENT ÊTRE EN 'test' POUR NE JAMAIS TOUCHER LA PROD !
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.')
    ) {
      return 'test';
    }

    // Détection via les domaines et sous-domaines Vercel Test
    if (
      hostname.includes('-git-test') ||
      hostname.includes('-test.') ||
      hostname.includes('.test.') ||
      hostname.startsWith('test-') ||
      hostname.startsWith('test.')
    ) {
      return 'test';
    }

    // Détection Staging / Bêta
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

    // Domaine de production officiel
    if (
      hostname.includes('laverie.klinup.com') ||
      hostname.includes('admin.klinup.com') ||
      hostname.includes('laverie-klinup.vercel.app')
    ) {
      return 'production';
    }
  }

  // 2. Détection BUILD-TIME via variable Vite ou Vercel Git Branch
  const buildGitBranch = (
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_APP_ENV || import.meta.env.VERCEL_GIT_COMMIT_REF)) || ''
  ).trim().toLowerCase();

  if (buildGitBranch === 'production' || buildGitBranch === 'main') return 'production';
  if (buildGitBranch === 'staging' || buildGitBranch === 'beta') return 'staging';
  if (buildGitBranch === 'test') return 'test';

  // 3. Si Vite tourne en mode développement local
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    return 'test';
  }

  // Fallback de sécurité : jamais 'production' sans preuve formelle
  return 'test';
}

export const appEnv = detectAppEnv();

// Résolution sécurisée de la base de données
const targetCreds = ENV_CREDENTIALS[appEnv] || ENV_CREDENTIALS.test;

const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
const envKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';

let resolvedUrl = targetCreds.url;
let resolvedKey = targetCreds.anonKey;

// Protection anti-collision renforcée :
if (envUrl && envKey) {
  const isProdDb = envUrl.includes('ucnqwqkjnlsrbdbmukvz');
  if (appEnv !== 'production') {
    if (isProdDb) {
      console.warn(`[KLIN UP DB] 🛡️ SÉCURITÉ CRITIQUE : Tentative de connexion à la base de PROD bloquée sur l'environnement '${appEnv}'. Redirection forcée vers la base de TEST.`);
      resolvedUrl = ENV_CREDENTIALS.test.url;
      resolvedKey = ENV_CREDENTIALS.test.anonKey;
    } else {
      resolvedUrl = envUrl;
      resolvedKey = envKey;
    }
  } else {
    resolvedUrl = envUrl;
    resolvedKey = envKey;
  }
}

// Double verrou local : si on est sur localhost, interdiction formelle d'utiliser la base de prod
if (typeof window !== 'undefined' && window.location) {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost && resolvedUrl.includes('ucnqwqkjnlsrbdbmukvz') && !window.location.search.includes('env=force_prod')) {
    console.error("[KLIN UP DB] 🚨 VERROU LOCAL : Connexion à la production interdite depuis localhost. Forçage immédiat sur la base de test.");
    resolvedUrl = ENV_CREDENTIALS.test.url;
    resolvedKey = ENV_CREDENTIALS.test.anonKey;
  }
}

export const supabaseUrl = resolvedUrl;
export const supabaseAnonKey = resolvedKey;

console.log(`[KLIN UP] 🌍 Environnement actif : ${appEnv.toUpperCase()} | Base Supabase : ${supabaseUrl} (${appEnv === 'production' ? '🔴 PROD' : '🟢 TEST/ISOLÉ'})`);

let supabaseInstance = null;

try {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error("[SUPABASE] Erreur lors de la création du client Supabase :", error);
}

export const supabase = supabaseInstance;
