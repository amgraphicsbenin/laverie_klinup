-- ====================================================================
-- SCRIPT DE MIGRATION : FRAIS DE LIVRAISON PAR ZONE KILOMÉTRIQUE & GPS
-- ====================================================================

-- 1. Table des zones de livraison par intervalle kilométrique
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  label_zone TEXT NOT NULL,
  min_km NUMERIC NOT NULL DEFAULT 0,
  max_km NUMERIC NOT NULL DEFAULT 3,
  frais_livraison NUMERIC NOT NULL DEFAULT 1000,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser la recherche par laverie et rayon
CREATE INDEX IF NOT EXISTS idx_delivery_zones_store_id ON public.delivery_zones(store_id);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_range ON public.delivery_zones(min_km, max_km);

-- 2. Ajout des coordonnées GPS centrales du point de laverie (Latitude, Longitude)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS latitude NUMERIC DEFAULT 6.3703;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS longitude NUMERIC DEFAULT 2.3912;

-- 3. Ajout du champ des coordonnées de livraison dans le profil client
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS coordonnees_livraison TEXT;

-- 4. Ajout des détails de livraison dans la table des commandes
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS frais_livraison NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS distance_km NUMERIC DEFAULT 0;

-- 5. Activation des politiques RLS (Row Level Security)
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique des zones de livraison" ON public.delivery_zones;
CREATE POLICY "Lecture publique des zones de livraison" 
  ON public.delivery_zones FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Gestion complète des zones pour admins" ON public.delivery_zones;
CREATE POLICY "Gestion complète des zones pour admins" 
  ON public.delivery_zones FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 6. DONNÉES DE TEST / SEED INITIAL PAR DÉFAUT
-- Coordonnées par défaut du point central KLIN UP Cotonou : 6.3703, 2.3912
UPDATE public.stores 
SET latitude = 6.3703, longitude = 2.3912 
WHERE latitude IS NULL OR longitude IS NULL;

-- Insertion des tranches de livraison standard (0-3km, 3-7km, 7-15km, 15-30km)
INSERT INTO public.delivery_zones (id, store_id, label_zone, min_km, max_km, frais_livraison) VALUES
  ('zone_proche', NULL, 'Zone Proche (0 - 3 km)', 0, 3, 500),
  ('zone_moyenne', NULL, 'Zone Intermédiaire (3 - 7 km)', 3, 7, 1000),
  ('zone_elargie', NULL, 'Zone Élargie (7 - 15 km)', 7, 15, 2000),
  ('zone_lointaine', NULL, 'Zone Éloignée (15 - 30 km)', 15, 30, 3500)
ON CONFLICT (id) DO UPDATE SET
  label_zone = EXCLUDED.label_zone,
  min_km = EXCLUDED.min_km,
  max_km = EXCLUDED.max_km,
  frais_livraison = EXCLUDED.frais_livraison;
