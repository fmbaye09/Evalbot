import { fetchWithAuth } from '../utils/api';

interface CorrigeType {
  id: string;
  exam_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface AutoGradeResult {
  success: boolean;
  message: string;
  grade: number;
  feedback: string;
}

class CorrectionService {
  private static instance: CorrectionService;

  private constructor() {}

  static getInstance(): CorrectionService {
    if (!CorrectionService.instance) {
      CorrectionService.instance = new CorrectionService();
    }
    return CorrectionService.instance;
  }

  /**
   * Génère un corrigé type pour un examen
   */
  async generateCorrigeType(examId: string): Promise<CorrigeType> {
    try {
      console.log('Génération du corrigé type pour l\'examen:', examId);
      
      const response = await fetchWithAuth(`/correction/generate-corrige/${examId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      return data.corrigeType;
    } catch (error) {
      console.error('Erreur lors de la génération du corrigé type:', error);
      throw error;
    }
  }

  /**
   * Corrige automatiquement une soumission
   */
  async autoGradeSubmission(submissionId: string): Promise<AutoGradeResult> {
    try {
      console.log('Correction automatique de la soumission:', submissionId);
      
      const response = await fetchWithAuth(`/correction/auto-grade/${submissionId}`, {
        method: 'POST'
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la correction automatique:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un corrigé type existe pour un examen
   */
  async checkCorrigeExists(examId: string): Promise<boolean> {
    try {
      const response = await fetchWithAuth(`/correction/check-corrige/${examId}`);
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Erreur lors de la vérification du corrigé type:', error);
      return false;
    }
  }
}

export const correctionService = CorrectionService.getInstance(); 