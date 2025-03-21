import express from 'express';
import { AiService } from '../services/aiService';

const router = express.Router();

// Route pour générer un corrigé type à partir d'un sujet d'examen
router.post('/generate-corrige', async (req, res) => {
  try {
    const { examContent } = req.body;
    
    if (!examContent) {
      return res.status(400).json({ error: 'Le contenu de l\'examen est requis' });
    }
    
    const corrigeType = await AiService.generateCorrigeType(examContent);
    res.json({ corrigeType });
  } catch (error) {
    console.error('Erreur lors de la génération du corrigé type:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du corrigé type',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour évaluer une copie d'étudiant
router.post('/grade-submission', async (req, res) => {
  try {
    const { studentSubmission, referenceAnswer } = req.body;
    
    if (!studentSubmission || !referenceAnswer) {
      return res.status(400).json({ error: 'La copie de l\'étudiant et le corrigé de référence sont requis' });
    }
    
    const result = await AiService.gradeSubmission(studentSubmission, referenceAnswer);
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la correction de la copie:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la correction de la copie',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router; 