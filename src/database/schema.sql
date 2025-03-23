-- Création des tables

-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des examens
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id),
    file_path VARCHAR(255),
    file_url TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des soumissions
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id),
    user_id UUID NOT NULL REFERENCES users(id),
    file_path VARCHAR(255),
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    grade DECIMAL(5,2),
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP WITH TIME ZONE
);

-- Table des corrigés types
CREATE TABLE corriges_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_exam_corrige UNIQUE (exam_id)
);


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




-- Index pour améliorer les performances
CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_submissions_exam_id ON submissions(exam_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_corriges_types_exam_id ON corriges_types(exam_id); 
CREATE INDEX idx_plagiarism_exam_id ON plagiarism_results(exam_id);
CREATE INDEX idx_plagiarism_submission1 ON plagiarism_results(submission1_id);
CREATE INDEX idx_plagiarism_submission2 ON plagiarism_results(submission2_id);

