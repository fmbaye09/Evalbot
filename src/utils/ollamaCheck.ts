import axios from 'axios';

const OLLAMA_API_URL = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434';
const MODEL_NAME = 'deepseek-r1:8b';

/**
 * Fonction utilitaire pour attendre un certain temps
 * @param ms Temps d'attente en millisecondes
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Vérifie si Ollama est disponible et si le modèle est installé
 * @param retries Nombre de tentatives (par défaut: 3)
 * @param delayMs Délai entre les tentatives en ms (par défaut: 1000)
 * @returns Un objet indiquant si Ollama est disponible et si le modèle est installé
 */
export async function checkOllamaStatus(retries = 3, delayMs = 1000): Promise<{ 
  ollamaAvailable: boolean; 
  modelInstalled: boolean;
  error?: string;
}> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Tentative ${attempt + 1}/${retries} de connexion à Ollama...`);
      }
      
      // Vérifier si Ollama est disponible
      const response = await axios.get(`${OLLAMA_API_URL}/api/tags`, { 
        timeout: 5000  // Timeout de 5 secondes pour éviter d'attendre trop longtemps
      });
      
      // Vérifier si le modèle est installé
      const models = response.data.models || [];
      const modelInstalled = models.some((model: any) => model.name === MODEL_NAME);
      
      return { 
        ollamaAvailable: true, 
        modelInstalled 
      };
    } catch (error) {
      lastError = error;
      console.warn(`Tentative ${attempt + 1} échouée:`, error);
      
      // Si ce n'est pas la dernière tentative, attendre avant de réessayer
      if (attempt < retries - 1) {
        await wait(delayMs);
      }
    }
  }
  
  // Toutes les tentatives ont échoué
  console.error('Erreur lors de la vérification d\'Ollama après plusieurs tentatives:', lastError);
  
  let errorMessage = 'Une erreur inconnue est survenue lors de la vérification d\'Ollama.';
  
  if (axios.isAxiosError(lastError)) {
    if (lastError.code === 'ECONNREFUSED' || lastError.code === 'ECONNABORTED') {
      errorMessage = 'Impossible de se connecter à Ollama. Veuillez vérifier qu\'Ollama est en cours d\'exécution.';
    } else if (lastError.response) {
      errorMessage = `Erreur du serveur Ollama: ${lastError.response.status} ${lastError.response.statusText}`;
    } else if (lastError.request) {
      errorMessage = 'Aucune réponse reçue d\'Ollama. Vérifiez que le service est démarré.';
    }
  }
  
  return { 
    ollamaAvailable: false, 
    modelInstalled: false,
    error: errorMessage
  };
}

/**
 * Affiche des instructions pour installer et exécuter Ollama
 */
export function getOllamaInstructions(): string {
  return `
Pour utiliser l'assistant IA, vous devez installer Ollama :

1. Téléchargez Ollama sur https://ollama.ai/
2. Installez et démarrez Ollama
3. Exécutez la commande suivante dans votre terminal pour télécharger le modèle :
   ollama pull ${MODEL_NAME}
4. Redémarrez l'application

Si vous avez déjà installé Ollama, assurez-vous qu'il est en cours d'exécution.
`;
} 