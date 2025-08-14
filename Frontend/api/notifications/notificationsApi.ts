import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { getCurrentUser } from "@/lib/auth";
import { handleApiError } from "@/lib/error-handler";
import { Notification } from "@/lib/types";

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
        
        // Si no hay notificaciones, devolver array vacío
        if (!notifications || !Array.isArray(notifications)) {
            return [];
        }

        // Mapear las notificaciones del backend al formato del frontend
        return notifications.map((notification: any) => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            infoType: notification.infoType || 'INFO',
            read: notification.read || false,
            archived: notification.archived || false,
            createdAt: new Date(notification.date || new Date()), // Mapear 'date' a 'createdAt'
            notificationCategory: notification.notificationCategory || 'CLIENT'
        }));
        
    } catch (error) {
        // Si es un error 404 (no hay notificaciones), devolver array vacío sin mostrar error
        if (error instanceof Error && error.message.includes('404')) {
            return [];
        }
        
        handleApiError(error, 'Error al cargar las notificaciones');
        return [];
    }
}

/**
 * Marca una notificación como leída (futuro endpoint del backend)
 */
export async function markNotificationAsRead(notificationId: number): Promise<boolean> {
    try {
        await jwtPermissionsApi.put(`/api/notifications/${notificationId}/read`, {});
        return true;
    } catch (error) {
        console.warn('Mark as read endpoint not implemented yet:', error);
        return false;
    }
}

/**
 * Archiva una notificación (futuro endpoint del backend)
 */
export async function archiveNotification(notificationId: number): Promise<boolean> {
    try {
        await jwtPermissionsApi.put(`/api/notifications/${notificationId}/archive`, {});
        return true;
    } catch (error) {
        console.warn('Archive notification endpoint not implemented yet:', error);
        return false;
    }
}

/**
 * Elimina una notificación (futuro endpoint del backend)
 */
export async function deleteNotification(notificationId: number): Promise<boolean> {
    try {
        await jwtPermissionsApi.delete(`/api/notifications/${notificationId}`);
        return true;
    } catch (error) {
        console.warn('Delete notification endpoint not implemented yet:', error);
        return false;
    }
}

