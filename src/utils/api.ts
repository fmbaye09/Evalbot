import { API_BASE_URL, getAuthToken } from '../config/client';

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  console.log('Token récupéré:', token);
  
  if (!token) {
    throw new Error('Non authentifié');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  console.log('URL de la requête:', url);
  console.log('Headers:', headers);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Réponse du serveur:', errorData);
      try {
        const jsonError = JSON.parse(errorData);
        throw new Error(jsonError.error || 'Une erreur est survenue');
      } catch (e) {
        throw new Error(`Erreur ${response.status}: ${errorData}`);
      }
    }

    return response;
  } catch (error) {
    console.error('Erreur lors de la requête:', error);
    throw error;
  }
}; 