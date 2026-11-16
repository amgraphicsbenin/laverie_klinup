-- ========================================================
-- MIGRATION : AJUSTEMENTS DE POINTS REWARD & VALIDATION ADMIN
-- Fichier : supabase/sql/schema_reward_adjustments.sql
-- ========================================================

CREATE TABLE IF NOT EXISTS public.reward_point_adjustments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  store_id TEXT DEFAULT 'store_central',
  points_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  requested_by_id TEXT,
  requested_by_name TEXT,
  requested_by_role TEXT,
  validated_by_id TEXT,
  validated_by_name TEXT,
  validated_by_role TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  validated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_reward_adj_customer ON public.reward_point_adjustments(customer_id);
CREATE INDEX IF NOT EXISTS idx_reward_adj_store ON public.reward_point_adjustments(store_id);
CREATE INDEX IF NOT EXISTS idx_reward_adj_status ON public.reward_point_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_reward_adj_created ON public.reward_point_adjustments(created_at DESC);

ALTER TABLE public.reward_point_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique ou authentifiee reward_point_adjustments" ON public.reward_point_adjustments;
CREATE POLICY "Lecture publique ou authentifiee reward_point_adjustments"
  ON public.reward_point_adjustments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Modification reward_point_adjustments" ON public.reward_point_adjustments;
CREATE POLICY "Modification reward_point_adjustments"
  ON public.reward_point_adjustments FOR ALL
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'reward_point_adjustments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reward_point_adjustments;
  END IF;
END $$;
