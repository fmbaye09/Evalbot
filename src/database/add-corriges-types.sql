-- Création de la table des corrigés types
CREATE TABLE IF NOT EXISTS corriges_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_exam_corrige UNIQUE (exam_id)
);

-- Index pour la table corriges_types
CREATE INDEX IF NOT EXISTS idx_corriges_types_exam_id ON corriges_types(exam_id); 