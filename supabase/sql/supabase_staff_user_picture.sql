-- =================================================================
-- Migration : Ajout de la colonne user_picture dans la table staff
-- =================================================================

ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_picture TEXT;

COMMENT ON COLUMN staff.user_picture IS 'URL ou chaîne base64 de la photo de profil de l''utilisateur';
