package com.personalfit.controllers;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.models.User;
import com.personalfit.repository.UserRepository;
import com.personalfit.services.NotificationService;

import lombok.extern.slf4j.Slf4j;

/**
 * Controller de Notificaciones implementado según el documento FCM
 * 
 * Endpoints principales:
 * - POST /api/notifications/token - Registro de tokens FCM (sección 1.3 del
 * documento)
 * - GET /api/notifications/user/{id} - Obtener historial de notificaciones
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    /**
     * DTO para el registro de token FCM según la sección 1.3 del documento
     */
    public static class FCMTokenRequest {
        public String token;
        public String deviceInfo;

        // Constructors
        public FCMTokenRequest() {
        }

        public FCMTokenRequest(String token, String deviceInfo) {
            this.token = token;
            this.deviceInfo = deviceInfo;
        }
    }

    // ===============================
    // ENDPOINT PRINCIPAL: REGISTRO DE TOKEN FCM (Sección 1.3 del documento)
    // ===============================

    /**
     * Registra un token FCM para un usuario autenticado
     * Implementa la sección 1.3 del documento: "Envío al Backend"
     * 
     * Endpoint seguro que requiere autenticación (@PreAuthorize)
     * El token debe estar asociado al User autenticado
     */
    @PostMapping("/token")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<String> registerFCMToken(@RequestBody FCMTokenRequest request,
            Authentication authentication) {
        try {
            if (request.token == null || request.token.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("FCM Token is required");
            }

            // Obtener usuario autenticado
            String userEmail = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(userEmail);

            if (userOpt.isEmpty()) {
                log.warn("User not found with email: {}", userEmail);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }

            User user = userOpt.get();

            // Registrar token FCM usando el NotificationService
            boolean success = notificationService.registerFCMToken(
                    user.getId(),
                    request.token,
                    request.deviceInfo);

            if (success) {
                log.info("✅ FCM token registered successfully for user: {}", user.getId());
                return ResponseEntity.ok("FCM token registered successfully");
            } else {
                log.error("❌ Failed to register FCM token for user: {}", user.getId());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to register FCM token");
            }

        } catch (Exception e) {
            log.error("Error registering FCM token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error");
        }
    }

    /**
     * Verifica si el usuario tiene tokens FCM activos
     * Endpoint para que el frontend sepa si mostrar el estado "Activo"
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getNotificationStatus(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(userEmail);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            boolean hasTokens = notificationService.hasActiveTokens(userOpt.get().getId());
            return ResponseEntity.ok(Map.of("hasDeviceTokens", hasTokens));

        } catch (Exception e) {
            log.error("Error checking notification status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Desuscribe un dispositivo específico (elimina su token)
     */
    @DeleteMapping("/token")
    public ResponseEntity<String> unsubscribe(@RequestBody(required = false) FCMTokenRequest request,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(userEmail);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }

            // Si no se envía token, no podemos desuscribir un dispositivo específico
            // En el futuro podríamos soportar "desuscribir todos" si request es null
            if (request == null || request.token == null || request.token.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Token is required to unsubscribe");
            }

            boolean success = notificationService.unsubscribe(userOpt.get().getId(), request.token);

            if (success) {
                log.info("✅ FCM token unsubscribed successfully for user: {}", userOpt.get().getId());
                return ResponseEntity.ok("Unsubscribed successfully");
            } else {
                // Si no se encontró el token, igual retornamos OK para ser idempotentes
                // pero logueamos warning
                log.warn("⚠️ Token not found or mismatch during unsubscribe for user: {}", userOpt.get().getId());
                return ResponseEntity.ok("Unsubscribed successfully (token not found)");
            }

        } catch (Exception e) {
            log.error("Error unsubscribing token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error");
        }
    }

    // ===============================
    // ENDPOINTS DE HISTORIAL DE NOTIFICACIONES
    // ===============================

    /**
     * Obtiene las notificaciones de un usuario específico
     * Los usuarios solo pueden ver sus propias notificaciones
     * Los administradores pueden ver las de cualquier usuario
     */
    @GetMapping("/user/{id}")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable Long id,
            Authentication authentication) {
        try {
            // Verificar si es ADMIN
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));

            if (isAdmin) {
                // Para ADMIN, obtener todas las notificaciones del usuario especificado
                List<NotificationDTO> notifications = notificationService.getAllByUserId(id);
                return ResponseEntity.ok(notifications);
            } else {
                // Para CLIENT/TRAINER, verificar que solo pueda acceder a sus propias
                // notificaciones
                String userEmail = authentication.getName();
                Optional<User> userOpt = userRepository.findByEmail(userEmail);

                if (userOpt.isEmpty() || !userOpt.get().getId().equals(id)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(List.of());
                }

                List<NotificationDTO> notifications = notificationService.getAllByUserId(id);
                return ResponseEntity.ok(notifications);
            }
        } catch (Exception e) {
            log.error("Error fetching notifications for user {}: {}", id, e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Obtiene las notificaciones del usuario autenticado actual
     * Endpoint de conveniencia para el frontend
     */
    @GetMapping("/my-notifications")
    public ResponseEntity<List<NotificationDTO>> getMyNotifications(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(userEmail);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
            }

            List<NotificationDTO> notifications = notificationService.getAllByUserId(userOpt.get().getId());
            return ResponseEntity.ok(notifications);

        } catch (Exception e) {
            log.error("Error fetching my notifications: {}", e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    // ===============================
    // ENDPOINT PARA NOTIFICACIONES MASIVAS
    // ===============================

    /**
     * Envía notificaciones masivas a múltiples usuarios
     * Solo accesible para administradores
     */
    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> sendBulkNotification(
            @RequestBody com.personalfit.dto.Notification.BulkNotificationRequest request,
            Authentication authentication) {
        try {
            log.info("Received bulk notification request from user: {}", authentication.getName());
            log.info("Request: title='{}', body='{}', userIds={}",
                    request.getTitle(), request.getBody(), request.getUserIds());

            if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
                log.warn("Bulk notification failed: Title is required");
                return ResponseEntity.badRequest().body("Title is required");
            }

            if (request.getBody() == null || request.getBody().trim().isEmpty()) {
                log.warn("Bulk notification failed: Body is required");
                return ResponseEntity.badRequest().body("Body is required");
            }

            // Si no se especifican userIds, obtener todos los usuarios activos
            List<User> targetUsers;
            if (request.getUserIds() == null || request.getUserIds().isEmpty()) {
                targetUsers = userRepository.findAll().stream()
                        .filter(user -> user.getStatus() != null &&
                                !"INACTIVE".equals(user.getStatus().toString()))
                        .toList();
                log.info("Sending bulk notification to all active users: {} users", targetUsers.size());
            } else {
                targetUsers = userRepository.findAllById(request.getUserIds());
                log.info("Sending bulk notification to specified users: {} users", targetUsers.size());
            }

            if (targetUsers.isEmpty()) {
                return ResponseEntity.badRequest().body("No target users found");
            }

            // Enviar notificación a cada usuario
            int successCount = 0;
            for (User user : targetUsers) {
                boolean success = notificationService.sendNotification(
                        user.getId(),
                        request.getTitle(),
                        request.getBody(),
                        request.getData() // Usar datos adicionales si existen
                );
                if (success) {
                    successCount++;
                }
            }

            String responseMessage = String.format(
                    "Bulk notification sent: %d/%d successful",
                    successCount,
                    targetUsers.size());

            log.info(responseMessage);
            return ResponseEntity.ok(responseMessage);

        } catch (Exception e) {
            log.error("Error sending bulk notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error sending bulk notification: " + e.getMessage());
        }
    }

    // ===============================
    // ENDPOINT DE SALUD/DIAGNÓSTICO
    // ===============================

    /**
     * Endpoint de diagnóstico para verificar el estado del servicio de
     * notificaciones
     * Solo accesible para administradores
     */
    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> healthCheck() {
        try {
            // Verificar si Firebase está configurado
            if (!notificationService.isFirebaseConfigured()) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("Firebase is not configured - FCM notifications disabled");
            }

            return ResponseEntity.ok("Notification service is healthy - FCM ready");

        } catch (Exception e) {
            log.error("Error in notification service health check", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Notification service error: " + e.getMessage());
        }
    }
}