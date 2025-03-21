import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../config';

// Configuration du pool de connexions
const pool = new Pool({
  user: config.dbUser,
  host: config.dbHost,
  database: config.dbName,
  password: process.env.DB_PASSWORD, // À définir dans les variables d'environnement
  port: parseInt(config.dbPort),
  max: 20, // Nombre maximum de clients dans le pool
  idleTimeoutMillis: 30000, // Temps maximum d'inactivité d'un client
  connectionTimeoutMillis: 2000, // Temps maximum pour établir une connexion
});

// Événements du pool
pool.on('connect', () => {
  console.log('Nouvelle connexion établie avec la base de données');
});

pool.on('error', (err) => {
  console.error('Erreur inattendue du pool de connexions', err);
});

// Fonction pour exécuter une requête
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Requête exécutée', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête', error);
    throw error;
  }
}

// Fonction pour obtenir un client dédié du pool
export async function getClient() {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Intercepter la méthode release pour éviter les doubles libérations
  client.release = () => {
    client.release = () => {
      console.warn('Client déjà libéré');
    };
    release();
  };

  return client;
}

export default {
  query,
  getClient,
  pool,
}; 