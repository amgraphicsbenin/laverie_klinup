-- ========================================================
-- MIGRATION SUPABASE : GESTION ET POPULATION DU USER_NAME SUR ACTIVITY_LOGS
-- ========================================================

-- 1. Ajout de la colonne user_name et store_id si elles n'existent pas encore
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS store_id TEXT;

-- 2. Remplissage rétroactif des user_name NULL à partir de la table staff
UPDATE public.activity_logs al
SET user_name = TRIM(s.prenom || ' ' || s.nom)
FROM public.staff s
WHERE al.user_id = s.id
  AND (al.user_name IS NULL OR al.user_name = '' OR al.user_name = 'NULL');

-- 3. Remplissage rétroactif pour les actions système ou sans correspondance staff
UPDATE public.activity_logs
SET user_name = CASE 
    WHEN user_id = 'u_system' OR user_id IS NULL THEN 'Automate / Système'
    ELSE 'Utilisateur Caisse'
  END
WHERE user_name IS NULL OR user_name = '' OR user_name = 'NULL';

-- 4. Trigger automatique pour remplir automatiquement user_name lors des futurs INSERTs si non fourni
CREATE OR REPLACE FUNCTION public.fn_auto_fill_activity_log_user_name()
RETURNS TRIGGER AS $$
DECLARE
  staff_name TEXT;
BEGIN
  IF NEW.user_name IS NULL OR NEW.user_name = '' THEN
    SELECT TRIM(prenom || ' ' || nom) INTO staff_name
    FROM public.staff
    WHERE id = NEW.user_id;

    IF staff_name IS NOT NULL AND staff_name <> '' THEN
      NEW.user_name := staff_name;
    ELSIF NEW.user_id = 'u_system' OR NEW.user_id IS NULL THEN
      NEW.user_name := 'Automate / Système';
    ELSE
      NEW.user_name := 'Utilisateur Caisse';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_fill_activity_log_user_name ON public.activity_logs;
CREATE TRIGGER trg_auto_fill_activity_log_user_name
BEFORE INSERT ON public.activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_fill_activity_log_user_name();
