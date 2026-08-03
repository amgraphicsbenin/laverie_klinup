-- Migration SQL pour ajouter les colonnes Mobile Money à la table orders dans Supabase

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS reference_momo TEXT,
ADD COLUMN IF NOT EXISTS reference_paiement TEXT,
ADD COLUMN IF NOT EXISTS operateur_momo TEXT,
ADD COLUMN IF NOT EXISTS solde_paid_at TIMESTAMPTZ;

-- Notifications et commentaires sur les colonnes
COMMENT ON COLUMN public.orders.reference_momo IS 'Numéro de référence de transaction Mobile Money';
COMMENT ON COLUMN public.orders.reference_paiement IS 'Référence de paiement globale (Mobile Money ou autre)';
COMMENT ON COLUMN public.orders.operateur_momo IS 'Opérateur réseau Mobile Money (MTN, MOOV, CELTIS)';
COMMENT ON COLUMN public.orders.solde_paid_at IS 'Date et heure du règlement final du solde';
