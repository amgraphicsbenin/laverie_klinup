-- ==============================================================================
-- 🛠️ EXEMPLES D'UTILISATION POUR VOS CRONS SUPABASE (pg_cron) ET SQLTOOLS
-- ==============================================================================
-- Exécutez ces requêtes avec l'extension SQLTools connectée à votre base Supabase.

-- 1. 👁️ VOIR TOUS LES CRONS ACTIFS
SELECT * FROM cron.job;

-- 2. 📝 CRÉER UN NOUVEAU CRON (Exemple: Tous les jours à minuit)
-- SELECT cron.schedule('mon_nom_de_cron', '0 0 * * *', $$
--    -- Votre requête SQL ici, ex: Nettoyer les logs anciens
--    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '30 days';
-- $$);

-- 3. ❌ SUPPRIMER UN CRON
-- SELECT cron.unschedule('mon_nom_de_cron');

-- 4. 🔍 VOIR L'HISTORIQUE D'EXÉCUTION DES CRONS
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
