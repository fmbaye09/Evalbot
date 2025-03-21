import { Request, Response, NextFunction } from 'express';

export const checkRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ 
        error: 'Accès non autorisé',
        message: `Rôle ${role} requis`
      });
    }

    next();
  };
}; 