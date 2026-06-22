import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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

