import { query } from '../db';

export interface CorrigeType {
  id: string;
  exam_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export class CorrigeTypeModel {
  /**
   * Crée un nouveau corrigé type pour un examen
   */
  static async create(examId: string, content: string): Promise<CorrigeType> {
    try {
      // Vérifier si un corrigé existe déjà pour cet examen
      const existingCorrige = await this.findByExamId(examId);
      
      if (existingCorrige) {
        // Mettre à jour le corrigé existant
        return await this.update(examId, content);
      }
      
      // Créer un nouveau corrigé
      const result = await query(
        `INSERT INTO corriges_types (exam_id, content) 
         VALUES ($1, $2) 
         RETURNING *`,
        [examId, content]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Erreur lors de la création du corrigé type:', error);
      throw error;
    }
  }

  /**
   * Met à jour un corrigé type existant
   */
  static async update(examId: string, content: string): Promise<CorrigeType> {
    const result = await query(
      `UPDATE corriges_types 
       SET content = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE exam_id = $2 
       RETURNING *`,
      [content, examId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Corrigé type non trouvé');
    }
    
    return result.rows[0];
  }

  /**
   * Récupère un corrigé type par son ID d'examen
   */
  static async findByExamId(examId: string): Promise<CorrigeType | null> {
    const result = await query(
      'SELECT * FROM corriges_types WHERE exam_id = $1',
      [examId]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Vérifie si un corrigé type existe pour un examen donné
   */
  static async exists(examId: string): Promise<boolean> {
    const result = await query(
      'SELECT EXISTS(SELECT 1 FROM corriges_types WHERE exam_id = $1)',
      [examId]
    );
    
    return result.rows[0].exists;
  }

  /**
   * Supprime un corrigé type
   */
  static async delete(examId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM corriges_types WHERE exam_id = $1 RETURNING id',
      [examId]
    );
    
    return result.rowCount > 0;
  }
} 