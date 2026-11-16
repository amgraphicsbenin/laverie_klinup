-- ============================================================================
-- MIGRATION : FACTURES / JUSTIFICATIFS DES DÉPENSES (IMAGE & PDF)
-- Fichier : supabase/sql/schema_expense_receipt.sql
-- ============================================================================

-- 1. Ajout des colonnes de justificatif sur public.expenses
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS receipt_name TEXT,
  ADD COLUMN IF NOT EXISTS receipt_mime_type TEXT;

COMMENT ON COLUMN public.expenses.receipt_url IS 'URL publique du justificatif / facture (image ou PDF) dans Supabase Storage';
COMMENT ON COLUMN public.expenses.receipt_name IS 'Nom du fichier justificatif téléversé';
COMMENT ON COLUMN public.expenses.receipt_mime_type IS 'Type MIME du justificatif (image/* ou application/pdf)';

-- 2. Création du bucket Supabase Storage pour les factures de dépenses
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-receipts',
  'expense-receipts',
  true,
  10485760, -- 10 Mo max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Politiques RLS sur storage.objects pour le bucket expense-receipts
DROP POLICY IF EXISTS "Lecture factures depenses" ON storage.objects;
CREATE POLICY "Lecture factures depenses"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'expense-receipts');

DROP POLICY IF EXISTS "Upload factures depenses" ON storage.objects;
CREATE POLICY "Upload factures depenses"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'expense-receipts');

DROP POLICY IF EXISTS "Mise a jour factures depenses" ON storage.objects;
CREATE POLICY "Mise a jour factures depenses"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'expense-receipts')
  WITH CHECK (bucket_id = 'expense-receipts');

DROP POLICY IF EXISTS "Suppression factures depenses" ON storage.objects;
CREATE POLICY "Suppression factures depenses"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'expense-receipts');
