import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ucnqwqkjnlsrbdbmukvz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnF3cWtqbmxzcmJkYm11a3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA1NzEsImV4cCI6MjA5Njg0NjU3MX0.8RdoITBg_AXDqN2DxuZlarrF_sx-ya1DCSyS-FLy0mo';

let supabaseInstance = null;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('votre-project-id')) {
  console.warn(
    "[SUPABASE] Identifiants Supabase non configurés ou invalides dans le fichier .env. " +
    "Veuillez renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env. " +
    "Repli sur le localStorage local."
  );
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("[SUPABASE] Erreur lors de la création du client Supabase :", error);
  }
}

export const supabase = supabaseInstance;

