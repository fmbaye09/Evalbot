import { query } from '../db';

export interface PlagiarismResult {
  id: string;
  exam_id: string;
  submission1_id: string;
  submission2_id: string;
  similarity_score: number;
  similar_passages?: string;
  created_at: Date;
  updated_at: Date;
}

export class PlagiarismResultModel {
  // Enregistrer un nouveau résultat de plagiat
  static async create(result: Omit<PlagiarismResult, 'id' | 'created_at' | 'updated_at'>): Promise<PlagiarismResult> {
    const { exam_id, submission1_id, submission2_id, similarity_score, similar_passages } = result;
    
    // Vérifier si une comparaison existe déjà pour ces deux soumissions (dans n'importe quel ordre)
    const existingResult = await query(
      `SELECT * FROM plagiarism_results 
       WHERE (submission1_id = $1 AND submission2_id = $2) 
          OR (submission1_id = $2 AND submission2_id = $1)`,
      [submission1_id, submission2_id]
    );

    if (existingResult.rows.length > 0) {
      // Mettre à jour le résultat existant
      const updateResult = await query(
        `UPDATE plagiarism_results 
         SET similarity_score = $1, 
             similar_passages = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [similarity_score, similar_passages, existingResult.rows[0].id]
      );
      return updateResult.rows[0];
    }

    // Créer un nouveau résultat
    const insertResult = await query(
      `INSERT INTO plagiarism_results (exam_id, submission1_id, submission2_id, similarity_score, similar_passages)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [exam_id, submission1_id, submission2_id, similarity_score, similar_passages]
    );
    return insertResult.rows[0];
  }

  // Récupérer tous les résultats de plagiat pour un examen
  static async findByExamId(examId: string): Promise<PlagiarismResult[]> {
    const result = await query(
      `SELECT pr.*, 
              s1.user_id as student1_id, 
              s2.user_id as student2_id,
              u1.name as student1_name,
              u2.name as student2_name
       FROM plagiarism_results pr
       JOIN submissions s1 ON pr.submission1_id = s1.id
       JOIN submissions s2 ON pr.submission2_id = s2.id
       JOIN users u1 ON s1.user_id = u1.id
       JOIN users u2 ON s2.user_id = u2.id
       WHERE pr.exam_id = $1
       ORDER BY pr.similarity_score DESC`,
      [examId]
    );
    return result.rows;
  }

  // Récupérer les résultats de plagiat pour une soumission spécifique
  static async findBySubmissionId(submissionId: string): Promise<PlagiarismResult[]> {
    const result = await query(
      `SELECT * FROM plagiarism_results 
       WHERE submission1_id = $1 OR submission2_id = $1
       ORDER BY similarity_score DESC`,
      [submissionId]
    );
    return result.rows;
  }

  // Supprimer les résultats de plagiat pour un examen
  static async deleteByExamId(examId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM plagiarism_results WHERE exam_id = $1 RETURNING id`,
      [examId]
    );
    return result.rowCount > 0;
  }
} 