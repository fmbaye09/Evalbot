-- Table pour stocker les résultats de détection de plagiat
CREATE TABLE IF NOT EXISTS plagiarism_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    submission1_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    submission2_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,2) NOT NULL,
    similar_passages TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_comparison UNIQUE (submission1_id, submission2_id)
);

-- Index pour améliorer les performances (création conditionnelle)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_plagiarism_exam_id') THEN
        CREATE INDEX idx_plagiarism_exam_id ON plagiarism_results(exam_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_plagiarism_submission1') THEN
        CREATE INDEX idx_plagiarism_submission1 ON plagiarism_results(submission1_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_plagiarism_submission2') THEN
        CREATE INDEX idx_plagiarism_submission2 ON plagiarism_results(submission2_id);
    END IF;
END $$; 