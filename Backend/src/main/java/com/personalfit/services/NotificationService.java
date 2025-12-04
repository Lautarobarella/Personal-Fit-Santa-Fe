package com.personalfit.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.SendResponse;
import com.personalfit.config.FirebaseConfig;
import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.enums.NotificationStatus;

import com.personalfit.models.FCMToken;
import com.personalfit.models.Notification;
import com.personalfit.models.User;
import com.personalfit.repository.FCMTokenRepository;
import com.personalfit.repository.NotificationRepository;
import com.personalfit.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Servicio de Notificaciones implementado según el documento de arquitectura
 * FCM
 * 
 * Responsabilidades principales:
 * 1. Gestión CRUD de tokens FCM (2.2 del documento)
 * 2. Envío de notificaciones push usando Firebase Admin SDK (3.2 del documento)
 * 3. Manejo de caducidad de tokens (2.2 del documento)
 * 4. Almacenamiento del historial de notificaciones
 */
@Slf4j
@Service
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FCMTokenRepository fcmTokenRepository;

    @Autowired
    private FirebaseConfig firebaseConfig;

    @Autowired(required = false)
    private FirebaseMessaging firebaseMessaging;

    // ===============================
    // 1. GESTIÓN DE TOKENS FCM (Sección 2 del documento)
    // ===============================

    /**
     * Registra un token FCM para un usuario autenticado
     * Implementa la sección 1.3 del documento: "Envío al Backend"
     * 
     * @param userId     ID del usuario autenticado
     * @param token      Token FCM recibido del frontend
     * @param deviceInfo Información opcional del dispositivo
     * @return true si se registró correctamente
     */
    public boolean registerFCMToken(Long userId, String token, String deviceInfo) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.warn("User not found with ID: {}", userId);
                return false;
            }

            User user = userOpt.get();

            // Verificar si el token ya existe
            Optional<FCMToken> existingToken = fcmTokenRepository.findByToken(token);
            if (existingToken.isPresent()) {
                // Actualizar token existente
                FCMToken fcmToken = existingToken.get();
                fcmToken.setUser(user);
                fcmToken.setDeviceInfo(deviceInfo);
                fcmTokenRepository.save(fcmToken);
                log.info("✅ Updated existing FCM token for user: {} | Token: {}...",
                        user.getId(), token.substring(0, Math.min(20, token.length())));
            } else {
                // Crear nuevo token
                FCMToken newToken = FCMToken.builder()
                        .user(user)
                        .token(token)
                        .deviceInfo(deviceInfo)
                        .build();
                fcmTokenRepository.save(newToken);
                log.info("🆕 Registered new FCM token for user: {} | Token: {}...",
                        user.getId(), token.substring(0, Math.min(20, token.length())));
            }

            // Verificar que el token se guardó correctamente
            long totalTokensForUser = fcmTokenRepository.countByUserId(user.getId());
            log.info("📱 User {} now has {} FCM tokens", user.getId(), totalTokensForUser);

            return true;
        } catch (Exception e) {
            log.error("Error registering FCM token for user: {}", userId, e);
            return false;
        }
    }

    /**
     * Verifica si el usuario tiene tokens activos
     */
    public boolean hasActiveTokens(Long userId) {
        return fcmTokenRepository.countByUserId(userId) > 0;
    }

    /**
     * Desuscribe un token específico
     */
    public boolean unsubscribe(Long userId, String token) {
        try {
            Optional<FCMToken> tokenOpt = fcmTokenRepository.findByToken(token);
            if (tokenOpt.isPresent() && tokenOpt.get().getUser().getId().equals(userId)) {
                fcmTokenRepository.delete(tokenOpt.get());
                log.info("✅ Unsubscribed token for user: {}", userId);
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error unsubscribing token for user: {}", userId, e);
            return false;
        }
    }

    /**
     * Desactiva un token de dispositivo al cerrar sesión
     */
    public void deactivateDeviceTokenOnLogout(String userEmail, String token) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isPresent()) {
                unsubscribe(userOpt.get().getId(), token);
            }
        } catch (Exception e) {
            log.error("Error deactivating device token for user: {}", userEmail, e);
        }
    }

    /**
     * Elimina tokens FCM inválidos o expirados
     * Implementa la sección 2.2 del documento: "Manejo de la caducidad"
     */
    public void cleanupInvalidTokens(List<String> invalidTokens) {
        if (invalidTokens != null && !invalidTokens.isEmpty()) {
            for (String token : invalidTokens) {
                fcmTokenRepository.deleteByToken(token);
                log.info("🗑️ Cleaned up invalid FCM token: {}...", token.substring(0, Math.min(10, token.length())));
            }
        }
    }

    /**
     * Método central para enviar notificaciones push según la sección 3.2 del
     * documento
     * 
     * @param userId ID del usuario objetivo
     * @param title  Título de la notificación
     * @param body   Cuerpo de la notificación
     * @param data   Datos adicionales para la PWA
     * @return true si se envió correctamente
     */
    public boolean sendNotification(Long userId, String title, String body, Map<String, String> data) {
        try {
            // Verificar que Firebase está configurado y el bean está disponible
            if (!firebaseConfig.isFirebaseConfigured() || firebaseMessaging == null) {
                log.warn(
                        "🔕 Firebase is not configured or FirebaseMessaging bean is not available. Notification not sent.");
                // Guardar en historial aunque no se envíe push
                saveNotificationHistory(userId, title, body);
                return false;
            }

            // 1. Buscar TODOS los tokens válidos del usuario (sección 3.2.1)
            List<FCMToken> fcmTokens = fcmTokenRepository.findByUserId(userId);
            if (fcmTokens.isEmpty()) {
                log.info("📱 No FCM tokens found for user: {} - notification saved in history only", userId);
                // Guardar en historial aunque no se envíe push
                saveNotificationHistory(userId, title, body);
                return true;
            }

            List<String> tokenStrings = fcmTokens.stream()
                    .map(FCMToken::getToken)
                    .collect(Collectors.toList());

            // 2. Construir MulticastMessage (sección 3.2.2)
            MulticastMessage message = createMulticastMessage(title, body, data, tokenStrings);

            // 3. Enviar usando FirebaseMessaging.getInstance().sendMulticast (sección
            // 3.2.3)
            BatchResponse response = firebaseMessaging.sendEachForMulticast(message);

            // 4. Procesar respuesta y manejar tokens inválidos
            handleBatchResponse(response, tokenStrings, userId);

            // 5. Guardar en historial
            saveNotificationHistory(userId, title, body);

            log.info("✅ FCM notification sent to user: {} with {} tokens", userId, tokenStrings.size());
            return true;

        } catch (Exception e) {
            log.error("Error sending FCM notification to user: {}", userId, e);
            return false;
        }
    }

    /**
     * Crea un MulticastMessage según las especificaciones del documento (sección
     * 3.3)
     * Utiliza tanto notification payload como data payload
     */
    private MulticastMessage createMulticastMessage(String title, String body, Map<String, String> data,
            List<String> tokens) {
        // Preparar data payload para procesamiento de la PWA (sección 3.3)
        // CAMBIO: Usamos SOLO data payload para evitar doble notificación (System + SW)
        Map<String, String> dataPayload = new HashMap<>();
        if (data != null) {
            dataPayload.putAll(data);
        }

        // Agregar campos estándar en data para que el SW los use
        dataPayload.put("title", title);
        dataPayload.put("body", body);

        // Agregar timestamp para el service worker
        dataPayload.put("timestamp", String.valueOf(System.currentTimeMillis()));

        return MulticastMessage.builder()
                // .setNotification(notification) // REMOVIDO: Para evitar notificación del
                // sistema
                .putAllData(dataPayload)
                .addAllTokens(tokens)
                .build();
    }

    private void handleBatchResponse(BatchResponse response, List<String> tokens, Long userId) {
        List<String> invalidTokens = new ArrayList<>();

        for (int i = 0; i < response.getResponses().size(); i++) {
            SendResponse sendResponse = response.getResponses().get(i);
            if (!sendResponse.isSuccessful()) {
                FirebaseMessagingException exception = sendResponse.getException();
                if (exception != null) {
                    String errorCode = exception.getErrorCode().toString();
                    // Tokens que FCM considera inválidos o expirados
                    if ("registration-token-not-registered".equals(errorCode) ||
                            "invalid-registration-token".equals(errorCode)) {
                        invalidTokens.add(tokens.get(i));
                    }
                }
            }
        }

        // Limpiar tokens inválidos (sección 2.2 del documento)
        if (!invalidTokens.isEmpty()) {
            cleanupInvalidTokens(invalidTokens);
            log.info("🗑️ Cleaned up {} invalid FCM tokens for user: {}", invalidTokens.size(), userId);
        }
    }

    // ===============================
    // 3. GESTIÓN DE HISTORIAL DE NOTIFICACIONES
    // ===============================

    /**
     * Guarda la notificación en el historial de base de datos
     */
    private void saveNotificationHistory(Long userId, String title, String body) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                Notification notification = Notification.builder()
                        .title(title)
                        .message(body)
                        .user(userOpt.get())
                        .date(LocalDateTime.now())
                        .status(NotificationStatus.UNREAD)
                        .targetRole(userOpt.get().getRole())
                        .build();

                notificationRepository.save(notification);
                log.debug("💾 Saved notification to history for user: {}", userId);
            }
        } catch (Exception e) {
            log.error("Error saving notification to history for user: {}", userId, e);
        }
    }

    /**
     * Obtiene las notificaciones de un usuario para mostrar en el frontend
     */
    public List<NotificationDTO> getAllByUserId(Long userId) {
        try {
            List<Notification> notifications = notificationRepository.findByUserId(userId);

            if (notifications == null || notifications.isEmpty()) {
                return new ArrayList<>();
            }

            return notifications.stream().map(n -> {
                return NotificationDTO.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .date(n.getDate())
                        .status(n.getStatus())
                        .targetRole(n.getTargetRole())
                        .build();
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching notifications for user {}: {}", userId, e.getMessage());
            return new ArrayList<>();
        }
    }

    // ===============================
    // 4. MÉTODOS DE NOTIFICACIONES ESPECÍFICAS DEL NEGOCIO
    // ===============================

    /**
     * Crea notificaciones de pago vencido
     */
    @Async
    public void createPaymentExpiredNotification(List<User> users, List<User> admins) {
        for (User user : users) {
            Map<String, String> data = new HashMap<>();
            data.put("type", "PAYMENT_EXPIRED");
            data.put("userId", user.getId().toString());

            sendNotification(user.getId(),
                    "Pago Vencido",
                    "Tu pago ha vencido. Por favor, renueva tu membresía.",
                    data);
        }

        // Notificar a admins
        for (User admin : admins) {
            Map<String, String> data = new HashMap<>();
            data.put("type", "ADMIN_PAYMENT_EXPIRED");
            data.put("count", String.valueOf(users.size()));

            sendNotification(admin.getId(),
                    "Pagos Vencidos",
                    users.size() + " usuarios tienen pagos vencidos",
                    data);
        }
    }

    /**
     * Crea notificaciones de cumpleaños
     */
    @Async
    public void createBirthdayNotification(List<User> users, List<User> admins) {
        // Notificar a los usuarios de cumpleaños
        for (User user : users) {
            Map<String, String> data = new HashMap<>();
            data.put("type", "BIRTHDAY");
            data.put("userId", user.getId().toString());

            sendNotification(user.getId(),
                    "¡Feliz Cumpleaños!",
                    "¡Que tengas un día fantástico! 🎉",
                    data);
        }

        // Notificar a admins
        for (User admin : admins) {
            String names = users.stream()
                    .map(User::getFirstName)
                    .collect(Collectors.joining(", "));

            Map<String, String> data = new HashMap<>();
            data.put("type", "ADMIN_BIRTHDAYS");
            data.put("names", names);

            sendNotification(admin.getId(),
                    "Cumpleaños Hoy",
                    "Cumpleaños: " + names,
                    data);
        }
    }

    /**
     * Crea notificaciones de advertencia de asistencia
     */
    @Async
    public void createAttendanceWarningNotification(List<User> users, List<User> admins) {
        for (User user : users) {
            Map<String, String> data = new HashMap<>();
            data.put("type", "ATTENDANCE_WARNING");
            data.put("userId", user.getId().toString());

            sendNotification(user.getId(),
                    "Recordatorio de Asistencia",
                    "No olvides asistir a tus clases programadas",
                    data);
        }

        // Notificar a admins
        for (User admin : admins) {
            Map<String, String> data = new HashMap<>();
            data.put("type", "ADMIN_ATTENDANCE_WARNING");
            data.put("count", String.valueOf(users.size()));

            sendNotification(admin.getId(),
                    "Advertencias de Asistencia",
                    users.size() + " usuarios necesitan recordatorio",
                    data);
        }
    }

    /**
     * Envía recordatorio de pago próximo a vencer
     */
    @Async
    public void sendPaymentDueReminder(User user, Double amount, LocalDate dueDate) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "PAYMENT_DUE_REMINDER");
        data.put("amount", amount.toString());
        data.put("dueDate", dueDate.toString());

        sendNotification(user.getId(),
                "Recordatorio de Pago",
                "Tu pago de $" + amount + " vence el " + dueDate,
                data);
    }

    /**
     * Envía recordatorios masivos de clase a múltiples usuarios
     */
    @Async
    public void sendBulkClassReminder(List<User> users, String activityName, LocalDateTime activityDate,
            String location) {
        for (User user : users) {
            Map<String, String> data = new HashMap<>();
            data.put("type", "ACTIVITY_REMINDER");
            data.put("activityName", activityName);
            data.put("activityDate", activityDate.toString());
            data.put("location", location != null ? location : "");

            sendNotification(user.getId(),
                    "Recordatorio de Clase",
                    "Tu clase de " + activityName + " es hoy a las " + activityDate.toLocalTime(),
                    data);
        }

        log.info("✅ Bulk class reminders sent to {} users for activity: {}", users.size(), activityName);
    }

    /**
     * Verifica si Firebase está configurado correctamente
     * Usado por el health check del controller
     */
    public boolean isFirebaseConfigured() {
        return firebaseConfig.isFirebaseConfigured();
    }
}