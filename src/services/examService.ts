import { API_BASE_URL, getAuthToken } from '../config/client';
import { Exam, Submission } from '../types';
import { fetchWithAuth } from '../utils/api';

interface FetchExamsParams {
  teacherId?: string;
  studentId?: string;
}

class ExamService {
  private static instance: ExamService;

  private constructor() {}

  static getInstance(): ExamService {
    if (!ExamService.instance) {
      ExamService.instance = new ExamService();
    }
    return ExamService.instance;
  }

  async fetchExams(params?: FetchExamsParams): Promise<Exam[]> {
    try {
      console.log('Récupération des examens...');
      let endpoint = '/exams';
      
      if (params) {
        const queryParams = new URLSearchParams();
        if (params.teacherId) queryParams.append('teacherId', params.teacherId);
        if (params.studentId) queryParams.append('studentId', params.studentId);
        if (queryParams.toString()) {
          endpoint += `?${queryParams.toString()}`;
        }
      }
      
      const response = await fetchWithAuth(endpoint);
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Réponse du serveur:', errorData);
        throw new Error(`Erreur lors de la récupération des examens: ${response.status}`);
      }
      const exams = await response.json();
      console.log('Examens reçus:', exams);
      return exams;
    } catch (error) {
      console.error('Erreur lors de la récupération des examens:', error);
      throw error;
    }
  }

  async getExamById(id: string): Promise<Exam | null> {
    try {
      const response = await fetchWithAuth(`/exams/${id}`);
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Réponse du serveur:', errorData);
        throw new Error(`Erreur lors de la récupération de l'examen: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'examen:', error);
      throw error;
    }
  }

  async createExam(examData: { title: string; description: string; deadline?: string }, file: File): Promise<Exam> {
    try {
      console.log('Création d\'un examen avec les données:', examData);
      
      const formData = new FormData();
      formData.append('title', examData.title);
      formData.append('description', examData.description);
      if (examData.deadline) {
        formData.append('deadline', examData.deadline);
      }
      formData.append('file', file);

      // Ajouter un indicateur pour envoyer des notifications
      formData.append('send_notifications', 'true');

      const response = await fetchWithAuth('/exams', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Réponse du serveur:', errorData);
        throw new Error(`Erreur lors de la création: ${response.status}`);
      }

      const exam = await response.json();
      console.log('Examen créé avec succès:', exam);
      
      // Facultatif: afficher un toast pour confirmer que des notifications ont été envoyées
      // Si vous avez une bibliothèque de toast, vous pouvez l'utiliser ici
      // toast.success('Les étudiants ont été notifiés du nouvel examen');
      
      return exam;
    } catch (error) {
      console.error('Erreur lors de la création de l\'examen:', error);
      throw error;
    }
  }

  async updateExam(id: string, exam: Partial<Exam>): Promise<Exam> {
    try {
      const response = await fetchWithAuth(`/exams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exam),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Réponse du serveur:', errorData);
        throw new Error(`Erreur lors de la mise à jour: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  }

  async deleteExam(id: string): Promise<boolean> {
    try {
      const response = await fetchWithAuth(`/exams/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Réponse du serveur:', errorData);
        throw new Error(`Erreur lors de la suppression: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  async downloadExamFile(filePath: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`/exams/download/${filePath}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Réponse du serveur:', errorData);
        throw new Error('Erreur lors du téléchargement du fichier');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'examen.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  }

  async submitExam(examId: string, file: File): Promise<Submission> {
    try {
      console.log("Préparation de la soumission:", {
        examId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      const formData = new FormData();
      formData.append('exam_id', examId);
      formData.append('file', file);

      const response = await fetchWithAuth('/submissions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Réponse du serveur:', errorData);
        throw new Error(
          errorData ? `Erreur lors de la soumission: ${errorData}` : 'Erreur lors de la soumission de l\'examen'
        );
      }

      const data = await response.json();
      console.log("Réponse de la soumission:", data);
      return data;
    } catch (error) {
      console.error('Erreur détaillée lors de la soumission:', error);
      throw error;
    }
  }

  async downloadSubmissionFile(filePath: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`/submissions/download/${filePath}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Réponse du serveur:', errorData);
        throw new Error('Erreur lors du téléchargement de la soumission');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'soumission.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  }
}

const examService = ExamService.getInstance();

export const {
  fetchExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  downloadExamFile,
  submitExam,
  downloadSubmissionFile,
} = examService;

export { examService };
