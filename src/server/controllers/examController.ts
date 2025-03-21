import { Request, Response } from 'express';
import { ExamModel } from '../models/exam';
import { uploadFile, deleteFile } from '../utils/fileHandler';
import path from 'path';
import { config } from '../config';
import { validateExam } from '../validators/examValidator';
import { AuthenticatedRequest } from '../types';
import fs from 'fs';

export const examController = {
  // Créer un nouvel examen
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      if (!teacherId) {
        return res.status(401).json({ error: 'Non autorisé' });
      }

      // Validation des données
      const validation = validateExam(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      // Gestion du fichier
      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const filePath = await uploadFile(req.file);
      
      const exam = await ExamModel.create({
        ...req.body,
        file_path: filePath,
        teacher_id: teacherId
      }, teacherId);

      res.status(201).json(exam);
    } catch (error) {
      console.error('Erreur lors de la création de l\'examen:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Récupérer tous les examens
  async getAll(req: Request, res: Response) {
    try {
      const { teacherId, studentId } = req.query;
      let exams;

      if (teacherId) {
        exams = await ExamModel.findByTeacherId(teacherId as string);
      } else if (studentId) {
        exams = await ExamModel.findAvailableForStudent(studentId as string);
      } else {
        return res.status(400).json({ error: 'Paramètres manquants' });
      }

      res.json(exams);
    } catch (error) {
      console.error('Erreur lors de la récupération des examens:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Récupérer un examen par son ID
  async getById(req: Request, res: Response) {
    try {
      const exam = await ExamModel.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({ error: 'Examen non trouvé' });
      }
      res.json(exam);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'examen:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Mettre à jour un examen
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const examId = req.params.id;

      if (!teacherId) {
        return res.status(401).json({ error: 'Non autorisé' });
      }

      // Vérifier que le professeur est propriétaire de l'examen
      const isOwner = await ExamModel.isTeacherOwner(examId, teacherId);
      if (!isOwner) {
        return res.status(403).json({ error: 'Non autorisé' });
      }

      // Validation des données
      const validation = validateExam(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const exam = await ExamModel.update(examId, req.body);
      if (!exam) {
        return res.status(404).json({ error: 'Examen non trouvé' });
      }

      res.json(exam);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'examen:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Supprimer un examen
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const examId = req.params.id;

      if (!teacherId) {
        return res.status(401).json({ error: 'Non autorisé' });
      }

      // Vérifier que le professeur est propriétaire de l'examen
      const isOwner = await ExamModel.isTeacherOwner(examId, teacherId);
      if (!isOwner) {
        return res.status(403).json({ error: 'Non autorisé' });
      }

      // Récupérer l'examen pour obtenir le chemin du fichier
      const exam = await ExamModel.findById(examId);
      if (!exam) {
        return res.status(404).json({ error: 'Examen non trouvé' });
      }

      // Supprimer le fichier
      await deleteFile(exam.file_path);

      // Supprimer l'examen de la base de données
      await ExamModel.delete(examId);

      res.status(204).send();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'examen:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Télécharger le fichier d'un examen
  async downloadFile(req: Request, res: Response) {
    try {
      const filePath = req.params.filePath;
      const fullPath = path.join(process.cwd(), 'uploads', filePath);

      if (!filePath.endsWith('.pdf')) {
        return res.status(400).json({ error: 'Format de fichier non autorisé' });
      }

      // Vérifier si le fichier existe
      if (!fs.existsSync(fullPath)) {
        console.error('Fichier non trouvé:', fullPath);
        return res.status(404).json({ error: 'Fichier non trouvé' });
      }

      res.download(fullPath, (err) => {
        if (err) {
          console.error('Erreur lors du téléchargement:', err);
          res.status(500).json({ error: 'Erreur lors du téléchargement' });
        }
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir les statistiques d'un professeur
  async getTeacherStats(req: AuthenticatedRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      if (!teacherId) {
        return res.status(401).json({ error: 'Non autorisé' });
      }

      const stats = await ExamModel.getTeacherStats(teacherId);
      res.json(stats);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}; 