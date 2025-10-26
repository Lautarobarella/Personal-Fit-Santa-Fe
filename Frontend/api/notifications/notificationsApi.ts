import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError } from "@/lib/error-handler";
import type { NotificationPreferences, RegisterDeviceRequest } from "@/lib/types";

/**
 * Legacy notifications API functions for compatibility
 * These functions maintain the interface expected by existing components
 * while using the modern JWT API under the hood
 */

export async function registerDeviceToken(request: RegisterDeviceRequest): Promise<boolean> {
  try {
    await jwtPermissionsApi.post('/api/notifications/pwa/register-device', {
      token: request.token,
      deviceType: request.deviceType,
      userId: request.userId
    });
    return true;
  } catch (error) {
    console.error('Error registering device token:', error);
    handleApiError(error, 'Error al registrar dispositivo');
    return false;
  }
}

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  try {
    const response = await jwtPermissionsApi.get('/api/notifications/preferences');
    return response;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    handleApiError(error, 'Error al obtener preferencias');
    return null;
  }
}

export async function updateNotificationPreferences(preferences: NotificationPreferences): Promise<boolean> {
  try {
    await jwtPermissionsApi.put('/api/notifications/preferences', preferences);
    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    handleApiError(error, 'Error al actualizar preferencias');
    return false;
  }
}

export async function getPushNotificationStatus(): Promise<any> {
  try {
    const response = await jwtPermissionsApi.get('/api/notifications/push-status');
    return response;
  } catch (error) {
    console.error('Error getting push notification status:', error);
    handleApiError(error, 'Error al obtener estado de notificaciones');
    return null;
  }
}

export async function getSubscriptionStatus(): Promise<any> {
  try {
    const response = await jwtPermissionsApi.get('/api/notifications/subscription-status');
    return response;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    handleApiError(error, 'Error al obtener estado de suscripción');
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    await jwtPermissionsApi.post('/api/notifications/unsubscribe', {});
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    handleApiError(error, 'Error al desuscribirse');
    return false;
  }
}

// Legacy function for bulk notification sending
// This is now handled by the NotificationRepository
export async function sendBulkNotification(request: any): Promise<boolean> {
  try {
    await jwtPermissionsApi.post('/api/notifications/pwa/send-bulk', request);
    return true;
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    handleApiError(error, 'Error al enviar notificaciones masivas');
    return false;
  }
}