package com.personalfit.services.notifications.interfaces;

import com.personalfit.enums.NotificationStatus;
import com.personalfit.models.Notification;

import java.util.List;

/**
 * Interface para operaciones de comando (escritura) de notificaciones
 * Siguiendo el patrón Command y principios CQRS
 */
public interface INotificationCommandService {
    
    /**
     * Crea una nueva notificación
     * @param notification La notificación a crear
     * @return La notificación creada
     */
    Notification createNotification(Notification notification);
    
    /**
     * Actualiza el estado de una notificación
     * @param notificationId ID de la notificación
     * @param status Nuevo estado
     * @return true si se actualizó correctamente
     */
    boolean updateNotificationStatus(Long notificationId, NotificationStatus status);
    
    /**
     * Elimina una notificación
     * @param notificationId ID de la notificación a eliminar
     * @return true si se eliminó correctamente
     */
    boolean deleteNotification(Long notificationId);
    
    /**
     * Marca todas las notificaciones de un usuario como leídas
     * @param userId ID del usuario
     */
    void markAllAsReadByUserId(Long userId);
    
    /**
     * Crea notificaciones en lote para múltiples usuarios
     * @param notifications Lista de notificaciones a crear
     * @return Lista de notificaciones creadas
     */
    List<Notification> createBulkNotifications(List<Notification> notifications);
}