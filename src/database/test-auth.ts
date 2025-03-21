import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';

async function testAuth() {
  try {
    console.log('🧪 Test de l\'authentification...');

    // 1. Nettoyer la table users
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    console.log('✨ Table users nettoyée');

    // 2. Créer un utilisateur de test
    const passwordHash = await bcrypt.hash('Test123!@#', 10);
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
      ['test@example.com', passwordHash, 'Test User', 'teacher']
    );
    
    const user = userResult.rows[0];
    console.log('👤 Utilisateur créé:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    // 3. Générer un token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    console.log('🔑 Token JWT généré:', token);

    // 4. Vérifier que l'utilisateur existe dans la base
    const checkResult = await pool.query('SELECT * FROM users WHERE email = $1', ['test@example.com']);
    console.log('✅ Utilisateur vérifié dans la base:', checkResult.rows.length > 0);

    console.log('\n✅ Test d\'authentification réussi !');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await pool.end();
  }
}

testAuth(); 