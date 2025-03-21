import { pool } from '../../config/database';

/**
 * Fonction pour créer les tables nécessaires pour le chatbot
 * Cette fonction est appelée au démarrage du serveur
 */
export async function setupChatbotTables() {
  try {
    console.log('Configuration des tables pour le chatbot...');
    
    // Création de la table des conversations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chatbot_conversations (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL DEFAULT 'Nouvelle conversation',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    // Création de la table des messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chatbot_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Tables du chatbot configurées avec succès');
  } catch (error) {
    console.error('Erreur lors de la configuration des tables du chatbot:', error);
    // Ne pas échouer le démarrage du serveur si la création des tables échoue
  }
} 