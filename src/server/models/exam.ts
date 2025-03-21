import { query } from '../db';
import { Exam } from '../../types';

export class ExamModel {
  // Créer un nouvel examen
  static async create(exam: Partial<Exam>, userId: string): Promise<Exam> {
    const { title, description, file_path, deadline } = exam;
    const result = await query(
      `INSERT INTO exams (title, description, file_path, user_id, deadline)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, file_path, userId, deadline]
    );
    return result.rows[0];
  }

  // Récupérer tous les examens d'un professeur
  static async findByTeacherId(userId: string): Promise<Exam[]> {
    const result = await query(
      `SELECT * FROM exams WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Récupérer les examens disponibles pour un étudiant
  static async findAvailableForStudent(userId: string): Promise<Exam[]> {
    const result = await query(
      `SELECT e.* 
       FROM exams e
       LEFT JOIN submissions s ON e.id = s.exam_id AND s.user_id = $1
       WHERE s.id IS NULL
       AND (e.deadline IS NULL OR e.deadline > CURRENT_TIMESTAMP)
       ORDER BY e.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Récupérer un examen par son ID
  static async findById(id: string): Promise<Exam | null> {
    const result = await query(
      `SELECT * FROM exams WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  // Mettre à jour un examen
  static async update(id: string, exam: Partial<Exam>): Promise<Exam | null> {
    const { title, description, deadline } = exam;
    const result = await query(
      `UPDATE exams 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           deadline = COALESCE($3, deadline),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [title, description, deadline, id]
    );
    return result.rows[0] || null;
  }

  // Supprimer un examen
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM exams WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rowCount > 0;
  }

  // Vérifier si un professeur est propriétaire d'un examen
  static async isTeacherOwner(examId: string, userId: string): Promise<boolean> {
    const result = await query(
      `SELECT EXISTS(SELECT 1 FROM exams WHERE id = $1 AND user_id = $2)`,
      [examId, userId]
    );
    return result.rows[0].exists;
  }

  // Compter le nombre total d'examens d'un professeur
  static async countByTeacher(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) FROM exams WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  // Récupérer les statistiques des examens d'un professeur
  static async getTeacherStats(userId: string) {
    const result = await query(
      `SELECT 
        COUNT(DISTINCT e.id) as total_exams,
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.grade IS NOT NULL THEN s.id END) as graded_submissions,
        ROUND(AVG(s.grade)::numeric, 2) as average_grade
       FROM exams e
       LEFT JOIN submissions s ON e.id = s.exam_id
       WHERE e.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }
} 