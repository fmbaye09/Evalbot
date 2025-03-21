import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de la connexion à la base de données
export const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'examinateur_db',
    port: parseInt(process.env.DB_PORT || '5432'),
  },
  pool: {
    min: 2,
    max: 10
  }
}); 