import express from 'express';
import { authenticate } from '../middleware/auth';
import { NotificationModel } from '../models/notification';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Protéger toutes les routes avec l'authentification
router.use(authenticate);

// Récupérer les notifications d'un utilisateur
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const notifications = await NotificationModel.getByUserId(userId, limit, offset);
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des notifications'
    });
  }
});

// Récupérer le nombre de notifications non lues
router.get('/unread/count', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const count = await NotificationModel.getUnreadCount(userId);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Erreur lors du comptage des notifications non lues:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors du comptage des notifications non lues'
    });
  }
});

// Récupérer les notifications non lues
router.get('/unread', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const notifications = await NotificationModel.getUnreadByUserId(userId);
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications non lues:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des notifications non lues'
    });
  }
});

// Marquer une notification comme lue
router.put('/:id/read', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    // Vérifier que la notification appartient à l'utilisateur
    const notification = await NotificationModel.getByUserId(userId);
    const userNotification = notification.find(n => n.id === id);
    
    if (!userNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }
    
    await NotificationModel.markAsRead(id);
    
    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors du marquage de la notification'
    });
  }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    await NotificationModel.markAllAsRead(userId);
    
    res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors du marquage de toutes les notifications'
    });
  }
});

export default router; 