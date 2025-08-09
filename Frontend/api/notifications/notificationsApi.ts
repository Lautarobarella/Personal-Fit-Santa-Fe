import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError } from "@/lib/error-handler";

export async function fetchNotifications(userId: number) {
    try {
        return await jwtPermissionsApi.get(`/api/notifications/user/${userId}`);
    } catch (error) {
        handleApiError(error, 'Error al cargar las notificaciones');
        return [];
    }
}

export async function fetchUnreadNotifications(userId: number) {
    try {
        return await jwtPermissionsApi.get(`/api/notifications/user/${userId}/unread`);
    } catch (error) {
        handleApiError(error, 'Error al cargar las notificaciones no leídas');
        return [];
    }
}

export async function fetchReadNotifications(userId: number) {
    try {
        return await jwtPermissionsApi.get(`/api/notifications/user/${userId}/read`);
    } catch (error) {
        handleApiError(error, 'Error al cargar las notificaciones leídas');
        return [];
    }
}

export async function fetchArchivedNotifications(userId: number) {
    try {
        return await jwtPermissionsApi.get(`/api/notifications/user/${userId}/archived`);
    } catch (error) {
        handleApiError(error, 'Error al cargar las notificaciones archivadas');
        return [];
    }
}

export async function getUnreadCount(userId: number) {
    try {
        return await jwtPermissionsApi.get(`/api/notifications/user/${userId}/unread-count`);
    } catch (error) {
        handleApiError(error, 'Error al obtener el conteo de notificaciones');
        return 0;
    }
}

export async function markAsRead(notificationId: number) {
    try {
        await jwtPermissionsApi.put(`/api/notifications/${notificationId}/read`, {});
        return true;
    } catch (error) {
        handleApiError(error, 'Error al marcar como leída');
        return false;
    }
}

export async function markAsUnread(notificationId: number) {
    try {
        await jwtPermissionsApi.put(`/api/notifications/${notificationId}/unread`, {});
        return true;
    } catch (error) {
        handleApiError(error, 'Error al marcar como no leída');
        return false;
    }
}

export async function archiveNotification(notificationId: number) {
    try {
        await jwtPermissionsApi.put(`/api/notifications/${notificationId}/archive`, {});
        return true;
    } catch (error) {
        handleApiError(error, 'Error al archivar notificación');
        return false;
    }
}

export async function unarchiveNotification(notificationId: number) {
    try {
        await jwtPermissionsApi.put(`/api/notifications/${notificationId}/unarchive`, {});
        return true;
    } catch (error) {
        handleApiError(error, 'Error al desarchivar notificación');
        return false;
    }
}

export async function deleteNotification(notificationId: number) {
    try {
        await jwtPermissionsApi.delete(`/api/notifications/${notificationId}`);
        return true;
    } catch (error) {
        handleApiError(error, 'Error al eliminar notificación');
        return false;
    }
}

export async function markAllAsRead(userId: number) {
    try {
        await jwtPermissionsApi.put(`/api/notifications/user/${userId}/mark-all-read`, {});
        return true;
    } catch (error) {
        handleApiError(error, 'Error al marcar todas como leídas');
        return false;
    }
}

