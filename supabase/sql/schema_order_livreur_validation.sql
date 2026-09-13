-- ========================================================
-- MIGRATION : VALIDATION DES COMMANDES LIVREUR PAR LA CAISSE
-- ========================================================

-- Ajout des colonnes de traçabilité livreur / validation caisse
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cree_par_livreur BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS validee_par_caisse BOOLEAN DEFAULT TRUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by_role TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS validated_by_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS validated_by_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;

-- Commentaire descriptif
COMMENT ON COLUMN public.orders.cree_par_livreur IS 'Indique si la commande a été initiée sur le terrain par un livreur';
COMMENT ON COLUMN public.orders.validee_par_caisse IS 'Indique si la commande a été formellement validée par un agent de caisse';
COMMENT ON COLUMN public.orders.created_by_role IS 'Rôle de l''utilisateur ayant créé la commande (livreur, agent_accueil, admin, etc.)';
COMMENT ON COLUMN public.orders.validated_by_id IS 'ID de l''agent ayant validé la commande';
COMMENT ON COLUMN public.orders.validated_by_name IS 'Nom de l''agent ayant validé la commande';
COMMENT ON COLUMN public.orders.validated_at IS 'Date et heure de validation par la caisse';
