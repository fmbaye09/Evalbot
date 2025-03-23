export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatar?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  user_id: string;
  file_path?: string;
  file_url?: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
  teacher_name?: string; // Champ calculé, non stocké en base de données
}

export interface Submission {
  id: string;
  exam_id: string;
  student_id: string;
  file_url: string;
  file_path: string;
  submitted_at: string;
  grade?: number;
  graded: boolean;
  studentName?: string; // Champ calculé, non stocké en base de données
  status: 'pending' | 'graded';
}
