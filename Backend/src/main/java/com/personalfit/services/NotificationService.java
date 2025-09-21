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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.SendResponse;
import com.personalfit.config.FirebaseConfig;
import com.personalfit.dto.Notification.BulkNotificationRequest;
import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.dto.Notification.NotificationPreferencesDTO;
import com.personalfit.dto.Notification.RegisterDeviceTokenRequest;
import com.personalfit.dto.Notification.SendNotificationRequest;
import com.personalfit.enums.DeviceType;
import com.personalfit.enums.NotificationStatus;
import com.personalfit.enums.UserRole;
import com.personalfit.models.Notification;
import com.personalfit.models.NotificationPreferences;
import com.personalfit.models.User;
import com.personalfit.models.UserDeviceToken;
import com.personalfit.repository.NotificationPreferencesRepository;
import com.personalfit.repository.NotificationRepository;
import com.personalfit.repository.UserDeviceTokenRepository;
import com.personalfit.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDeviceTokenRepository deviceTokenRepository;

    @Autowired
    private NotificationPreferencesRepository preferencesRepository;

    @Autowired
    private FirebaseConfig firebaseConfig;

    public List<NotificationDTO> getAllByUserId(Long id) {
        try {
            List<Notification> notifications = notificationRepository.findByUserId(id);

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
                        .infoType("INFO") // Valor por defecto
                        .notificationCategory("CLIENT") // Valor por defecto
                        .build();
            }).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error fetching notifications for user " + id + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<NotificationDTO> getUserNotificationsByIdAndEmail(Long userId, String userEmail) {
        try {
            // Verificar que el usuario corresponde al email autenticado
            Optional<User> user = userRepository.findByEmail(userEmail);
            if (user.isEmpty()) {
                System.err.println("User not found with email: " + userEmail);
                return new ArrayList<>();
            }

            // Verificar que el ID del usuario coincide con el solicitado
            if (!user.get().getId().equals(userId)) {
                System.err.println("User ID mismatch. Requested: " + userId + ", Found: " + user.get().getId());
                return new ArrayList<>();
            }

            // Verificar si el usuario está suscrito a notificaciones
            if (!isUserSubscribedToNotifications(userId)) {
                log.info("User {} with email {} is not subscribed to notifications", userId, userEmail);
                return new ArrayList<>();
            }

            // Si la validación es exitosa, obtener las notificaciones
            return getAllByUserId(userId);
        } catch (Exception e) {
            System.err.println("Error fetching notifications for user with email " + userEmail + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @Transactional
    public boolean updateNotificationStatus(Long notificationId, NotificationStatus status) {
        try {
            Optional<Notification> optionalNotification = notificationRepository.findById(notificationId);
            if (optionalNotification.isPresent()) {
                Notification notification = optionalNotification.get();
                notification.setStatus(status);
                notificationRepository.save(notification);
                return true;
            }
            return false;
        } catch (Exception e) {
            System.err.println("Error updating notification status: " + e.getMessage());
            return false;
        }
    }

    @Transactional
    public boolean deleteNotification(Long notificationId) {
        try {
            if (notificationRepository.existsById(notificationId)) {
                notificationRepository.deleteById(notificationId);
                return true;
            }
            return false;
        } catch (Exception e) {
            System.err.println("Error deleting notification: " + e.getMessage());
            return false;
        }
    }

    @Transactional
    public void markAllAsReadByUserId(Long userId) {
        try {
            List<Notification> unreadNotifications = notificationRepository.findByUserIdAndStatus(userId,
                    NotificationStatus.UNREAD);
            unreadNotifications.forEach(notification -> notification.setStatus(NotificationStatus.READ));
            notificationRepository.saveAll(unreadNotifications);
        } catch (Exception e) {
            System.err.println("Error marking all notifications as read: " + e.getMessage());
        }
    }

    /**
     * Crea y guarda una notificación individual
     * Método genérico para ser usado por otros servicios como PushNotificationService
     */
    @Transactional
    public Notification createNotification(Notification notification) {
        try {
            // Establecer valores por defecto si no están definidos
            if (notification.getDate() == null) {
                notification.setDate(LocalDateTime.now());
            }
            if (notification.getStatus() == null) {
                notification.setStatus(NotificationStatus.UNREAD);
            }
            if (notification.getTargetRole() == null && notification.getUser() != null) {
                notification.setTargetRole(notification.getUser().getRole());
            }

            return notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Error creating notification: {}", e.getMessage(), e);
            throw new RuntimeException("Error creating notification", e);
        }
    }

    @Transactional
    public void createPaymentExpiredNotification(List<User> users, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();

        // Solo crear notificaciones para usuarios suscritos
        List<User> subscribedUsers = users.stream()
            .filter(user -> isUserSubscribedToNotifications(user.getId()))
            .collect(Collectors.toList());

        log.info("Creating payment expired notifications for {} subscribed users out of {} total users", 
                subscribedUsers.size(), users.size());

        for (User user : subscribedUsers) {
            Notification notification = Notification.builder()
                    .title("Pago vencido")
                    .message("Tu pago ha vencido, realiza un pago para renovar tu membresía")
                    .user(user)
                    .date(LocalDateTime.now())
                    .status(NotificationStatus.UNREAD)
                    .targetRole(UserRole.CLIENT)
                    .build();
            notifications.add(notification);
        }

        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void createBirthdayNotification(List<User> users, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();

        for (User user : users) {
            for (User admin : admins) {
                Notification notification = Notification.builder()
                        .title("Cumple de " + user.getFirstName())
                        .message("Hoy es el cumpleaños de " + user.getFullName() + "! Deseale un feliz cumpleaños!")
                        .user(admin)
                        .date(LocalDateTime.now())
                        .status(NotificationStatus.UNREAD)
                        .targetRole(UserRole.ADMIN)
                        .build();
                notifications.add(notification);
            }
        }

        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void createAttendanceWarningNotification(List<User> users, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();

        for (User user : users) {
            for (User admin : admins) {
                Notification notification = Notification.builder()
                        .title("Inasistencia de " + user.getFirstName())
                        .message(user.getFullName()
                                + " hace 4 días que no asiste al gimnasio. Contactalo para saber si necesita ayuda.")
                        .user(admin)
                        .date(LocalDateTime.now())
                        .status(NotificationStatus.UNREAD)
                        .targetRole(UserRole.ADMIN)
                        .build();
                notifications.add(notification);
            }
        }

        notificationRepository.saveAll(notifications);
    }

    @Scheduled(cron = "0 30 0 * * ?")
    @Transactional
    public void checkClientBirthdays() {
        log.info("Starting daily birthday check process at 00:30 AM...");

        try {
            LocalDate today = LocalDate.now();

            // Buscar todos los clientes que cumplen años hoy (día y mes, ignorando año)
            List<User> clients = userRepository.findAllByRole(UserRole.CLIENT);
            List<User> birthdayClients = clients.stream()
                    .filter(user -> user.getBirthDate() != null)
                    .filter(user -> {
                        LocalDate birthDate = user.getBirthDate();
                        return birthDate.getMonth() == today.getMonth() &&
                                birthDate.getDayOfMonth() == today.getDayOfMonth();
                    })
                    .collect(Collectors.toList());

            if (birthdayClients.isEmpty()) {
                log.info("No clients with birthdays today");
                return;
            }

            // Obtener todos los administradores
            List<User> admins = userRepository.findAllByRole(UserRole.ADMIN);
            if (admins.isEmpty()) {
                log.warn("No administrators found to send birthday notifications");
                return;
            }

            // Crear notificaciones de cumpleaños para admins
            createBirthdayNotification(birthdayClients, admins);

            log.info("Birthday notifications sent for {} clients to {} administrators",
                    birthdayClients.size(), admins.size());

        } catch (Exception e) {
            log.error("Error during daily birthday check process: {}", e.getMessage(), e);
        }
    }

     /**
     * Limpia tokens de dispositivos inactivos cada semana (domingos a las 2:00 AM)
     */
    @Scheduled(cron = "0 0 2 * * SUN")
    @Transactional
    public void cleanupInactiveTokens() {
        try {
            log.info("Starting inactive tokens cleanup job");
            
            // Buscar tokens que no se han usado en 30 días
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            List<UserDeviceToken> inactiveTokens = deviceTokenRepository.findInactiveTokens(cutoffDate);
            
            if (inactiveTokens.isEmpty()) {
                log.info("No inactive tokens found for cleanup");
                return;
            }
            
            // Eliminar tokens inactivos
            for (UserDeviceToken token : inactiveTokens) {
                deviceTokenRepository.delete(token);
            }
            
            log.info("Cleanup completed. Removed {} inactive tokens", inactiveTokens.size());
        } catch (Exception e) {
            log.error("Error in inactive tokens cleanup job", e);
        }
    }

    /**
     * Método manual para enviar notificación de meta alcanzada
     * NOTA: Este método se movió a NotificationTriggerService para evitar dependencia circular
     * Use NotificationTriggerService.scheduleGoalAchievementNotification() directamente
     */
    @Deprecated
    public void scheduleGoalAchievementNotification(User user, String goalType, String achievement) {
        log.warn("Este método está deprecado. Use NotificationTriggerService.scheduleGoalAchievementNotification() directamente");
        // Método deprecado para evitar dependencia circular
        // triggerService.sendGoalAchievement(user, goalType, achievement);
    }

    /**
     * Crea una notificación desde un SendNotificationRequest
     * Este método es usado por PushNotificationService para guardar notificaciones en BD
     * Solo crea la notificación si el usuario está suscrito
     */
    @Transactional
    public Notification createNotificationFromRequest(com.personalfit.dto.Notification.SendNotificationRequest request) {
        try {
            if (request.getUserId() == null) {
                log.warn("Cannot create notification: userId is null");
                return null;
            }

            // Verificar si el usuario está suscrito a notificaciones
            if (!isUserSubscribedToNotifications(request.getUserId())) {
                log.info("User {} is not subscribed to notifications, skipping notification creation", 
                        request.getUserId());
                return null;
            }

            Optional<User> userOpt = userRepository.findById(request.getUserId());
            if (userOpt.isEmpty()) {
                log.warn("User not found with ID: {}", request.getUserId());
                return null;
            }

            Notification notification = Notification.builder()
                .title(request.getTitle())
                .message(request.getBody())
                .date(LocalDateTime.now())
                .status(NotificationStatus.UNREAD)
                .user(userOpt.get())
                .targetRole(userOpt.get().getRole())
                .build();

            return createNotification(notification);
        } catch (Exception e) {
            log.error("Error creating notification from request", e);
            return null;
        }
    }

    /**
     * Crea múltiples notificaciones desde un BulkNotificationRequest
     * Solo crea notificaciones para usuarios suscritos
     */
    @Transactional
    public List<Notification> createBulkNotificationsFromRequest(com.personalfit.dto.Notification.BulkNotificationRequest request) {
        try {
            List<Notification> createdNotifications = new ArrayList<>();

            // Determinar usuarios objetivo
            List<Long> targetUserIds = request.getUserIds();
            if (targetUserIds == null || targetUserIds.isEmpty()) {
                // Si no se especifican usuarios, crear para todos los usuarios con tokens activos
                targetUserIds = deviceTokenRepository.findAll().stream()
                    .filter(token -> token.getIsActive())
                    .map(token -> token.getUser().getId())
                    .distinct()
                    .collect(Collectors.toList());
                log.info("No specific users provided, creating notifications for {} subscribed users", targetUserIds.size());
            }

            // Filtrar solo usuarios que están suscritos
            List<Long> subscribedUserIds = targetUserIds.stream()
                .filter(this::isUserSubscribedToNotifications)
                .collect(Collectors.toList());

            log.info("Creating bulk notifications for {} subscribed users out of {} target users", 
                    subscribedUserIds.size(), targetUserIds.size());

            // Crear notificación para cada usuario suscrito
            for (Long userId : subscribedUserIds) {
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    Notification notification = Notification.builder()
                        .title(request.getTitle())
                        .message(request.getBody())
                        .date(LocalDateTime.now())
                        .status(NotificationStatus.UNREAD)
                        .user(userOpt.get())
                        .targetRole(userOpt.get().getRole())
                        .build();

                    Notification saved = createNotification(notification);
                    if (saved != null) {
                        createdNotifications.add(saved);
                    }
                } else {
                    log.warn("User not found with ID: {} during bulk notification creation", userId);
                }
            }

            log.info("Created {} notifications from bulk request", createdNotifications.size());
            return createdNotifications;
        } catch (Exception e) {
            log.error("Error creating bulk notifications from request", e);
            return new ArrayList<>();
        }
    }

    // ===============================
    // MÉTODOS DE PUSH NOTIFICATIONS (Migrados desde PushNotificationService)
    // ===============================

    /**
     * Registra un token de dispositivo para un usuario
     */
    public boolean registerDeviceToken(RegisterDeviceTokenRequest request) {
        try {
            Optional<User> userOpt = userRepository.findById(request.getUserId());
            if (userOpt.isEmpty()) {
                log.warn("User not found with ID: {}", request.getUserId());
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
                log.info("✅ Updated existing device token for user: {} | Token: {}...", 
                          user.getId(), request.getToken().substring(0, 20));
            } else {
                // Limpiar tokens antiguos del mismo usuario si hay demasiados (mantener solo los 2 más recientes)
                List<UserDeviceToken> userTokens = deviceTokenRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
                if (userTokens.size() >= 2) {
                    // Eliminar los tokens más antiguos, manteniendo solo el más reciente
                    for (int i = 0; i < userTokens.size() - 1; i++) {
                        UserDeviceToken oldToken = userTokens.get(i);
                        deviceTokenRepository.delete(oldToken);
                        log.info("🧹 Cleaned up old token for user: {} | Token: {}...", 
                                 user.getId(), oldToken.getToken().substring(0, 20));
                    }
                }
                
                // Crear nuevo token
                UserDeviceToken newToken = UserDeviceToken.builder()
                    .user(user)
                    .token(request.getToken())
                    .deviceType(request.getDeviceType())
                    .deviceInfo(request.getDeviceInfo())
                    .isActive(true)
                    .build();
                deviceTokenRepository.save(newToken);
                log.info("🆕 Registered new device token for user: {} | Token: {}...", 
                          user.getId(), request.getToken().substring(0, 20));
            }

            // Verificar que el token se guardó correctamente
            long totalTokensForUser = deviceTokenRepository.countByUserIdAndIsActiveTrue(user.getId());
            log.info("📱 User {} now has {} active device tokens", user.getId(), totalTokensForUser);

            // Crear preferencias por defecto si no existen y habilitar notificaciones push
            createDefaultPreferencesIfNotExists(user.getId());
            enablePushNotifications(user.getId());

            return true;
        } catch (Exception e) {
            log.error("Error registering device token", e);
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
     * Elimina un token de dispositivo
     */
    public boolean unregisterDeviceToken(String token) {
        try {
            Optional<UserDeviceToken> tokenOpt = deviceTokenRepository.findByToken(token);
            if (tokenOpt.isPresent()) {
                deviceTokenRepository.delete(tokenOpt.get());
                log.info("Unregistered device token: {}", token.substring(0, 10) + "...");
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error unregistering device token", e);
            return false;
        }
    }

    /**
     * Elimina un token de dispositivo por usuario y token
     */
    public boolean unregisterDeviceToken(Long userId, String token) {
        try {
            Optional<UserDeviceToken> tokenOpt = deviceTokenRepository.findByUserIdAndToken(userId, token);
            if (tokenOpt.isPresent()) {
                deviceTokenRepository.delete(tokenOpt.get());
                log.info("Unregistered device token for user: {} token: {}", userId, token.substring(0, 10) + "...");
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error unregistering device token for user: " + userId, e);
            return false;
        }
    }

    /**
     * Envía una notificación push a un usuario específico
     */
    public boolean sendNotificationToUser(SendNotificationRequest request) {
        try {
            if (!firebaseConfig.isFirebaseConfigured()) {
                log.warn("Firebase is not configured. Notification not sent.");
                return false;
            }

            // IMPORTANTE: Verificar que el usuario tenga habilitadas las notificaciones push (permiso lógico)
            if (!isUserSubscribedToNotifications(request.getUserId())) {
                log.info("User {} has disabled push notifications or has no active tokens", request.getUserId());
                return true; // No es un error, el usuario no quiere notificaciones push
            }

            // Verificar preferencias específicas del usuario por tipo
            if (!shouldSendNotification(request.getUserId(), request.getType())) {
                log.info("User has disabled notifications of type: {}", request.getType());
                return true; // No es un error, el usuario simplemente no quiere este tipo
            }

            // Obtener solo el token más reciente del usuario para evitar duplicados
            List<String> tokenStrings = deviceTokenRepository.findLatestActiveTokensByUserIds(
                List.of(request.getUserId())
            );
            
            if (tokenStrings.isEmpty()) {
                log.info("No active tokens found for user: {}", request.getUserId());
                return true; // No es un error, simplemente no hay tokens
            }

            log.debug("Sending notification to user {} using {} unique token(s)", 
                      request.getUserId(), tokenStrings.size());

            // Crear el mensaje
            MulticastMessage message = createMulticastMessage(request, tokenStrings);

            // Enviar notificación
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            
            // Procesar respuesta
            handleBatchResponse(response, tokenStrings, request.getUserId());

            // Guardar en base de datos si se solicita
            if (Boolean.TRUE.equals(request.getSaveToDatabase())) {
                createNotificationFromRequest(request);
            }

            log.info("Sent notification to user: {} with {} tokens", request.getUserId(), tokenStrings.size());
            return true;

        } catch (Exception e) {
            log.error("Error sending notification to user: " + request.getUserId(), e);
            return false;
        }
    }

    /**
     * Envía notificaciones masivas a múltiples usuarios
     */
    public boolean sendBulkNotifications(BulkNotificationRequest request) {
        return sendBulkNotifications(request, null);
    }

    /**
     * Envía notificaciones masivas a múltiples usuarios excluyendo al remitente
     */
    public boolean sendBulkNotifications(BulkNotificationRequest request, Long excludeUserId) {
        try {
            if (!firebaseConfig.isFirebaseConfigured()) {
                log.warn("Firebase is not configured. Bulk notification not sent.");
                return false;
            }

            // Determinar usuarios objetivo
            List<Long> targetUserIds = request.getUserIds();
            if (targetUserIds == null || targetUserIds.isEmpty()) {
                // Si no se especifican usuarios, enviar a todos los usuarios activos
                targetUserIds = userRepository.findAll().stream()
                    .map(User::getId)
                    .toList();
                log.info("No specific users provided, sending to all {} active users", targetUserIds.size());
            }

            // Excluir al usuario remitente si se especifica
            if (excludeUserId != null) {
                targetUserIds = targetUserIds.stream()
                    .filter(userId -> !userId.equals(excludeUserId))
                    .toList();
                log.info("Excluded sender user {} from bulk notification. Remaining users: {}", excludeUserId, targetUserIds.size());
            }

            // IMPORTANTE: Filtrar usuarios que tengan habilitadas las notificaciones push lógicamente
            List<Long> subscribedUserIds = targetUserIds.stream()
                .filter(this::isUserSubscribedToNotifications)
                .toList();
            
            log.info("Filtered users: {} total -> {} subscribed and enabled", targetUserIds.size(), subscribedUserIds.size());

            if (subscribedUserIds.isEmpty()) {
                log.info("No users with push notifications enabled found");
                return true;
            }

            // Obtener solo el token más reciente de cada usuario suscrito para evitar duplicados
            List<String> allTokens = deviceTokenRepository.findLatestActiveTokensByUserIds(subscribedUserIds);
            
            if (allTokens.isEmpty()) {
                log.info("No active tokens found for bulk notification");
                return true;
            }

            log.info("Sending bulk notification to {} subscribed users with {} unique tokens (avoiding duplicates)", 
                       subscribedUserIds.size(), allTokens.size());

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

            // Guardar en base de datos si se solicita (también excluyendo al remitente)
            if (Boolean.TRUE.equals(request.getSaveToDatabase())) {
                // Actualizar el request con los usuarios filtrados
                BulkNotificationRequest filteredRequest = BulkNotificationRequest.builder()
                    .title(request.getTitle())
                    .body(request.getBody())
                    .type(request.getType())
                    .image(request.getImage())
                    .data(request.getData())
                    .userIds(subscribedUserIds)
                    .saveToDatabase(request.getSaveToDatabase())
                    .build();
                
                createBulkNotificationsFromRequest(filteredRequest);
            }

            log.info("Sent bulk notification to {} subscribed users with {} total tokens", 
                       subscribedUserIds.size(), allTokens.size());
            return true;

        } catch (Exception e) {
            log.error("Error sending bulk notification", e);
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
                .pushNotificationsEnabled(prefs.getPushNotificationsEnabled())
                .build();
        }
        
        // Crear preferencias por defecto
        createDefaultPreferencesIfNotExists(userId);
        return createDefaultPreferencesDTO();
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
                    log.warn("User not found with ID: {}", userId);
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
            if (preferencesDTO.getPushNotificationsEnabled() != null) {
                prefs.setPushNotificationsEnabled(preferencesDTO.getPushNotificationsEnabled());
            }
            
            preferencesRepository.save(prefs);
            log.info("Updated notification preferences for user: {}", userId);
            return true;
        } catch (Exception e) {
            log.error("Error updating notification preferences for user: " + userId, e);
            return false;
        }
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
                log.info("Deactivated {} inactive tokens", inactiveTokens.size());
            }
        } catch (Exception e) {
            log.error("Error cleaning up invalid tokens", e);
        }
    }

    /**
     * Habilita las notificaciones push para un usuario (solo cambia el estado lógico)
     */
    public boolean enablePushNotifications(Long userId) {
        try {
            Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
            if (prefsOpt.isEmpty()) {
                createDefaultPreferencesIfNotExists(userId);
                prefsOpt = preferencesRepository.findByUserId(userId);
            }
            
            if (prefsOpt.isPresent()) {
                NotificationPreferences prefs = prefsOpt.get();
                prefs.setPushNotificationsEnabled(true);
                preferencesRepository.save(prefs);
                log.info("✅ Push notifications enabled for user: {}", userId);
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error enabling push notifications for user: " + userId, e);
            return false;
        }
    }

    /**
     * Deshabilita las notificaciones push para un usuario (solo cambia el estado lógico)
     * NO elimina los tokens de dispositivo
     */
    public boolean disablePushNotifications(Long userId) {
        try {
            Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
            if (prefsOpt.isPresent()) {
                NotificationPreferences prefs = prefsOpt.get();
                prefs.setPushNotificationsEnabled(false);
                preferencesRepository.save(prefs);
                log.info("🔕 Push notifications disabled for user: {}", userId);
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error disabling push notifications for user: " + userId, e);
            return false;
        }
    }

    /**
     * Verifica si un usuario tiene las notificaciones push habilitadas lógicamente
     */
    public boolean isPushNotificationsEnabled(Long userId) {
        try {
            Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
            if (prefsOpt.isPresent()) {
                return Boolean.TRUE.equals(prefsOpt.get().getPushNotificationsEnabled());
            }
            return false;
        } catch (Exception e) {
            log.error("Error checking push notifications status for user: " + userId, e);
            return false;
        }
    }

    /**
     * Obtiene la cantidad de tokens activos para un usuario
     */
    public long getActiveTokensCount(Long userId) {
        try {
            return deviceTokenRepository.countByUserIdAndIsActiveTrue(userId);
        } catch (Exception e) {
            log.error("Error getting active tokens count for user: " + userId, e);
            return 0;
        }
    }

    // ===============================
    // MÉTODOS PRIVADOS PARA PUSH NOTIFICATIONS
    // ===============================


    /**
     * Verifica si un usuario está suscrito a notificaciones (tiene tokens activos)
     */
    private boolean isUserSubscribedToNotifications(Long userId) {
        try {
            // Verificar que el usuario tenga tokens activos Y tenga habilitadas las notificaciones push
            long activeTokens = deviceTokenRepository.countByUserIdAndIsActiveTrue(userId);
            boolean hasTokens = activeTokens > 0;
            boolean pushEnabled = isPushNotificationsEnabled(userId);
            
            log.debug("User {} subscription check: hasTokens={}, pushEnabled={}", userId, hasTokens, pushEnabled);
            return hasTokens && pushEnabled;
        } catch (Exception e) {
            log.warn("Error checking subscription status for user {}: {}", userId, e.getMessage());
            return false;
        }
    }

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
        com.google.firebase.messaging.Notification.Builder notificationBuilder = com.google.firebase.messaging.Notification.builder()
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
                    log.warn("Deactivated invalid token: {}", token.substring(0, 10) + "...");
                } else {
                    log.warn("Failed to send notification to token: {} - Error: {}", 
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

    private void createDefaultPreferencesIfNotExists(Long userId) {
        if (!preferencesRepository.existsByUserId(userId)) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                NotificationPreferences defaultPrefs = NotificationPreferences.builder()
                    .user(userOpt.get())
                    .build();
                preferencesRepository.save(defaultPrefs);
                log.info("Created default notification preferences for user: {}", userId);
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
            .pushNotificationsEnabled(false)
            .build();
    }

}
