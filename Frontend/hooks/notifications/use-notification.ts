import { useCallback, useState, useMemo } from 'react';
import { fetchMyNotifications } from '@/api/notifications/notificationsApi';
import { Notification, NotificationStatus } from '@/lib/types';
import { handleApiError } from '@/lib/error-handler';

interface UseNotificationReturn {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAsUnread: (notificationId: number) => Promise<void>;
  archiveNotification: (notificationId: number) => Promise<void>;
  unarchiveNotification: (notificationId: number) => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotification = (): UseNotificationReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedNotifications = await fetchMyNotifications();
      setNotifications(fetchedNotifications);
      
    } catch (err) {
      const errorMessage = 'Error al cargar las notificaciones';
      setError(errorMessage);
      handleApiError(err, errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función helper para actualizar una notificación en el estado local
  const updateNotificationInState = useCallback((notificationId: number, updater: (notification: Notification) => Notification) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? updater(notification)
          : notification
      )
    );
  }, []);

  // Simulamos las funciones de marcado - en una implementación real estas harían llamadas a la API
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      // En una implementación real, aquí haríamos la llamada a la API
      // Por ahora, solo actualizamos el estado local
      updateNotificationInState(notificationId, (notification) => ({
        ...notification,
        status: 'READ' as any
      }));
    } catch (err) {
      handleApiError(err, 'Error al marcar notificación como leída');
    }
  }, [updateNotificationInState]);

  const markAsUnread = useCallback(async (notificationId: number) => {
    try {
      updateNotificationInState(notificationId, (notification) => ({
        ...notification,
        status: 'UNREAD' as any
      }));
    } catch (err) {
      handleApiError(err, 'Error al marcar notificación como no leída');
    }
  }, [updateNotificationInState]);

  const archiveNotification = useCallback(async (notificationId: number) => {
    try {
      updateNotificationInState(notificationId, (notification) => ({
        ...notification,
        status: 'ARCHIVED' as any
      }));
    } catch (err) {
      handleApiError(err, 'Error al archivar notificación');
    }
  }, [updateNotificationInState]);

  const unarchiveNotification = useCallback(async (notificationId: number) => {
    try {
      updateNotificationInState(notificationId, (notification) => ({
        ...notification,
        status: 'READ' as any
      }));
    } catch (err) {
      handleApiError(err, 'Error al desarchivar notificación');
    }
  }, [updateNotificationInState]);

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      // Eliminamos la notificación del estado local
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    } catch (err) {
      handleApiError(err, 'Error al eliminar notificación');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          status: 'READ' as any
        }))
      );
    } catch (err) {
      handleApiError(err, 'Error al marcar todas las notificaciones como leídas');
    }
  }, []);

  // Calcular el número de notificaciones no leídas
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => notification.status === NotificationStatus.UNREAD).length;
  }, [notifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAsUnread,
    archiveNotification,
    unarchiveNotification,
    deleteNotification,
    markAllAsRead,
  };
};