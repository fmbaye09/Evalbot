import { useState } from 'react';
import { authService, User } from '@/services/authService';

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'teacher' | 'student') => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuthActions(
  setUser: (user: User | null) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): AuthActions {
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.signIn(email, password);
      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: 'teacher' | 'student') => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.signUp(email, password, name, role);
      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  return { login, register, logout };
}
