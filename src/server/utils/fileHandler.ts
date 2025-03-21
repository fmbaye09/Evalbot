import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
export const SUBMISSIONS_DIR = path.join(UPLOAD_DIR, 'submissions');
export const EXAMS_DIR = path.join(UPLOAD_DIR, 'exams');

export const ensureDirectoryExists = async (directory: string): Promise<void> => {
  try {
    await fs.access(directory);
  } catch {
    await fs.mkdir(directory, { recursive: true });
  }
};

export const generateUniqueFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const uuid = uuidv4();
  return `${uuid}${ext}`;
};

export const uploadFile = async (file: Express.Multer.File): Promise<string> => {
  // Le fichier est déjà sauvegardé par Multer, on retourne simplement son nom
  return file.filename;
};

export const deleteFile = async (fileName: string): Promise<void> => {
  const filePath = path.join(UPLOAD_DIR, fileName);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Erreur lors de la suppression du fichier ${fileName}:`, error);
    throw error;
  }
};

export const fileExists = async (fileName: string): Promise<boolean> => {
  const filePath = path.join(UPLOAD_DIR, fileName);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const readFile = async (fileName: string): Promise<Buffer> => {
  const filePath = path.join(UPLOAD_DIR, fileName);
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${fileName}:`, error);
    throw error;
  }
}; 