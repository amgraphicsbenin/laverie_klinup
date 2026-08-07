-- Ajout des champs pour la récupération à domicile dans la table orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS with_pickup BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS frais_recuperation NUMERIC DEFAULT 0;

-- Commentaire pour spécifier l'usage
COMMENT ON COLUMN public.orders.with_pickup IS 'Indique si la commande inclut une récupération à domicile';
COMMENT ON COLUMN public.orders.frais_recuperation IS 'Frais calculés pour la récupération à domicile, basés sur la zone de livraison';
