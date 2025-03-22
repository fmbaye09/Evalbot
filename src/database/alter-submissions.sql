-- Ajout de la colonne graded_at à la table submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP WITH TIME ZONE; 