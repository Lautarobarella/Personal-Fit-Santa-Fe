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
import com.personalfit.enums.NotificationStatus;
import com.personalfit.models.User;
import com.personalfit.repository.UserRepository;
import com.personalfit.services.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Obtiene las notificaciones de un usuario específico
     */
    @GetMapping("/user/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable Long id, Authentication authentication) {
        try {
            // Verificar si es ADMIN
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (isAdmin) {
                // Para ADMIN, obtener todas las notificaciones del usuario especificado
                List<NotificationDTO> notifications = notificationService.getAllByUserId(id);
                return ResponseEntity.ok(notifications);
            } else {
                // Para CLIENT, verificar que solo pueda acceder a sus propias notificaciones
                String userEmail = authentication.getName();
                List<NotificationDTO> notifications = notificationService.getUserNotificationsByIdAndEmail(id, userEmail);
                return ResponseEntity.ok(notifications);
            }
        } catch (Exception e) {
            System.err.println("Error fetching notifications for user " + id + ": " + e.getMessage());
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
            boolean updated = notificationService.updateNotificationStatus(id, NotificationStatus.READ);
            if (updated) {
                return ResponseEntity.ok("Notification marked as read");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error marking notification as read: " + e.getMessage());
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
            boolean updated = notificationService.updateNotificationStatus(id, NotificationStatus.UNREAD);
            if (updated) {
                return ResponseEntity.ok("Notification marked as unread");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error marking notification as unread: " + e.getMessage());
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
            boolean updated = notificationService.updateNotificationStatus(id, NotificationStatus.ARCHIVED);
            if (updated) {
                return ResponseEntity.ok("Notification archived");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error archiving notification: " + e.getMessage());
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
            boolean deleted = notificationService.deleteNotification(id);
            if (deleted) {
                return ResponseEntity.ok("Notification deleted");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error deleting notification: " + e.getMessage());
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
            // Verificar si es ADMIN
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (!isAdmin) {
                // Para CLIENT, verificar que el userId corresponda al usuario autenticado
                String userEmail = authentication.getName();
                Optional<User> user = userRepository.findByEmail(userEmail);
                if (user.isEmpty() || !user.get().getId().equals(userId)) {
                    return ResponseEntity.status(403).body("Access denied");
                }
            }
            
            notificationService.markAllAsReadByUserId(userId);
            return ResponseEntity.ok("All notifications marked as read");
        } catch (Exception e) {
            System.err.println("Error marking all notifications as read: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error updating notifications");
        }
    }

    // ==================== PWA PUSH NOTIFICATION ENDPOINTS ====================

    /**
     * Registra un token de dispositivo para notificaciones push
     */
    @PostMapping("/pwa/register-device")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    public ResponseEntity<String> registerDevice(@RequestBody RegisterDeviceTokenRequest request, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> user = userRepository.findByEmail(userEmail);
            
            if (user.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            boolean registered = notificationService.registerDeviceToken(
                user.get().getId(), 
                request.getToken(), 
                request.getDeviceInfo()
            );
            
            if (registered) {
                return ResponseEntity.ok("Device registered successfully");
            } else {
                return ResponseEntity.badRequest().body("Failed to register device");
            }
        } catch (Exception e) {
            System.err.println("Error registering device: " + e.getMessage());
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
            
            boolean unregistered = notificationService.unregisterDeviceToken(user.get().getId(), token);
            
            if (unregistered) {
                return ResponseEntity.ok("Device unregistered successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error unregistering device: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error unregistering device");
        }
    }

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
            
            // Usar getUserPreferences que maneja null correctamente y devuelve DTO directamente
            NotificationPreferencesDTO dto = notificationService.getUserPreferences(user.get().getId());
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            System.err.println("Error getting notification preferences: " + e.getMessage());
            e.printStackTrace();
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
            
            boolean updated = notificationService.updateNotificationPreferences(user.get().getId(), preferencesDTO);
            
            if (updated) {
                return ResponseEntity.ok("Preferences updated successfully");
            } else {
                return ResponseEntity.badRequest().body("Failed to update preferences");
            }
        } catch (Exception e) {
            System.err.println("Error updating notification preferences: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error updating preferences");
        }
    }

    /**
     * Envía una notificación push a un usuario específico (solo ADMIN)
     */
    @PostMapping("/pwa/send")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> sendPushNotification(@RequestBody SendNotificationRequest request) {
        try {
            boolean sent = notificationService.createAndSendNotification(request);
            
            if (sent) {
                return ResponseEntity.ok("Notification sent successfully");
            } else {
                return ResponseEntity.badRequest().body("Failed to send notification");
            }
        } catch (Exception e) {
            System.err.println("Error sending push notification: " + e.getMessage());
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
            System.out.println("🔥 Bulk notification request received:");
            System.out.println("  Title: " + request.getTitle());
            System.out.println("  Body: " + request.getBody());
            System.out.println("  Type: " + request.getType());
            System.out.println("  User IDs: " + (request.getUserIds() != null ? request.getUserIds().size() + " users" : "null (all users)"));
            System.out.println("  Save to DB: " + request.getSaveToDatabase());
            
            boolean sent = notificationService.createAndSendBulkNotifications(request);
            
            if (sent) {
                System.out.println("✅ Bulk notifications sent successfully");
                return ResponseEntity.ok("Bulk notifications sent successfully");
            } else {
                System.out.println("❌ Failed to send bulk notifications");
                return ResponseEntity.badRequest().body("Failed to send bulk notifications");
            }
        } catch (Exception e) {
            System.err.println("❌ Error sending bulk push notifications: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error sending bulk notifications");
        }
    }



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
            
            long activeTokens = notificationService.getActiveTokenCount(user.get().getId());
            
            Map<String, Object> status = new HashMap<>();
            status.put("hasDeviceTokens", activeTokens > 0);
            status.put("activeTokensCount", activeTokens);
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            System.err.println("Error getting push notification status: " + e.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
    }

    // ===============================
    // GESTIÓN PROFESIONAL DE SUSCRIPCIONES
    // ===============================

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

            boolean isSubscribed = notificationService.isUserSubscribedToNotifications(user.get().getId());
            long activeTokens = notificationService.getActiveTokenCount(user.get().getId());
            
            Map<String, Object> status = Map.of(
                "isSubscribed", isSubscribed,
                "activeTokensCount", activeTokens,
                "canSubscribe", !isSubscribed,
                "canUnsubscribe", isSubscribed
            );
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            System.err.println("Error getting subscription status: " + e.getMessage());
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

            boolean success = notificationService.unsubscribeFromPushNotifications(user.get().getId());
            
            if (success) {
                return ResponseEntity.ok("Successfully unsubscribed from push notifications");
            } else {
                return ResponseEntity.badRequest().body("Failed to unsubscribe from push notifications");
            }
        } catch (Exception e) {
            System.err.println("Error unsubscribing from push notifications: " + e.getMessage());
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
            notificationService.cleanupInvalidTokens();
            return ResponseEntity.ok("Token cleanup completed successfully");
        } catch (Exception e) {
            System.err.println("Error during manual token cleanup: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error during token cleanup");
        }
    }
}
