import fs from 'fs/promises';
import path from 'path';
import { PDFExtract } from 'pdf.js-extract';
import { UPLOAD_DIR } from '../utils/fileHandler';
import { PlagiarismResultModel } from '../models/plagiarismResult';
import { query } from '../db';

// Extraction du PDF
const pdfExtract = new PDFExtract();

interface Submission {
  id: string;
  exam_id: string;
  user_id: string;
  file_path: string;
}

interface PlagiarismAnalysisResult {
  examId: string;
  results: {
    submission1Id: string;
    submission2Id: string;
    similarityScore: number;
    similarPassages?: string;
  }[];
}

export class PlagiarismService {
  // Extraire le texte d'un fichier PDF
  static async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const fullPath = path.join(UPLOAD_DIR, filePath);
      const data = await pdfExtract.extract(fullPath, {});
      
      // Concaténer le texte de toutes les pages
      const text = data.pages
        .map(page => page.content
          .map(item => item.str)
          .join(' '))
        .join('\n');
      
      // Normaliser le texte (enlever les espaces multiples, convertir en minuscules)
      return this.normalizeText(text);
    } catch (error) {
      console.error('Erreur lors de l\'extraction du texte:', error);
      throw new Error(`Impossible d'extraire le texte du PDF: ${error.message}`);
    }
  }

  // Normaliser le texte pour la comparaison
  static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '') // Supprimer la ponctuation
      .trim();
  }

  // Calculer la similarité entre deux textes (coefficient de Jaccard)
  static calculateSimilarity(text1: string, text2: string): number {
    // Diviser les textes en "shingles" (n-grammes de mots)
    const shingleSize = 3; // Taille des n-grammes (ajustable)
    
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    const shingles1 = new Set<string>();
    const shingles2 = new Set<string>();
    
    // Créer des shingles pour text1
    for (let i = 0; i <= words1.length - shingleSize; i++) {
      const shingle = words1.slice(i, i + shingleSize).join(' ');
      shingles1.add(shingle);
    }
    
    // Créer des shingles pour text2
    for (let i = 0; i <= words2.length - shingleSize; i++) {
      const shingle = words2.slice(i, i + shingleSize).join(' ');
      shingles2.add(shingle);
    }
    
    // Calculer l'intersection
    const intersection = new Set<string>();
    for (const shingle of shingles1) {
      if (shingles2.has(shingle)) {
        intersection.add(shingle);
      }
    }
    
    // Calculer l'union
    const union = new Set<string>([...shingles1, ...shingles2]);
    
    // Coefficient de Jaccard : taille de l'intersection / taille de l'union
    if (union.size === 0) return 0;
    return (intersection.size / union.size) * 100;
  }

  // Identifier les passages similaires
  static findSimilarPassages(text1: string, text2: string): string[] {
    const passages: string[] = [];
    const minLength = 20; // Longueur minimale d'un passage à considérer
    
    // Diviser en phrases
    const sentences1 = text1.match(/[^.!?]+[.!?]+/g) || [];
    const sentences2 = text2.match(/[^.!?]+[.!?]+/g) || [];
    
    // Comparer chaque phrase
    for (const s1 of sentences1) {
      for (const s2 of sentences2) {
        if (s1.length > minLength && s2.length > minLength) {
          const similarity = this.calculateSimilarity(s1, s2);
          if (similarity > 70) { // Seuil de similarité pour les phrases
            passages.push(s1.trim());
            break;
          }
        }
      }
    }
    
    return Array.from(new Set(passages)).slice(0, 10); // Limiter à 10 passages uniques
  }

  // Analyser le plagiat pour un examen
  static async analyzeExamPlagiarism(examId: string): Promise<PlagiarismAnalysisResult> {
    try {
      // Récupérer toutes les soumissions pour cet examen
      const submissionsResult = await query(
        'SELECT id, exam_id, user_id, file_path FROM submissions WHERE exam_id = $1',
        [examId]
      );
      
      const submissions: Submission[] = submissionsResult.rows;
      
      if (submissions.length < 2) {
        throw new Error('Au moins deux soumissions sont nécessaires pour analyser le plagiat');
      }
      
      console.log(`Analyse de plagiat pour l'examen ${examId} avec ${submissions.length} soumissions`);
      
      // Extraire le texte de chaque soumission
      const submissionTexts: Map<string, string> = new Map();
      for (const submission of submissions) {
        if (submission.file_path && submission.file_path.endsWith('.pdf')) {
          try {
            const text = await this.extractTextFromPDF(submission.file_path);
            submissionTexts.set(submission.id, text);
          } catch (error) {
            console.error(`Erreur lors de l'extraction du texte pour la soumission ${submission.id}:`, error);
            // Continuer avec les autres soumissions
          }
        }
      }
      
      // Comparer chaque paire de soumissions
      const results = [];
      
      for (let i = 0; i < submissions.length; i++) {
        const sub1 = submissions[i];
        const text1 = submissionTexts.get(sub1.id);
        
        if (!text1) continue;
        
        for (let j = i + 1; j < submissions.length; j++) {
          const sub2 = submissions[j];
          const text2 = submissionTexts.get(sub2.id);
          
          if (!text2) continue;
          
          // Calculer la similarité
          const similarityScore = this.calculateSimilarity(text1, text2);
          
          // Trouver les passages similaires (si le score est significatif)
          let similarPassages: string | undefined;
          if (similarityScore > 30) { // Seuil à partir duquel on recherche des passages
            const passages = this.findSimilarPassages(text1, text2);
            if (passages.length > 0) {
              similarPassages = JSON.stringify(passages);
            }
          }
          
          // Enregistrer le résultat
          const result = await PlagiarismResultModel.create({
            exam_id: examId,
            submission1_id: sub1.id,
            submission2_id: sub2.id,
            similarity_score: similarityScore,
            similar_passages: similarPassages
          });
          
          results.push({
            submission1Id: sub1.id,
            submission2Id: sub2.id,
            similarityScore,
            similarPassages
          });
          
          console.log(`Similarité entre ${sub1.id} et ${sub2.id}: ${similarityScore.toFixed(2)}%`);
        }
      }
      
      return {
        examId,
        results
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse de plagiat:', error);
      throw error;
    }
  }
} 