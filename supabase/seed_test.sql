-- ==============================================================================
-- KLIN UP - JEU DE DONNÉES DE TEST (SEED TEST ENVIRONMENT)
-- ==============================================================================
-- Ce script est destiné exclusivement à l'environnement de TEST (klinup-test).
-- Ne jamais exécuter ce fichier sur la base de données de Production !
-- ==============================================================================

-- 1. Nettoyage contrôlé des tables de test
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.customers CASCADE;
TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.staff CASCADE;
TRUNCATE TABLE public.catalog CASCADE;

-- 2. Insertion du personnel de test (Staff)
INSERT INTO public.staff (id, nom, prenom, role, email, code_pin, statut, telephone, permissions)
VALUES 
  ('staff-test-admin', 'ADMIN', 'Testeur', 'Administrateur', 'admin.test@klinup.bj', '000000', 'actif', '+22997000001', '["all"]'::jsonb),
  ('staff-test-caisse', 'CAISSIER', 'Jean', 'Caissier', 'caisse.test@klinup.bj', '123456', 'actif', '+22997000002', '["orders_create", "orders_read", "cash_register"]'::jsonb),
  ('staff-test-livreur', 'LIVREUR', 'Marc', 'Livreur', 'livreur.test@klinup.bj', '123456', 'actif', '+22997000003', '["delivery"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. Insertion de clients de test
INSERT INTO public.customers (id, nom, prenom, telephone, adresse, indicatif, preferences_pliage, points_fidelite)
VALUES
  ('cust-test-1', 'MENSAH', 'Aïcha', '+22997112233', 'Cotonou, Haie Vive', '229', 'Cintre', 120),
  ('cust-test-2', 'KOUDJO', 'Boris', '+22996445566', 'Cotonou, Cadjèhoun', '229', 'Plié', 45),
  ('cust-test-3', 'AGBOGBA', 'Clarisse', '+22995778899', 'Calavi, Arconville', '229', 'Plié', 0)
ON CONFLICT (id) DO NOTHING;

-- 4. Insertion du catalogue de prestations de test
INSERT INTO public.catalog (id, nom, description, categorie, prix_unitaire, statut, created_at)
VALUES
  ('cat-chemise', 'Chemise Homme / Femme', 'Lavage standard et repassage soigné sur cintre', 'Classique', 1500, 'actif', CURRENT_TIMESTAMP),
  ('cat-pantalon', 'Pantalon costume / Jeans', 'Détachage, lavage et repassage au pli', 'Classique', 2000, 'actif', CURRENT_TIMESTAMP),
  ('cat-costume', 'Costume 2 pièces', 'Nettoyage à sec pressing haute précision', 'Pressing', 5000, 'actif', CURRENT_TIMESTAMP),
  ('cat-robe', 'Robe de soirée', 'Nettoyage délicat et repassage vapeur', 'Pressing', 6000, 'actif', CURRENT_TIMESTAMP),
  ('cat-couette', 'Couette 2 places', 'Lavage antibactérien et séchage haute capacité', 'Linge de maison', 4500, 'actif', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET prix_unitaire = EXCLUDED.prix_unitaire;

-- 5. Insertion de commandes de test représentatives de chaque étape du workflow
INSERT INTO public.orders (
  id, customer_id, statut, type_article, type_service, niveau_urgence, 
  mode_reglement, avance_payee, prix_total, identifiant_unique_marquage, 
  created_at, items, created_by_name
)
VALUES
  (
    'ord-test-001', 'cust-test-1', 'attente', 'Chemise (x2)', 'Lavage & Repassage', 'Normal',
    'Espèces', 0.00, 3000.00, 'TEST-001',
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    '[{"id":"cat-chemise","nom":"Chemise","quantite":2,"prix":1500}]'::jsonb,
    'Testeur Caisse'
  ),
  (
    'ord-test-002', 'cust-test-2', 'traitement', 'Costume 2 pièces', 'Pressing Express', 'Urgent',
    'Mobile Money', 5000.00, 5000.00, 'TEST-002',
    CURRENT_TIMESTAMP - INTERVAL '5 hours',
    '[{"id":"cat-costume","nom":"Costume 2 pièces","quantite":1,"prix":5000}]'::jsonb,
    'Testeur Caisse'
  ),
  (
    'ord-test-003', 'cust-test-1', 'en_cours_lavage', 'Pantalon (x2)', 'Lavage', 'Normal',
    'Espèces', 2000.00, 4000.00, 'TEST-003',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    '[{"id":"cat-pantalon","nom":"Pantalon","quantite":2,"prix":2000}]'::jsonb,
    'Testeur Caisse'
  ),
  (
    'ord-test-004', 'cust-test-3', 'pret', 'Couette 2 places', 'Linge de maison', 'Normal',
    'Espèces', 4500.00, 4500.00, 'TEST-004',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    '[{"id":"cat-couette","nom":"Couette 2 places","quantite":1,"prix":4500}]'::jsonb,
    'Testeur Caisse'
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Journal d'activité initial
INSERT INTO public.activity_logs (id, user_id, user_name, action, details, timestamp)
VALUES
  ('log-test-init', 'staff-test-admin', 'ADMIN Testeur', 'INITIALISATION_ENVIRONNEMENT', 'Données de test initialisées avec succès pour la base klinup-test.', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
