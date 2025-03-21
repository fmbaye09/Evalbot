const isClient = typeof window !== 'undefined';


export const API_BASE_URL = isClient ? 'http://localhost:3003/api' : 'http://localhost:3003/api';

const TOKEN_KEY = 'auth_token';

export const getAuthToken = () => {
  if (!isClient) return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
  if (!isClient) return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeAuthToken = () => {
  if (!isClient) return;
  localStorage.removeItem(TOKEN_KEY);
}; 