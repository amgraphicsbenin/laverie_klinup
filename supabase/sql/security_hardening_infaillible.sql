-- ============================================================================
-- 🛡️ ARCHITECTURE DE SÉCURITÉ INFAILLIBLE KLIN UP (SUPABASE RPC & RLS)
-- ============================================================================
-- Ce script renforce l'authentification mobile et l'isolation des données :
-- 1. Active `pgcrypto` pour le hachage sécurisé des codes PIN (bcrypt).
-- 2. Ajoute les colonnes anti-bruteforce (`failed_pin_attempts`, `locked_until`) sur `public.staff`.
-- 3. Crée la RPC `lookup_staff_login(p_email)` (SECURITY DEFINER) qui retourne uniquement
--    l'identité publique d'un employé actif sans jamais exposer `code_pin`.
-- 4. Crée la RPC `authenticate_staff_pin(p_staff_id, p_pin)` (SECURITY DEFINER) avec
--    blocage serveur automatique de 15 minutes après 5 tentatives erronées.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Colonnes de protection anti-bruteforce sur `public.staff`
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL;

-- 2. RPC Étape 1 : Recherche ciblée par email (Zéro fuite de `code_pin`)
CREATE OR REPLACE FUNCTION public.lookup_staff_login(p_email TEXT)
RETURNS TABLE (
  id TEXT,
  nom TEXT,
  prenom TEXT,
  email TEXT,
  role TEXT,
  user_picture TEXT,
  statut TEXT,
  telephone TEXT,
  store_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id::TEXT,
    COALESCE(s.nom, '')::TEXT,
    s.prenom::TEXT,
    s.email::TEXT,
    COALESCE(s.role, 'agent_caisse')::TEXT,
    s.user_picture::TEXT,
    COALESCE(s.statut, 'actif')::TEXT,
    s.telephone::TEXT,
    COALESCE(s.store_id, 'all')::TEXT
  FROM public.staff s
  WHERE LOWER(TRIM(s.email)) = LOWER(TRIM(p_email))
    AND LOWER(COALESCE(s.statut, 'actif')) = 'actif'
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_staff_login(TEXT) TO anon, authenticated;

-- 3. RPC Étape 2 : Vérification atomique du PIN avec anti-bruteforce serveur
CREATE OR REPLACE FUNCTION public.authenticate_staff_pin(
  p_staff_id TEXT,
  p_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff RECORD;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_pin_ok BOOLEAN := FALSE;
  v_new_attempts INTEGER;
BEGIN
  SELECT * INTO v_staff
  FROM public.staff
  WHERE id::TEXT = p_staff_id
    AND LOWER(COALESCE(statut, 'actif')) = 'actif'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'error_code', 'ACCOUNT_NOT_FOUND',
      'message', 'Compte introuvable ou inactif.'
    );
  END IF;

  -- Vérification du verrouillage actif
  IF v_staff.locked_until IS NOT NULL AND v_staff.locked_until > v_now THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'error_code', 'ACCOUNT_LOCKED',
      'remaining_seconds', CEIL(EXTRACT(EPOCH FROM (v_staff.locked_until - v_now)))::INT,
      'message', 'Compte temporairement verrouillé suite à plusieurs échecs.'
    );
  END IF;

  -- Refus strict si aucun PIN n'est configuré (pas de "000000" par défaut)
  IF v_staff.code_pin IS NULL OR LENGTH(TRIM(v_staff.code_pin)) < 4 THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'error_code', 'PIN_NOT_CONFIGURED',
      'message', 'Code PIN non configuré. Contactez un administrateur.'
    );
  END IF;

  -- Supporte les PIN hachés bcrypt ($2a$/$2b$) ainsi que la transition depuis les PIN existants
  IF v_staff.code_pin LIKE '$2a$%' OR v_staff.code_pin LIKE '$2b$%' THEN
    v_pin_ok := (v_staff.code_pin = crypt(TRIM(p_pin), v_staff.code_pin));
  ELSE
    v_pin_ok := (TRIM(v_staff.code_pin) = TRIM(p_pin));
  END IF;

  IF v_pin_ok THEN
    UPDATE public.staff
    SET failed_pin_attempts = 0,
        locked_until = NULL
    WHERE id::TEXT = p_staff_id;

    RETURN jsonb_build_object(
      'authenticated', true,
      'user', jsonb_build_object(
        'id', v_staff.id,
        'nom', COALESCE(v_staff.nom, ''),
        'prenom', v_staff.prenom,
        'email', v_staff.email,
        'role', COALESCE(v_staff.role, 'agent_caisse'),
        'user_picture', v_staff.user_picture,
        'statut', COALESCE(v_staff.statut, 'actif'),
        'telephone', v_staff.telephone,
        'store_id', COALESCE(v_staff.store_id, 'all')
      )
    );
  ELSE
    v_new_attempts := COALESCE(v_staff.failed_pin_attempts, 0) + 1;
    IF v_new_attempts >= 5 THEN
      UPDATE public.staff
      SET failed_pin_attempts = 0,
          locked_until = v_now + INTERVAL '15 minutes'
      WHERE id::TEXT = p_staff_id;

      RETURN jsonb_build_object(
        'authenticated', false,
        'error_code', 'ACCOUNT_LOCKED',
        'remaining_seconds', 900,
        'message', 'Compte verrouillé pendant 15 minutes après 5 tentatives incorrectes.'
      );
    ELSE
      UPDATE public.staff
      SET failed_pin_attempts = v_new_attempts
      WHERE id::TEXT = p_staff_id;

      RETURN jsonb_build_object(
        'authenticated', false,
        'error_code', 'INVALID_PIN',
        'remaining_attempts', (5 - v_new_attempts),
        'message', 'Code PIN incorrect.'
      );
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_staff_pin(TEXT, TEXT) TO anon, authenticated;
