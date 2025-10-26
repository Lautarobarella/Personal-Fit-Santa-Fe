package com.personalfit.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.dto.Notification.BulkNotificationRequest;
import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.dto.Notification.NotificationPreferencesDTO;
import com.personalfit.dto.Notification.RegisterDeviceTokenRequest;
import com.personalfit.dto.Notification.SendNotificationRequest;
import com.personalfit.models.User;
import com.personalfit.repository.UserRepository;
import com.personalfit.services.notifications.NotificationCoordinatorService;

import lombok.extern.slf4j.Slf4j;

/**
 * Controlador de notificaciones con nueva arquitectura profesional
 * Usa el NotificationCoordinatorService que orquesta servicios especializados
 * Código limpio, mantenible y siguiendo principios SOLID
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationCoordinatorService notificationCoordinator;

    @Autowired
    private UserRepository userRepository;

    // ===============================
    // OPERACIONES BÁSICAS DE NOTIFICACIONES
    // ===============================

    /**
     * Obtiene las notificaciones de un usuario específico
     */
    @GetMapping("/user/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(
            @PathVariable Long id, 
            Authentication authentication) {
        try {
            // Verificar permisos
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            List<NotificationDTO> notifications;
            if (isAdmin) {
                // Para ADMIN, obtener todas las notificaciones del usuario especificado
                notifications = notificationCoordinator.getUserNotifications(id);
            } else {
                // Para CLIENT, verificar que solo pueda acceder a sus propias notificaciones
                String userEmail = authentication.getName();
                notifications = notificationCoordinator.getUserNotificationsByIdAndEmail(id, userEmail);
            }
            
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error fetching notifications for user {}: {}", id, e.getMessage(), e);
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Marca una notificación como leída
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<String> markAsRead(@PathVariable Long id) {
        try {
            boolean updated = notificationCoordinator.markNotificationAsRead(id);
            if (updated) {
                return ResponseEntity.ok("Notification marked as read");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error marking notification {} as read: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error updating notification");
        }
    }

    /**
     * Marca una notificación como no leída
     */
    @PutMapping("/{id}/unread")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<String> markAsUnread(@PathVariable Long id) {
        try {
            boolean updated = notificationCoordinator.markNotificationAsUnread(id);
            if (updated) {
                return ResponseEntity.ok("Notification marked as unread");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error marking notification {} as unread: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error updating notification");
        }
    }

    /**
     * Archiva una notificación
     */
    @PutMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<String> archiveNotification(@PathVariable Long id) {
        try {
            boolean updated = notificationCoordinator.archiveNotification(id);
            if (updated) {
                return ResponseEntity.ok("Notification archived");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error archiving notification {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error updating notification");
        }
    }

    /**
     * Elimina una notificación
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<String> deleteNotification(@PathVariable Long id) {
        try {
            boolean deleted = notificationCoordinator.deleteNotification(id);
            if (deleted) {
                return ResponseEntity.ok("Notification deleted");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting notification {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error deleting notification");
        }
    }

    /**
     * Marca todas las notificaciones como leídas para un usuario
     */
    @PutMapping("/user/{userId}/mark-all-read")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<String> markAllAsRead(@PathVariable Long userId, Authentication authentication) {
        try {
            // Verificar permisos
            if (!hasPermissionForUser(userId, authentication)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }
            
            notificationCoordinator.markAllAsReadByUserId(userId);
            return ResponseEntity.ok("All notifications marked as read");
        } catch (Exception e) {
            log.error("Error marking all notifications as read for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error updating notifications");
        }
    }

    // ===============================
    // GESTIÓN DE DISPOSITIVOS Y TOKENS
    // ===============================

    /**
     * Registra un token de dispositivo para notificaciones push
     */
    @PostMapping("/pwa/register-device")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<String> registerDevice(
            @RequestBody RegisterDeviceTokenRequest request, 
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> user = userRepository.findByEmail(userEmail);
            
            if (user.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            // Establecer el userId en el request
            request.setUserId(user.get().getId());
            
            boolean registered = notificationCoordinator.registerDeviceToken(request);
            
            if (registered) {
                return ResponseEntity.ok("Device registered successfully");
            } else {
                return ResponseEntity.badRequest().body("Failed to register device");
            }
        } catch (Exception e) {
            log.error("Error registering device for user {}: {}", authentication.getName(), e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error registering device");
        }
    }

    /**
     * Elimina un token de dispositivo
     */
    @DeleteMapping("/pwa/unregister-device/{token}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<String> unregisterDevice(@PathVariable String token, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> user = userRepository.findByEmail(userEmail);
            
            if (user.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            boolean unregistered = notificationCoordinator.unregisterDeviceToken(user.get().getId(), token);
            
            if (unregistered) {
                return ResponseEntity.ok("Device unregistered successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error unregistering device for user {}: {}", authentication.getName(), e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error unregistering device");
        }
    }

    // ===============================
    // GESTIÓN DE PREFERENCIAS
    // ===============================

    /**
     * Obtiene las preferencias de notificación del usuario
     */
    @GetMapping("/pwa/preferences")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<NotificationPreferencesDTO> getNotificationPreferences(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> user = userRepository.findByEmail(userEmail);
            
            if (user.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            NotificationPreferencesDTO preferences = notificationCoordinator.getUserPreferences(user.get().getId());
            return ResponseEntity.ok(preferences);
            
        } catch (Exception e) {
            log.error("Error getting notification preferences for user {}: {}", 
                     authentication.getName(), e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Actualiza las preferencias de notificación del usuario
     */
    @PutMapping("/pwa/preferences")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<String> updateNotificationPreferences(
            @RequestBody NotificationPreferencesDTO preferencesDTO, 
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> user = userRepository.findByEmail(userEmail);
            
            if (user.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            boolean updated = notificationCoordinator.updateNotificationPreferences(
                user.get().getId(), preferencesDTO);
            
            if (updated) {
                return ResponseEntity.ok("Preferences updated successfully");
            } else {
                return ResponseEntity.badRequest().body("Failed to update preferences");
            }
        } catch (Exception e) {
            log.error("Error updating notification preferences for user {}: {}", 
                     authentication.getName(), e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error updating preferences");
        }
    }

    // ===============================
    // ENVÍO DE NOTIFICACIONES (SOLO ADMIN)
    // ===============================

    /**
     * Envía una notificación push a un usuario específico (solo ADMIN)
     */
    @PostMapping("/pwa/send")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> sendPushNotification(@RequestBody SendNotificationRequest request) {
        try {
            boolean sent = notificationCoordinator.createAndSendNotification(request);
            
            if (sent) {
                return ResponseEntity.ok("Notification sent successfully");
            } else {
                return ResponseEntity.badRequest().body("Failed to send notification");
            }
        } catch (Exception e) {
            log.error("Error sending push notification: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error sending notification");
        }
    }

    /**
     * Envía notificaciones push a múltiples usuarios (solo ADMIN)
     */
    @PostMapping("/pwa/send-bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> sendBulkPushNotifications(@RequestBody BulkNotificationRequest request) {
        try {
            log.info("Bulk notification request received - Title: '{}', Type: '{}'", 
                    request.getTitle(), request.getType());
            
            boolean sent = notificationCoordinator.createAndSendBulkNotifications(request);
            
            if (sent) {
                log.info("Bulk notifications sent successfully");
                return ResponseEntity.ok("Bulk notifications sent successfully");
            } else {
                log.warn("Failed to send bulk notifications");
                return ResponseEntity.badRequest().body("Failed to send bulk notifications");
            }
        } catch (Exception e) {
            log.error("Error sending bulk push notifications: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error sending bulk notifications");
        }
    }

    // ===============================
    // ESTADO Y SUSCRIPCIONES
    // ===============================

    /**
     * Verifica si el usuario tiene las notificaciones push habilitadas
     */
    @GetMapping("/pwa/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<Map<String, Object>> getPushNotificationStatus(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> user = userRepository.findByEmail(userEmail);
            
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body(null);
            }
            
            long activeTokens = notificationCoordinator.getActiveTokenCount(user.get().getId());
            
            Map<String, Object> status = new HashMap<>();
            status.put("hasDeviceTokens", activeTokens > 0);
            status.put("activeTokensCount", activeTokens);
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Error getting push notification status for user {}: {}", 
                     authentication.getName(), e.getMessage(), e);
            return ResponseEntity.internalServerError().body(null);
        }
    }

    /**
     * Obtiene el estado de suscripción a notificaciones push del usuario
     */
    @GetMapping("/subscription-status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<Map<String, Object>> getSubscriptionStatus(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> user = userRepository.findByEmail(userEmail);
            
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Map<String, Object> status = notificationCoordinator.getSubscriptionStatus(user.get().getId());
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            log.error("Error getting subscription status for user {}: {}", 
                     authentication.getName(), e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Internal server error"));
        }
    }

    /**
     * Desuscribe al usuario de notificaciones push (desactiva todos sus tokens)
     */
    @PostMapping("/unsubscribe")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<String> unsubscribeFromPushNotifications(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> user = userRepository.findByEmail(userEmail);
            
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }

            boolean success = notificationCoordinator.unsubscribeFromPushNotifications(user.get().getId());
            
            if (success) {
                return ResponseEntity.ok("Successfully unsubscribed from push notifications");
            } else {
                return ResponseEntity.badRequest().body("Failed to unsubscribe from push notifications");
            }
        } catch (Exception e) {
            log.error("Error unsubscribing from push notifications for user {}: {}", 
                     authentication.getName(), e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error unsubscribing from push notifications");
        }
    }

    /**
     * Trigger manual de limpieza de tokens (solo para ADMIN)
     */
    @PostMapping("/cleanup-tokens")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> cleanupInvalidTokens() {
        try {
            notificationCoordinator.cleanupInvalidTokens();
            return ResponseEntity.ok("Token cleanup completed successfully");
        } catch (Exception e) {
            log.error("Error during manual token cleanup: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error during token cleanup");
        }
    }

    // ===============================
    // MÉTODOS DE APOYO PRIVADOS
    // ===============================

    /**
     * Verifica si el usuario autenticado tiene permisos para acceder a los datos del userId especificado
     */
    private boolean hasPermissionForUser(Long userId, Authentication authentication) {
        // Verificar si es ADMIN
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            return true;
        }
        
        // Para CLIENT, verificar que el userId corresponda al usuario autenticado
        String userEmail = authentication.getName();
        Optional<User> user = userRepository.findByEmail(userEmail);
        return user.isPresent() && user.get().getId().equals(userId);
    }
}