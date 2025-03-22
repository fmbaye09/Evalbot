import fetch from 'node-fetch';
import { config } from '../config';

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'deepseek-r1:8b';

interface OllamaRequestBody {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export class AiService {
  /**
   * Génère un corrigé type à partir d'un sujet d'examen
   * @param examContent Le contenu de l'examen
   * @returns Le contenu du corrigé généré
   */
  static async generateCorrigeType(examContent: string): Promise<string> {
    console.log('Génération du corrigé type...');
    
    const prompt = `
Tu es un enseignant expert qui doit générer un corrigé type pour un sujet d'examen.
Voici le sujet d'examen :

${examContent}

Génère un corrigé type complet, clair et précis pour ce sujet. 
Le corrigé doit :
- Couvrir tous les points importants du sujet
- Fournir des réponses détaillées et justifiées
- Respecter la structure du sujet original
- Inclure des informations pertinentes et exactes
- Être bien organisé avec des sections claires

Corrigé type :
`;

    const response = await this.callOllama(prompt, {
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 4000
    });

    return response;
  }

  /**
   * Corrige une copie d'étudiant en la comparant à un corrigé type
   * @param studentSubmission Le contenu de la copie de l'étudiant
   * @param referenceAnswer Le corrigé type
   * @returns Une note sur 20 et un feedback détaillé
   */
  static async gradeSubmission(studentSubmission: string, referenceAnswer: string): Promise<{ grade: number, feedback: string }> {
    console.log('Correction automatique de la copie...');
    
    const prompt = `
Tu es un enseignant expert qui doit évaluer la copie d'un étudiant en la comparant à un corrigé type.

Voici le corrigé type de référence :
---
${referenceAnswer}
---

Voici la copie de l'étudiant à évaluer :
---
${studentSubmission}
---

Évalue cette copie selon les critères suivants :
1. Exactitude des réponses par rapport au corrigé type



Donne une note sur 20 et un feedback détaillé.
IMPORTANT: Ta réponse doit être au format JSON suivant sans aucun autre texte :
{
  "grade": <note sur 20>,
  "feedback": "<feedback détaillé>"
}
`;

    const jsonResponse = await this.callOllama(prompt, {
      temperature: 0.1,
      top_p: 0.9,
      max_tokens: 2000
    });

    try {
      // Nettoyer la réponse pour assurer un JSON valide
      const cleanedResponse = jsonResponse.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanedResponse);
      
      // Vérification de la structure
      if (typeof result.grade !== 'number' || typeof result.feedback !== 'string') {
        throw new Error('Format de réponse invalide');
      }
      
      // S'assurer que la note est entre 0 et 20
      const grade = Math.max(0, Math.min(20, result.grade));
      
      return {
        grade,
        feedback: result.feedback
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la réponse JSON:', error);
      console.error('Réponse brute:', jsonResponse);
      
      // Retourner une valeur par défaut en cas d'erreur
      return {
        grade: 10,
        feedback: "Impossible d'analyser la copie correctement. Veuillez vérifier manuellement."
      };
    }
  }

  /**
   * Appelle l'API Ollama pour générer une réponse
   */
  private static async callOllama(prompt: string, options: { temperature?: number, top_p?: number, max_tokens?: number } = {}): Promise<string> {
    const requestBody: OllamaRequestBody = {
      model: MODEL_NAME,
      prompt,
      stream: false,
      options
    };

    try {
      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur API Ollama: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as OllamaResponse;
      return result.response;
    } catch (error) {
      console.error('Erreur lors de l\'appel à Ollama:', error);
      throw new Error(`Échec de l'appel au modèle d'IA: ${error.message}`);
    }
  }
} 