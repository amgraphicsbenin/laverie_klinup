-- ========================================================
-- SCRIPT DE CRÉATION DE LA TABLE DÉDIÉE REWARDS
-- ========================================================

CREATE TABLE IF NOT EXISTS public.rewards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cost INTEGER NOT NULL DEFAULT 10,
  discount_amount NUMERIC DEFAULT 0.00,
  icon_name TEXT DEFAULT 'Gift',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activation du RLS pour la table rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accès public en lecture aux récompenses" ON public.rewards;
CREATE POLICY "Accès public en lecture aux récompenses" ON public.rewards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Accès complet aux récompenses" ON public.rewards;
CREATE POLICY "Accès complet aux récompenses" ON public.rewards FOR ALL USING (true);

-- Seed initial des récompenses par défaut
INSERT INTO public.rewards (id, title, cost, discount_amount, icon_name, description) VALUES
  ('remise_1000', 'Remise de 1 000 FCFA', 30, 1000, 'Tag', 'Réduction de 1 000 FCFA sur la prochaine commande.'),
  ('lavage_offert', 'Lavage 1 Vêtement Offert', 50, 2000, 'Shirt', 'Un lavage gratuit pour une pièce au choix.'),
  ('livraison_offerte', 'Livraison Offerte', 60, 1500, 'Truck', 'Frais de livraison 100% offerts.'),
  ('repassage_offert', 'Repassage Offert', 100, 4000, 'Sparkles', 'Repassage complet offert sur vos vêtements.'),
  ('remise_5000', 'Remise 5 000 FCFA Abonnement', 150, 5000, 'Gift', 'Réduction de 5 000 FCFA lors du renouvellement d''abonnement.')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  cost = EXCLUDED.cost,
  discount_amount = EXCLUDED.discount_amount,
  icon_name = EXCLUDED.icon_name,
  description = EXCLUDED.description;
