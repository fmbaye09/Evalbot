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
import { SubmissionModel } from '../models/submission';

const router = express.Router();
const aiService = new AiService();
const pdfService = new PdfService();

// Protéger toutes les routes de ce router
router.use(authenticate);
router.use(checkRole('teacher'));

// Route pour générer un corrigé type pour un examen
router.post('/generate-corrige', async (req: AuthenticatedRequest, res) => {
  try {
    const { examId, prompt } = req.body;
    
    if (!examId || !prompt) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de l\'examen et le prompt sont requis'
      });
    }
    
    // Vérifier si un corrigé existe déjà
    const existingCorrige = await CorrigeTypeModel.findByExamId(examId);
    if (existingCorrige) {
      return res.status(409).json({
        success: false,
        message: 'Un corrigé type existe déjà pour cet examen'
      });
    }
    
    // Générer le corrigé avec l'IA
    const response = await aiService.generateModelAnswer(prompt);
    
    if (!response) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du corrigé type'
      });
    }
    
    // Sauvegarder le corrigé en base de données
    const corrigeType = await CorrigeTypeModel.create(examId, response);
    
    res.json({
      success: true,
      corrigeType
    });
  } catch (error) {
    console.error('Erreur lors de la génération du corrigé type:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la génération du corrigé type'
    });
  }
});

// Route pour corriger automatiquement une soumission
router.post('/auto-grade/:submissionId', async (req: AuthenticatedRequest, res) => {
  try {
    const { submissionId } = req.params;
    
    // Récupérer la soumission
    const submission = await SubmissionModel.getById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Soumission non trouvée'
      });
    }
    
    // Vérifier si un corrigé existe pour cet examen
    const corrigeType = await CorrigeTypeModel.findByExamId(submission.exam_id);
    if (!corrigeType) {
      return res.status(404).json({
        success: false,
        message: 'Aucun corrigé type trouvé pour cet examen'
      });
    }
    
    // Extraire le texte du PDF soumis
    const submissionText = await pdfService.extractTextFromPdf(submission.file_path);
    if (!submissionText) {
      return res.status(500).json({
        success: false,
        message: 'Impossible d\'extraire le texte de la soumission'
      });
    }
    
    // Évaluer la soumission avec l'IA
    const gradeResult = await aiService.gradeSubmission(submissionText, corrigeType.content);
    if (!gradeResult) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'évaluation de la soumission'
      });
    }
    
    // Mettre à jour la note et le feedback
    await SubmissionModel.updateGrade(
      submissionId, 
      gradeResult.grade, 
      gradeResult.feedback,
      true // Marquer comme corrigé automatiquement
    );
    
    res.json({
      success: true,
      grade: gradeResult.grade,
      feedback: gradeResult.feedback
    });
  } catch (error) {
    console.error('Erreur lors de la correction automatique:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la correction automatique'
    });
  }
});

// Route pour vérifier si un corrigé type existe pour un examen
router.get('/check-corrige/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const corrigeType = await CorrigeTypeModel.findByExamId(examId);
    
    res.json({
      success: true,
      exists: !!corrigeType
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du corrigé type:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la vérification'
    });
  }
});

export default router; 