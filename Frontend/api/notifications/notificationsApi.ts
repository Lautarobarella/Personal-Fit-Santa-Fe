import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { getCurrentUser } from "@/lib/auth";
import { handleApiError } from "@/lib/error-handler";
import { Notification, NotificationStatus } from "@/lib/types";

/**
 * API para manejo de notificaciones
 */

/**
 * Obtiene las notificaciones del usuario actual
 */
export async function fetchNotifications(): Promise<Notification[]> {
    try {
        const user = getCurrentUser();
        
        if (!user) {
            console.warn('No user found when fetching notifications');
            return [];
        }

        const notifications = await jwtPermissionsApi.get(`/api/notifications/user/${user.id}`);
        
        if (!notifications || !Array.isArray(notifications)) {
            return [];
        }

        // Mapear las notificaciones del backend al formato del frontend
        return notifications.map((notification: any) => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            infoType: notification.infoType || 'INFO',
            status: notification.status || NotificationStatus.UNREAD,
            createdAt: new Date(notification.date || new Date()),
            notificationCategory: notification.notificationCategory || 'CLIENT'
        }));
        
    } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
            return [];
        }
        
        handleApiError(error, 'Error al cargar las notificaciones');
        return [];
    }
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(notificationId: number): Promise<boolean> {
    try {
        await jwtPermissionsApi.put(`/api/notifications/${notificationId}/read`, {});
        return true;
    } catch (error) {
        handleApiError(error, 'Error al marcar como leída');
        return false;
    }
}

/**
 * Marca una notificación como no leída
 */
export async function markNotificationAsUnread(notificationId: number): Promise<boolean> {
    try {
        await jwtPermissionsApi.put(`/api/notifications/${notificationId}/unread`, {});
        return true;
    } catch (error) {
        handleApiError(error, 'Error al marcar como no leída');
        return false;
    }
}

/**
 * Archiva una notificación
 */
export async function archiveNotification(notificationId: number): Promise<boolean> {
    try {
        await jwtPermissionsApi.put(`/api/notifications/${notificationId}/archive`, {});
        return true;
    } catch (error) {
        handleApiError(error, 'Error al archivar');
        return false;
    }
}

/**
 * Elimina una notificación
 */
export async function deleteNotification(notificationId: number): Promise<boolean> {
    try {
        await jwtPermissionsApi.delete(`/api/notifications/${notificationId}`);
        return true;
    } catch (error) {
        handleApiError(error, 'Error al eliminar');
        return false;
    }
}

/**
 * Marca todas las notificaciones como leídas
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
    try {
        const user = getCurrentUser();
        
        if (!user) {
            console.warn('No user found when marking all as read');
            return false;
        }

        await jwtPermissionsApi.put(`/api/notifications/user/${user.id}/mark-all-read`, {});
        return true;
    } catch (error) {
        handleApiError(error, 'Error al marcar todas como leídas');
        return false;
    }
}

