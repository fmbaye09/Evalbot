import axios from 'axios';

// Configuration de l'API Ollama
const OLLAMA_API_URL = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434';
const MODEL_NAME = 'deepseek-r1:8b';

// Classe pour le service Ollama DeepSeek
class DeepseekService {
  private static instance: DeepseekService;

  private constructor() {}

  static getInstance(): DeepseekService {
    if (!DeepseekService.instance) {
      DeepseekService.instance = new DeepseekService();
    }
    return DeepseekService.instance;
  }

  /**
   * Envoie une question à l'IA DeepSeek via Ollama et retourne la réponse
   */
  async askQuestion(question: string, context?: string): Promise<string> {
    try {
      console.log(`Envoi de la question à Ollama en local (${MODEL_NAME})...`);
      
      // Préparer le prompt avec contexte si fourni
      const prompt = context 
        ? `Contexte: ${context}\n\nQuestion: ${question}`
        : question;

      console.log(`URL Ollama: ${OLLAMA_API_URL}/api/generate`);
      
      // Configuration pour la requête
      const config = {
        responseType: 'text' as const,
        onDownloadProgress: (progressEvent: any) => {
          console.log('Progression de la réponse:', progressEvent);
        }
      };
      
      // Appel à l'API Ollama
      const response = await axios.post(
        `${OLLAMA_API_URL}/api/generate`,
        {
          model: MODEL_NAME,
          prompt: prompt,
          system: "Vous êtes un assistant pédagogique spécialisé dans l'aide aux étudiants et aux enseignants. Répondez en français de manière concise et précise.",
          options: {
            temperature: 0.7,
            num_predict: 500
          },
          stream: false // Désactiver le streaming pour simplifier le traitement
        },
        config
      );
      
      // Vérifier si la réponse est valide
      if (typeof response.data === 'string') {
        try {
          // Tenter de parser la réponse si c'est une chaîne JSON
          const jsonData = JSON.parse(response.data);
          if (jsonData.response) {
            console.log('Réponse reçue d\'Ollama avec succès (format JSON)');
            return jsonData.response;
          }
        } catch (e) {
          // La réponse n'est pas un JSON valide, l'utiliser telle quelle
          console.log('Réponse reçue d\'Ollama avec succès (format texte)');
          return response.data;
        }
      } else if (response.data && response.data.response) {
        // La réponse est déjà un objet JSON
        console.log('Réponse reçue d\'Ollama avec succès (objet)');
        return response.data.response;
      }
      
      console.error('Format de réponse Ollama inattendu:', response.data);
      return "Désolé, je n'ai pas pu générer de réponse compréhensible.";

    } catch (error) {
      console.error('Erreur lors de la communication avec Ollama:', error);
      
      // Afficher plus de détails sur l'erreur pour faciliter le débogage
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          console.error('Connexion refusée. Vérifiez qu\'Ollama est bien en cours d\'exécution sur le port par défaut (11434).');
          return "Impossible de se connecter au serveur Ollama local. Veuillez vérifier qu'Ollama est en cours d'exécution.";
        }
        
        if (error.response) {
          console.error('Réponse d\'erreur d\'Ollama:', error.response.data);
          if (error.response.status === 404) {
            return `Le modèle ${MODEL_NAME} n'est pas disponible. Veuillez exécuter 'ollama pull ${MODEL_NAME}' pour le télécharger.`;
          }
        }
      }
      
      return "Désolé, une erreur est survenue lors de la communication avec l'IA. Veuillez réessayer plus tard.";
    }
  }
  
  /**
   * Version alternative utilisant le streaming pour récupérer la réponse morceau par morceau
   * avec l'API Fetch qui est compatible avec les navigateurs
   */
  async askQuestionStreaming(question: string, context?: string, onUpdate?: (partialResponse: string) => void): Promise<string> {
    try {
      console.log(`Envoi de la question en streaming à Ollama en local (${MODEL_NAME})...`);
      
      // Préparer le prompt avec contexte si fourni
      const prompt = context 
        ? `Contexte: ${context}\n\nQuestion: ${question}`
        : question;
      
      // Préparation des données
      const body = JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        system: "Vous êtes un assistant pédagogique spécialisé dans l'aide aux étudiants et aux enseignants. Répondez en français de manière concise et précise.",
        options: {
          temperature: 0.7,
          num_predict: 500
        },
        stream: true
      });
      
      console.log(`URL API: ${OLLAMA_API_URL}/api/generate`);
      console.log('Données envoyées:', body);
      
      // Appel à l'API Ollama avec fetch
      const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur HTTP:', response.status, errorText);
        
        if (response.status === 404) {
          throw new Error(`Le modèle ${MODEL_NAME} n'est pas disponible`);
        }
        
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
      
      // Vérification que le body existe et est lisible en streaming
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Le corps de la réponse n\'est pas disponible en streaming');
      }
      
      const decoder = new TextDecoder();
      let responseText = '';
      let hasThinkingTag = false;
      
      // Lecture du stream morceau par morceau
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          console.log('Streaming terminé, réponse complète reçue');
          break;
        }
        
        // Convertir le morceau en texte
        const chunkText = decoder.decode(value, { stream: true });
        
        // Diviser par lignes (chaque ligne est un objet JSON)
        const lines = chunkText.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            // Filtrer les balises <think> et </think> que certains modèles peuvent générer
            if (data.response) {
              const response = data.response;
              
              // Vérifier si le texte contient des balises de réflexion
              if (response.includes('<think>')) {
                hasThinkingTag = true;
                continue; // Ignorer ce morceau
              }
              
              if (response.includes('</think>')) {
                hasThinkingTag = false;
                continue; // Ignorer ce morceau
              }
              
              // Si nous sommes dans une section de réflexion, ignorer ce texte
              if (hasThinkingTag) {
                continue;
              }
              
              responseText += response;
              
              // Notifier de la mise à jour si un callback est fourni
              if (onUpdate) {
                onUpdate(responseText);
              }
            }
          } catch (e) {
            console.warn('Impossible de parser la ligne JSON:', line);
          }
        }
      }
      
      if (responseText.trim() === '') {
        return "Désolé, je n'ai pas pu générer une réponse. Veuillez réessayer.";
      }
      
      return responseText;
      
    } catch (error) {
      console.error('Erreur lors de la communication en streaming avec Ollama:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return "Impossible de se connecter au serveur Ollama local. Veuillez vérifier qu'Ollama est en cours d'exécution.";
      }
      
      if (error instanceof Error) {
        if (error.message.includes('n\'est pas disponible')) {
          return `Le modèle ${MODEL_NAME} n'est pas disponible. Veuillez exécuter 'ollama pull ${MODEL_NAME}' pour le télécharger.`;
        }
        return error.message;
      }
      
      return "Désolé, une erreur est survenue lors de la communication avec l'IA. Veuillez réessayer plus tard.";
    }
  }
}

// Instance singleton
const deepseekService = DeepseekService.getInstance();

// Exporter les méthodes individuelles pour un accès plus facile
export const {
  askQuestion,
  askQuestionStreaming
} = deepseekService;

// Exporter le service complet
export { deepseekService }; 