import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/error-handler";
import { FCMTokenRequest, Notification, NotificationStatus } from "@/lib/types";

// ===============================
// API DE NOTIFICACIONES FCM - Implementación según documento
// ===============================

/**
 * Registra un token FCM en el backend (sección 1.3 del documento)
 * Endpoint: POST /api/notifications/token
 * 
 * @param token Token FCM obtenido del SDK de Firebase
 * @param deviceInfo Información opcional del dispositivo
 * @returns Promise<boolean> true si se registró correctamente
 */
export async function registerFCMToken(token: string, deviceInfo?: string): Promise<boolean> {
    try {
        const request: FCMTokenRequest = {
            token,
            deviceInfo: deviceInfo || navigator.userAgent
        };

        await jwtPermissionsApi.post('/api/notifications/token', request);
        
        console.log('✅ FCM token registered successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Error registering FCM token:', error);
        handleApiError(error, 'Error al registrar token de notificaciones');
        return false;
    }
}

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
 * Obtiene las notificaciones del usuario actual autenticado
 * Endpoint de conveniencia que usa /api/notifications/my-notifications
 */
export async function fetchMyNotifications(): Promise<Notification[]> {
    try {
        const notifications = await jwtPermissionsApi.get('/api/notifications/my-notifications');
        
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
        
        handleApiError(error, 'Error al cargar mis notificaciones');
        return [];
    }
}

/**
 * Verifica el estado de salud del servicio de notificaciones
 * Solo accesible para administradores
 */
export async function checkNotificationServiceHealth(): Promise<{ status: string; message: string }> {
    try {
        const response = await jwtPermissionsApi.get('/api/notifications/health');
        return {
            status: 'healthy',
            message: response || 'Notification service is healthy'
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data || error?.message || 'Unknown error'
        };
    }
}

// ===============================
// FUNCIONES LEGACY (para mantener compatibilidad durante la transición)
// ===============================

/**
 * @deprecated Usar registerFCMToken en su lugar
 */
export async function markNotificationAsRead(notificationId: number): Promise<boolean> {
    console.warn('markNotificationAsRead is deprecated - notifications are now managed in real-time');
    return true;
}

/**
 * @deprecated Usar registerFCMToken en su lugar
 */
export async function markNotificationAsUnread(notificationId: number): Promise<boolean> {
    console.warn('markNotificationAsUnread is deprecated - notifications are now managed in real-time');
    return true;
}

/**
 * @deprecated Ya no es necesario archivar notificaciones manualmente
 */
export async function archiveNotification(notificationId: number): Promise<boolean> {
    console.warn('archiveNotification is deprecated - notifications auto-archive after 30 days');
    return true;
}

/**
 * @deprecated Ya no es necesario eliminar notificaciones manualmente
 */
export async function deleteNotification(notificationId: number): Promise<boolean> {
    console.warn('deleteNotification is deprecated - notifications auto-delete after 60 days');
    return true;
}

/**
 * @deprecated Ya no es necesario marcar todas como leídas
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
    console.warn('markAllNotificationsAsRead is deprecated - use FCM push notifications instead');
    return true;
}