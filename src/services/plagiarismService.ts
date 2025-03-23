import { fetchWithAuth } from '../utils/api';

export interface PlagiarismResult {
  id: string;
  exam_id: string;
  submission1_id: string;
  submission2_id: string;
  similarity_score: number;
  similar_passages?: string;
  created_at: string;
  updated_at: string;
  student1_id?: string;
  student2_id?: string;
  student1_name?: string;
  student2_name?: string;
}

interface PlagiarismAnalysisResponse {
  message: string;
  data: {
    examId: string;
    results: {
      submission1Id: string;
      submission2Id: string;
      similarityScore: number;
      similarPassages?: string;
    }[];
  };
}

class PlagiarismService {
  private static instance: PlagiarismService;

  private constructor() {}

  static getInstance(): PlagiarismService {
    if (!PlagiarismService.instance) {
      PlagiarismService.instance = new PlagiarismService();
    }
    return PlagiarismService.instance;
  }

  /**
   * Lance l'analyse de plagiat pour un examen
   */
  async analyzePlagiarism(examId: string): Promise<PlagiarismAnalysisResponse> {
    try {
      console.log(`Lancement de l'analyse de plagiat pour l'examen ${examId}`);
      
      const response = await fetchWithAuth(`/plagiarism/analyze/${examId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'analyse de plagiat');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'analyse de plagiat:', error);
      throw error;
    }
  }

  /**
   * Récupère les résultats de plagiat pour un examen
   */
  async getPlagiarismResults(examId: string): Promise<PlagiarismResult[]> {
    try {
      console.log(`Récupération des résultats de plagiat pour l'examen ${examId}`);
      
      const response = await fetchWithAuth(`/plagiarism/results/${examId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la récupération des résultats de plagiat');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats de plagiat:', error);
      throw error;
    }
  }

  /**
   * Supprime les résultats de plagiat pour un examen
   */
  async deletePlagiarismResults(examId: string): Promise<{ message: string }> {
    try {
      console.log(`Suppression des résultats de plagiat pour l'examen ${examId}`);
      
      const response = await fetchWithAuth(`/plagiarism/results/${examId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression des résultats de plagiat');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la suppression des résultats de plagiat:', error);
      throw error;
    }
  }
}

const plagiarismService = PlagiarismService.getInstance();

export const {
  analyzePlagiarism,
  getPlagiarismResults,
  deletePlagiarismResults
} = plagiarismService;

export { plagiarismService }; 