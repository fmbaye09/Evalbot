\c examinateur_db;

-- Accorder tous les privilèges sur la base de données
GRANT ALL PRIVILEGES ON DATABASE examinateur_db TO odoo;

-- Accorder tous les privilèges sur toutes les tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO odoo;

-- Accorder tous les privilèges sur toutes les séquences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO odoo;

-- Définir odoo comme propriétaire du schéma public
ALTER SCHEMA public OWNER TO odoo;

-- Accorder les privilèges par défaut pour les futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO odoo;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON SEQUENCES TO odoo; 