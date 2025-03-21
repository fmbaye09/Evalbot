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

async function addCorrigesTypesTable() {
  try {
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'add-corriges-types.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    // Exécuter le script
    await pool.query(sqlScript);
    console.log('Table des corrigés types créée avec succès');

  } catch (error) {
    console.error('Erreur lors de la création de la table des corrigés types:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter la migration
addCorrigesTypesTable(); 