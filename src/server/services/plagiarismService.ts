import { PdfService } from './pdfService';
import { PlagiarismReportModel, PlagiarismDetails } from '../models/plagiarismReport';
import { SubmissionModel } from '../models/submission';
import { NotificationModel } from '../models/notification';
import { diffWords } from 'diff';

export class PlagiarismService {
  private pdfService: PdfService;
  
  constructor() {
    this.pdfService = new PdfService();
  }

  /**
   * Analyse de plagiat pour toutes les soumissions d'un examen
   */
  async analyzeExamSubmissions(examId: string, teacherId: string): Promise<{
    reportsCount: number;
    highSimilarityCount: number;
  }> {
    try {
      // Récupérer toutes les soumissions pour cet examen
      const submissions = await SubmissionModel.getByExamId(examId);
      
      if (submissions.length < 2) {
        return { reportsCount: 0, highSimilarityCount: 0 };
      }

      let reportsCount = 0;
      let highSimilarityCount = 0;
      const highSimilarityThreshold = 70; // Pourcentage à partir duquel on considère une forte similarité
      
      // Comparer chaque paire de soumissions
      for (let i = 0; i < submissions.length; i++) {
        for (let j = i + 1; j < submissions.length; j++) {
          // Vérifier si un rapport existe déjà pour cette paire
          const reportExists = await PlagiarismReportModel.existsForSubmissionPair(
            submissions[i].id,
            submissions[j].id
          );
          
          if (!reportExists) {
            // Extraire le texte des deux soumissions
            const text1 = await this.pdfService.extractTextFromPdf(submissions[i].file_path);
            const text2 = await this.pdfService.extractTextFromPdf(submissions[j].file_path);
            
            if (text1 && text2) {
              // Calculer la similarité
              const { similarityScore, details } = this.calculateSimilarity(text1, text2);
              
              // Créer un rapport de plagiat
              const report = await PlagiarismReportModel.create({
                exam_id: examId,
                submission1_id: submissions[i].id,
                submission2_id: submissions[j].id,
                similarity_score: similarityScore,
                details,
                status: 'pending'
              });
              
              reportsCount++;
              
              // Si la similarité est élevée, envoyer une notification
              if (similarityScore >= highSimilarityThreshold) {
                highSimilarityCount++;
                await NotificationModel.createPlagiarismNotification(
                  teacherId,
                  report.id,
                  submissions[i].exam_title || 'Examen'
                );
                
                // Marquer le rapport comme notifié
                await PlagiarismReportModel.markAsNotified(report.id);
              }
            }
          }
        }
      }
      
      return { 
        reportsCount, 
        highSimilarityCount 
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse de plagiat:', error);
      throw new Error('Erreur lors de l\'analyse de plagiat');
    }
  }

  /**
   * Calcule la similarité entre deux textes
   */
  private calculateSimilarity(text1: string, text2: string): {
    similarityScore: number;
    details: PlagiarismDetails;
  } {
    // Normaliser les textes
    const normalizedText1 = this.normalizeText(text1);
    const normalizedText2 = this.normalizeText(text2);
    
    // Utiliser diff pour trouver les différences
    const differences = diffWords(normalizedText1, normalizedText2);
    
    // Calculer les segments correspondants
    const matchedSegments = this.extractMatchedSegments(differences, normalizedText1, normalizedText2);
    
    // Calculer le score de similarité
    const totalChars = normalizedText1.length;
    const matchedChars = matchedSegments.reduce((sum, segment) => {
      return sum + segment.segment1.text.length;
    }, 0);
    
    const similarityScore = (matchedChars / totalChars) * 100;
    
    return {
      similarityScore: Math.round(similarityScore * 100) / 100, // Limiter à 2 décimales
      details: {
        matchedSegments,
        totalCharacters: totalChars,
        matchedCharacters: matchedChars
      }
    };
  }

  /**
   * Normalise un texte pour la comparaison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Supprimer la ponctuation
      .trim();
  }

  /**
   * Extrait les segments correspondants à partir des différences
   */
  private extractMatchedSegments(
    differences: any[],
    text1: string,
    text2: string
  ): PlagiarismDetails['matchedSegments'] {
    const segments: PlagiarismDetails['matchedSegments'] = [];
    let pos1 = 0;
    let pos2 = 0;
    
    for (const part of differences) {
      if (part.added) {
        // Ce segment est présent uniquement dans text2
        pos2 += part.value.length;
      } else if (part.removed) {
        // Ce segment est présent uniquement dans text1
        pos1 += part.value.length;
      } else {
        // Ce segment est commun aux deux textes
        // Ne conserver que les segments significatifs (plus de 10 caractères)
        if (part.value.length > 10) {
          segments.push({
            segment1: {
              text: part.value,
              startPosition: pos1,
              endPosition: pos1 + part.value.length
            },
            segment2: {
              text: part.value,
              startPosition: pos2,
              endPosition: pos2 + part.value.length
            },
            similarityScore: 100 // Ce segment est identique
          });
        }
        
        // Mettre à jour les positions
        pos1 += part.value.length;
        pos2 += part.value.length;
      }
    }
    
    return segments;
  }
} 