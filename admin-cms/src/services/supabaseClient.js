import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';

let supabaseInstance = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[SUPABASE SÉCURITÉ] Identifiants Supabase non configurés dans le fichier .env. " +
    "Veuillez définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour activer la synchronisation serveur."
  );
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("[SUPABASE] Erreur lors de la création du client Supabase :", error);
  }
}

export const supabase = supabaseInstance;

