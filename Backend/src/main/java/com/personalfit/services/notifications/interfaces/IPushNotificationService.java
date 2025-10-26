package com.personalfit.services.notifications.interfaces;

import com.personalfit.dto.Notification.BulkNotificationRequest;
import com.personalfit.dto.Notification.SendNotificationRequest;

import java.util.List;

/**
 * Interface para el servicio de notificaciones push
 * Responsable únicamente de enviar notificaciones push a través de Firebase
 */
public interface IPushNotificationService {
    
    /**
     * Envía una notificación push a un usuario específico
     * @param request Datos de la notificación a enviar
     * @return true si se envió correctamente
     */
    boolean sendPushNotificationToUser(SendNotificationRequest request);
    
    /**
     * Envía notificaciones push masivas a múltiples usuarios
     * @param request Datos de la notificación masiva
     * @return true si se envió correctamente
     */
    boolean sendBulkPushNotification(BulkNotificationRequest request);
    
    /**
     * Verifica si Firebase está configurado correctamente
     * @return true si Firebase está configurado
     */
    boolean isFirebaseConfigured();
    
    /**
     * Verifica si se debe enviar una notificación basada en las preferencias del usuario
     * @param userId ID del usuario
     * @param notificationType Tipo de notificación
     * @return true si se debe enviar
     */
    boolean shouldSendNotificationByPreferences(Long userId, String notificationType);
    
    /**
     * Obtiene los tokens activos de un usuario para envío push
     * @param userId ID del usuario
     * @return Lista de tokens activos
     */
    List<String> getActiveTokensForUser(Long userId);
    
    /**
     * Obtiene todos los tokens activos para una lista de usuarios
     * @param userIds Lista de IDs de usuarios
     * @return Lista de tokens activos
     */
    List<String> getActiveTokensForUsers(List<Long> userIds);
}