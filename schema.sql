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
  subscription_details JSONB,
  -- Traçabilité : agent ayant créé la commande
  created_by_id TEXT,
  created_by_name TEXT
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
  description TEXT,
  nombre_vetements INTEGER,
  ramassage BOOLEAN DEFAULT FALSE,
  nombre_ramassages INTEGER,
  ramassage_gratuit BOOLEAN DEFAULT FALSE,
  livraison_gratuite BOOLEAN DEFAULT FALSE
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
-- Jupe
('cat_jupe_ls', 'Jupe', 'lavage_simple', 0, 'individuel', ''),
('cat_jupe_nas', 'Jupe', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_jupe_rep', 'Jupe', 'repassage', 0, 'individuel', ''),
-- Pull
('cat_pull_ls', 'Pull', 'lavage_simple', 0, 'individuel', ''),
('cat_pull_nas', 'Pull', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_pull_rep', 'Pull', 'repassage', 0, 'individuel', ''),
-- Culotte
('cat_culotte_ls', 'Culotte', 'lavage_simple', 0, 'individuel', ''),
('cat_culotte_nas', 'Culotte', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_culotte_rep', 'Culotte', 'repassage', 0, 'individuel', ''),
-- T-shirt
('cat_tshirt_ls', 'T-shirt', 'lavage_simple', 0, 'individuel', ''),
('cat_tshirt_nas', 'T-shirt', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_tshirt_rep', 'T-shirt', 'repassage', 0, 'individuel', ''),
-- Polo
('cat_polo_ls', 'Polo', 'lavage_simple', 0, 'individuel', ''),
('cat_polo_nas', 'Polo', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_polo_rep', 'Polo', 'repassage', 0, 'individuel', ''),
-- Blouson
('cat_blouson_ls', 'Blouson', 'lavage_simple', 0, 'individuel', ''),
('cat_blouson_nas', 'Blouson', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_blouson_rep', 'Blouson', 'repassage', 0, 'individuel', ''),
-- Veste
('cat_veste_ls', 'Veste', 'lavage_simple', 0, 'individuel', ''),
('cat_veste_nas', 'Veste', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_veste_rep', 'Veste', 'repassage', 0, 'individuel', ''),
-- Costume
('cat_costume_ls', 'Costume', 'lavage_simple', 0, 'individuel', ''),
('cat_costume_nas', 'Costume', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_costume_rep', 'Costume', 'repassage', 0, 'individuel', ''),
-- Cravate
('cat_cravate_ls', 'Cravate', 'lavage_simple', 0, 'individuel', ''),
('cat_cravate_nas', 'Cravate', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_cravate_rep', 'Cravate', 'repassage', 0, 'individuel', ''),
-- Haut
('cat_haut_ls', 'Haut', 'lavage_simple', 0, 'individuel', ''),
('cat_haut_nas', 'Haut', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_haut_rep', 'Haut', 'repassage', 0, 'individuel', ''),
-- Débardeur
('cat_debardeur_ls', 'Débardeur', 'lavage_simple', 0, 'individuel', ''),
('cat_debardeur_nas', 'Débardeur', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_debardeur_rep', 'Débardeur', 'repassage', 0, 'individuel', ''),
-- Jeans
('cat_jeans_ls', 'Jeans', 'lavage_simple', 0, 'individuel', ''),
('cat_jeans_nas', 'Jeans', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_jeans_rep', 'Jeans', 'repassage', 0, 'individuel', ''),
-- Robe de mariée
('cat_robemariee_ls', 'Robe de mariée', 'lavage_simple', 0, 'individuel', ''),
('cat_robemariee_nas', 'Robe de mariée', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_robemariee_rep', 'Robe de mariée', 'repassage', 0, 'individuel', ''),
-- Couette Legée
('cat_couettelegee_ls', 'Couette Legée', 'lavage_simple', 0, 'individuel', ''),
('cat_couettelegee_nas', 'Couette Legée', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_couettelegee_rep', 'Couette Legée', 'repassage', 0, 'individuel', ''),
-- Couette lourd
('cat_couettelourd_ls', 'Couette lourd', 'lavage_simple', 0, 'individuel', ''),
('cat_couettelourd_nas', 'Couette lourd', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_couettelourd_rep', 'Couette lourd', 'repassage', 0, 'individuel', ''),
-- 1Draps+ 2 taies
('cat_1draps2taies_ls', '1Draps+ 2 taies', 'lavage_simple', 0, 'individuel', ''),
('cat_1draps2taies_nas', '1Draps+ 2 taies', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_1draps2taies_rep', '1Draps+ 2 taies', 'repassage', 0, 'individuel', ''),
-- 2 draps+ 2 taies
('cat_2draps2taies_ls', '2 draps+ 2 taies', 'lavage_simple', 0, 'individuel', ''),
('cat_2draps2taies_nas', '2 draps+ 2 taies', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_2draps2taies_rep', '2 draps+ 2 taies', 'repassage', 0, 'individuel', ''),
-- Taies
('cat_taies_ls', 'Taies', 'lavage_simple', 0, 'individuel', ''),
('cat_taies_nas', 'Taies', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_taies_rep', 'Taies', 'repassage', 0, 'individuel', ''),
-- Petite serviette
('cat_petiteserviette_ls', 'Petite serviette', 'lavage_simple', 0, 'individuel', ''),
('cat_petiteserviette_nas', 'Petite serviette', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_petiteserviette_rep', 'Petite serviette', 'repassage', 0, 'individuel', ''),
-- Grandes serviettes
('cat_grandesserviettes_ls', 'Grandes serviettes', 'lavage_simple', 0, 'individuel', ''),
('cat_grandesserviettes_nas', 'Grandes serviettes', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_grandesserviettes_rep', 'Grandes serviettes', 'repassage', 0, 'individuel', ''),
-- Ensemble 2 pièce
('cat_ensemble2piece_ls', 'Ensemble 2 pièce', 'lavage_simple', 0, 'individuel', ''),
('cat_ensemble2piece_nas', 'Ensemble 2 pièce', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_ensemble2piece_rep', 'Ensemble 2 pièce', 'repassage', 0, 'individuel', ''),
-- Ensemble 3 pièces
('cat_ensemble3pieces_ls', 'Ensemble 3 pièces', 'lavage_simple', 0, 'individuel', ''),
('cat_ensemble3pieces_nas', 'Ensemble 3 pièces', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_ensemble3pieces_rep', 'Ensemble 3 pièces', 'repassage', 0, 'individuel', ''),
-- Chapeau
('cat_chapeau_ls', 'Chapeau', 'lavage_simple', 0, 'individuel', ''),
('cat_chapeau_nas', 'Chapeau', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_chapeau_rep', 'Chapeau', 'repassage', 0, 'individuel', ''),
-- chausette
('cat_chausette_ls', 'chausette', 'lavage_simple', 0, 'individuel', ''),
('cat_chausette_nas', 'chausette', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_chausette_rep', 'chausette', 'repassage', 0, 'individuel', ''),
-- Nappe de table
('cat_nappetable_ls', 'Nappe de table', 'lavage_simple', 0, 'individuel', ''),
('cat_nappetable_nas', 'Nappe de table', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_nappetable_rep', 'Nappe de table', 'repassage', 0, 'individuel', ''),
-- Rideau
('cat_rideau_ls', 'Rideau', 'lavage_simple', 0, 'individuel', ''),
('cat_rideau_nas', 'Rideau', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_rideau_rep', 'Rideau', 'repassage', 0, 'individuel', ''),
-- Robe fantaisiste
('cat_robefantaisiste_ls', 'Robe fantaisiste', 'lavage_simple', 0, 'individuel', ''),
('cat_robefantaisiste_nas', 'Robe fantaisiste', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_robefantaisiste_rep', 'Robe fantaisiste', 'repassage', 0, 'individuel', ''),
-- Serpillière
('cat_serpilliere_ls', 'Serpillière', 'lavage_simple', 0, 'individuel', ''),
('cat_serpilliere_nas', 'Serpillière', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_serpilliere_rep', 'Serpillière', 'repassage', 0, 'individuel', ''),
-- Torchon
('cat_torchon_ls', 'Torchon', 'lavage_simple', 0, 'individuel', ''),
('cat_torchon_nas', 'Torchon', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_torchon_rep', 'Torchon', 'repassage', 0, 'individuel', ''),
-- Foulard
('cat_foulard_ls', 'Foulard', 'lavage_simple', 0, 'individuel', ''),
('cat_foulard_nas', 'Foulard', 'nettoyage_a_sec', 0, 'individuel', ''),
('cat_foulard_rep', 'Foulard', 'repassage', 0, 'individuel', '')
ON CONFLICT (id) DO NOTHING;

-- Seeds pour les Abonnements avec caractéristiques détaillées
INSERT INTO public.catalog (id, article, service, prix, categorie, description, nombre_vetements, ramassage, nombre_ramassages, ramassage_gratuit, livraison_gratuite) VALUES
('sub1', 'Offre Active', 'abonnement', 20000, 'abonnement', '25 vêtements | Livraison et ramassage gratuits', 25, true, null, true, true),
('sub2', 'Abonnement Premium', 'abonnement', 35000, 'abonnement', '50 vêtements max/mois | 2 ramassages max par mois | Ramassage et livraison gratuits', 50, true, 2, true, true),
('sub3', 'Abonnement Prestige', 'abonnement', 60000, 'abonnement', '100 vêtements max/mois | 4 ramassages max par mois | Ramassage et livraison gratuits', 100, true, 4, true, true),
('sub4', 'Abonnement VIP', 'abonnement', 100000, 'abonnement', '200 vêtements max/mois | 4 ramassages max par mois | Ramassage et livraison gratuits', 200, true, 4, true, true)
ON CONFLICT (id) DO NOTHING;

-- Seeds pour les paramètres système
INSERT INTO public.catalog (id, article, service, prix, categorie, description) VALUES
('setting_express_hours', 'Délai Express (heures)', 'system', 6, 'system_setting', 'Configuration système'),
('setting_normal_hours', 'Délai Normal (heures)', 'system', 48, 'system_setting', 'Configuration système'),
('setting_express_markup', 'Majoration Express (%)', 'system', 50, 'system_setting', 'Configuration système')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.staff (id, nom, prenom, role, email, code_pin, statut) VALUES
('u1', 'Gomez', 'Jean-Luc', 'super_admin', 'jean-luc.gomez@klinup.com', '111111', 'actif'),
('u2', 'Koffi', 'Marie-Antoinette', 'manager', 'marie.koffi@klinup.com', '222222', 'actif'),
('u3', 'Diallo', 'Pierre', 'agent_accueil', 'pierre.diallo@klinup.com', '333333', 'actif'),
('u4', 'Koutomi', 'André', 'super_admin', 'andre.koutomi98@gmail.com', '000000', 'actif'),
('u5', 'Sosso', 'Paul', 'livreur', 'paul.sosso@klinup.com', '444444', 'actif'),
('u6', 'Kole', 'Moussa', 'agent_lavage_repassage', 'moussa.kole@klinup.com', '555555', 'actif')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- CONFIGURATION DU REALTIME (TEMPS RÉEL)
-- Utilisation de blocs DO pour éviter les erreurs si les tables
-- sont déjà membres de la publication (idempotent).
-- ========================================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.catalog;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pin_reset_requests;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- SÉCURITÉ : ROW LEVEL SECURITY (RLS) POLICIES
-- Utilisation de blocs DO pour éviter les erreurs si les
-- politiques existent déjà (idempotent).
-- ========================================================

-- Activation de RLS sur toutes les tables
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_reset_requests ENABLE ROW LEVEL SECURITY;

-- 1. Politiques pour la table "catalog"
DO $$ BEGIN
  CREATE POLICY "Lecture publique du catalogue" ON public.catalog FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Modifications catalogue par le personnel" ON public.catalog
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Politiques pour la table "staff"
DO $$ BEGIN
  CREATE POLICY "Gestion du personnel" ON public.staff
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Politiques pour la table "customers"
DO $$ BEGIN
  CREATE POLICY "Gestion des clients" ON public.customers
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Politiques pour la table "orders"
DO $$ BEGIN
  CREATE POLICY "Gestion des commandes" ON public.orders
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Politiques pour la table "activity_logs"
DO $$ BEGIN
  CREATE POLICY "Gestion des logs" ON public.activity_logs
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Politiques pour la table "pin_reset_requests"
DO $$ BEGIN
  CREATE POLICY "Gestion des demandes de reset PIN" ON public.pin_reset_requests
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- MIGRATION : Ajout des colonnes created_by à orders
-- ADD COLUMN IF NOT EXISTS est idempotent nativement.
-- ========================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by_name TEXT;

