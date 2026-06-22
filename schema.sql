-- ========================================================
-- SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES SUPABASE
-- ========================================================

-- Désactive temporairement le RLS pendant la création
-- (Il sera réactivé à la fin avec des politiques restrictives)

-- 1. Table: staff
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT UNIQUE,
  code_pin TEXT,
  statut TEXT DEFAULT 'actif',
  telephone TEXT,
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: customers
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT UNIQUE NOT NULL,
  adresse TEXT,
  indicatif TEXT DEFAULT '229',
  preferences_pliage TEXT DEFAULT 'Plié',
  points_fidelite INT DEFAULT 0,
  solde_dette NUMERIC DEFAULT 0.00,
  active_subscription JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: orders
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  statut TEXT NOT NULL,
  type_article TEXT NOT NULL,
  type_service TEXT NOT NULL,
  niveau_urgence TEXT NOT NULL,
  mode_reglement TEXT NOT NULL,
  avance_payee NUMERIC DEFAULT 0.00,
  prix_total NUMERIC DEFAULT 0.00,
  identifiant_unique_marquage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP WITH TIME ZONE,
  acompte_paid_at TIMESTAMP WITH TIME ZONE,
  solde_paid_at TIMESTAMP WITH TIME ZONE,
  items JSONB,
  is_subscription_order BOOLEAN DEFAULT FALSE,
  subscription_details JSONB
);

-- 4. Table: activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table: catalog
CREATE TABLE IF NOT EXISTS public.catalog (
  id TEXT PRIMARY KEY,
  article TEXT NOT NULL,
  service TEXT NOT NULL,
  prix NUMERIC NOT NULL,
  categorie TEXT DEFAULT 'individuel',
  description TEXT
);

-- 6. Table: pin_reset_requests
CREATE TABLE IF NOT EXISTS public.pin_reset_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  resolved_pin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- SEED DATA (INITIALISATION DES DONNÉES PAR DÉFAUT)
-- ========================================================

INSERT INTO public.catalog (id, article, service, prix, categorie, description) VALUES
('cat1', 'Chemise', 'lavage_simple', 1500, 'individuel', ''),
('cat2', 'Chemise', 'nettoyage_a_sec', 3000, 'individuel', ''),
('cat3', 'Chemise', 'repassage', 1000, 'individuel', ''),
('cat4', 'Pantalon', 'lavage_simple', 2000, 'individuel', ''),
('cat5', 'Pantalon', 'nettoyage_a_sec', 3500, 'individuel', ''),
('cat6', 'Pantalon', 'repassage', 1200, 'individuel', ''),
('cat7', 'Robe', 'lavage_simple', 2500, 'individuel', ''),
('cat8', 'Robe', 'nettoyage_a_sec', 4500, 'individuel', ''),
('cat9', 'Robe', 'repassage', 1500, 'individuel', ''),
('cat10', 'Combinaison', 'lavage_simple', 3000, 'individuel', ''),
('cat11', 'Combinaison', 'nettoyage_a_sec', 5000, 'individuel', ''),
('cat12', 'Combinaison', 'repassage', 1800, 'individuel', ''),
('sub1', 'Offre Active', 'abonnement', 20000, 'abonnement', '25 vêtements | Livraison et ramassage gratuits'),
('sub2', 'Abonnement Premium', 'abonnement', 35000, 'abonnement', '50 vêtements max/mois | 2 ramassages max par mois | Ramassage et livraison gratuits'),
('sub3', 'Abonnement Prestige', 'abonnement', 60000, 'abonnement', '100 vêtements max/mois | 4 ramassages max par mois | Ramassage et livraison gratuits'),
('sub4', 'Abonnement VIP', 'abonnement', 100000, 'abonnement', '200 vêtements max/mois | 4 ramassages max par mois | Ramassage et livraison gratuits')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.staff (id, nom, prenom, role, email, code_pin, statut) VALUES
('u1', 'Gomez', 'Jean-Luc', 'super_admin', 'jean-luc.gomez@klinup.com', '111111', 'actif'),
('u2', 'Koffi', 'Marie-Antoinette', 'manager', 'marie.koffi@klinup.com', '222222', 'actif'),
('u3', 'Diallo', 'Pierre', 'agent_accueil', 'pierre.diallo@klinup.com', '333333', 'actif'),
('u4', 'Koutomi', 'André', 'super_admin', 'andre.koutomi98@gmail.com', '000000', 'actif')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- CONFIGURATION DU REALTIME (TEMPS RÉEL)
-- ========================================================

-- Permet aux applications d'écouter les modifications en temps réel sur ces tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.catalog;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pin_reset_requests;

-- ========================================================
-- SÉCURITÉ : ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Activation de RLS sur toutes les tables
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_reset_requests ENABLE ROW LEVEL SECURITY;

-- 1. Politiques pour la table "catalog" (Lecture publique, écriture par le personnel)
CREATE POLICY "Lecture publique du catalogue" ON public.catalog 
  FOR SELECT USING (true);
CREATE POLICY "Modifications catalogue par le personnel" ON public.catalog 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Politiques pour la table "staff"
CREATE POLICY "Gestion du personnel" ON public.staff 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Politiques pour la table "customers"
CREATE POLICY "Gestion des clients" ON public.customers 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Politiques pour la table "orders"
CREATE POLICY "Gestion des commandes" ON public.orders 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Politiques pour la table "activity_logs"
CREATE POLICY "Gestion des logs" ON public.activity_logs 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. Politiques pour la table "pin_reset_requests"
CREATE POLICY "Gestion des demandes de reset PIN" ON public.pin_reset_requests 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
