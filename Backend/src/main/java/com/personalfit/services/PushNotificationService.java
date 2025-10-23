package com.personalfit.services;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.SendResponse;
import com.personalfit.config.FirebaseConfig;
import com.personalfit.dto.Notification.BulkNotificationRequest;
import com.personalfit.dto.Notification.NotificationPreferencesDTO;
import com.personalfit.dto.Notification.RegisterDeviceTokenRequest;
import com.personalfit.dto.Notification.SendNotificationRequest;
import com.personalfit.enums.DeviceType;
import com.personalfit.models.NotificationPreferences;
import com.personalfit.models.User;
import com.personalfit.models.UserDeviceToken;
import com.personalfit.repository.NotificationPreferencesRepository;
import com.personalfit.repository.UserDeviceTokenRepository;
import com.personalfit.repository.UserRepository;

@Service
@Transactional
public class PushNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(PushNotificationService.class);

    @Autowired
    private UserDeviceTokenRepository deviceTokenRepository;

    @Autowired
    private NotificationPreferencesRepository preferencesRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FirebaseConfig firebaseConfig;

    // Removed NotificationService dependency to avoid circular dependency
    // NotificationService now handles DB operations and calls this service for push notifications

    /**
     * Registra un token de dispositivo para un usuario
     */
    public boolean registerDeviceToken(RegisterDeviceTokenRequest request) {
        try {
            Optional<User> userOpt = userRepository.findById(request.getUserId());
            if (userOpt.isEmpty()) {
                logger.warn("User not found with ID: {}", request.getUserId());
                return false;
            }

            User user = userOpt.get();

            // Verificar si el token ya existe
            Optional<UserDeviceToken> existingToken = deviceTokenRepository.findByToken(request.getToken());
            if (existingToken.isPresent()) {
                // Actualizar el token existente
                UserDeviceToken token = existingToken.get();
                token.setUser(user);
                token.setDeviceType(request.getDeviceType());
                token.setDeviceInfo(request.getDeviceInfo());
                token.setIsActive(true);
                deviceTokenRepository.save(token);
                logger.info("✅ Updated existing device token for user: {} | Token: {}...", 
                          user.getId(), request.getToken().substring(0, 20));
            } else {
                // Crear nuevo token
                UserDeviceToken newToken = UserDeviceToken.builder()
                    .user(user)
                    .token(request.getToken())
                    .deviceType(request.getDeviceType())
                    .deviceInfo(request.getDeviceInfo())
                    .isActive(true)
                    .build();
                deviceTokenRepository.save(newToken);
                logger.info("🆕 Registered new device token for user: {} | Token: {}...", 
                          user.getId(), request.getToken().substring(0, 20));
            }

            // Verificar que el token se guardó correctamente
            long totalTokensForUser = deviceTokenRepository.countByUserIdAndIsActiveTrue(user.getId());
            logger.info("📱 User {} now has {} active device tokens", user.getId(), totalTokensForUser);

            // Crear preferencias por defecto si no existen
            createDefaultPreferencesIfNotExists(user.getId());

            return true;
        } catch (Exception e) {
            logger.error("Error registering device token", e);
            return false;
        }
    }

    /**
     * Elimina un token de dispositivo
     */
    public boolean unregisterDeviceToken(String token) {
        try {
            Optional<UserDeviceToken> tokenOpt = deviceTokenRepository.findByToken(token);
            if (tokenOpt.isPresent()) {
                deviceTokenRepository.delete(tokenOpt.get());
                logger.info("Unregistered device token: {}", token.substring(0, 10) + "...");
                return true;
            }
            return false;
        } catch (Exception e) {
            logger.error("Error unregistering device token", e);
            return false;
        }
    }

    /**
     * Envía una notificación push a un usuario específico
     */
    public boolean sendNotificationToUser(SendNotificationRequest request) {
        try {
            if (!firebaseConfig.isFirebaseConfigured()) {
                logger.warn("Firebase is not configured. Notification not sent.");
                return false;
            }

            // Verificar preferencias del usuario
            if (!shouldSendNotification(request.getUserId(), request.getType())) {
                logger.info("User has disabled notifications of type: {}", request.getType());
                return true; // No es un error, el usuario simplemente no quiere este tipo
            }

            // Obtener tokens activos del usuario para push
            List<UserDeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(request.getUserId());
            if (tokens.isEmpty()) {
                logger.info("📱 No active tokens found for user: {} - push not sent but notification saved in historial", request.getUserId());
                return true; // No es un error - simplemente el usuario no está suscrito a push
            }

            List<String> tokenStrings = tokens.stream().map(UserDeviceToken::getToken).toList();

            // Crear el mensaje
            MulticastMessage message = createMulticastMessage(request, tokenStrings);

            // Enviar notificación
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            
            // Procesar respuesta
            handleBatchResponse(response, tokenStrings, request.getUserId());

            // NOTA: Ya no guardamos en BD aquí - esa responsabilidad es del NotificationService

            logger.info("✅ PUSH_SERVICE: Push notification sent to user: {} with {} tokens", 
                    request.getUserId(), tokenStrings.size());
            return true;

        } catch (Exception e) {
            logger.error("Error sending notification to user: " + request.getUserId(), e);
            return false;
        }
    }

    /**
     * Envía notificaciones masivas a múltiples usuarios
     */
    public boolean sendBulkNotification(BulkNotificationRequest request) {
        try {
            if (!firebaseConfig.isFirebaseConfigured()) {
                logger.warn("Firebase is not configured. Bulk notification not sent.");
                return false;
            }

            // Determinar usuarios objetivo
            List<Long> targetUserIds = request.getUserIds();
            if (targetUserIds == null || targetUserIds.isEmpty()) {
                // Si no se especifican usuarios, enviar a todos los usuarios activos
                // EXCEPTO los administradores (solo para notificaciones generales)
                targetUserIds = userRepository.findAll().stream()
                    .filter(user -> !user.getDni().equals(99999999) && !user.getDni().equals(36265798))
                    .map(User::getId)
                    .toList();
                logger.info("No specific users provided, sending to all {} active users (excluding admins)", targetUserIds.size());
            }

            // Obtener todos los tokens activos de los usuarios objetivo
            List<String> allTokens = deviceTokenRepository.findActiveTokensByUserIds(targetUserIds);
            
            if (allTokens.isEmpty()) {
                logger.info("No active tokens found for bulk notification");
                return true;
            }

            logger.info("Sending bulk notification to {} users with {} active tokens", 
                       targetUserIds.size(), allTokens.size());

            // Crear mensaje genérico
            SendNotificationRequest genericRequest = SendNotificationRequest.builder()
                .title(request.getTitle())
                .body(request.getBody())
                .type(request.getType())
                .image(request.getImage())
                .data(request.getData())
                .build();

            // Dividir en batches (FCM tiene límite de 500 tokens por batch)
            int batchSize = 500;
            for (int i = 0; i < allTokens.size(); i += batchSize) {
                int endIndex = Math.min(i + batchSize, allTokens.size());
                List<String> batchTokens = allTokens.subList(i, endIndex);
                
                MulticastMessage message = createMulticastMessage(genericRequest, batchTokens);
                BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
                
                // Procesar respuesta del batch
                handleBatchResponse(response, batchTokens, null);
            }

            // NOTA: Ya no guardamos en BD aquí - esa responsabilidad es del NotificationService

            logger.info("✅ PUSH_SERVICE: Bulk push notification sent to {} users with {} total tokens", 
                       targetUserIds.size(), allTokens.size());
            return true;

        } catch (Exception e) {
            logger.error("Error sending bulk notification", e);
            return false;
        }
    }

    /**
     * Obtiene las preferencias de notificación de un usuario
     */
    public NotificationPreferencesDTO getUserPreferences(Long userId) {
        Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
        
        if (prefsOpt.isPresent()) {
            NotificationPreferences prefs = prefsOpt.get();
            return NotificationPreferencesDTO.builder()
                .classReminders(prefs.getClassReminders())
                .paymentDue(prefs.getPaymentDue())
                .newClasses(prefs.getNewClasses())
                .promotions(prefs.getPromotions())
                .classCancellations(prefs.getClassCancellations())
                .generalAnnouncements(prefs.getGeneralAnnouncements())
                .build();
        }
        
        // Crear preferencias por defecto
        createDefaultPreferencesIfNotExists(userId);
        return createDefaultPreferencesDTO();
    }

    /**
     * Actualiza las preferencias de notificación de un usuario
     */
    public boolean updateUserPreferences(Long userId, NotificationPreferencesDTO preferencesDTO) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                logger.warn("User not found with ID: {}", userId);
                return false;
            }

            Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
            NotificationPreferences prefs;

            if (prefsOpt.isPresent()) {
                prefs = prefsOpt.get();
            } else {
                prefs = NotificationPreferences.builder()
                    .user(userOpt.get())
                    .build();
            }

            // Actualizar preferencias
            prefs.setClassReminders(preferencesDTO.getClassReminders());
            prefs.setPaymentDue(preferencesDTO.getPaymentDue());
            prefs.setNewClasses(preferencesDTO.getNewClasses());
            prefs.setPromotions(preferencesDTO.getPromotions());
            prefs.setClassCancellations(preferencesDTO.getClassCancellations());
            prefs.setGeneralAnnouncements(preferencesDTO.getGeneralAnnouncements());

            preferencesRepository.save(prefs);
            logger.info("Updated notification preferences for user: {}", userId);
            return true;

        } catch (Exception e) {
            logger.error("Error updating user preferences for user: " + userId, e);
            return false;
        }
    }

    /**
     * Limpia tokens inválidos (debe ejecutarse periódicamente)
     */
    public void cleanupInvalidTokens() {
        try {
            // Obtener tokens que no han sido usados en los últimos 30 días
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            List<UserDeviceToken> inactiveTokens = deviceTokenRepository.findInactiveTokens(cutoffDate);
            
            for (UserDeviceToken token : inactiveTokens) {
                deviceTokenRepository.deactivateByToken(token.getToken());
            }
            
            if (!inactiveTokens.isEmpty()) {
                logger.info("Deactivated {} inactive tokens", inactiveTokens.size());
            }
        } catch (Exception e) {
            logger.error("Error cleaning up invalid tokens", e);
        }
    }

    // ===============================
    // MÉTODOS PRIVADOS
    // ===============================

    private MulticastMessage createMulticastMessage(SendNotificationRequest request, List<String> tokens) {
        // Preparar datos
        Map<String, String> data = new HashMap<>();
        if (request.getData() != null) {
            data.putAll(request.getData());
        }
        if (request.getType() != null) {
            data.put("type", request.getType());
        }
        if (request.getUserId() != null) {
            data.put("userId", request.getUserId().toString());
        }

        // Crear notificación
        Notification.Builder notificationBuilder = Notification.builder()
            .setTitle(request.getTitle())
            .setBody(request.getBody());

        if (request.getImage() != null && !request.getImage().trim().isEmpty()) {
            notificationBuilder.setImage(request.getImage());
        }

        // Construir mensaje
        return MulticastMessage.builder()
            .setNotification(notificationBuilder.build())
            .putAllData(data)
            .addAllTokens(tokens)
            .build();
    }

    private void handleBatchResponse(BatchResponse response, List<String> tokens, Long userId) {
        for (int i = 0; i < response.getResponses().size(); i++) {
            SendResponse sendResponse = response.getResponses().get(i);
            String token = tokens.get(i);
            
            if (!sendResponse.isSuccessful()) {
                FirebaseMessagingException exception = sendResponse.getException();
                String errorCode = exception != null ? exception.getErrorCode().toString() : "unknown";
                
                // Manejar tokens inválidos
                if ("UNREGISTERED".equals(errorCode) || 
                    "INVALID_ARGUMENT".equals(errorCode)) {
                    deviceTokenRepository.deactivateByToken(token);
                    logger.warn("Deactivated invalid token: {}", token.substring(0, 10) + "...");
                } else {
                    logger.warn("Failed to send notification to token: {} - Error: {}", 
                               token.substring(0, 10) + "...", errorCode);
                }
            } else {
                // Actualizar último uso del token
                if (userId != null) {
                    deviceTokenRepository.updateLastUsed(token, LocalDateTime.now());
                }
            }
        }
    }

    private boolean shouldSendNotification(Long userId, String type) {
        if (type == null) return true;
        
        Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
        if (prefsOpt.isEmpty()) return true;
        
        NotificationPreferences prefs = prefsOpt.get();
        
        return switch (type) {
            case "class_reminder" -> Boolean.TRUE.equals(prefs.getClassReminders());
            case "payment_due" -> Boolean.TRUE.equals(prefs.getPaymentDue());
            case "new_class" -> Boolean.TRUE.equals(prefs.getNewClasses());
            case "promotion" -> Boolean.TRUE.equals(prefs.getPromotions());
            case "class_cancelled" -> Boolean.TRUE.equals(prefs.getClassCancellations());
            case "general" -> Boolean.TRUE.equals(prefs.getGeneralAnnouncements());
            default -> true;
        };
    }

    // Method removed - NotificationService now handles database operations

    private void createDefaultPreferencesIfNotExists(Long userId) {
        if (!preferencesRepository.existsByUserId(userId)) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                NotificationPreferences defaultPrefs = NotificationPreferences.builder()
                    .user(userOpt.get())
                    .build();
                preferencesRepository.save(defaultPrefs);
                logger.info("Created default notification preferences for user: {}", userId);
            }
        }
    }

    private NotificationPreferencesDTO createDefaultPreferencesDTO() {
        return NotificationPreferencesDTO.builder()
            .classReminders(true)
            .paymentDue(true)
            .newClasses(true)
            .promotions(false)
            .classCancellations(true)
            .generalAnnouncements(true)
            .build();
    }

    /**
     * Obtiene las preferencias de notificación de un usuario (modelo completo)
     */
    public NotificationPreferences getNotificationPreferences(Long userId) {
        Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
        if (prefsOpt.isPresent()) {
            return prefsOpt.get();
        }
        
        // Si no existen, crear preferencias por defecto
        createDefaultPreferencesIfNotExists(userId);
        return preferencesRepository.findByUserId(userId).orElse(null);
    }

    /**
     * Actualiza las preferencias de notificación de un usuario
     */
    public boolean updateNotificationPreferences(Long userId, NotificationPreferencesDTO preferencesDTO) {
        try {
            Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
            NotificationPreferences prefs;
            
            if (prefsOpt.isPresent()) {
                prefs = prefsOpt.get();
            } else {
                // Crear nuevas preferencias si no existen
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isEmpty()) {
                    logger.warn("User not found with ID: {}", userId);
                    return false;
                }
                prefs = NotificationPreferences.builder()
                    .user(userOpt.get())
                    .build();
            }
            
            // Actualizar las preferencias
            prefs.setClassReminders(preferencesDTO.getClassReminders());
            prefs.setPaymentDue(preferencesDTO.getPaymentDue());
            prefs.setNewClasses(preferencesDTO.getNewClasses());
            prefs.setPromotions(preferencesDTO.getPromotions());
            prefs.setClassCancellations(preferencesDTO.getClassCancellations());
            prefs.setGeneralAnnouncements(preferencesDTO.getGeneralAnnouncements());
            
            preferencesRepository.save(prefs);
            logger.info("Updated notification preferences for user: {}", userId);
            return true;
        } catch (Exception e) {
            logger.error("Error updating notification preferences for user: " + userId, e);
            return false;
        }
    }

    /**
     * Registra un token de dispositivo con userId y otros parámetros separados
     */
    public boolean registerDeviceToken(Long userId, String token, String deviceInfo) {
        RegisterDeviceTokenRequest request = RegisterDeviceTokenRequest.builder()
            .userId(userId)
            .token(token)
            .deviceType(DeviceType.PWA)
            .deviceInfo(deviceInfo)
            .build();
        return registerDeviceToken(request);
    }

    /**
     * Elimina un token de dispositivo por usuario y token
     */
    public boolean unregisterDeviceToken(Long userId, String token) {
        try {
            Optional<UserDeviceToken> tokenOpt = deviceTokenRepository.findByUserIdAndToken(userId, token);
            if (tokenOpt.isPresent()) {
                deviceTokenRepository.delete(tokenOpt.get());
                logger.info("Unregistered device token for user: {} token: {}", userId, token.substring(0, 10) + "...");
                return true;
            }
            return false;
        } catch (Exception e) {
            logger.error("Error unregistering device token for user: " + userId, e);
            return false;
        }
    }

    /**
     * Alias para sendBulkNotification para compatibilidad con controlador
     */
    public boolean sendBulkNotifications(BulkNotificationRequest request) {
        return sendBulkNotification(request);
    }
}