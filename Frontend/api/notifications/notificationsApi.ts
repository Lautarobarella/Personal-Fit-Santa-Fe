import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError, handleValidationError, isValidationError } from "@/lib/error-handler";
import { NotificationFormType } from "@/lib/types";

export async function fetchNotifications(userId: number) {
  try {
    return await jwtPermissionsApi.get(`/api/notifications/user/${userId}`);
  } catch (error) {
    handleApiError(error, 'Error al cargar las notificaciones');
    return [];
  }
}

export async function fetchNotificationDetail(id: number) {
  try {
    const response = await jwtPermissionsApi.get(`/api/notifications/${id}`);
    return response;
  } catch (error) {
    console.error("Error in fetchNotificationDetail:", error);
    handleApiError(error, 'Error al cargar los detalles de la notificación');
    throw error;
  }
}

export async function newNotification(notification: Omit<NotificationFormType, 'id'>) {
  try {
    return await jwtPermissionsApi.post('/api/notifications/new', notification);
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al crear la notificación');
    }
    throw error;
  }
}

export async function deleteNotification(id: number) {
  try {
    return await jwtPermissionsApi.delete(`/api/notifications/${id}`);
  } catch (error) {
    handleApiError(error, 'Error al eliminar la notificación');
    throw error;
  }
}

export async function markNotificationAsRead(id: number) {
  try {
    return await jwtPermissionsApi.put(`/api/notifications/${id}/read`, {});
  } catch (error) {
    handleApiError(error, 'Error al marcar la notificación como leída');
    throw error;
  }
}

export async function markNotificationAsUnread(id: number) {
  try {
    return await jwtPermissionsApi.put(`/api/notifications/${id}/unread`, {});
  } catch (error) {
    handleApiError(error, 'Error al marcar la notificación como no leída');
    throw error;
  }
}

export async function archiveNotification(id: number) {
  try {
    return await jwtPermissionsApi.put(`/api/notifications/${id}/archive`, {});
  } catch (error) {
    handleApiError(error, 'Error al archivar la notificación');
    throw error;
  }
}

export async function unarchiveNotification(id: number) {
  try {
    return await jwtPermissionsApi.put(`/api/notifications/${id}/unarchive`, {});
  } catch (error) {
    handleApiError(error, 'Error al desarchivar la notificación');
    throw error;
  }
}
