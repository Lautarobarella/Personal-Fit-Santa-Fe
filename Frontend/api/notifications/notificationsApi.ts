import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError, handleValidationError, isValidationError } from "@/lib/error-handler";
import { NotificationFormType } from "@/lib/types";

export interface BulkNotificationRecipient {
  id: number;
  name: string;
}

export interface BulkNotificationRecipientsResponse {
  success: boolean;
  count: number;
  recipients: BulkNotificationRecipient[];
}

export async function fetchNotifications(userId: number) {
  try {
    // El cliente API devuelve null ante respuestas vacías o no-JSON. El default
    // `= []` de useQuery solo cubre undefined, así que un null llegaría a los
    // .filter() del provider del layout y tumbaría toda la app. Garantizar array.
    const response = await jwtPermissionsApi.get(`/api/notifications/user/${userId}`);
    return Array.isArray(response) ? response : [];
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

export async function newNotification(notification: Omit<NotificationFormType, 'id'>, options?: { silent?: boolean }) {
  try {
    return await jwtPermissionsApi.post('/api/notifications/new', notification);
  } catch (error) {
    if (!options?.silent) {
      if (isValidationError(error)) {
        handleValidationError(error);
      } else {
        handleApiError(error, 'Error al crear la notificación');
      }
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

export async function createBulkNotification(title: string, message: string) {
  try {
    const response = await jwtPermissionsApi.post('/api/notifications/bulk', { title, message });
    return response;
  } catch (error) {
    console.error('Error creating bulk notification:', error);
    handleApiError(error, 'Error al crear notificaciones masivas');
    throw error;
  }
}

export async function fetchBulkNotificationRecipients(): Promise<BulkNotificationRecipientsResponse> {
  try {
    return await jwtPermissionsApi.get('/api/notifications/bulk/recipients');
  } catch (error) {
    handleApiError(error, 'Error al cargar los destinatarios de la notificación');
    throw error;
  }
}
