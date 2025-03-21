import { getAuthToken } from '@/config/client';
import { io, Socket } from 'socket.io-client';

// Types de notification
export type NotificationType = 'exam' | 'submission' | 'grade' | 'plagiarism' | 'system';

// Interface de notification adaptée pour le client
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean; // Côté client nous utilisons read
  link?: string;
  data?: Record<string, any>;
  created_at: string;
  related_id?: string;
}

// Interface serveur pour la conversion
interface ServerNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean; // Côté serveur c'est is_read
  link?: string;
  related_id?: string;
  created_at: string;
}

/**
 * Service pour gérer les notifications côté client
 */
class NotificationService {
  private static instance: NotificationService;
  private baseUrl = '/api/notifications';
  private socket: Socket | null = null;
  private listeners: Array<(notification: Notification) => void> = [];
  private isBackendAvailable: boolean = true; // Par défaut, supposons que le backend est disponible
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;
  private hasLoggedSocketError: boolean = false;
  private backendDetectionDone: boolean = false;

  private constructor() {
    // Détecter la disponibilité du backend
    this.detectBackendAvailability();
    // Initialiser le socket WebSocket
    this.initializeSocket();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Détecte si le backend des notifications est disponible
   * Cette méthode est appelée automatiquement lors de l'initialisation du service
   */
  private async detectBackendAvailability(): Promise<void> {
    if (this.backendDetectionDone) return;

    try {
      // On ne fait pas de vérification HEAD qui génère une erreur 401
      // À la place, on présume que le backend est disponible et 
      // on laissera les méthodes de récupération gérer les erreurs
      this.isBackendAvailable = true;
      this.backendDetectionDone = true;
      console.log('Backend de notifications présumé disponible');
    } catch (error) {
      // En cas d'erreur exceptionnelle, désactiver le backend
      this.isBackendAvailable = false;
      console.error('Erreur lors de la détection du backend de notifications:', error);
      this.backendDetectionDone = true;
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Non authentifié');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Convertit une notification du format serveur au format client
   */
  private convertFromServer(serverNotif: ServerNotification): Notification {
    return {
      ...serverNotif,
      read: serverNotif.is_read,
    };
  }

  /**
   * Vérifie si la réponse est du JSON valide
   */
  private async isJsonResponse(response: Response): Promise<boolean> {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return false;
    }
    
    try {
      const text = await response.text();
      JSON.parse(text);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Désactiver complètement le service de notification backend
   */
  disableBackend(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isBackendAvailable = false;
    console.error('Service de notifications désactivé');
  }

  /**
   * Initialiser la connexion WebSocket pour les notifications en temps réel
   */
  initializeSocket(): Socket | null {
    // Désactiver temporairement la connexion WebSocket en raison des erreurs serveur
    console.log('WebSocket temporairement désactivé pour éviter les erreurs');
    
    // Au lieu du WebSocket en temps réel, on va utiliser le polling régulier
    // Les notifications seront récupérées lors de l'ouverture du panneau
    return null;
  }

  /**
   * Ajouter un écouteur pour les nouvelles notifications
   */
  onNotification(callback: (notification: Notification) => void): () => void {
    this.listeners.push(callback);
    
    // Retourne une fonction pour supprimer l'écouteur
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notifier tous les écouteurs d'une nouvelle notification
   */
  private notifyListeners(notification: Notification): void {
    this.listeners.forEach(listener => listener(notification));
  }

  /**
   * Afficher une notification système (navigateur)
   * Cette méthode ne doit être appelée qu'après une interaction utilisateur
   */
  private showBrowserNotification(notification: Notification): void {
    // Ne plus utiliser les notifications du navigateur
    // On se concentre uniquement sur les notifications internes
    console.log('Notification reçue:', notification.title);
  }

  /**
   * Demander la permission pour les notifications du navigateur
   * Cette méthode doit être appelée uniquement en réponse à une interaction utilisateur
   */
  requestNotificationPermission(): Promise<NotificationPermission> {
    // Ne plus demander de permission, toujours retourner "granted" pour la compatibilité
    return Promise.resolve('granted');
  }

  /**
   * Récupère les notifications non lues depuis l'API
   * @returns Promise<Notification[]>
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    try {
      // Simuler des notifications au lieu d'utiliser l'API
      console.log('Simulation de notifications non lues (API temporairement désactivée)');
      
      // Créer quelques notifications simulées
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Nouvel examen créé',
          message: 'L\'examen "Introduction à l\'IA" a été créé',
          type: 'exam',
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          related_id: 'teacher1',
          user_id: 'student1',
          data: {
            sender: {
              id: 'teacher1',
              name: 'Prof. Dupont',
              role: 'teacher'
            }
          }
        },
        {
          id: '2',
          title: 'Examen à venir',
          message: 'N\'oubliez pas votre examen de programmation demain',
          type: 'exam',
          read: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          related_id: 'admin1',
          user_id: 'student1',
          data: {
            sender: {
              id: 'admin1',
              name: 'Administration',
              role: 'admin'
            }
          }
        }
      ];
      
      return mockNotifications;
      
      /* Code API désactivé temporairement
      // Vérifier si l'authentification est disponible
      const token = getAuthToken();
      if (!token) {
        console.warn('getUnreadNotifications: Aucun token d\'authentification disponible');
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications/unread`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Pour l'erreur 401, on retourne simplement un tableau vide sans erreur
        if (response.status === 401) {
          console.warn('getUnreadNotifications: Non autorisé (401), authentification requise');
          return [];
        }
        
        throw new Error(`Erreur lors de la récupération des notifications: ${response.statusText}`);
      }

      const data = await response.json();
      return data.map(this.convertFromServer);
      */
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications non lues:', error);
      return [];
    }
  }

  /**
   * Récupère toutes les notifications depuis l'API
   * @returns Promise<Notification[]>
   */
  async getAllNotifications(): Promise<Notification[]> {
    try {
      // Simuler des notifications au lieu d'utiliser l'API
      console.log('Simulation de toutes les notifications (API temporairement désactivée)');
      
      // Créer quelques notifications simulées (incluant les lues et non lues)
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Nouvel examen créé',
          message: 'L\'examen "Introduction à l\'IA" a été créé',
          type: 'exam',
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          related_id: 'teacher1',
          user_id: 'student1',
          data: {
            sender: {
              id: 'teacher1',
              name: 'Prof. Dupont',
              role: 'teacher'
            }
          }
        },
        {
          id: '2',
          title: 'Examen à venir',
          message: 'N\'oubliez pas votre examen de programmation demain',
          type: 'exam',
          read: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          related_id: 'admin1',
          user_id: 'student1',
          data: {
            sender: {
              id: 'admin1',
              name: 'Administration',
              role: 'admin'
            }
          }
        },
        {
          id: '3',
          title: 'Résultats disponibles',
          message: 'Les résultats de l\'examen "Programmation C++" sont disponibles',
          type: 'exam',
          read: true,
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 jours
          related_id: 'teacher2',
          user_id: 'student1',
          data: {
            sender: {
              id: 'teacher2',
              name: 'Prof. Martin',
              role: 'teacher'
            }
          }
        }
      ];
      
      return mockNotifications;
      
      /* Code API désactivé temporairement
      // Vérifier si l'authentification est disponible
      const token = getAuthToken();
      if (!token) {
        console.warn('getAllNotifications: Aucun token d\'authentification disponible');
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Pour l'erreur 401, on retourne simplement un tableau vide sans erreur
        if (response.status === 401) {
          console.warn('getAllNotifications: Non autorisé (401), authentification requise');
          return [];
        }
        
        throw new Error(`Erreur lors de la récupération des notifications: ${response.statusText}`);
      }

      const data = await response.json();
      return data.map(this.convertFromServer);
      */
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les notifications:', error);
      return [];
    }
  }

  /**
   * Notifie les listeners d'un changement de statut pour une notification
   * @param notificationId ID de la notification mise à jour
   * @param read Nouvel état de lecture de la notification
   */
  private notifyStatusChange(notificationId: string, read: boolean): void {
    // Émettre un événement pour mettre à jour l'UI
    const event = new CustomEvent('notification:status-change', {
      detail: {
        id: notificationId,
        read: read
      }
    });
    window.dispatchEvent(event);
    
    console.log(`Notification ${notificationId} marquée comme ${read ? 'lue' : 'non lue'}`);
  }

  /**
   * Marquer une notification comme lue
   * @param id ID de la notification
   * @returns Promise<boolean>
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      // Simuler la mise à jour (API temporairement désactivée)
      console.log(`Simulation de la mise à jour (marquer comme lu) pour la notification ${id}`);
      
      // Simuler un délai et retourner un succès
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Émettre un événement pour mettre à jour l'interface
      this.notifyStatusChange(id, true);
      
      return true;
      
      /* Code API désactivé temporairement
      const token = getAuthToken();
      if (!token) {
        console.warn('markAsRead: Aucun token d\'authentification disponible');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('markAsRead: Non autorisé (401), authentification requise');
          return false;
        }
        
        throw new Error(`Erreur lors du marquage de la notification: ${response.statusText}`);
      }

      // Émettre un événement pour mettre à jour l'interface
      this.notifyStatusChange(id, true);
      
      return true;
      */
    } catch (error) {
      console.error(`Erreur lors du marquage de la notification ${id} comme lue:`, error);
      return false;
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<void> {
    if (!this.isBackendAvailable) {
      console.error('Backend non disponible pour marquer toutes les notifications comme lues');
      return;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/read-all`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors du marquage des notifications');
      }
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
    }
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    if (!this.isBackendAvailable) {
      console.error('Backend non disponible pour supprimer la notification');
      return;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression de la notification');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  }
}

// Exporter l'instance unique
export const notificationService = NotificationService.getInstance();