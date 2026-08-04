-- ====================================================================
-- MIGRATION : CHAMPS D'ADRESSE STRUCTURÉE POUR LES CLIENTS
-- Compatible avec les zones de livraison GPS de l'admin
-- ====================================================================

-- 1. Ajout des colonnes d'adresse structurée dans la table customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS quartier TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS ville TEXT DEFAULT 'Cotonou';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- S'assure que coordonnees_livraison existe (déjà créé dans schema_delivery_zones.sql)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS coordonnees_livraison TEXT;

-- 2. Index GPS pour accélérer les recherches géographiques
CREATE INDEX IF NOT EXISTS idx_customers_gps ON public.customers(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. Commentaires sur les colonnes pour documentation
COMMENT ON COLUMN public.customers.quartier IS 'Quartier / secteur de résidence du client';
COMMENT ON COLUMN public.customers.ville IS 'Ville de résidence (Cotonou par défaut)';
COMMENT ON COLUMN public.customers.latitude IS 'Latitude GPS du domicile client pour calcul livraison';
COMMENT ON COLUMN public.customers.longitude IS 'Longitude GPS du domicile client pour calcul livraison';
COMMENT ON COLUMN public.customers.coordonnees_livraison IS 'Format texte "lat,lng" (rétrocompat.) - priorité à latitude/longitude séparés';

-- 4. Trigger de cohérence : synchronise coordonnees_livraison <-> latitude/longitude
-- Si on insère lat/lng séparés, coordonnees_livraison est mis à jour automatiquement
CREATE OR REPLACE FUNCTION public.sync_customer_gps()
RETURNS TRIGGER AS $$
BEGIN
  -- Si lat/lng séparés sont fournis, met à jour coordonnees_livraison
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.coordonnees_livraison := NEW.latitude::TEXT || ',' || NEW.longitude::TEXT;
  -- Si coordonnees_livraison est fourni en "lat,lng", extrait lat/lng
  ELSIF NEW.coordonnees_livraison IS NOT NULL AND NEW.coordonnees_livraison LIKE '%,%' THEN
    BEGIN
      NEW.latitude := TRIM(SPLIT_PART(NEW.coordonnees_livraison, ',', 1))::NUMERIC;
      NEW.longitude := TRIM(SPLIT_PART(NEW.coordonnees_livraison, ',', 2))::NUMERIC;
    EXCEPTION WHEN others THEN
      -- Ignore silencieusement si le format est invalide
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_customer_gps ON public.customers;
CREATE TRIGGER trg_sync_customer_gps
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_gps();
