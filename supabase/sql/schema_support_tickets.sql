-- ====================================================================
-- SCRIPT DE MIGRATION : SYSTEME DE GESTION DE TICKETS D'AIDE ET BUGS
-- ====================================================================

-- 1. Table principale des tickets d'assistance et de signalement de bugs
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  ticket_type TEXT NOT NULL DEFAULT 'bug', -- 'bug' | 'help' | 'feature'
  subject TEXT NOT NULL,
  module_name TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Moyenne', -- 'Basse' | 'Moyenne' | 'Haute' | 'Critique'
  status TEXT NOT NULL DEFAULT 'Ouvert', -- 'Ouvert' | 'En cours' | 'Résolu' | 'Fermé'
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  user_id TEXT REFERENCES public.staff(id) ON DELETE SET NULL,
  user_name TEXT,
  store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
  attached_files JSONB DEFAULT '[]'::jsonb,
  response_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index d'optimisation de recherche
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_type ON public.support_tickets(ticket_type);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- 2. Table des messages de suivi / fil de discussion sur les tickets
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'staff',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);

-- 3. Activation des politiques RLS (Row Level Security)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique des tickets support" ON public.support_tickets;
CREATE POLICY "Lecture publique des tickets support" 
  ON public.support_tickets FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Gestion complète des tickets support" ON public.support_tickets;
CREATE POLICY "Gestion complète des tickets support" 
  ON public.support_tickets FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Lecture publique des messages tickets" ON public.support_ticket_messages;
CREATE POLICY "Lecture publique des messages tickets" 
  ON public.support_ticket_messages FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Gestion complète des messages tickets" ON public.support_ticket_messages;
CREATE POLICY "Gestion complète des messages tickets" 
  ON public.support_ticket_messages FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 4. DONNÉES D'EXEMPLE / SEED INITIAL (Optionnel - Désactivé)
-- INSERT INTO public.support_tickets (id, ticket_type, subject, module_name, priority, status, description, user_name, created_at) VALUES
--   ('TICK-4821', 'bug', 'Erreur lors du calcul de la remise abonnement', 'Gestion des Commandes', 'Haute', 'En cours', 'La remise ne s applique pas correctement quand le client a un forfait actif.', 'Administrateur KLIN UP', CURRENT_TIMESTAMP - INTERVAL '2 days'),
--   ('TICK-3910', 'help', 'Configuration du réseau d imprimante thermique POS', 'Modèles de Reçus', 'Moyenne', 'Résolu', 'Comment associer l imprimante Bluetooth Xprinter 80mm ?', 'Super Admin', CURRENT_TIMESTAMP - INTERVAL '5 days')
-- ON CONFLICT (id) DO NOTHING;
