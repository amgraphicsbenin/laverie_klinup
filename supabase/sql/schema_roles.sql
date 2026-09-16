-- ========================================================
-- SCRIPT DE CRÉATION DE LA TABLE ROLES & PERMISSIONS
-- Fichier : supabase/sql/schema_roles.sql
-- ========================================================

-- 1. Création de la table des rôles
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  short_label TEXT,
  color TEXT DEFAULT '#2563eb',
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Index de performance
CREATE INDEX IF NOT EXISTS idx_roles_key ON public.roles(key);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON public.roles(is_system);

-- 3. Sécurité Row Level Security (RLS)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique ou authentifiée des rôles" ON public.roles;
CREATE POLICY "Lecture publique ou authentifiée des rôles"
  ON public.roles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Modification des rôles autorisée" ON public.roles;
CREATE POLICY "Modification des rôles autorisée"
  ON public.roles FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Insertion des 6 Rôles Système Initiaux de KLIN UP
-- (ON CONFLICT DO NOTHING assure que le script est 100% idempotent et non destructif)
INSERT INTO public.roles (id, key, label, short_label, color, description, is_system, permissions) VALUES
  (
    'super_admin',
    'super_admin',
    'Super Administrateur',
    'Admin',
    '#2563eb',
    'Accès complet au CMS, gestion du personnel, paramètres système et audit.',
    true,
    '{"can_view_dashboard": true, "can_manage_orders": true, "can_manage_crm": true, "can_edit_catalog": true, "can_manage_stores": true, "can_view_logs": true, "can_manage_staff": true, "can_access_mobile": true, "can_create_orders_mobile": true, "can_manage_delivery_mobile": true, "can_manage_workshop_mobile": true}'::jsonb
  ),
  (
    'manager',
    'manager',
    'Manager Caisse',
    'Manager',
    '#0284c7',
    'Gestion des encaissements, commandes, clients et catalogue d''articles.',
    true,
    '{"can_view_dashboard": true, "can_manage_orders": true, "can_manage_crm": true, "can_edit_catalog": true, "can_manage_stores": false, "can_view_logs": false, "can_manage_staff": false, "can_access_mobile": true, "can_create_orders_mobile": true, "can_manage_delivery_mobile": false, "can_manage_workshop_mobile": false}'::jsonb
  ),
  (
    'editeur_catalogue',
    'editeur_catalogue',
    'Éditeur Catalogue',
    'Catalogue',
    '#8b5cf6',
    'Gestion complète du catalogue d''articles, création de produits, ajustement des tarifs et formules d''abonnement.',
    true,
    '{"can_view_dashboard": false, "can_manage_orders": false, "can_manage_crm": false, "can_edit_catalog": true, "can_manage_stores": false, "can_view_logs": false, "can_manage_staff": false, "can_access_mobile": true, "can_create_orders_mobile": false, "can_manage_delivery_mobile": false, "can_manage_workshop_mobile": false}'::jsonb
  ),
  (
    'agent_accueil',
    'agent_accueil',
    'Agent d''accueil',
    'Accueil',
    '#16a34a',
    'Réception des clients et enregistrement des commandes (App Mobile).',
    true,
    '{"can_view_dashboard": false, "can_manage_orders": false, "can_manage_crm": false, "can_edit_catalog": false, "can_manage_stores": false, "can_view_logs": false, "can_manage_staff": false, "can_access_mobile": true, "can_create_orders_mobile": true, "can_manage_delivery_mobile": false, "can_manage_workshop_mobile": false}'::jsonb
  ),
  (
    'livreur',
    'livreur',
    'Livreur',
    'Livreur',
    '#d97706',
    'Collecte et livraison des colis textiles à domicile (App Mobile).',
    true,
    '{"can_view_dashboard": false, "can_manage_orders": false, "can_manage_crm": false, "can_edit_catalog": false, "can_manage_stores": false, "can_view_logs": false, "can_manage_staff": false, "can_access_mobile": true, "can_create_orders_mobile": false, "can_manage_delivery_mobile": true, "can_manage_workshop_mobile": false}'::jsonb
  ),
  (
    'agent_lavage_repassage',
    'agent_lavage_repassage',
    'Agent Atelier (Lavage/Repassage)',
    'Atelier',
    '#8b5cf6',
    'Traitement des textiles, lavage, séchage et repassage (App Mobile).',
    true,
    '{"can_view_dashboard": false, "can_manage_orders": false, "can_manage_crm": false, "can_edit_catalog": false, "can_manage_stores": false, "can_view_logs": false, "can_manage_staff": false, "can_access_mobile": true, "can_create_orders_mobile": false, "can_manage_delivery_mobile": false, "can_manage_workshop_mobile": true}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

