import { API_BASE_URL } from '../config/client';
import { fetchWithAuth } from '../utils/api';

const TOKEN_KEY = 'auth_token';

// Service d'authentification local
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'teacher' | 'student';
  created_at: Date;
  updated_at: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('Tentative de connexion avec:', { email });
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Email ou mot de passe incorrect');
      }

      const { user, token } = await response.json() as AuthResponse;
      this.setToken(token);
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, name?: string, role: 'teacher' | 'student' = 'student'): Promise<User> {
    try {
      console.log('Tentative d\'inscription avec:', { email, name, role });
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.details) {
          throw new Error(error.details.map((e: any) => e.message).join(', '));
        }
        throw new Error(error.error || 'Erreur lors de l\'inscription');
      }

      const { user, token } = await response.json() as AuthResponse;
      this.setToken(token);
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Une erreur inattendue est survenue lors de l\'inscription');
    }
  }

  async signOut(): Promise<void> {
    this.removeToken();
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.currentUser) {
      const token = this.getToken();
      if (!token) return null;

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération de l\'utilisateur');
        }

        this.currentUser = await response.json();
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        this.currentUser = null;
        this.removeToken();
      }
    }
    return this.currentUser;
  }
}

export const authService = AuthService.getInstance(); 