import multer from 'multer';
import path from 'path';
import { config } from '../config';
import * as fileHandler from '../utils/fileHandler';

// S'assurer que le répertoire d'upload existe
fileHandler.ensureDirectoryExists(config.uploadDir);

// Configuration de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFileName = fileHandler.generateUniqueFileName(file.originalname);
    cb(null, uniqueFileName);
  }
});

// Filtre pour les types de fichiers acceptés
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Seuls les fichiers PDF et images (JPEG, PNG, GIF) sont acceptés.'));
  }
};

// Configuration de l'upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  }
});

export default upload; 