import express from 'express';
import { PlagiarismService } from '../services/plagiarismService';
import { PlagiarismResultModel } from '../models/plagiarismResult';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est un enseignant
const requireTeacher = checkRole('teacher');

// Route pour lancer l'analyse de plagiat pour un examen
router.post('/analyze/:examId', authenticate, requireTeacher, async (req: AuthenticatedRequest, res) => {
  try {
    const { examId } = req.params;
    
    // Vérifier que l'examen existe et appartient à l'enseignant
    const examResult = await PlagiarismService.analyzeExamPlagiarism(examId);
    
    res.status(200).json({
      message: 'Analyse de plagiat terminée avec succès',
      data: examResult
    });
  } catch (error) {
    console.error('Erreur lors de l\'analyse de plagiat:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse de plagiat',
      message: error.message
    });
  }
});

// Route pour récupérer les résultats de plagiat pour un examen
router.get('/results/:examId', authenticate, requireTeacher, async (req: AuthenticatedRequest, res) => {
  try {
    const { examId } = req.params;
    
    const results = await PlagiarismResultModel.findByExamId(examId);
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats de plagiat:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des résultats',
      message: error.message
    });
  }
});

// Route pour supprimer les résultats de plagiat d'un examen
router.delete('/results/:examId', authenticate, requireTeacher, async (req: AuthenticatedRequest, res) => {
  try {
    const { examId } = req.params;
    
    const deleted = await PlagiarismResultModel.deleteByExamId(examId);
    
    if (deleted) {
      res.status(200).json({
        message: 'Résultats de plagiat supprimés avec succès'
      });
    } else {
      res.status(404).json({
        error: 'Aucun résultat trouvé pour cet examen'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression des résultats de plagiat:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression des résultats',
      message: error.message
    });
  }
});

export default router; 