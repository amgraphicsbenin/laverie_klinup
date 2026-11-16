-- ============================================================================
-- MIGRATION : GESTION DES DÉPENSES LAVERIE (APP ANDROID + ADMIN CMS)
-- Fichier : supabase/sql/schema_expenses.sql
-- ============================================================================

-- 1. Table principale des dépenses de la laverie
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL DEFAULT 'store_central',
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  amount DOUBLE PRECISION NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'especes',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'validee', -- 'validee' | 'en_attente' | 'rejetee'
  reference TEXT,
  receipt_url TEXT,
  receipt_name TEXT,
  receipt_mime_type TEXT,
  created_by_id TEXT,
  created_by_name TEXT,
  created_by_role TEXT,
  source TEXT NOT NULL DEFAULT 'app', -- 'app' | 'admin'
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Index de performance pour les filtres App & Admin
CREATE INDEX IF NOT EXISTS idx_expenses_store_id ON public.expenses(store_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at DESC);

-- 3. Trigger de mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.set_expenses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON public.expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_expenses_updated_at();

-- 4. Fonction RPC : création sécurisée d'une dépense + journalisation
CREATE OR REPLACE FUNCTION public.create_expense(
  p_store_id TEXT DEFAULT 'store_central',
  p_category TEXT DEFAULT 'autres',
  p_label TEXT DEFAULT '',
  p_description TEXT DEFAULT NULL,
  p_amount DOUBLE PRECISION DEFAULT 0,
  p_payment_method TEXT DEFAULT 'especes',
  p_expense_date DATE DEFAULT CURRENT_DATE,
  p_reference TEXT DEFAULT NULL,
  p_created_by_id TEXT DEFAULT NULL,
  p_created_by_name TEXT DEFAULT NULL,
  p_created_by_role TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'app',
  p_status TEXT DEFAULT 'validee'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id TEXT := 'exp_' || replace(gen_random_uuid()::text, '-', '');
  v_store_id TEXT := COALESCE(NULLIF(TRIM(p_store_id), ''), 'store_central');
  v_category TEXT := COALESCE(NULLIF(TRIM(p_category), ''), 'autres');
  v_label TEXT := TRIM(COALESCE(p_label, ''));
  v_payment TEXT := COALESCE(NULLIF(TRIM(p_payment_method), ''), 'especes');
  v_date DATE := COALESCE(p_expense_date, CURRENT_DATE);
  v_status TEXT := CASE WHEN p_status IN ('validee', 'en_attente', 'rejetee') THEN p_status ELSE 'validee' END;
  v_source TEXT := CASE WHEN p_source IN ('app', 'admin') THEN p_source ELSE 'app' END;
  v_row public.expenses%ROWTYPE;
BEGIN
  IF v_label = '' THEN
    RAISE EXCEPTION 'Le libellé de la dépense est obligatoire.';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant de la dépense doit être strictement supérieur à 0.';
  END IF;

  INSERT INTO public.expenses (
    id,
    store_id,
    category,
    label,
    description,
    amount,
    payment_method,
    expense_date,
    status,
    reference,
    created_by_id,
    created_by_name,
    created_by_role,
    source
  ) VALUES (
    v_id,
    v_store_id,
    v_category,
    v_label,
    NULLIF(TRIM(COALESCE(p_description, '')), ''),
    p_amount,
    v_payment,
    v_date,
    v_status,
    NULLIF(TRIM(COALESCE(p_reference, '')), ''),
    NULLIF(TRIM(COALESCE(p_created_by_id, '')), ''),
    NULLIF(TRIM(COALESCE(p_created_by_name, '')), ''),
    NULLIF(TRIM(COALESCE(p_created_by_role, '')), ''),
    v_source
  )
  RETURNING * INTO v_row;

  -- Journalisation non bloquante dans activity_logs
  BEGIN
    INSERT INTO public.activity_logs (id, user_id, user_name, action, details, timestamp)
    VALUES (
      'log_' || replace(gen_random_uuid()::text, '-', ''),
      v_row.created_by_id,
      COALESCE(v_row.created_by_name, 'Système'),
      'CREATION_DEPENSE',
      format('Dépense "%s" (%s) : %s FCFA [%s]', v_row.label, v_row.category, round(v_row.amount)::text, v_row.payment_method),
      CURRENT_TIMESTAMP
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN to_jsonb(v_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_expense(
  TEXT, TEXT, TEXT, TEXT, DOUBLE PRECISION, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- 5. Fonction RPC : résumé analytique des dépenses (Admin & App)
CREATE OR REPLACE FUNCTION public.get_expenses_summary(
  p_store_id TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total DOUBLE PRECISION := 0;
  v_count INTEGER := 0;
  v_avg DOUBLE PRECISION := 0;
  v_by_category JSONB := '[]'::jsonb;
  v_by_payment JSONB := '[]'::jsonb;
BEGIN
  SELECT
    COALESCE(SUM(amount), 0),
    COUNT(*)::INTEGER,
    COALESCE(AVG(amount), 0)
  INTO v_total, v_count, v_avg
  FROM public.expenses
  WHERE status <> 'rejetee'
    AND (p_store_id IS NULL OR p_store_id IN ('all', 'GLOBAL', '') OR store_id = p_store_id)
    AND (p_start_date IS NULL OR expense_date >= p_start_date)
    AND (p_end_date IS NULL OR expense_date <= p_end_date);

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'category', t.category,
        'total', t.total,
        'count', t.cnt
      )
      ORDER BY t.total DESC
    ),
    '[]'::jsonb
  )
  INTO v_by_category
  FROM (
    SELECT category, SUM(amount) AS total, COUNT(*)::INTEGER AS cnt
    FROM public.expenses
    WHERE status <> 'rejetee'
      AND (p_store_id IS NULL OR p_store_id IN ('all', 'GLOBAL', '') OR store_id = p_store_id)
      AND (p_start_date IS NULL OR expense_date >= p_start_date)
      AND (p_end_date IS NULL OR expense_date <= p_end_date)
    GROUP BY category
  ) t;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'payment_method', t.payment_method,
        'total', t.total,
        'count', t.cnt
      )
      ORDER BY t.total DESC
    ),
    '[]'::jsonb
  )
  INTO v_by_payment
  FROM (
    SELECT payment_method, SUM(amount) AS total, COUNT(*)::INTEGER AS cnt
    FROM public.expenses
    WHERE status <> 'rejetee'
      AND (p_store_id IS NULL OR p_store_id IN ('all', 'GLOBAL', '') OR store_id = p_store_id)
      AND (p_start_date IS NULL OR expense_date >= p_start_date)
      AND (p_end_date IS NULL OR expense_date <= p_end_date)
    GROUP BY payment_method
  ) t;

  RETURN jsonb_build_object(
    'total_amount', v_total,
    'expense_count', v_count,
    'avg_amount', v_avg,
    'by_category', v_by_category,
    'by_payment_method', v_by_payment
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_expenses_summary(TEXT, DATE, DATE) TO anon, authenticated;

-- 6. Sécurité RLS & Droits d'accès
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO anon, authenticated;

DROP POLICY IF EXISTS "Lecture expenses" ON public.expenses;
CREATE POLICY "Lecture expenses"
  ON public.expenses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Insertion expenses" ON public.expenses;
CREATE POLICY "Insertion expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Modification expenses" ON public.expenses;
CREATE POLICY "Modification expenses"
  ON public.expenses FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Suppression expenses" ON public.expenses;
CREATE POLICY "Suppression expenses"
  ON public.expenses FOR DELETE
  USING (true);

-- 7. Activation Temps Réel (Supabase Realtime)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;
END $$;
