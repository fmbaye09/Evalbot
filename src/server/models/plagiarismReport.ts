import { db } from '../database/db';

export interface PlagiarismDetails {
  matchedSegments: Array<{
    segment1: { 
      text: string;
      startPosition: number;
      endPosition: number;
    };
    segment2: { 
      text: string;
      startPosition: number;
      endPosition: number;
    };
    similarityScore: number;
  }>;
  totalCharacters: number;
  matchedCharacters: number;
}

export interface PlagiarismReport {
  id: string;
  exam_id: string;
  submission1_id: string;
  submission2_id: string;
  similarity_score: number;
  details: PlagiarismDetails;
  status: 'pending' | 'confirmed' | 'dismissed' | 'reviewing';
  created_at: Date;
  updated_at: Date;
  reviewed_by?: string;
  review_notes?: string;
  is_notified: boolean;
}

export class PlagiarismReportModel {
  static async create(report: Omit<PlagiarismReport, 'id' | 'created_at' | 'updated_at' | 'is_notified'>): Promise<PlagiarismReport> {
    const [result] = await db('plagiarism_reports')
      .insert({
        ...report,
        created_at: new Date(),
        updated_at: new Date(),
        is_notified: false
      })
      .returning('*');
    return result;
  }

  static async getById(id: string): Promise<PlagiarismReport | null> {
    const result = await db('plagiarism_reports')
      .where({ id })
      .first();
    return result || null;
  }

  static async getByExamId(examId: string): Promise<PlagiarismReport[]> {
    const results = await db('plagiarism_reports')
      .where({ exam_id: examId })
      .orderBy([
        { column: 'similarity_score', order: 'desc' },
        { column: 'created_at', order: 'desc' }
      ]);
    return results;
  }

  static async getByTeacherId(teacherId: string): Promise<PlagiarismReport[]> {
    const results = await db('plagiarism_reports as pr')
      .join('exams as e', 'pr.exam_id', 'e.id')
      .where('e.user_id', teacherId)
      .select(
        'pr.*',
        'e.title as exam_title'
      )
      .orderBy([
        { column: 'pr.similarity_score', order: 'desc' },
        { column: 'pr.created_at', order: 'desc' }
      ]);
    return results;
  }

  static async getHighSimilarityReports(threshold = 80): Promise<PlagiarismReport[]> {
    const results = await db('plagiarism_reports')
      .where('similarity_score', '>=', threshold)
      .orderBy('similarity_score', 'desc');
    return results;
  }

  static async updateStatus(
    id: string, 
    status: 'confirmed' | 'dismissed' | 'reviewing',
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<PlagiarismReport> {
    const [result] = await db('plagiarism_reports')
      .where({ id })
      .update({
        status,
        reviewed_by: reviewedBy,
        review_notes: reviewNotes,
        updated_at: new Date()
      })
      .returning('*');
    return result;
  }

  static async markAsNotified(id: string): Promise<void> {
    await db('plagiarism_reports')
      .where({ id })
      .update({
        is_notified: true,
        updated_at: new Date()
      });
  }

  static async existsForSubmissionPair(submission1Id: string, submission2Id: string): Promise<boolean> {
    const result = await db('plagiarism_reports')
      .where({
        submission1_id: submission1Id,
        submission2_id: submission2Id
      })
      .orWhere({
        submission1_id: submission2Id,
        submission2_id: submission1Id
      })
      .first();
    return !!result;
  }

  static async deleteById(id: string): Promise<void> {
    await db('plagiarism_reports')
      .where({ id })
      .delete();
  }
} 