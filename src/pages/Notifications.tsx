import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, Check, Trash2, BellOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { notificationService, Notification, NotificationType } from '@/services/notificationService';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  
  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();
  }, [user, activeTab]);
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let fetchedNotifications: Notification[];
      
      if (activeTab === 'unread') {
        fetchedNotifications = await notificationService.getUnreadNotifications();
      } else {
        fetchedNotifications = await notificationService.getAllNotifications();
      }
      
      setNotifications(
        activeTab === 'read' 
          ? fetchedNotifications.filter(n => n.read) 
          : fetchedNotifications
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de récupérer les notifications'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      toast({
        title: 'Notification marquée comme lue',
        description: 'La notification a été marquée comme lue avec succès'
      });
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de marquer la notification comme lue'
      });
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({
        title: 'Notifications marquées comme lues',
        description: 'Toutes les notifications ont été marquées comme lues'
      });
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de marquer les notifications comme lues'
      });
    }
  };
  
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({
        title: 'Notification supprimée',
        description: 'La notification a été supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer la notification'
      });
    }
  };
  
  const handleNavigateToLink = (notification: Notification) => {
    if (notification.link) {
      if (!notification.read) {
        handleMarkAsRead(notification.id);
      }
      navigate(notification.link);
    }
  };
  
  const getTypeIcon = (type: NotificationType) => {
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
  
  const getTypeName = (type: NotificationType) => {
    switch (type) {
      case 'exam':
        return 'Examen';
      case 'submission':
        return 'Soumission';
      case 'grade':
        return 'Note';
      case 'plagiarism':
        return 'Plagiat';
      case 'system':
        return 'Système';
      default:
        return type;
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Consultez et gérez vos notifications
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="unread">Non lues</TabsTrigger>
              <TabsTrigger value="read">Lues</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            disabled={!notifications.some(n => !n.read)} 
            onClick={handleMarkAllAsRead}
          >
            <BellOff className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Vos notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                <Bell className="h-8 w-8 mb-4 text-muted-foreground/50" />
                <p>Aucune notification à afficher</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map(notification => (
                    <TableRow 
                      key={notification.id}
                      className={notification.read ? '' : 'bg-muted/30'}
                    >
                      <TableCell className="font-medium text-center text-xl">
                        {getTypeIcon(notification.type)}
                      </TableCell>
                      <TableCell 
                        className="font-medium cursor-pointer hover:underline"
                        onClick={() => handleNavigateToLink(notification)}
                      >
                        {notification.title}
                        <p className="text-xs font-normal text-muted-foreground">
                          {getTypeName(notification.type)}
                        </p>
                      </TableCell>
                      <TableCell>{notification.message}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {notification.read ? (
                          <Badge variant="outline">Lu</Badge>
                        ) : (
                          <Badge>Non lu</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {!notification.read && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 