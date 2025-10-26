package com.personalfit.services.notifications.interfaces;

import com.personalfit.dto.Notification.RegisterDeviceTokenRequest;

/**
 * Interface para la gestión de tokens de dispositivos
 * Responsable de manejar los tokens FCM para notificaciones push
 */
public interface IDeviceTokenService {
    
    /**
     * Registra un nuevo token de dispositivo
     * @param request Datos del token a registrar
     * @return true si se registró correctamente
     */
    boolean registerDeviceToken(RegisterDeviceTokenRequest request);
    
    /**
     * Registra un token de dispositivo con parámetros separados
     * @param userId ID del usuario
     * @param token Token FCM del dispositivo
     * @param deviceInfo Información del dispositivo
     * @return true si se registró correctamente
     */
    boolean registerDeviceToken(Long userId, String token, String deviceInfo);
    
    /**
     * Elimina un token de dispositivo por token
     * @param token Token a eliminar
     * @return true si se eliminó correctamente
     */
    boolean unregisterDeviceToken(String token);
    
    /**
     * Elimina un token de dispositivo por usuario y token
     * @param userId ID del usuario
     * @param token Token a eliminar
     * @return true si se eliminó correctamente
     */
    boolean unregisterDeviceToken(Long userId, String token);
    
    /**
     * Desactiva todos los tokens de un usuario (desuscripción)
     * @param userId ID del usuario
     * @return true si se desactivaron correctamente
     */
    boolean deactivateAllUserTokens(Long userId);
    
    /**
     * Desactiva un token específico al hacer logout
     * @param userEmail Email del usuario
     * @param deviceToken Token del dispositivo
     * @return true si se desactivó correctamente
     */
    boolean deactivateTokenOnLogout(String userEmail, String deviceToken);
    
    /**
     * Obtiene la cantidad de tokens activos para un usuario
     * @param userId ID del usuario
     * @return Número de tokens activos
     */
    long getActiveTokenCount(Long userId);
    
    /**
     * Verifica si un usuario tiene tokens activos (está suscrito)
     * @param userId ID del usuario
     * @return true si tiene tokens activos
     */
    boolean hasActiveTokens(Long userId);
    
    /**
     * Limpia tokens inválidos o antiguos
     */
    void cleanupInvalidTokens();
}