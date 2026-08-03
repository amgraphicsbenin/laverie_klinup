-- ========================================================
-- MIGRATION SUPABASE : Ajout de store_id dans la table catalog
-- ========================================================

-- 1. Ajout de la colonne store_id si elle n'existe pas
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS store_id TEXT;

-- 2. Création d'un index pour optimiser la recherche de produits par point de laverie
CREATE INDEX IF NOT EXISTS idx_catalog_store_id ON public.catalog(store_id);

-- 3. Commentaire d'explication de la colonne
COMMENT ON COLUMN public.catalog.store_id IS 'Identifiant du point de laverie rattaché à cet article/tarif. NULL ou ''all'' signifie un tarif global.';
