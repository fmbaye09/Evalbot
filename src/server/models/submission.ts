import { db } from '../database/db';

export interface Submission {
  id: string;
  student_id: string;
  exam_id: string;
  file_path: string;
  submitted_at: Date;
  grade?: number;
  feedback?: string;
  auto_graded?: boolean;
}

export class SubmissionModel {
  static async create(submission: Omit<Submission, 'id' | 'submitted_at'>): Promise<Submission> {
    const [result] = await db('submissions')
      .insert({
        ...submission,
        submitted_at: new Date(),
      })
      .returning('*');
    return result;
  }

  static async getById(id: string): Promise<Submission | null> {
    const result = await db('submissions').where({ id }).first();
    return result || null;
  }

  static async getByStudentId(studentId: string): Promise<Submission[]> {
    const results = await db('submissions')
      .select(
        'submissions.*',
        'exams.title as exam_title',
        'users.name as student_name'
      )
      .where({ student_id: studentId })
      .leftJoin('exams', 'submissions.exam_id', 'exams.id')
      .leftJoin('users', 'submissions.student_id', 'users.id')
      .orderBy('submitted_at', 'desc');
    return results;
  }

  static async getByExamId(examId: string): Promise<Submission[]> {
    const results = await db('submissions')
      .select(
        'submissions.*',
        'exams.title as exam_title', 
        'users.name as student_name'
      )
      .where({ exam_id: examId })
      .leftJoin('exams', 'submissions.exam_id', 'exams.id')
      .leftJoin('users', 'submissions.student_id', 'users.id')
      .orderBy('submitted_at', 'desc');
    return results;
  }

  static async getByTeacherId(teacherId: string): Promise<Submission[]> {
    const results = await db('submissions')
      .select(
        'submissions.*',
        'exams.title as exam_title',
        'users.name as student_name'
      )
      .join('exams', 'submissions.exam_id', 'exams.id')
      .where('exams.teacher_id', teacherId)
      .leftJoin('users', 'submissions.student_id', 'users.id')
      .orderBy('submitted_at', 'desc');
    return results;
  }

  static async updateGrade(id: string, grade: number, feedback: string, auto_graded: boolean = false): Promise<Submission> {
    const [result] = await db('submissions')
      .where({ id })
      .update({ grade, feedback, auto_graded })
      .returning('*');
    return result;
  }
} 