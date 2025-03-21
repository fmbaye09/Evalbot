import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

process.stdout.write('🚀 Démarrage du script de test...\n');

// Charger les variables d'environnement
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'odoo',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'examinateur_db',
  password: process.env.DB_PASSWORD || 'odoo',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function testConnection() {
  try {
    process.stdout.write('📡 Tentative de connexion à la base de données...\n');
    const result = await pool.query('SELECT NOW()');
    process.stdout.write('✅ Connexion réussie !\n');
    process.stdout.write(`⏰ Heure du serveur: ${result.rows[0].now}\n`);
  } catch (error) {
    process.stderr.write(`❌ Erreur de connexion: ${error}\n`);
    process.exit(1);
  } finally {
    await pool.end();
    process.stdout.write('👋 Test terminé !\n');
  }
}

// Exécuter le test et attendre un peu avant de terminer
testConnection().then(() => {
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}).catch((error) => {
  process.stderr.write(`❌ Erreur non gérée: ${error}\n`);
  process.exit(1);
}); 