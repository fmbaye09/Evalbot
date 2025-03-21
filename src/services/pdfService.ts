/**
 * Service pour l'extraction et la manipulation de fichiers PDF
 */
export class PdfService {
  /**
   * Extrait le texte d'un fichier PDF
   * @param pdfData Données du fichier PDF (ArrayBuffer)
   * @returns Texte extrait du PDF
   */
  async extractTextFromPdf(pdfData: ArrayBuffer): Promise<string> {
    try {
      // Nous utilisons la librairie pdfjs-dist qui doit être importée dynamiquement
      // car elle utilise des fonctionnalités de navigateur
      const pdfjs = await import('pdfjs-dist');
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
      
      // Configuration du worker
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      
      // Chargement du document PDF
      const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
      let textContent = '';
      
      // Extraction du texte de chaque page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        
        textContent += pageText + '\n';
      }
      
      return textContent.trim();
    } catch (error) {
      console.error('Erreur lors de l\'extraction du texte du PDF:', error);
      throw new Error(`Impossible d'extraire le texte du PDF: ${error.message}`);
    }
  }
  
  /**
   * Nettoie le texte extrait pour une meilleure analyse
   * @param text Texte à nettoyer
   * @returns Texte normalisé
   */
  normalizeText(text: string): string {
    return text
      .toLowerCase()
      // Suppression des caractères spéciaux
      .replace(/[^\w\s]/g, '')
      // Suppression des espaces multiples
      .replace(/\s+/g, ' ')
      // Suppression des sauts de ligne
      .replace(/\n/g, ' ')
      .trim();
  }
} 