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
    console.log('Starting migration: Adding auto_graded column to submissions table');
    
    // Vérifier si la colonne existe déjà
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'submissions' AND column_name = 'auto_graded';
    `;
    
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length === 0) {
      // La colonne n'existe pas, on l'ajoute
      const alterTableQuery = `
        ALTER TABLE submissions 
        ADD COLUMN auto_graded BOOLEAN DEFAULT FALSE;
      `;
      
      await client.query(alterTableQuery);
      console.log('✅ Migration successful: Added auto_graded column to submissions table');
    } else {
      console.log('ℹ️ Column auto_graded already exists in submissions table');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la migration
runMigration().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
}); 