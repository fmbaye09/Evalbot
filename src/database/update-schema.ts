import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function updateSchema() {
  try {
    // Lire le fichier alter-submissions.sql
    const alterScriptPath = path.join(__dirname, 'alter-submissions.sql');
    const alterScript = fs.readFileSync(alterScriptPath, 'utf8');

    // Exécuter le script
    await pool.query(alterScript);
    console.log('Schéma de la base de données mis à jour avec succès');

  } catch (error) {
    console.error('Erreur lors de la mise à jour du schéma:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter la mise à jour
updateSchema(); 