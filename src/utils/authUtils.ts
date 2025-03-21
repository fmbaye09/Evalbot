import { authService, User } from '@/services/authService';
import { pool } from '@/config/database';

/**
 * Récupère le profil utilisateur depuis la base de données locale
 */
export const fetchUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Erreur lors de la récupération du profil utilisateur:", error);
    return null;
  }
};

export async function getCurrentUser(): Promise<User | null> {
  return authService.getCurrentUser();
}

export async function signIn(email: string, password: string): Promise<User> {
  return authService.signIn(email, password);
}

export async function signUp(email: string, password: string, name?: string): Promise<User> {
  return authService.signUp(email, password, name);
}

export async function signOut(): Promise<void> {
  return authService.signOut();
}
