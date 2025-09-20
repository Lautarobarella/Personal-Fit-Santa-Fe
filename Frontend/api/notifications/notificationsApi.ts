import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/error-handler";
import { BulkNotificationRequest, Notification, NotificationPreferences, NotificationStatus, RegisterDeviceRequest, SendNotificationRequest } from "@/lib/types";


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

// ===============================
// PWA Push Notifications API
// ===============================

/**
 * Registra un token de dispositivo para notificaciones push
 */
export async function registerDeviceToken(request: RegisterDeviceRequest): Promise<boolean> {
    try {
        let targetUserId = request.userId;
        
        if (!targetUserId) {
            const storedUserId = getUserId();
            if (!storedUserId) {
                console.warn('No user ID found when registering device token');
                return false;
            }
            targetUserId = storedUserId;
        }

        await jwtPermissionsApi.post('/api/notifications/pwa/register-device', {
            ...request,
            userId: targetUserId
        });
        
        console.log('Device token registered successfully');
        return true;
    } catch (error) {
        handleApiError(error, 'Error al registrar token de dispositivo');
        return false;
    }
}

/**
 * Elimina un token de dispositivo
 */
export async function unregisterDeviceToken(token: string): Promise<boolean> {
    try {
        await jwtPermissionsApi.delete(`/api/notifications/pwa/unregister-device/${token}`);
        console.log('Device token unregistered successfully');
        return true;
    } catch (error) {
        handleApiError(error, 'Error al eliminar token de dispositivo');
        return false;
    }
}

/**
 * Obtiene las preferencias de notificaciones del usuario
 */
export async function getNotificationPreferences(userId?: number): Promise<NotificationPreferences | null> {
    try {
        let targetUserId = userId;
        
        if (!targetUserId) {
            const storedUserId = getUserId();
            if (!storedUserId) {
                console.warn('No user ID found when fetching notification preferences');
                return null;
            }
            targetUserId = storedUserId;
        }

        const preferences = await jwtPermissionsApi.get(`/api/notifications/preferences/${targetUserId}`);
        return preferences as NotificationPreferences;
    } catch (error) {
        handleApiError(error, 'Error al obtener preferencias de notificaciones');
        return null;
    }
}

/**
 * Actualiza las preferencias de notificaciones del usuario
 */
export async function updateNotificationPreferences(
    preferences: NotificationPreferences, 
    userId?: number
): Promise<boolean> {
    try {
        let targetUserId = userId;
        
        if (!targetUserId) {
            const storedUserId = getUserId();
            if (!storedUserId) {
                console.warn('No user ID found when updating notification preferences');
                return false;
            }
            targetUserId = storedUserId;
        }

        await jwtPermissionsApi.put(`/api/notifications/preferences/${targetUserId}`, preferences);
        console.log('Notification preferences updated successfully');
        return true;
    } catch (error) {
        handleApiError(error, 'Error al actualizar preferencias de notificaciones');
        return false;
    }
}

/**
 * Envía una notificación de prueba (solo para testing)
 */
export async function sendTestNotification(request: SendNotificationRequest): Promise<boolean> {
    try {
        await jwtPermissionsApi.post('/api/notifications/send-test', request);
        console.log('Test notification sent successfully');
        return true;
    } catch (error) {
        handleApiError(error, 'Error al enviar notificación de prueba');
        return false;
    }
}

/**
 * Envía una notificación push a todos los usuarios (solo ADMIN)
 */
export async function sendBulkNotification(request: BulkNotificationRequest): Promise<boolean> {
    try {
        await jwtPermissionsApi.post('/api/notifications/pwa/send-bulk', request);
        console.log('Bulk notification sent successfully');
        return true;
    } catch (error) {
        handleApiError(error, 'Error al enviar notificación masiva');
        return false;
    }
}


