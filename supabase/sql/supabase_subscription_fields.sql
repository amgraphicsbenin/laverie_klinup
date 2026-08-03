-- ========================================================
-- AJOUT DE NOUVEAUX CHAMPS D'ABONNEMENT DANS LE CATALOGUE
-- ========================================================

-- Ajoute les colonnes de configuration pour les formules d'abonnement dans la table public.catalog
ALTER TABLE public.catalog
ADD COLUMN IF NOT EXISTS nombre_vetements INTEGER,
ADD COLUMN IF NOT EXISTS ramassage BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nombre_ramassages INTEGER,
ADD COLUMN IF NOT EXISTS ramassage_gratuit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS livraison_gratuite BOOLEAN DEFAULT FALSE;

-- Documenter les colonnes pour une meilleure traçabilité
COMMENT ON COLUMN public.catalog.nombre_vetements IS 'Nombre de vêtements inclus dans la formule d''abonnement';
COMMENT ON COLUMN public.catalog.ramassage IS 'Indique si le service de ramassage à domicile est disponible dans cette formule';
COMMENT ON COLUMN public.catalog.nombre_ramassages IS 'Nombre maximal de ramassages autorisés par mois';
COMMENT ON COLUMN public.catalog.ramassage_gratuit IS 'Indique si le service de ramassage est gratuit';
COMMENT ON COLUMN public.catalog.livraison_gratuite IS 'Indique si la livraison à domicile est gratuite';
