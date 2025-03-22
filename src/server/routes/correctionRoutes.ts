import express from 'express';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { AiService } from '../services/aiService';
import { PdfService } from '../services/pdfService';
import { CorrigeTypeModel } from '../models/corrigeType';
import { ExamModel } from '../models/exam';
import db from '../db';
import path from 'path';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Protéger toutes les routes de ce router
router.use(authenticate);
router.use(checkRole('teacher'));

// Route pour générer un corrigé type pour un examen
router.post('/generate-corrige/:examId', async (req: AuthenticatedRequest, res) => {
  try {
    const { examId } = req.params;
    
    // Vérifier que l'examen existe et appartient à l'enseignant
    const isOwner = await ExamModel.isTeacherOwner(examId, req.user!.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    
    // Récupérer l'examen
    const exam = await ExamModel.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Examen non trouvé' });
    }
    
    // Extraire le texte du PDF de l'examen
    const examText = await PdfService.extractTextFromPdf(exam.file_path);
    
    // Générer le corrigé type
    const corrigeContent = await AiService.generateCorrigeType(examText);
    
    // Enregistrer le corrigé type dans la base de données
    const corrigeType = await CorrigeTypeModel.create(examId, corrigeContent);
    
    res.status(200).json({
      success: true,
      message: 'Corrigé type généré avec succès',
      corrigeType
    });
  } catch (error) {
    console.error('Erreur lors de la génération du corrigé type:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du corrigé type',
      details: error.message 
    });
  }
});

// Route pour corriger automatiquement une soumission
router.post('/auto-grade/:submissionId', async (req: AuthenticatedRequest, res) => {
  try {
    const { submissionId } = req.params;
    
    // Récupérer la soumission
    const submissionResult = await db.query(
      `SELECT s.*, e.id as exam_id, e.user_id as teacher_id 
       FROM submissions s 
       JOIN exams e ON s.exam_id = e.id 
       WHERE s.id = $1`,
      [submissionId]
    );
    
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Soumission non trouvée' });
    }
    
    const submission = submissionResult.rows[0];
    
    // Vérifier que l'enseignant est bien le propriétaire de l'examen
    if (submission.teacher_id !== req.user!.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    
    // Vérifier qu'un corrigé type existe pour cet examen
    const corrigeType = await CorrigeTypeModel.findByExamId(submission.exam_id);
    if (!corrigeType) {
      return res.status(400).json({ 
        error: 'Aucun corrigé type disponible pour cet examen',
        message: 'Veuillez d\'abord générer un corrigé type pour cet examen.'
      });
    }
    
    // Extraire le texte de la soumission de l'étudiant
    const submissionText = await PdfService.extractTextFromPdf(submission.file_path);
    
    // Corriger la soumission en utilisant le modèle d'IA
    const gradeResult = await AiService.gradeSubmission(submissionText, corrigeType.content);
    
    // Mettre à jour la soumission avec la note et le feedback
    await db.query(
      `UPDATE submissions 
       SET grade = $1, feedback = $2, status = 'graded', graded_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [gradeResult.grade, gradeResult.feedback, submissionId]
    );
    
    res.status(200).json({
      success: true,
      message: 'Correction automatique réussie',
      grade: gradeResult.grade,
      feedback: gradeResult.feedback
    });
  } catch (error) {
    console.error('Erreur lors de la correction automatique:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la correction automatique',
      details: error.message 
    });
  }
});

// Route pour vérifier si un corrigé type existe pour un examen
router.get('/check-corrige/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const exists = await CorrigeTypeModel.exists(examId);
    
    res.status(200).json({
      exists,
      examId
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du corrigé type:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router; 