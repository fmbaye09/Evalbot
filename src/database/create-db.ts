import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'postgres',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function createDatabase() {
  try {
    // Vérifier si la base de données existe
    const result = await pool.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [process.env.DB_NAME]);

    // Créer la base de données si elle n'existe pas
    if (result.rows.length === 0) {
      await pool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log('Nouvelle base de données créée');
    } else {
      console.log('La base de données existe déjà');
    }

    // Se connecter à la base de données
    const newPool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    });

    // Créer l'extension uuid-ossp si elle n'existe pas
    await newPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('Extension uuid-ossp créée');

    await newPool.end();
    console.log('Configuration de la base de données terminée !');
  } catch (error) {
    console.error('Erreur lors de la création de la base de données:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter la création
createDatabase(); 