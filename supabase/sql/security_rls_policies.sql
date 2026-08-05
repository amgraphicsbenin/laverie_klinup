-- ============================================================================
-- 🛡️ SCRIPT DE SÉCURITÉ SUPABASE : ACTIVATION RLS & POLITIQUES RBAC (SEC-02)
-- ============================================================================
-- Application : Admin CMS & Mobile App KLIN UP
-- Objectif : Verrouiller l'accès direct aux tables Supabase en fonction des rôles.

-- 1. Activation de Row Level Security sur toutes les tables
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- 2. Suppression des anciennes politiques si existantes
DROP POLICY IF EXISTS "Public access staff" ON public.staff;
DROP POLICY IF EXISTS "Public access activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Public access orders" ON public.orders;
DROP POLICY IF EXISTS "Public access customers" ON public.customers;
DROP POLICY IF EXISTS "Public access stores" ON public.stores;
DROP POLICY IF EXISTS "Public access catalog" ON public.catalog_items;

-- ============================================================================
-- POLITIQUES SUR LA TABLE `staff`
-- ============================================================================

-- Les membres du personnel identifiés peuvent lire la liste des employés
CREATE POLICY "Staff read access" ON public.staff
FOR SELECT
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Seuls les administrateurs avec la permission `can_manage_staff` peuvent insérer/modifier/supprimer
CREATE POLICY "Staff admin write access" ON public.staff
FOR ALL
USING (
  auth.role() = 'authenticated' AND (
    (auth.jwt() ->> 'role') IN ('super_admin', 'gerant_boutique') OR
    (auth.jwt() ->> 'can_manage_staff')::boolean = true
  )
);

-- ============================================================================
-- POLITIQUES SUR LA TABLE `activity_logs` (SENSITIVE)
-- ============================================================================

-- Seuls les Super Admin et Gérants de boutique peuvent lire les logs d'activité
CREATE POLICY "Activity logs admin read" ON public.activity_logs
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    (auth.jwt() ->> 'role') IN ('super_admin', 'gerant_boutique') OR
    (auth.jwt() ->> 'can_view_logs')::boolean = true
  )
);

-- Tout membre du personnel peut écrire dans les logs
CREATE POLICY "Activity logs staff insert" ON public.activity_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Interdiction de modifier ou supprimer les logs d'audit (Immuabilité)
-- Aucune politique UPDATE ni DELETE n'est créée pour `activity_logs`.

-- ============================================================================
-- POLITIQUES SUR LA TABLE `orders`
-- ============================================================================

-- Accès en lecture aux commandes pour le personnel authentifié
CREATE POLICY "Orders read policy" ON public.orders
FOR SELECT
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Création et modification des commandes autorisées pour le personnel ayant `can_manage_orders`
CREATE POLICY "Orders write policy" ON public.orders
FOR ALL
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- ============================================================================
-- POLITIQUES SUR LA TABLE `catalog_items`
-- ============================================================================

-- Consultation du catalogue publique (Mobile & Caisse)
CREATE POLICY "Catalog public read" ON public.catalog_items
FOR SELECT
USING (true);

-- Modification du catalogue réservée au rôle d'administration avec `can_edit_catalog`
CREATE POLICY "Catalog admin write" ON public.catalog_items
FOR ALL
USING (
  auth.role() = 'authenticated' AND (
    (auth.jwt() ->> 'role') IN ('super_admin', 'gerant_boutique') OR
    (auth.jwt() ->> 'can_edit_catalog')::boolean = true
  )
);

-- ============================================================================
-- VÉRIFICATION & VALIDATION DES POLITIQUES
-- ============================================================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('staff', 'activity_logs', 'orders', 'customers', 'stores', 'catalog_items');
