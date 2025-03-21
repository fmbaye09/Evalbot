import { useState, useEffect, useRef } from 'react';
import { Bell, X, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { notificationService, NotificationType } from '@/services/notificationService';
// Utiliser un import de type pour éviter le conflit avec l'objet global Notification
import type { Notification as NotificationModel } from '@/services/notificationService';

export function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notificationListener = useRef<(() => void) | null>(null);
  
  // Récupérer les notifications non lues au chargement
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const notifications = await notificationService.getUnreadNotifications();
        setNotifications(notifications);
        setUnreadCount(notifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        setError('Impossible de charger les notifications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
    
    return () => {
      if (notificationListener.current) {
        notificationListener.current();
      }
    };
  }, [user]);

  // Configurer les écouteurs de notifications en temps réel
  useEffect(() => {
    if (!user) return;
    
    try {
      // Configurer l'écouteur pour les nouvelles notifications
      notificationListener.current = notificationService.onNotification((newNotification) => {
        setNotifications(prev => {
          // Ne pas ajouter de doublons
          if (prev.some(n => n.id === newNotification.id)) {
            return prev;
          }
          
          const updated = [newNotification, ...prev];
          setUnreadCount(updated.filter(n => !n.read).length);
          return updated;
        });
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications en temps réel:', error);
    }
    
    return () => {
      if (notificationListener.current) {
        notificationListener.current();
      }
    };
  }, [user]);

  const handleNotificationClick = async (notification: NotificationModel) => {
    try {
      // Marquer la notification comme lue
      await notificationService.markAsRead(notification.id);
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Naviguer vers le lien si présent
      if (notification.link) {
        navigate(notification.link);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur lors du marquage des notifications comme lues:', error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'exam':
        return '📝';
      case 'submission':
        return '📤';
      case 'grade':
        return '🎓';
      case 'plagiarism':
        return '⚠️';
      case 'system':
        return '🔔';
      default:
        return '🔔';
    }
  };

  // Simplifier la fonction d'ouverture du panneau
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-sm flex flex-col">
        <SheetHeader className="flex-row justify-between items-center">
          <SheetTitle>Notifications</SheetTitle>
          <div className="flex space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <BellOff className="h-4 w-4 mr-1" />
                Tout marquer comme lu
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        
        <Separator className="my-2" />
        
        <ScrollArea className="flex-1 pr-2 mt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <BellOff className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer border",
                    notification.read 
                      ? "bg-background border-muted hover:bg-muted/20" 
                      : "bg-primary/5 border-primary shadow-sm",
                    "hover:bg-muted/10 transition-colors"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3 items-start">
                    <div className="text-2xl mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{notification.title}</p>
                        {!notification.read && (
                          <Badge variant="default" className="text-[10px] px-1 py-0">Nouveau</Badge>
                        )}
                      </div>
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true,
                          locale: fr 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
} 