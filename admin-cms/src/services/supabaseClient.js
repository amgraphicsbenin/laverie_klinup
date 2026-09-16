import { createClient } from '@supabase/supabase-js';

export const appEnv = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APP_ENV) || 'production').toLowerCase();

const defaultUrls = {
  test: 'https://ryjwrjzggfwglfmyovhk.supabase.co',
  staging: 'https://ryjwrjzggfwglfmyovhk.supabase.co',
  production: 'https://ucnqwqkjnlsrbdbmukvz.supabase.co',
};

const defaultAnonKeys = {
  test: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5andyanpnZ2Z3Z2xmbXlvdmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDE4NDcsImV4cCI6MjEwNTExNzg0N30.SuL0HAWzX2EmISFgf01wt5huArlRw5Dcd4fayMpVt8c',
  staging: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5andyanpnZ2Z3Z2xmbXlvdmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDE4NDcsImV4cCI6MjEwNTExNzg0N30.SuL0HAWzX2EmISFgf01wt5huArlRw5Dcd4fayMpVt8c',
  production: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnF3cWtqbmxzcmJkYm11a3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA1NzEsImV4cCI6MjA5Njg0NjU3MX0.8RdoITBg_AXDqN2DxuZlarrF_sx-ya1DCSyS-FLy0mo',
};

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || defaultUrls[appEnv] || defaultUrls.production;
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || defaultAnonKeys[appEnv] || defaultAnonKeys.production;

let supabaseInstance = null;

try {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error("[SUPABASE] Erreur lors de la création du client Supabase :", error);
}

export const supabase = supabaseInstance;

