package com.personalfit.services.notifications.interfaces;

import com.personalfit.dto.Notification.NotificationPreferencesDTO;
import com.personalfit.models.NotificationPreferences;

/**
 * Interface para la gestión de preferencias de notificaciones
 * Responsable de manejar las preferencias de usuario para diferentes tipos de notificaciones
 */
public interface INotificationPreferencesService {
    
    /**
     * Obtiene las preferencias de notificación de un usuario como DTO
     * @param userId ID del usuario
     * @return Preferencias del usuario como DTO
     */
    NotificationPreferencesDTO getUserPreferencesAsDTO(Long userId);
    
    /**
     * Obtiene las preferencias de notificación de un usuario como entidad
     * @param userId ID del usuario
     * @return Preferencias del usuario como entidad
     */
    NotificationPreferences getUserPreferences(Long userId);
    
    /**
     * Actualiza las preferencias de notificación de un usuario
     * @param userId ID del usuario
     * @param preferencesDTO Nuevas preferencias
     * @return true si se actualizó correctamente
     */
    boolean updateUserPreferences(Long userId, NotificationPreferencesDTO preferencesDTO);
    
    /**
     * Crea preferencias por defecto para un usuario si no existen
     * @param userId ID del usuario
     */
    void createDefaultPreferencesIfNotExists(Long userId);
    
    /**
     * Verifica si un usuario tiene habilitado un tipo específico de notificación
     * @param userId ID del usuario
     * @param notificationType Tipo de notificación a verificar
     * @return true si está habilitado
     */
    boolean isNotificationTypeEnabledForUser(Long userId, String notificationType);
    
    /**
     * Crea un DTO con preferencias por defecto
     * @return DTO con valores por defecto
     */
    NotificationPreferencesDTO createDefaultPreferencesDTO();
}