import { getAuthToken } from '@/config/client';
import * as diff from 'diff';
import { PdfService } from './pdfService';

// Types des entités liées au plagiat
export interface Submission {
  id: string;
  student_id: string;
  student_name: string;
  exam_id: string;
  exam_title: string; // Ajout du titre de l'examen
  pdf_url: string;
  submitted_at: string;
  file_path?: string; // Ajout pour compatibilité avec PlagiarismDetection
}

export interface PlagiarismReport {
  id: string;
  exam_id: string;
  submission1_id: string;
  submission2_id: string;
  similarity_score: number;
  details: PlagiarismDetails;
  status: 'pending' | 'confirmed' | 'dismissed' | 'reviewing';
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  review_notes?: string;
  submission1?: Submission;
  submission2?: Submission;
  exam_title?: string; // Pour compatibilité avec le composant
}

export interface PlagiarismDetails {
  matching_sections: {
    text: string;
    submission1_offset: number;
    submission2_offset: number;
    length: number;
  }[];
  diff_html?: string;
  matchedSegments?: Array<any>; // Pour compatibilité avec le composant
}

/**
 * Service pour la détection et la gestion du plagiat
 */
class PlagiarismService {
  private static instance: PlagiarismService;
  private baseUrl = '/api/plagiarism';
  private pdfService: PdfService;

  private constructor() {
    this.pdfService = new PdfService();
  }

  public static getInstance(): PlagiarismService {
    if (!PlagiarismService.instance) {
      PlagiarismService.instance = new PlagiarismService();
    }
    return PlagiarismService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Non authentifié');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Lancer une analyse de plagiat sur un examen
   */
  async analyzePlagiarism(examId: string): Promise<PlagiarismReport[]> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze/${examId}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'analyse du plagiat');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'analyse du plagiat:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les rapports de plagiat pour l'enseignant
   */
  async getReports(): Promise<PlagiarismReport[]> {
    try {
      const response = await fetch(this.baseUrl, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la récupération des rapports');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
      throw error;
    }
  }

  /**
   * Récupérer les rapports de plagiat pour un examen spécifique
   */
  async getReportsByExam(examId: string): Promise<PlagiarismReport[]> {
    try {
      const response = await fetch(`${this.baseUrl}/exam/${examId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la récupération des rapports');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
      throw error;
    }
  }

  /**
   * Récupérer un rapport de plagiat spécifique avec détails
   */
  async getReport(reportId: string): Promise<PlagiarismReport> {
    try {
      const response = await fetch(`${this.baseUrl}/${reportId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la récupération du rapport');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'un rapport de plagiat
   */
  async updateReportStatus(
    reportId: string,
    status: 'confirmed' | 'dismissed',
    notes?: string
  ): Promise<PlagiarismReport> {
    try {
      const response = await fetch(`${this.baseUrl}/${reportId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, review_notes: notes })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la mise à jour du rapport');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rapport:', error);
      throw error;
    }
  }

  /**
   * Extraire le texte d'un fichier PDF soumis
   */
  async extractTextFromSubmission(submission: Submission): Promise<string> {
    try {
      const response = await fetch(submission.pdf_url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.pdfService.extractTextFromPdf(arrayBuffer);
    } catch (error) {
      console.error('Erreur lors de l\'extraction du texte:', error);
      throw error;
    }
  }

  /**
   * Générer un diff HTML entre deux textes
   */
  generateDiffHtml(text1: string, text2: string): string {
    const differences = diff.diffWords(text1, text2);
    let html = '<div class="diff">';
    
    differences.forEach((part) => {
      const className = part.added 
        ? 'added' 
        : part.removed 
          ? 'removed' 
          : 'unchanged';
          
      html += `<span class="${className}">${part.value}</span>`;
    });
    
    html += '</div>';
    return html;
  }

  /**
   * Récupérer un rapport de plagiat spécifique avec détails des soumissions
   */
  async getReportDetails(reportId: string): Promise<{
    report: PlagiarismReport, 
    submissions: {
      submission1: Submission, 
      submission2: Submission
    }
  }> {
    try {
      // Code pour production:
      const response = await fetch(`${this.baseUrl}/${reportId}/details`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la récupération des détails du rapport');
      }

      return await response.json();
      
      /* Données simulées pour le développement
      return {
        report: {
          id: reportId,
          exam_id: "1",
          submission1_id: "s1",
          submission2_id: "s2",
          similarity_score: 85,
          details: {
            matching_sections: [
              {
                text: "Texte similaire trouvé",
                submission1_offset: 120,
                submission2_offset: 140,
                length: 250
              }
            ],
            matchedSegments: []
          },
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          review_notes: ""
        },
        submissions: {
          submission1: {
            id: "s1",
            student_id: "std1",
            student_name: "Jean Dupont",
            exam_id: "1",
            exam_title: "Mathématiques - Semestre 1",
            pdf_url: "/path/to/submission1.pdf",
            submitted_at: new Date().toISOString(),
            file_path: "submission1.pdf"
          },
          submission2: {
            id: "s2",
            student_id: "std2",
            student_name: "Marie Martin",
            exam_id: "1",
            exam_title: "Mathématiques - Semestre 1",
            pdf_url: "/path/to/submission2.pdf",
            submitted_at: new Date().toISOString(),
            file_path: "submission2.pdf"
          }
        }
      };
      */
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du rapport:', error);
      throw error;
    }
  }

  /**
   * Lancer une analyse de plagiat sur un examen - Alias pour compatibilité avec le composant
   */
  async analyzeExam(examId: string): Promise<{ message: string }> {
    try {
      // En production, utiliser cette méthode:
      await this.analyzePlagiarism(examId);
      return { message: "Analyse de plagiat lancée avec succès" };
      
      // Données simulées pour le développement
      // return { message: "Analyse de plagiat lancée avec succès" };
    } catch (error) {
      console.error('Erreur lors de l\'analyse du plagiat:', error);
      throw error;
    }
  }
}

export const plagiarismService = PlagiarismService.getInstance(); 