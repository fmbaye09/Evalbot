import express from 'express';
import { examController } from '../controllers/examController';
import { authenticate } from '../middleware/auth';
import upload from '../middleware/upload';
import { checkRole } from '../middleware/checkRole';

const router = express.Router();

// Route publique pour le téléchargement des fichiers
router.get('/download/:filePath', examController.downloadFile);

// Routes protégées nécessitant une authentification
router.use(authenticate);

// Routes pour les professeurs
router.post('/', 
  checkRole('teacher'), 
  upload.single('file'), 
  examController.create
);

router.put('/:id', 
  checkRole('teacher'), 
  examController.update
);

router.delete('/:id', 
  checkRole('teacher'), 
  examController.delete
);

router.get('/stats', 
  checkRole('teacher'), 
  examController.getTeacherStats
);

// Routes accessibles aux étudiants et professeurs
router.get('/', examController.getAll);
router.get('/:id', examController.getById);

export default router; 