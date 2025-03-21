import { PDFExtract, PDFExtractOptions } from 'pdf.js-extract';
import path from 'path';
import { config } from '../config';

const pdfExtract = new PDFExtract();
const options: PDFExtractOptions = {};

export class PdfService {
  /**
   * Extrait le texte d'un fichier PDF
   * @param filePath Chemin relatif du fichier dans le dossier uploads
   * @returns Le texte extrait du PDF
   */
  static async extractTextFromPdf(filePath: string): Promise<string> {
    try {
      console.log('Extraction du texte du PDF:', filePath);
      
      // Chemin complet vers le fichier
      const fullPath = path.join(process.cwd(), config.uploadDir, filePath);
      console.log('Chemin complet:', fullPath);
      
      // Extraire le texte
      const data = await pdfExtract.extract(fullPath, options);
      
      // Concatener le texte de toutes les pages
      const text = data.pages
        .map(page => page.content.map(item => item.str).join(' '))
        .join('\n\n');
      
      console.log(`Extraction réussie: ${text.length} caractères extraits`);
      return text;
    } catch (error) {
      console.error('Erreur lors de l\'extraction du texte du PDF:', error);
      throw new Error(`Impossible d'extraire le texte du fichier PDF: ${error.message}`);
    }
  }
} 