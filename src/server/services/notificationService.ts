import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { NotificationModel, Notification } from '../models/notification';
import { verifyToken } from '../utils/jwt';

interface UserSocket {
  userId: string;
  socket: Socket;
}

export class NotificationService {
  private io: Server;
  private connectedUsers: Map<string, Socket[]> = new Map();

  constructor(httpServer: HttpServer) {
    // Initialiser Socket.IO
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Middleware d'authentification pour les WebSockets
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentification requise'));
        }

        const decoded = verifyToken(token);
        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Token invalide'));
      }
    });

    // Gérer les connexions
    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      this.addUserSocket(userId, socket);

      console.log(`Utilisateur ${userId} connecté au système de notifications`);

      // Envoyer les notifications non lues à l'utilisateur qui vient de se connecter
      this.sendUnreadNotifications(userId);

      // Gérer la déconnexion
      socket.on('disconnect', () => {
        this.removeUserSocket(userId, socket);
        console.log(`Utilisateur ${userId} déconnecté du système de notifications`);
      });

      // Gérer la marque de lecture d'une notification
      socket.on('markAsRead', async (notificationId: string) => {
        await NotificationModel.markAsRead(notificationId);
      });

      // Gérer la marque de lecture de toutes les notifications
      socket.on('markAllAsRead', async () => {
        await NotificationModel.markAllAsRead(userId);
      });
    });
  }

  /**
   * Ajoute un socket utilisateur à la liste des connexions
   */
  private addUserSocket(userId: string, socket: Socket): void {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, []);
    }
    this.connectedUsers.get(userId)?.push(socket);
  }

  /**
   * Retire un socket utilisateur de la liste des connexions
   */
  private removeUserSocket(userId: string, socket: Socket): void {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      const index = userSockets.indexOf(socket);
      if (index !== -1) {
        userSockets.splice(index, 1);
      }
      // Si plus de sockets, supprimer l'entrée
      if (userSockets.length === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  /**
   * Envoie les notifications non lues à un utilisateur
   */
  private async sendUnreadNotifications(userId: string): Promise<void> {
    try {
      const notifications = await NotificationModel.getUnreadByUserId(userId);
      const sockets = this.connectedUsers.get(userId);
      
      if (sockets && notifications.length > 0) {
        sockets.forEach(socket => {
          socket.emit('unreadNotifications', notifications);
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications non lues:', error);
    }
  }

  /**
   * Envoie une notification à un utilisateur spécifique
   */
  async sendNotification(userId: string, notification: Notification): Promise<void> {
    try {
      const sockets = this.connectedUsers.get(userId);
      
      if (sockets && sockets.length > 0) {
        sockets.forEach(socket => {
          socket.emit('notification', notification);
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'une notification:', error);
    }
  }

  /**
   * Envoie une notification à plusieurs utilisateurs
   */
  async broadcastNotification(userIds: string[], notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'>): Promise<void> {
    try {
      for (const userId of userIds) {
        // Créer une notification dans la base de données
        const savedNotification = await NotificationModel.create({
          ...notification,
          user_id: userId
        });
        
        // Envoyer la notification en temps réel
        await this.sendNotification(userId, savedNotification);
      }
    } catch (error) {
      console.error('Erreur lors de la diffusion d\'une notification:', error);
    }
  }

  /**
   * Notifie les étudiants d'un nouvel examen
   */
  async notifyNewExam(studentIds: string[], examId: string, examTitle: string): Promise<void> {
    await this.broadcastNotification(
      studentIds,
      {
        title: 'Nouvel examen disponible',
        message: `Un nouvel examen "${examTitle}" a été publié.`,
        type: 'exam',
        related_id: examId,
        link: `/student/exams/${examId}`
      }
    );
  }

  /**
   * Notifie un étudiant que sa copie a été corrigée
   */
  async notifyGraded(studentId: string, submissionId: string, examTitle: string, grade: number): Promise<void> {
    const notification = await NotificationModel.createGradeNotification(
      studentId,
      submissionId,
      examTitle,
      grade
    );
    
    await this.sendNotification(studentId, notification);
  }

  /**
   * Notifie un professeur d'une suspicion de plagiat
   */
  async notifyPlagiarism(teacherId: string, reportId: string, examTitle: string): Promise<void> {
    const notification = await NotificationModel.createPlagiarismNotification(
      teacherId,
      reportId,
      examTitle
    );
    
    await this.sendNotification(teacherId, notification);
  }
} 