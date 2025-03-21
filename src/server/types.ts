import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
}

export interface AuthenticatedRequest extends Request {
  user?: User;
} 