import { db } from '../database/db';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'exam' | 'submission' | 'grade' | 'plagiarism' | 'system';
  related_id?: string;
  is_read: boolean;
  created_at: Date;
  link?: string;
}

export class NotificationModel {
  static async create(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification> {
    const [result] = await db('notifications')
      .insert({
        ...notification,
        is_read: false,
        created_at: new Date(),
      })
      .returning('*');
    return result;
  }

  static async getByUserId(userId: string, limit = 20, offset = 0): Promise<Notification[]> {
    const results = await db('notifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
    return results;
  }

  static async getUnreadByUserId(userId: string): Promise<Notification[]> {
    const results = await db('notifications')
      .where({ user_id: userId, is_read: false })
      .orderBy('created_at', 'desc');
    return results;
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const result = await db('notifications')
      .where({ user_id: userId, is_read: false })
      .count('id as count')
      .first();
    return parseInt(result?.count as string) || 0;
  }

  static async markAsRead(id: string): Promise<void> {
    await db('notifications')
      .where({ id })
      .update({ is_read: true });
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await db('notifications')
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true });
  }

  static async deleteById(id: string): Promise<void> {
    await db('notifications')
      .where({ id })
      .delete();
  }

  static async deleteByUserId(userId: string): Promise<void> {
    await db('notifications')
      .where({ user_id: userId })
      .delete();
  }

  // Méthodes pour créer des notifications spécifiques
  static async createExamNotification(
    userId: string, 
    examId: string, 
    examTitle: string
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      title: 'Nouvel examen disponible',
      message: `Un nouvel examen "${examTitle}" a été publié.`,
      type: 'exam',
      related_id: examId,
      link: `/student/exams/${examId}`
    });
  }

  static async createGradeNotification(
    userId: string, 
    submissionId: string, 
    examTitle: string,
    grade: number
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      title: 'Note disponible',
      message: `Votre note pour l'examen "${examTitle}" est maintenant disponible: ${grade}/20.`,
      type: 'grade',
      related_id: submissionId,
      link: `/student/submissions`
    });
  }

  static async createPlagiarismNotification(
    userId: string, 
    reportId: string, 
    examTitle: string
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      title: 'Suspicion de plagiat détectée',
      message: `Une suspicion de plagiat a été détectée dans l'examen "${examTitle}".`,
      type: 'plagiarism',
      related_id: reportId,
      link: `/teacher/plagiarism/${reportId}`
    });
  }
} 