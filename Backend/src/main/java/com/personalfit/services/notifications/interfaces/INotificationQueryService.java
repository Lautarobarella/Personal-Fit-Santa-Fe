package com.personalfit.services.notifications.interfaces;

import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.enums.NotificationStatus;

import java.util.List;

/**
 * Interface para operaciones de consulta (lectura) de notificaciones
 * Siguiendo el patrón Query y principios CQRS
 */
public interface INotificationQueryService {
    
    /**
     * Obtiene todas las notificaciones de un usuario
     * @param userId ID del usuario
     * @return Lista de notificaciones del usuario
     */
    List<NotificationDTO> getUserNotifications(Long userId);
    
    /**
     * Obtiene las notificaciones de un usuario verificando permisos
     * @param userId ID del usuario
     * @param userEmail Email del usuario autenticado
     * @return Lista de notificaciones del usuario
     */
    List<NotificationDTO> getUserNotificationsByIdAndEmail(Long userId, String userEmail);
    
    /**
     * Obtiene notificaciones por estado
     * @param userId ID del usuario
     * @param status Estado de las notificaciones
     * @return Lista de notificaciones filtradas por estado
     */
    List<NotificationDTO> getNotificationsByStatus(Long userId, NotificationStatus status);
    
    /**
     * Cuenta las notificaciones no leídas de un usuario
     * @param userId ID del usuario
     * @return Número de notificaciones no leídas
     */
    long getUnreadNotificationCount(Long userId);
    
    /**
     * Verifica si una notificación existe
     * @param notificationId ID de la notificación
     * @return true si la notificación existe
     */
    boolean notificationExists(Long notificationId);
    
    /**
     * Verifica si el usuario es propietario de la notificación
     * @param notificationId ID de la notificación
     * @param userId ID del usuario
     * @return true si el usuario es propietario
     */
    boolean isUserOwnerOfNotification(Long notificationId, Long userId);
}