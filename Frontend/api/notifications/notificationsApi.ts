import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/error-handler";
import { Notification, NotificationStatus } from "@/lib/types";


/**
 * Obtiene las notificaciones del usuario especificado
 * @param userId ID del usuario (opcional, si no se proporciona se obtiene desde localStorage)
 */
export async function fetchNotifications(userId?: number): Promise<Notification[]> {
    try {
        let targetUserId = userId;
        
        if (!targetUserId) {
            const storedUserId = getUserId();
            if (!storedUserId) {
                console.warn('No user ID found when fetching notifications');
                return [];
            }
            targetUserId = storedUserId;
        }

        const notifications = await jwtPermissionsApi.get(`/api/notifications/user/${targetUserId}`);
        
        if (!notifications || !Array.isArray(notifications)) {
            return [];
        }

        // Mapear las notificaciones del backend al formato del frontend
        const mappedNotifications = notifications.map((notification: any) => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            infoType: notification.infoType || 'INFO',
            status: notification.status || NotificationStatus.UNREAD,
            createdAt: new Date(notification.date || new Date()),
            notificationCategory: notification.notificationCategory || 'CLIENT'
        }));

        // Ordenar las notificaciones de más nuevas a más viejas
        return mappedNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
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
 * @param userId ID del usuario (opcional, si no se proporciona se obtiene desde localStorage)
 */
export async function markAllNotificationsAsRead(userId?: number): Promise<boolean> {
    try {
        let targetUserId = userId;
        
        if (!targetUserId) {
            const storedUserId = getUserId();
            if (!storedUserId) {
                console.warn('No user ID found when marking all as read');
                return false;
            }
            targetUserId = storedUserId;
        }

        await jwtPermissionsApi.put(`/api/notifications/user/${targetUserId}/mark-all-read`, {});
        return true;
    } catch (error) {
        handleApiError(error, 'Error al marcar todas como leídas');
        return false;
    }
}

