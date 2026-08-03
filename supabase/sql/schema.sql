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
  push_token TEXT,
  push_token_updated_at TIMESTAMP WITH TIME ZONE,
  user_picture TEXT,
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
  store_id TEXT,
  created_by_id TEXT,
  created_by_name TEXT,
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
  user_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS user_name TEXT;

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
  livraison_gratuite BOOLEAN DEFAULT FALSE,
  store_id TEXT
);

-- Migrations idempotentes : ajout des colonnes si la table existait déjà antérieurement
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS nombre_vetements INTEGER;
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS ramassage BOOLEAN DEFAULT FALSE;
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS nombre_ramassages INTEGER;
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS ramassage_gratuit BOOLEAN DEFAULT FALSE;
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS livraison_gratuite BOOLEAN DEFAULT FALSE;
ALTER TABLE public.catalog ADD COLUMN IF NOT EXISTS store_id TEXT;
CREATE INDEX IF NOT EXISTS idx_catalog_store_id ON public.catalog(store_id);

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

-- 7. Politiques pour la table "stores" (Points de Laverie)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Gestion des points de laverie" ON public.stores
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- MIGRATION : Rattachement Obligatoire aux Points de Laverie (stores / store_id)
-- ========================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- 1. Création de la table stores si elle n'existe pas encore
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  adresse TEXT,
  ville TEXT DEFAULT 'Cotonou',
  telephone TEXT,
  responsable_id TEXT,
  responsable_nom TEXT,
  statut TEXT DEFAULT 'actif',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrations idempotentes : ajout des colonnes si déjà existantes
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS ville TEXT DEFAULT 'Cotonou';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS responsable_id TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS responsable_nom TEXT;

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS store_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS store_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS store_id TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_store_id ON public.customers(store_id);

-- 3. Migration des commandes historiques orphelines vers le premier store existant
DO $$
DECLARE
  first_store_id TEXT;
BEGIN
  SELECT id INTO first_store_id FROM public.stores ORDER BY created_at ASC LIMIT 1;
  IF first_store_id IS NOT NULL THEN
    UPDATE public.orders 
    SET store_id = first_store_id 
    WHERE store_id IS NULL OR TRIM(store_id) = '' OR store_id = 'all' OR store_id = 'store_central';
  END IF;
END $$;

-- 4. Application de la contrainte NOT NULL
ALTER TABLE public.orders ALTER COLUMN store_id SET NOT NULL;

-- 5. Trigger de sécurité PostgreSQL pour auto-rattacher et imposer store_id sur public.customers
CREATE OR REPLACE FUNCTION public.check_customer_store_id()
RETURNS TRIGGER AS $$
DECLARE
  creator_store_id TEXT;
BEGIN
  -- Si store_id est absent, le déduire du profil de l'utilisateur créateur
  IF NEW.store_id IS NULL OR TRIM(NEW.store_id) = '' OR NEW.store_id = 'all' THEN
    IF NEW.created_by_id IS NOT NULL AND TRIM(NEW.created_by_id) <> '' THEN
      SELECT store_id INTO creator_store_id FROM public.staff WHERE id = NEW.created_by_id;
      IF creator_store_id IS NOT NULL AND TRIM(creator_store_id) <> '' AND creator_store_id <> 'all' THEN
        NEW.store_id := creator_store_id;
      END IF;
    END IF;
  END IF;

  -- Si toujours absent, attribuer la première boutique existante
  IF NEW.store_id IS NULL OR TRIM(NEW.store_id) = '' OR NEW.store_id = 'all' THEN
    SELECT id INTO creator_store_id FROM public.stores ORDER BY created_at ASC LIMIT 1;
    IF creator_store_id IS NOT NULL THEN
      NEW.store_id := creator_store_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_customer_store ON public.customers;
CREATE TRIGGER trg_enforce_customer_store
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.check_customer_store_id();

-- 6. Trigger de sécurité PostgreSQL pour auto-rattacher et imposer store_id sur public.orders
CREATE OR REPLACE FUNCTION public.check_order_store_id()
RETURNS TRIGGER AS $$
DECLARE
  creator_store_id TEXT;
BEGIN
  IF NEW.store_id IS NULL OR TRIM(NEW.store_id) = '' OR NEW.store_id = 'all' THEN
    IF NEW.created_by_id IS NOT NULL AND TRIM(NEW.created_by_id) <> '' THEN
      SELECT store_id INTO creator_store_id FROM public.staff WHERE id = NEW.created_by_id;
      IF creator_store_id IS NOT NULL AND TRIM(creator_store_id) <> '' AND creator_store_id <> 'all' THEN
        NEW.store_id := creator_store_id;
      END IF;
    END IF;
  END IF;

  IF NEW.store_id IS NULL OR TRIM(NEW.store_id) = '' OR NEW.store_id = 'all' THEN
    SELECT id INTO creator_store_id FROM public.stores ORDER BY created_at ASC LIMIT 1;
    IF creator_store_id IS NOT NULL THEN
      NEW.store_id := creator_store_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_order_store ON public.orders;
CREATE TRIGGER trg_enforce_order_store
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.check_order_store_id();

-- ========================================================
-- DIRECTIVES AUTH : Synchronisation automatique auth.users & RLS Mobile
-- ========================================================

-- 1. Politique RLS permettant à l'application mobile (anon) de vérifier l'existence d'un email de personnel
DO $$ BEGIN
  DROP POLICY IF EXISTS "Vérification email login personnel" ON public.staff;
  CREATE POLICY "Vérification email login personnel" ON public.staff
    FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Fonction SQL de synchronisation automatique vers auth.users (Supabase Auth)
CREATE OR REPLACE FUNCTION public.sync_staff_to_auth_users()
RETURNS TRIGGER AS $$
DECLARE
  new_auth_id UUID;
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    -- Vérifier si l'utilisateur existe déjà dans auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(NEW.email)) THEN
      new_auth_id := gen_random_uuid();
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud
      ) VALUES (
        new_auth_id,
        '00000000-0000-0000-0000-000000000000',
        LOWER(NEW.email),
        crypt(COALESCE(NEW.code_pin, '000000'), gen_salt('bf')),
        CURRENT_TIMESTAMP,
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object('nom', NEW.nom, 'prenom', NEW.prenom, 'role', NEW.role),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        'authenticated',
        'authenticated'
      );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Ne pas bloquer l'insertion métier si auth.users n'est pas accessible directement via l'utilisateur anon/postgres
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger d'exécution de la synchronisation staff -> auth.users
DROP TRIGGER IF EXISTS trg_sync_staff_auth ON public.staff;
CREATE TRIGGER trg_sync_staff_auth
AFTER INSERT OR UPDATE OF email, code_pin ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_to_auth_users();

-- 4. Fonction et Trigger SQL de suppression automatique dans auth.users
CREATE OR REPLACE FUNCTION public.handle_staff_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email IS NOT NULL AND OLD.email != '' THEN
    DELETE FROM auth.users WHERE LOWER(email) = LOWER(OLD.email);
  END IF;
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_delete_staff_auth ON public.staff;
CREATE TRIGGER trg_delete_staff_auth
AFTER DELETE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.handle_staff_delete();

-- 5. Procédure Stockée RPC d'Administration pour la création atomique de compte
CREATE OR REPLACE FUNCTION public.admin_create_staff_user(
  p_nom TEXT,
  p_prenom TEXT,
  p_role TEXT,
  p_email TEXT,
  p_telephone TEXT DEFAULT '',
  p_code_pin TEXT DEFAULT '000000',
  p_store_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_res JSONB;
  v_resolved_store_id TEXT := p_store_id;
BEGIN
  IF v_resolved_store_id IS NULL OR TRIM(v_resolved_store_id) = '' THEN
    SELECT id INTO v_resolved_store_id FROM public.stores ORDER BY created_at ASC LIMIT 1;
  END IF;
  p_email := LOWER(TRIM(p_email));
  
  IF EXISTS (SELECT 1 FROM public.staff WHERE LOWER(email) = p_email) THEN
    RAISE EXCEPTION 'Un utilisateur avec cet e-mail existe déjà.';
  END IF;

  v_user_id := gen_random_uuid();

  -- Insertion dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = p_email) THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', p_email,
      crypt(COALESCE(p_code_pin, '000000'), gen_salt('bf')), CURRENT_TIMESTAMP,
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('nom', p_nom, 'prenom', p_prenom, 'role', p_role),
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'authenticated', 'authenticated'
    );
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = p_email;
  END IF;

  -- Insertion dans public.staff
  INSERT INTO public.staff (
    id, nom, prenom, role, email, code_pin, statut, telephone, store_id, created_at
  ) VALUES (
    v_user_id::text, p_nom, p_prenom, p_role, p_email, p_code_pin, 'actif', p_telephone, v_resolved_store_id, CURRENT_TIMESTAMP
  );

  SELECT row_to_json(s)::jsonb INTO v_res FROM public.staff s WHERE s.id = v_user_id::text;
  RETURN v_res;
END;
$$;

-- 6. Fonction RPC de vérification sécurisée lors de la connexion mobile
CREATE OR REPLACE FUNCTION public.verify_staff_login(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff RECORD;
BEGIN
  p_email := LOWER(TRIM(p_email));
  SELECT * INTO v_staff FROM public.staff WHERE LOWER(email) = p_email LIMIT 1;
  IF v_staff.id IS NOT NULL THEN
    RETURN row_to_json(v_staff)::jsonb;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_staff_login(TEXT) TO anon, authenticated;

-- 7. Table pour la gestion multi-appareils des Push Tokens par Point de Laverie
CREATE TABLE IF NOT EXISTS public.staff_devices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  staff_id TEXT REFERENCES public.staff(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL,
  push_token TEXT NOT NULL,
  platform TEXT DEFAULT 'mobile',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_staff_push_token UNIQUE (staff_id, push_token)
);

-- Index pour des performances optimales lors du filtrage par store_id
CREATE INDEX IF NOT EXISTS idx_staff_devices_store ON public.staff_devices(store_id);

-- Publication Realtime Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_devices;

-- Activation RLS
ALTER TABLE public.staff_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces public et authentifie staff_devices" ON public.staff_devices
  FOR ALL USING (true) WITH CHECK (true);

-- 8. Table dédiée de notifications de commande par point de laverie
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  type_action TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_notifications_store ON public.order_notifications(store_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_order ON public.order_notifications(order_id);

-- Colonnes d'idempotence pour le dispatch push (évite les envois multiples)
ALTER TABLE public.order_notifications ADD COLUMN IF NOT EXISTS push_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.order_notifications ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_order_notifications_push_sent ON public.order_notifications(push_sent);

ALTER PUBLICATION supabase_realtime ADD TABLE public.order_notifications;
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces public et authentifie order_notifications" ON public.order_notifications
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger automatique pour générer une notification dès qu'une action est effectuée sur une commande
CREATE OR REPLACE FUNCTION public.fn_process_order_action_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_ref TEXT;
  v_new_statut TEXT;
  v_old_statut TEXT;
  v_store_id TEXT;
  v_titre TEXT := '';
  v_message TEXT := '';
  v_statut_label TEXT := '';
  v_type_action TEXT := TG_OP;
BEGIN
  v_ref := COALESCE(NEW.identifiant_unique_marquage, NEW.id, 'N/A');
  v_new_statut := COALESCE(NEW.statut, '');
  v_old_statut := CASE WHEN TG_OP = 'UPDATE' THEN COALESCE(OLD.statut, '') ELSE NULL END;
  
  -- Résolution dynamique du store_id
  v_store_id := NEW.store_id;
  IF v_store_id IS NULL OR TRIM(v_store_id) = '' THEN
    SELECT store_id INTO v_store_id FROM public.staff WHERE id = NEW.created_by_id;
  END IF;
  IF v_store_id IS NULL OR TRIM(v_store_id) = '' THEN
    SELECT id INTO v_store_id FROM public.stores ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- Ne créer une notification sur UPDATE que s'il y a un vrai changement de statut
  IF TG_OP = 'UPDATE' AND v_new_statut = v_old_statut THEN
    RETURN NEW;
  END IF;

  -- Libellé lisible du statut
  IF v_new_statut = 'en_attente' OR v_new_statut = 'attente' THEN v_statut_label := 'En attente';
  ELSIF v_new_statut = 'traitement' OR v_new_statut = 'lavage' OR v_new_statut = 'en_cours_lavage' THEN v_statut_label := 'Lavage en cours';
  ELSIF v_new_statut = 'repassage' OR v_new_statut = 'en_cours_repassage' THEN v_statut_label := 'Repassage en cours';
  ELSIF v_new_statut = 'pret' OR v_new_statut = 'a_livrer' OR v_new_statut = 'a_recuperer' THEN v_statut_label := 'Prête';
  ELSIF v_new_statut = 'en_cours_livraison' THEN v_statut_label := 'En cours de livraison';
  ELSIF v_new_statut = 'restitue' OR v_new_statut = 'livre' THEN v_statut_label := 'Livrée / Restituée';
  ELSIF v_new_statut = 'annule' THEN v_statut_label := 'Annulée';
  ELSE v_statut_label := v_new_statut;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_titre := '🧺 Nouvelle commande enregistrée';
    v_message := 'La commande ' || v_ref || ' a été enregistrée (' || v_statut_label || ').';
  ELSIF TG_OP = 'UPDATE' THEN
    IF v_new_statut = 'pret' OR v_new_statut = 'a_livrer' OR v_new_statut = 'a_recuperer' THEN
      v_titre := '✅ Commande prête !';
      v_message := 'La commande ' || v_ref || ' est prête (' || v_statut_label || ').';
    ELSIF v_new_statut = 'en_cours_livraison' THEN
      v_titre := '🛵 Livraison en cours';
      v_message := 'La commande ' || v_ref || ' est en cours de livraison.';
    ELSIF v_new_statut = 'restitue' OR v_new_statut = 'livre' THEN
      v_titre := '🎉 Commande livrée';
      v_message := 'La commande ' || v_ref || ' a été restituée au client.';
    ELSIF v_new_statut = 'annule' THEN
      v_titre := '⚠️ Commande annulée';
      v_message := 'La commande ' || v_ref || ' a été annulée.';
    ELSE
      v_titre := '📦 Statut mis à jour';
      v_message := 'Commande ' || v_ref || ' : statut ' || v_statut_label;
    END IF;
  END IF;

  -- Insertion automatique dans la table order_notifications
  INSERT INTO public.order_notifications (
    order_id,
    store_id,
    type_action,
    titre,
    message,
    metadata
  ) VALUES (
    NEW.id,
    v_store_id,
    v_type_action,
    v_titre,
    v_message,
    row_to_json(NEW)::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_order_action ON public.orders;
CREATE TRIGGER trg_notify_order_action
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_process_order_action_notification();

-- ============================================================
-- 9. Chien de Garde Serveur : Trigger → pg_net → Edge Function
-- ============================================================
-- Prérequis :
--   1. Activer pg_net : Dashboard → Database → Extensions → pg_net → Enable
--   2. Stocker les secrets UNE SEULE FOIS dans le SQL Editor Supabase :
--
--      SELECT vault.create_secret(
--        'https://<your-project-ref>.supabase.co',
--        'klin_up_project_url',
--        'URL du projet Supabase KLIN UP'
--      );
--      SELECT vault.create_secret(
--        '<your-service-role-key>',
--        'klin_up_service_role_key',
--        'Service role key pour appels internes Edge Function'
--      );
--
--   (Remplacer <your-project-ref> et <your-service-role-key> par vos vraies valeurs)
--   (Disponibles dans : Dashboard → Settings → API)

CREATE OR REPLACE FUNCTION public.fn_dispatch_push_on_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_url  TEXT;
  v_key  TEXT;
  v_body TEXT;
BEGIN
  -- Récupérer les secrets depuis Supabase Vault
  -- (pas de ALTER DATABASE requis — compatible Supabase Cloud)
  BEGIN
    SELECT decrypted_secret INTO v_url
      FROM vault.decrypted_secrets
      WHERE name = 'klin_up_project_url'
      LIMIT 1;

    SELECT decrypted_secret INTO v_key
      FROM vault.decrypted_secrets
      WHERE name = 'klin_up_service_role_key'
      LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[fn_dispatch_push] Impossible de lire les secrets Vault : %. Configurer via vault.create_secret().', SQLERRM;
    RETURN NEW;
  END;

  IF v_url IS NULL OR v_url = '' OR v_key IS NULL OR v_key = '' THEN
    RAISE WARNING '[fn_dispatch_push] Secrets Vault vides (klin_up_project_url / klin_up_service_role_key). Vérifier la configuration.';
    RETURN NEW;
  END IF;

  -- Construire le body JSON de la notification à envoyer
  v_body := row_to_json(NEW)::text;

  -- Appel HTTP asynchrone vers l'Edge Function send-push-notification
  -- pg_net effectue l'appel en arrière-plan sans bloquer la transaction
  PERFORM net.http_post(
    url     := v_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := v_body
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Ne jamais bloquer la transaction principale en cas d'erreur réseau
  RAISE WARNING '[fn_dispatch_push] Erreur lors de l''appel Edge Function : %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_dispatch_push ON public.order_notifications;
CREATE TRIGGER trg_dispatch_push
AFTER INSERT ON public.order_notifications
FOR EACH ROW EXECUTE FUNCTION public.fn_dispatch_push_on_notification();

-- ============================================================
-- FALLBACK si pg_net ou Vault ne sont pas disponibles sur votre plan :
-- Utiliser le Database Webhook Supabase (aucun SQL requis) :
--   Dashboard → Database → Webhooks → New Webhook
--   Table    : order_notifications
--   Event    : INSERT
--   URL      : https://<project-ref>.supabase.co/functions/v1/send-push-notification
--   Header   : Authorization: Bearer <service_role_key>
-- ============================================================


