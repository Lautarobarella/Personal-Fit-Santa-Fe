import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/error-handler";
import type {
  NotificationEntity,
  SendNotificationCommand,
  BulkNotificationCommand,
  NotificationOperationResult,
  NotificationListResult,
  NotificationQuery
} from '../domain/types';
import type { INotificationRepository } from '../domain/repositories';
import { NotificationStatus } from "@/lib/types";

/**
 * Implementation of notification repository using JWT API
 * Handles all notification-related API calls
 */
export class NotificationRepository implements INotificationRepository {

  async getUserNotifications(query: NotificationQuery): Promise<NotificationListResult> {
    try {
      let targetUserId = query.userId;
      
      if (!targetUserId) {
        const storedUserId = getUserId();
        if (!storedUserId) {
          console.warn('No user ID found when fetching notifications');
          return { notifications: [], unreadCount: 0, totalCount: 0 };
        }
        targetUserId = storedUserId;
      }

      const notifications = await jwtPermissionsApi.get(`/api/notifications/user/${targetUserId}`);
      
      if (!notifications || !Array.isArray(notifications)) {
        return { notifications: [], unreadCount: 0, totalCount: 0 };
      }

      // Map backend response to domain entities
      const mappedNotifications: NotificationEntity[] = notifications.map((notification: any) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        infoType: notification.infoType || 'INFO',
        status: notification.status || NotificationStatus.UNREAD,
        createdAt: new Date(notification.date || new Date()),
        notificationCategory: notification.notificationCategory || 'CLIENT'
      }));

      // Sort notifications by date (newest first)
      const sortedNotifications = mappedNotifications.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      // Calculate counts
      const unreadCount = sortedNotifications.filter(n => n.status === NotificationStatus.UNREAD).length;

      return {
        notifications: sortedNotifications,
        unreadCount,
        totalCount: sortedNotifications.length
      };
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return { notifications: [], unreadCount: 0, totalCount: 0 };
      }
      
      handleApiError(error, 'Error al cargar las notificaciones');
      return { notifications: [], unreadCount: 0, totalCount: 0 };
    }
  }

  async markAsRead(notificationId: number): Promise<NotificationOperationResult> {
    try {
      await jwtPermissionsApi.put(`/api/notifications/${notificationId}/read`, {});
      return { success: true, message: 'Notificación marcada como leída' };
    } catch (error) {
      handleApiError(error, 'Error al marcar como leída');
      return { success: false, message: 'Error al marcar como leída' };
    }
  }

  async markAsUnread(notificationId: number): Promise<NotificationOperationResult> {
    try {
      await jwtPermissionsApi.put(`/api/notifications/${notificationId}/unread`, {});
      return { success: true, message: 'Notificación marcada como no leída' };
    } catch (error) {
      handleApiError(error, 'Error al marcar como no leída');
      return { success: false, message: 'Error al marcar como no leída' };
    }
  }

  async archiveNotification(notificationId: number): Promise<NotificationOperationResult> {
    try {
      await jwtPermissionsApi.put(`/api/notifications/${notificationId}/archive`, {});
      return { success: true, message: 'Notificación archivada' };
    } catch (error) {
      handleApiError(error, 'Error al archivar');
      return { success: false, message: 'Error al archivar' };
    }
  }

  async deleteNotification(notificationId: number): Promise<NotificationOperationResult> {
    try {
      await jwtPermissionsApi.delete(`/api/notifications/${notificationId}`);
      return { success: true, message: 'Notificación eliminada' };
    } catch (error) {
      handleApiError(error, 'Error al eliminar');
      return { success: false, message: 'Error al eliminar' };
    }
  }

  async markAllAsRead(userId: number): Promise<NotificationOperationResult> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const storedUserId = getUserId();
        if (!storedUserId) {
          console.warn('No user ID found when marking all as read');
          return { success: false, message: 'Usuario no identificado' };
        }
        targetUserId = storedUserId;
      }

      await jwtPermissionsApi.put(`/api/notifications/user/${targetUserId}/mark-all-read`, {});
      return { success: true, message: 'Todas las notificaciones marcadas como leídas' };
    } catch (error) {
      handleApiError(error, 'Error al marcar todas como leídas');
      return { success: false, message: 'Error al marcar todas como leídas' };
    }
  }

  async sendNotification(command: SendNotificationCommand): Promise<NotificationOperationResult> {
    try {
      await jwtPermissionsApi.post('/api/notifications/pwa/send', command);
      return { success: true, message: 'Notificación enviada exitosamente' };
    } catch (error) {
      handleApiError(error, 'Error al enviar notificación');
      return { success: false, message: 'Error al enviar notificación' };
    }
  }

  async sendBulkNotification(command: BulkNotificationCommand): Promise<NotificationOperationResult> {
    try {
      await jwtPermissionsApi.post('/api/notifications/pwa/send-bulk', command);
      return { success: true, message: 'Notificaciones masivas enviadas exitosamente' };
    } catch (error) {
      handleApiError(error, 'Error al enviar notificaciones masivas');
      return { success: false, message: 'Error al enviar notificaciones masivas' };
    }
  }
}