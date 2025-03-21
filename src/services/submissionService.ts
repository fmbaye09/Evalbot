// import { Submission } from '../types';
import { fetchWithAuth } from '../utils/api';

interface FetchSubmissionsParams {
  teacherId?: string;
  studentId?: string;
  examId?: string;
}

export interface Submission {
  id: string;
  exam_id: string;
  user_id: string;
  file_path?: string;
  file_url?: string;
  status: 'pending' | 'graded';
  grade?: number;
  feedback?: string;
  submitted_at: Date;
  updated_at: Date;
}

class SubmissionService {
  private static instance: SubmissionService;

  private constructor() {}

  static getInstance(): SubmissionService {
    if (!SubmissionService.instance) {
      SubmissionService.instance = new SubmissionService();
    }
    return SubmissionService.instance;
  }

  async fetchSubmissions(params?: FetchSubmissionsParams): Promise<Submission[]> {
    try {
      const endpoint = '/submissions';
      const response = await fetchWithAuth(endpoint);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des soumissions');
      }
      return response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des soumissions:', error);
      throw error;
    }
  }

  async getSubmissionById(id: string): Promise<Submission | null> {
    const response = await fetchWithAuth(`/submissions/${id}`);
    return response.json();
  }

  async createSubmission(submission: Omit<Submission, 'id' | 'submitted_at' | 'updated_at'>): Promise<Submission> {
    const response = await fetchWithAuth('/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });
    return response.json();
  }

  async updateSubmission(id: string, submission: Partial<Submission>): Promise<Submission | null> {
    const response = await fetchWithAuth(`/submissions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });
    return response.json();
  }

  async deleteSubmission(id: string): Promise<boolean> {
    await fetchWithAuth(`/submissions/${id}`, {
      method: 'DELETE',
    });
    return true;
  }

  async getSubmissionDownloadUrl(submissionId: string): Promise<string | null> {
    const submission = await this.getSubmissionById(submissionId);
    return submission?.file_url || null;
  }

  async gradeSubmission(id: string, grade: number, feedback: string): Promise<Submission | null> {
    try {
      const response = await fetchWithAuth(`/submissions/${id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade,
          feedback,
          send_notification: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Réponse du serveur:', errorData);
        throw new Error(`Erreur lors de la notation: ${response.status}`);
      }
      
      const updatedSubmission = await response.json();
      
      return updatedSubmission;
    } catch (error) {
      console.error('Erreur lors de la notation de la soumission:', error);
      return this.updateSubmission(id, {
        status: 'graded',
        grade,
        feedback
      });
    }
  }
}

// Créer une instance unique du service
const submissionService = SubmissionService.getInstance();

// Exporter l'instance et ses méthodes
export { submissionService };
export const fetchSubmissions = submissionService.fetchSubmissions.bind(submissionService);
export const createSubmission = submissionService.createSubmission.bind(submissionService);
export const getSubmissionDownloadUrl = submissionService.getSubmissionDownloadUrl.bind(submissionService);
export const gradeSubmission = submissionService.gradeSubmission.bind(submissionService);
