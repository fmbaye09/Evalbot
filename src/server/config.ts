import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

interface Config {
  port: string;
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  jwtSecret: string;
  uploadDir: string;
}

export const config: Config = {
  port: process.env.PORT || '3003',
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: process.env.DB_PORT || '5432',
  dbName: process.env.DB_NAME || 'examinateur_db',
  dbUser: process.env.DB_USER || 'odoo',
  dbPassword: process.env.DB_PASSWORD || '',
  jwtSecret: process.env.JWT_SECRET || 'votre_secret_jwt',
  uploadDir: process.env.UPLOAD_DIR || 'uploads'
};

// Vérification des variables d'environnement requises
const requiredEnvVars = ['DB_PASSWORD', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('Variables d\'environnement manquantes:', missingEnvVars.join(', '));
}

// Afficher la configuration au démarrage
console.log('Configuration du serveur:', {
  port: config.port,
  dbHost: config.dbHost,
  dbName: config.dbName,
  dbUser: config.dbUser,
  dbPort: config.dbPort,
}); 