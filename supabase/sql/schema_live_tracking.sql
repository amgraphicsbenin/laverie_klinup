-- ====================================================================
-- MIGRATION : SUIVI EN TEMPS RÉEL DES LIVREURS (DÉPÔT & LIVRAISON)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.order_tracking_sessions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  driver_id TEXT NOT NULL,
  driver_name TEXT,
  store_id TEXT,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('depot_laverie', 'livraison_client')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  heading DOUBLE PRECISION DEFAULT 0,
  speed DOUBLE PRECISION DEFAULT 0,
  dest_latitude DOUBLE PRECISION,
  dest_longitude DOUBLE PRECISION,
  dest_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_active_updated
  ON public.order_tracking_sessions(is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tracking_driver_id
  ON public.order_tracking_sessions(driver_id);

CREATE INDEX IF NOT EXISTS idx_tracking_store_id
  ON public.order_tracking_sessions(store_id);

-- Politiques RLS
ALTER TABLE public.order_tracking_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique suivi live" ON public.order_tracking_sessions;
CREATE POLICY "Lecture publique suivi live"
  ON public.order_tracking_sessions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Gestion complète suivi live" ON public.order_tracking_sessions;
CREATE POLICY "Gestion complète suivi live"
  ON public.order_tracking_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Colonnes GPS sur la table customers (pour persister l'adresse de livraison)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS coordonnees_livraison TEXT;

-- Activation Supabase Realtime sur la table de suivi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'order_tracking_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_tracking_sessions;
  END IF;
END $$;
