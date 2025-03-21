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
    console.log('Démarrage de la migration: Création de la table notifications');
    
    // Vérifier si la table existe déjà
    const checkTableQuery = `
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' AND tablename = 'notifications';
    `;
    
    const checkResult = await client.query(checkTableQuery);
    
    if (checkResult.rows.length === 0) {
      // Création de la table
      const createTableQuery = `
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          related_id UUID,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          link VARCHAR(255)
        );
        
        CREATE INDEX notifications_user_id_idx ON notifications(user_id);
        CREATE INDEX notifications_is_read_idx ON notifications(is_read);
      `;
      
      await client.query(createTableQuery);
      console.log('✅ Migration réussie: Table notifications créée');
    } else {
      console.log('ℹ️ La table notifications existe déjà');
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