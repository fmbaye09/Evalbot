import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Démarrage de la migration: Création de la table plagiarism_reports');
    
    // Vérifier si la table existe déjà
    const checkTableQuery = `
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' AND tablename = 'plagiarism_reports';
    `;
    
    const checkResult = await client.query(checkTableQuery);
    
    if (checkResult.rows.length === 0) {
      // Création de la table
      const createTableQuery = `
        CREATE TABLE plagiarism_reports (
          id SERIAL PRIMARY KEY,
          exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
          submission1_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
          submission2_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
          similarity_score DECIMAL(5,2) NOT NULL,
          details JSONB NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_by UUID REFERENCES users(id),
          review_notes TEXT,
          is_notified BOOLEAN DEFAULT false
        );
        
        CREATE INDEX plagiarism_reports_exam_id_idx ON plagiarism_reports(exam_id);
        CREATE INDEX plagiarism_reports_submission1_id_idx ON plagiarism_reports(submission1_id);
        CREATE INDEX plagiarism_reports_submission2_id_idx ON plagiarism_reports(submission2_id);
        CREATE INDEX plagiarism_reports_similarity_score_idx ON plagiarism_reports(similarity_score);
      `;
      
      await client.query(createTableQuery);
      console.log('✅ Migration réussie: Table plagiarism_reports créée');
    } else {
      console.log('ℹ️ La table plagiarism_reports existe déjà');
    }
    
  } catch (error) {
    console.error('❌ Échec de la migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la migration
runMigration().catch(err => {
  console.error('Erreur de migration:', err);
  process.exit(1);
}); 