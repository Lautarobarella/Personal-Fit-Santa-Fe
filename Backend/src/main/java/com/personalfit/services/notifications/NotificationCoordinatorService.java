package com.personalfit.services.notifications;

import com.personalfit.dto.Notification.BulkNotificationRequest;
import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.dto.Notification.NotificationPreferencesDTO;
import com.personalfit.dto.Notification.RegisterDeviceTokenRequest;
import com.personalfit.dto.Notification.SendNotificationRequest;
import com.personalfit.enums.NotificationStatus;
import com.personalfit.models.Notification;
import com.personalfit.models.User;
import com.personalfit.repository.UserRepository;
import com.personalfit.services.notifications.factory.NotificationFactory;
import com.personalfit.services.notifications.interfaces.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio coordinador principal de notificaciones
 * Orquesta todos los servicios especializados siguiendo el patrón Facade
 * Esta es la única clase que deberían usar los controladores y otros servicios
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationCoordinatorService {

    // Servicios especializados
    private final INotificationCommandService commandService;
    private final INotificationQueryService queryService;
    private final IPushNotificationService pushService;
    private final INotificationPreferencesService preferencesService;
    private final IDeviceTokenService deviceTokenService;
    private final NotificationFactory notificationFactory;
    
    // Repositorio necesario para algunas operaciones
    private final UserRepository userRepository;

    // ===============================
    // OPERACIONES BÁSICAS DE NOTIFICACIONES
    // ===============================

    /**
     * Obtiene las notificaciones de un usuario
     */
    public List<NotificationDTO> getUserNotifications(Long userId) {
        return queryService.getUserNotifications(userId);
    }

    /**
     * Obtiene las notificaciones de un usuario verificando permisos
     */
    public List<NotificationDTO> getUserNotificationsByIdAndEmail(Long userId, String userEmail) {
        return queryService.getUserNotificationsByIdAndEmail(userId, userEmail);
    }

    /**
     * Marca una notificación como leída
     */
    public boolean markNotificationAsRead(Long notificationId) {
        return commandService.updateNotificationStatus(notificationId, NotificationStatus.READ);
    }

    /**
     * Marca una notificación como no leída
     */
    public boolean markNotificationAsUnread(Long notificationId) {
        return commandService.updateNotificationStatus(notificationId, NotificationStatus.UNREAD);
    }

    /**
     * Archiva una notificación
     */
    public boolean archiveNotification(Long notificationId) {
        return commandService.updateNotificationStatus(notificationId, NotificationStatus.ARCHIVED);
    }

    /**
     * Elimina una notificación
     */
    public boolean deleteNotification(Long notificationId) {
        return commandService.deleteNotification(notificationId);
    }

    /**
     * Marca todas las notificaciones como leídas
     */
    public void markAllAsReadByUserId(Long userId) {
        commandService.markAllAsReadByUserId(userId);
    }

    // ===============================
    // CREACIÓN Y ENVÍO DE NOTIFICACIONES
    // ===============================

    /**
     * Crea y envía una notificación completa (historial + push)
     * Este es el método principal para enviar notificaciones
     */
    @Transactional
    public boolean createAndSendNotification(SendNotificationRequest request) {
        try {
            log.debug("Creating and sending notification - User: {}, Title: '{}'", 
                     request.getUserId(), request.getTitle());

            // 1. Crear la notificación en BD para historial (SIEMPRE)
            Notification notification = createNotificationFromRequest(request);
            if (notification == null) {
                log.error("Failed to create notification in database");
                return false;
            }

            log.debug("Notification saved to database - ID: {}, User: {}", 
                     notification.getId(), request.getUserId());

            // 2. Intentar envío push (OPCIONAL - depende de suscripción)
            boolean pushSent = pushService.sendPushNotificationToUser(request);
            
            if (pushSent) {
                log.debug("Push notification sent successfully - User: {}", request.getUserId());
            } else {
                log.debug("No push sent (user not subscribed or preferences disabled) - User: {}", 
                         request.getUserId());
            }

            // Retornamos true porque la notificación se guardó exitosamente
            // El push es opcional
            return true;

        } catch (Exception e) {
            log.error("Error in createAndSendNotification for user {}: {}", 
                     request.getUserId(), e.getMessage(), e);
            return false;
        }
    }

    /**
     * Crea y envía notificaciones masivas
     */
    @Transactional
    public boolean createAndSendBulkNotifications(BulkNotificationRequest request) {
        try {
            log.debug("Creating and sending bulk notifications - Title: '{}'", request.getTitle());

            // 1. Crear las notificaciones en BD
            List<Notification> notifications = createBulkNotificationsFromRequest(request);
            if (notifications.isEmpty()) {
                log.warn("No notifications were created in database");
                return false;
            }

            // 2. Intentar envío push masivo
            boolean pushSent = pushService.sendBulkPushNotification(request);
            
            if (pushSent) {
                log.info("Bulk notifications created and push sent successfully - {} notifications created", 
                        notifications.size());
            } else {
                log.warn("Bulk notifications created but push failed - {} notifications created", 
                        notifications.size());
            }

            return true;

        } catch (Exception e) {
            log.error("Error in createAndSendBulkNotifications: {}", e.getMessage(), e);
            return false;
        }
    }

    // ===============================
    // NOTIFICACIONES ESPECIALIZADAS
    // ===============================

    /**
     * Crea notificaciones de pago vencido
     */
    @Transactional
    public void createPaymentExpiredNotifications(List<User> users) {
        // Filtrar solo usuarios suscritos
        List<User> subscribedUsers = users.stream()
                .filter(user -> deviceTokenService.hasActiveTokens(user.getId()))
                .collect(Collectors.toList());

        if (subscribedUsers.isEmpty()) {
            log.info("No subscribed users found for payment expired notifications");
            return;
        }

        List<Notification> notifications = notificationFactory.createPaymentExpiredNotifications(subscribedUsers);
        commandService.createBulkNotifications(notifications);
        
        log.info("Created payment expired notifications for {} subscribed users", subscribedUsers.size());
    }

    /**
     * Crea notificaciones de cumpleaños para administradores
     */
    @Transactional
    public void createBirthdayNotifications(List<User> birthdayUsers, List<User> admins) {
        List<Notification> notifications = notificationFactory.createBirthdayNotifications(birthdayUsers, admins);
        commandService.createBulkNotifications(notifications);
        
        log.info("Created birthday notifications for {} users to {} administrators", 
                birthdayUsers.size(), admins.size());
    }

    /**
     * Crea notificaciones de advertencia por inasistencia
     */
    @Transactional
    public void createAttendanceWarningNotifications(List<User> absentUsers, List<User> admins) {
        List<Notification> notifications = notificationFactory.createAttendanceWarningNotifications(absentUsers, admins);
        commandService.createBulkNotifications(notifications);
        
        log.info("Created attendance warning notifications for {} users to {} administrators", 
                absentUsers.size(), admins.size());
    }

    // ===============================
    // GESTIÓN DE DISPOSITIVOS Y PREFERENCIAS
    // ===============================

    /**
     * Registra un token de dispositivo
     */
    public boolean registerDeviceToken(RegisterDeviceTokenRequest request) {
        boolean registered = deviceTokenService.registerDeviceToken(request);
        if (registered) {
            // Crear preferencias por defecto si no existen
            preferencesService.createDefaultPreferencesIfNotExists(request.getUserId());
        }
        return registered;
    }

    /**
     * Registra un token de dispositivo (versión simplificada)
     */
    public boolean registerDeviceToken(Long userId, String token, String deviceInfo) {
        return deviceTokenService.registerDeviceToken(userId, token, deviceInfo);
    }

    /**
     * Elimina un token de dispositivo
     */
    public boolean unregisterDeviceToken(Long userId, String token) {
        return deviceTokenService.unregisterDeviceToken(userId, token);
    }

    /**
     * Desuscribe a un usuario de notificaciones push
     */
    public boolean unsubscribeFromPushNotifications(Long userId) {
        return deviceTokenService.deactivateAllUserTokens(userId);
    }

    /**
     * Obtiene las preferencias de notificación de un usuario
     */
    public NotificationPreferencesDTO getUserPreferences(Long userId) {
        return preferencesService.getUserPreferencesAsDTO(userId);
    }

    /**
     * Actualiza las preferencias de notificación de un usuario
     */
    public boolean updateNotificationPreferences(Long userId, NotificationPreferencesDTO preferences) {
        return preferencesService.updateUserPreferences(userId, preferences);
    }

    /**
     * Verifica si un usuario está suscrito a notificaciones
     */
    public boolean isUserSubscribedToNotifications(Long userId) {
        return deviceTokenService.hasActiveTokens(userId);
    }

    /**
     * Obtiene la cantidad de tokens activos de un usuario
     */
    public long getActiveTokenCount(Long userId) {
        return deviceTokenService.getActiveTokenCount(userId);
    }

    /**
     * Obtiene información del estado de suscripción
     */
    public Map<String, Object> getSubscriptionStatus(Long userId) {
        boolean isSubscribed = isUserSubscribedToNotifications(userId);
        long activeTokens = getActiveTokenCount(userId);
        
        return Map.of(
            "isSubscribed", isSubscribed,
            "activeTokensCount", activeTokens,
            "canSubscribe", !isSubscribed,
            "canUnsubscribe", isSubscribed
        );
    }

    /**
     * Limpia tokens inválidos
     */
    public void cleanupInvalidTokens() {
        deviceTokenService.cleanupInvalidTokens();
    }

    // ===============================
    // MÉTODOS PRIVADOS DE APOYO
    // ===============================

    /**
     * Crea una notificación desde un SendNotificationRequest
     */
    private Notification createNotificationFromRequest(SendNotificationRequest request) {
        try {
            if (request.getUserId() == null) {
                log.warn("Cannot create notification: userId is null");
                return null;
            }

            Notification notification = Notification.builder()
                    .title(request.getTitle())
                    .message(request.getBody())
                    .date(LocalDateTime.now())
                    .status(NotificationStatus.UNREAD)
                    .build();

            // Obtener el usuario y establecer la relación
            // Nota: Este código asume que el User se establecerá en el commandService
            // basado en el userId del request si es necesario

            return commandService.createNotification(notification);
            
        } catch (Exception e) {
            log.error("Error creating notification from request: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Crea múltiples notificaciones desde un BulkNotificationRequest
     */
    private List<Notification> createBulkNotificationsFromRequest(BulkNotificationRequest request) {
        // Implementación pendiente: necesita determinar usuarios objetivo y crear notificaciones
        // Por ahora retorna lista vacía
        log.warn("createBulkNotificationsFromRequest not fully implemented yet");
        return List.of();
    }

    /**
     * Desactiva el token de dispositivo cuando el usuario hace logout
     */
    public void deactivateDeviceTokenOnLogout(String userEmail, String deviceToken) {
        try {
            // Buscar usuario por email y desactivar el token
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + userEmail));
                    
            deviceTokenService.unregisterDeviceToken(deviceToken);
            log.info("Token desactivado exitosamente para usuario: {}", userEmail);
        } catch (Exception e) {
            log.error("Error al desactivar token de dispositivo para usuario {}: {}", userEmail, e.getMessage());
            // No relanzar la excepción para no interrumpir el logout
        }
    }

    /**
     * Envía recordatorios de clase en masa
     */
    public void sendBulkClassReminder(List<User> enrolledUsers, String activityName, 
                                    LocalDateTime activityDate, String location) {
        try {
            for (User user : enrolledUsers) {
                SendNotificationRequest request = SendNotificationRequest.builder()
                        .userId(user.getId())
                        .title("🏃‍♀️ Recordatorio de Clase")
                        .body(String.format("Tu clase de %s está programada para hoy en %s", activityName, location))
                        .type("class_reminder")
                        .saveToDatabase(true)
                        .build();
                        
                createAndSendNotification(request);
            }
            log.info("Bulk class reminder sent for activity: {} to {} users", activityName, enrolledUsers.size());
        } catch (Exception e) {
            log.error("Error enviando recordatorios masivos de clase {}: {}", activityName, e.getMessage());
        }
    }

    /**
     * Crea notificaciones de pago vencido
     */
    public void createPaymentExpiredNotification(List<User> usersWithExpiredPayments, List<User> admins) {
        try {
            // Notificar a usuarios con pagos vencidos
            for (User user : usersWithExpiredPayments) {
                SendNotificationRequest request = SendNotificationRequest.builder()
                        .userId(user.getId())
                        .title("⚠️ Pago Vencido")
                        .body("Tu pago mensual ha vencido. Por favor, regulariza tu situación lo antes posible.")
                        .type("payment_expired")
                        .saveToDatabase(true)
                        .build();
                        
                createAndSendNotification(request);
            }
            
            // Notificar a administradores si hay alguno
            for (User admin : admins) {
                SendNotificationRequest request = SendNotificationRequest.builder()
                        .userId(admin.getId())
                        .title("📊 Pagos Vencidos")
                        .body(String.format("%d usuarios tienen pagos vencidos", usersWithExpiredPayments.size()))
                        .type("admin_payment_expired")
                        .saveToDatabase(true)
                        .build();
                        
                createAndSendNotification(request);
            }
            
            log.info("Payment expired notifications sent to {} users and {} admins", 
                    usersWithExpiredPayments.size(), admins.size());
        } catch (Exception e) {
            log.error("Error enviando notificaciones de pago vencido: {}", e.getMessage());
        }
    }

    /**
     * Envía recordatorio de pago próximo a vencer
     */
    public void sendPaymentDueReminder(User user, Double amount, LocalDateTime expiresAt) {
        try {
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .userId(user.getId())
                    .title("💳 Recordatorio de Pago")
                    .body(String.format("Tu pago de $%.2f vence pronto. No olvides renovar tu suscripción.", amount))
                    .type("payment_due_reminder")
                    .saveToDatabase(true)
                    .build();
                    
            createAndSendNotification(request);
            log.info("Payment due reminder sent to user: {} for amount: $%.2f", user.getEmail(), amount);
        } catch (Exception e) {
            log.error("Error enviando recordatorio de pago a usuario {}: {}", user.getEmail(), e.getMessage());
        }
    }

    /**
     * Crea notificaciones de cumpleaños
     */
    public void createBirthdayNotification(List<User> users, List<User> admins) {
        try {
            // Notificar a cada usuario que cumple años
            for (User user : users) {
                SendNotificationRequest request = SendNotificationRequest.builder()
                        .userId(user.getId())
                        .title("🎉 ¡Feliz Cumpleaños!")
                        .body(String.format("¡Feliz cumpleaños %s! Todo el equipo de Personal Fit te desea un día espectacular.", user.getFirstName()))
                        .type("birthday")
                        .saveToDatabase(true)
                        .build();
                        
                createAndSendNotification(request);
            }
            
            // Notificar a administradores sobre cumpleaños
            for (User admin : admins) {
                SendNotificationRequest request = SendNotificationRequest.builder()
                        .userId(admin.getId())
                        .title("🎂 Cumpleaños de Usuarios")
                        .body(String.format("%d usuario(s) cumplen años hoy", users.size()))
                        .type("admin_birthday")
                        .saveToDatabase(true)
                        .build();
                        
                createAndSendNotification(request);
            }
            
            log.info("Birthday notifications sent to {} users and {} admins", users.size(), admins.size());
        } catch (Exception e) {
            log.error("Error enviando notificaciones de cumpleaños: {}", e.getMessage());
        }
    }

    /**
     * Crea notificaciones de advertencia por inasistencia
     */
    public void createAttendanceWarningNotification(List<User> users, List<User> admins) {
        try {
            // Notificar a usuarios con inasistencias
            for (User user : users) {
                SendNotificationRequest request = SendNotificationRequest.builder()
                        .userId(user.getId())
                        .title("⚠️ Te Extrañamos")
                        .body("Hemos notado que no has venido últimamente. ¡Esperamos verte pronto en el gym!")
                        .type("attendance_warning")
                        .saveToDatabase(true)
                        .build();
                        
                createAndSendNotification(request);
            }
            
            // Notificar a administradores sobre inasistencias
            for (User admin : admins) {
                SendNotificationRequest request = SendNotificationRequest.builder()
                        .userId(admin.getId())
                        .title("📊 Alerta de Inasistencias")
                        .body(String.format("%d usuario(s) tienen inasistencias prolongadas", users.size()))
                        .type("admin_attendance_warning")
                        .saveToDatabase(true)
                        .build();
                        
                createAndSendNotification(request);
            }
            
            log.info("Attendance warning notifications sent to {} users and {} admins", users.size(), admins.size());
        } catch (Exception e) {
            log.error("Error enviando notificaciones de advertencia de asistencia: {}", e.getMessage());
        }
    }
}