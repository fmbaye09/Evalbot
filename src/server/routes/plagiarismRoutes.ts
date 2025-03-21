import express from 'express';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { PlagiarismService } from '../services/plagiarismService';
import { PlagiarismReportModel } from '../models/plagiarismReport';
import { SubmissionModel } from '../models/submission';
import { AuthenticatedRequest } from '../types';

const router = express.Router();
const plagiarismService = new PlagiarismService();

// Protéger toutes les routes
router.use(authenticate);
router.use(checkRole('teacher')); // Seuls les enseignants peuvent accéder à ces routes

// Démarrer l'analyse de plagiat pour un examen
router.post('/analyze/:examId', async (req: AuthenticatedRequest, res) => {
  try {
    const { examId } = req.params;
    const teacherId = req.user?.id;
    
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    // Vérifier si l'enseignant est propriétaire de l'examen
    const submissions = await SubmissionModel.getByExamId(examId);
    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucune soumission trouvée pour cet examen'
      });
    }
    
    // Démarrer l'analyse
    const result = await plagiarismService.analyzeExamSubmissions(examId, teacherId);
    
    res.json({
      success: true,
      message: `Analyse de plagiat terminée: ${result.reportsCount} rapports générés, ${result.highSimilarityCount} avec forte similarité`,
      ...result
    });
  } catch (error) {
    console.error('Erreur lors de l\'analyse de plagiat:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de l\'analyse de plagiat'
    });
  }
});

// Récupérer tous les rapports de plagiat pour un enseignant
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const teacherId = req.user?.id;
    
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const reports = await PlagiarismReportModel.getByTeacherId(teacherId);
    
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports de plagiat:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des rapports de plagiat'
    });
  }
});

// Récupérer les rapports de plagiat pour un examen spécifique
router.get('/exam/:examId', async (req: AuthenticatedRequest, res) => {
  try {
    const { examId } = req.params;
    const teacherId = req.user?.id;
    
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    // Vérifier si l'enseignant est propriétaire de l'examen
    const submissions = await SubmissionModel.getByExamId(examId);
    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucune soumission trouvée pour cet examen'
      });
    }
    
    const reports = await PlagiarismReportModel.getByExamId(examId);
    
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports de plagiat:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des rapports de plagiat'
    });
  }
});

// Récupérer un rapport de plagiat spécifique
router.get('/:reportId', async (req: AuthenticatedRequest, res) => {
  try {
    const { reportId } = req.params;
    const teacherId = req.user?.id;
    
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const report = await PlagiarismReportModel.getById(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapport de plagiat non trouvé'
      });
    }
    
    // Récupérer les détails des soumissions
    const submission1 = await SubmissionModel.getById(report.submission1_id);
    const submission2 = await SubmissionModel.getById(report.submission2_id);
    
    res.json({
      success: true,
      report,
      submissions: {
        submission1,
        submission2
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport de plagiat:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération du rapport de plagiat'
    });
  }
});

// Mettre à jour le statut d'un rapport de plagiat
router.put('/:reportId', async (req: AuthenticatedRequest, res) => {
  try {
    const { reportId } = req.params;
    const { status, reviewNotes } = req.body;
    const teacherId = req.user?.id;
    
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    // Vérifier que le statut est valide
    if (!['confirmed', 'dismissed', 'reviewing'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }
    
    const report = await PlagiarismReportModel.getById(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapport de plagiat non trouvé'
      });
    }
    
    // Mettre à jour le rapport
    const updatedReport = await PlagiarismReportModel.updateStatus(
      reportId,
      status as 'confirmed' | 'dismissed' | 'reviewing',
      teacherId,
      reviewNotes
    );
    
    res.json({
      success: true,
      report: updatedReport
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rapport de plagiat:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la mise à jour du rapport de plagiat'
    });
  }
});

export default router; 