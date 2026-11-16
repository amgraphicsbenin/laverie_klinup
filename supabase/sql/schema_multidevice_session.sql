-- ============================================================================
-- MIGRATION : GESTION MULTI-APPAREIL (SESSION UNIQUE PAR COMPTE)
-- Fichier : supabase/sql/schema_multidevice_session.sql
-- ============================================================================

-- 1. Colonnes de session active sur public.staff
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS active_device_id TEXT,
  ADD COLUMN IF NOT EXISTS active_session_token TEXT,
  ADD COLUMN IF NOT EXISTS active_device_name TEXT,
  ADD COLUMN IF NOT EXISTS active_device_model TEXT,
  ADD COLUMN IF NOT EXISTS active_android_version TEXT,
  ADD COLUMN IF NOT EXISTS active_app_version TEXT,
  ADD COLUMN IF NOT EXISTS active_session_at TIMESTAMPTZ;

COMMENT ON COLUMN public.staff.active_device_id IS 'Identifiant unique de l''appareil actuellement connecté';
COMMENT ON COLUMN public.staff.active_session_token IS 'Jeton de session actif (invalide automatiquement les autres appareils)';
COMMENT ON COLUMN public.staff.active_device_name IS 'Nom lisible du dernier appareil connecté';
COMMENT ON COLUMN public.staff.active_device_model IS 'Modèle matériel de l''appareil connecté';
COMMENT ON COLUMN public.staff.active_android_version IS 'Version Android de l''appareil connecté';
COMMENT ON COLUMN public.staff.active_app_version IS 'Version de l''application KLIN UP installée';
COMMENT ON COLUMN public.staff.active_session_at IS 'Horodatage de la dernière prise de session active';

-- 2. RPC sécurisée pour enregistrer l''appareil actif lors de la connexion
CREATE OR REPLACE FUNCTION public.register_active_device_session(
  p_staff_id TEXT,
  p_device_id TEXT,
  p_session_token TEXT,
  p_device_name TEXT DEFAULT NULL,
  p_device_model TEXT DEFAULT NULL,
  p_android_version TEXT DEFAULT NULL,
  p_app_version TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.staff
  SET
    active_device_id = NULLIF(TRIM(COALESCE(p_device_id, '')), ''),
    active_session_token = NULLIF(TRIM(COALESCE(p_session_token, '')), ''),
    active_device_name = NULLIF(TRIM(COALESCE(p_device_name, '')), ''),
    active_device_model = NULLIF(TRIM(COALESCE(p_device_model, '')), ''),
    active_android_version = NULLIF(TRIM(COALESCE(p_android_version, '')), ''),
    active_app_version = NULLIF(TRIM(COALESCE(p_app_version, '')), ''),
    active_session_at = CURRENT_TIMESTAMP
  WHERE id = p_staff_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_active_device_session(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 3. Activation de Supabase Realtime sur public.staff pour déconnexion instantanée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'staff'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
  END IF;
END $$;
