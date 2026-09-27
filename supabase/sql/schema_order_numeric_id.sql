-- ==============================================================================
-- 🚀 MIGRATION : PASSAGE DES COMMANDES À UN IDENTIFIANT STRICTEMENT NUMÉRIQUE
-- ==============================================================================
-- Cette migration :
-- 1. Crée une séquence PostgreSQL dédiée pour l'auto-incrémentation numérique des commandes
-- 2. Initialise la valeur de départ
-- 3. Attribue une valeur par défaut auto-incrémentée pour la colonne id
-- 4. Fournit la procédure de migration ordonnée pour réaligner les commandes existantes
-- ==============================================================================

-- 1. Création de la séquence auto-incrémentée pour les IDs de commande
CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq START WITH 1 INCREMENT BY 1;

-- 2. Synchronisation de la séquence avec le maximum numérique existant
DO $$
DECLARE
  v_max_id BIGINT;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\D', '', 'g'), '')::bigint), 0)
  INTO v_max_id
  FROM public.orders;

  IF v_max_id > 0 THEN
    PERFORM setval('public.orders_id_seq', v_max_id);
  END IF;
END $$;

-- 3. Définition de la valeur par défaut pour la colonne id
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq')::text;

-- 4. Procédure de normalisation des commandes historiques (réassignation d'un ID numérique propre)
DO $$
DECLARE
  r RECORD;
  v_num BIGINT := 1;
BEGIN
  FOR r IN 
    SELECT id, identifiant_unique_marquage 
    FROM public.orders 
    WHERE id ~ '\D'
    ORDER BY created_at ASC 
  LOOP
    WHILE EXISTS (SELECT 1 FROM public.orders WHERE id = v_num::text) LOOP
      v_num := v_num + 1;
    END LOOP;

    -- Mise à jour de la table liée order_notifications
    UPDATE public.order_notifications 
    SET order_id = v_num::text 
    WHERE order_id = r.id;

    -- Mise à jour de la commande avec le nouvel ID numérique et alignement du marquage
    UPDATE public.orders 
    SET 
      id = v_num::text,
      identifiant_unique_marquage = v_num::text
    WHERE id = r.id;

    v_num := v_num + 1;
  END LOOP;

  IF EXISTS (SELECT 1 FROM public.orders WHERE id ~ '^\d+$') THEN
    PERFORM setval('public.orders_id_seq', (SELECT MAX(id::bigint) FROM public.orders WHERE id ~ '^\d+$'));
  END IF;
END $$;
