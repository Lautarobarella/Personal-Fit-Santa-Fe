package com.personalfit.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private PushNotificationService pushNotificationService;

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
     * Método genérico para ser usado por otros servicios como
     * PushNotificationService
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
     * Método para enviar notificación de meta alcanzada
     * Llama al método sendGoalAchievement integrado
     * Método manual para enviar notificación de meta alcanzada
     * NOTA: Este método se movió a NotificationTriggerService para evitar
     * dependencia circular
     * Use NotificationTriggerService.scheduleGoalAchievementNotification()
     * directamente
     */
    public void scheduleGoalAchievementNotification(User user, String goalType, String achievement) {
        sendGoalAchievement(user, goalType, achievement);
        log.warn(
                "Este método está deprecado. Use NotificationTriggerService.scheduleGoalAchievementNotification() directamente");
        // Método deprecado para evitar dependencia circular
        // triggerService.sendGoalAchievement(user, goalType, achievement);
    }

    /**
     * Crea una notificación desde un SendNotificationRequest
     * Este método es usado por PushNotificationService para guardar notificaciones
     * en BD
     * Solo crea la notificación si el usuario está suscrito
     */
    @Transactional
    public Notification createNotificationFromRequest(
            com.personalfit.dto.Notification.SendNotificationRequest request) {
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
    public List<Notification> createBulkNotificationsFromRequest(
            com.personalfit.dto.Notification.BulkNotificationRequest request) {
        try {
            List<Notification> createdNotifications = new ArrayList<>();

            // Determinar usuarios objetivo
            List<Long> targetUserIds = request.getUserIds();
            if (targetUserIds == null || targetUserIds.isEmpty()) {
                // Si no se especifican usuarios, crear para todos los usuarios con tokens
                // activos
                targetUserIds = deviceTokenRepository.findAll().stream()
                        .filter(token -> token.getIsActive())
                        .map(token -> token.getUser().getId())
                        .distinct()
                        .collect(Collectors.toList());
                log.info("No specific users provided, creating notifications for {} subscribed users",
                        targetUserIds.size());
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
                // Limpiar tokens antiguos del mismo usuario si hay demasiados (mantener solo
                // los 2 más recientes)
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

            // Crear preferencias por defecto si no existen
            createDefaultPreferencesIfNotExists(user.getId());

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
     * ========================================
     * FLUJO INDEPENDIENTE DE NOTIFICACIONES
     * ========================================
     * 
     * Este método implementa la lógica de separación entre notificaciones de historial y push:
     * 
     * 1. SIEMPRE crea la notificación en BD (para historial en app)
     * 2. CONDICIONALMENTE envía push (solo si usuario está suscrito)
     * 
     * Esto significa que:
     * - Las notificaciones SIEMPRE aparecen en el historial de la app
     * - Las notificaciones push SOLO se envían si el usuario tiene tokens activos
     * - Si un usuario se desuscribe, conserva todo el historial anterior
     * - Si un usuario se resuscribe, empieza a recibir push de nuevas notificaciones
     */
    public boolean createAndSendNotification(SendNotificationRequest request) {
        try {
            log.info("📝 NOTIFICATION_SERVICE: Creating notification for historial - User: {}, Title: '{}', Type: '{}'", 
                    request.getUserId(), request.getTitle(), request.getType());

            // 1. SIEMPRE crear la notificación en BD para historial
            Notification notification = createNotificationFromRequest(request);
            if (notification == null) {
                log.error("❌ Failed to create notification in database - this should never happen");
                return false;
            }

            log.info("✅ Notification saved to historial - ID: {}, User: {}", 
                    notification.getId(), request.getUserId());

            // 2. CONDICIONALMENTE intentar envío push
            boolean pushSent = pushNotificationService.sendNotificationToUser(request);
            
            if (pushSent) {
                log.info("🔔 Push notification sent successfully - User: {}", request.getUserId());
            } else {
                log.info("📱 No push sent (user not subscribed or no active tokens) - User: {}", request.getUserId());
            }

            // IMPORTANTE: Siempre retornamos true porque la notificación se guardó en BD
            // El push es opcional - el historial es lo importante
            return true;

        } catch (Exception e) {
            log.error("❌ Error in createAndSendNotification for user: " + request.getUserId(), e);
            return false;
        }
    }

    /**
     * Crea una notificación SOLO para historial (sin intento de push)
     * Útil para casos donde explícitamente no queremos enviar push
     */
    public Notification createNotificationForHistoryOnly(SendNotificationRequest request) {
        try {
            log.info("📝 NOTIFICATION_SERVICE: Creating notification for history only - User: {}, Title: '{}'", 
                    request.getUserId(), request.getTitle());

            Notification notification = createNotificationFromRequest(request);
            if (notification != null) {
                log.info("✅ Notification saved to history only - ID: {}, User: {}", 
                        notification.getId(), request.getUserId());
            }
            return notification;

        } catch (Exception e) {
            log.error("❌ Error creating notification for history only - User: " + request.getUserId(), e);
            return null;
        }
    }

    /**
     * NUEVO FLUJO: Crea y envía notificaciones masivas
     * 1. Crea las notificaciones en BD para todos los usuarios objetivo
     * 2. Delega el envío push masivo a PushNotificationService
     */
    public boolean createAndSendBulkNotifications(BulkNotificationRequest request) {
        try {
            log.info("📝 NOTIFICATION_SERVICE: Creating and sending bulk notifications - Title: '{}', Type: '{}'", 
                    request.getTitle(), request.getType());

            // Determinar usuarios objetivo
            List<Long> targetUserIds = request.getUserIds();
            if (targetUserIds == null || targetUserIds.isEmpty()) {
                // Si no se especifican usuarios, enviar a todos los usuarios activos
                // EXCEPTO los administradores (solo para notificaciones generales)
                targetUserIds = userRepository.findAll().stream()
                        .filter(user -> {
                            Integer dni = user.getDni();
                            return !(36265798 == dni || 99999999 == dni);
                        })
                        .map(User::getId)
                        .toList();
                log.info("General notification: targeting all users except admins, {} users", targetUserIds.size());
            } else {
                log.info("Specific notification: targeting {} specified users", targetUserIds.size());
            }

            if (targetUserIds.isEmpty()) {
                log.info("No target users found for bulk notification");
                return true;
            }

            // 1. Crear las notificaciones en BD primero
            List<Notification> notifications = createBulkNotificationsFromRequest(request);
            if (notifications.isEmpty()) {
                log.warn("No notifications were created in database");
                return false;
            }

            // 2. Delegar el envío push masivo al PushNotificationService
            boolean pushSent = pushNotificationService.sendBulkNotification(request);
            
            // 3. Log del resultado
            if (pushSent) {
                log.info("✅ Bulk notifications created and push sent successfully - {} notifications created", 
                        notifications.size());
                return true;
            } else {
                log.warn("⚠️ Bulk notifications created but push failed - {} notifications created", 
                        notifications.size());
                return false;
            }

        } catch (Exception e) {
            log.error("Error in createAndSendBulkNotifications", e);
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
     * Limpia tokens inválidos periódicamente (scheduled task cada hora)
     */
    @Scheduled(fixedRate = 3600000) // Cada hora
    @Transactional
    public void cleanupInvalidTokens() {
        try {
            // Obtener tokens que no han sido usados en los últimos 30 días
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            List<UserDeviceToken> inactiveTokens = deviceTokenRepository.findInactiveTokens(cutoffDate);

            for (UserDeviceToken token : inactiveTokens) {
                deviceTokenRepository.deactivateByToken(token.getToken());
            }

            if (!inactiveTokens.isEmpty()) {
                log.info("🧹 PROFESSIONAL_TOKEN_CLEANUP: Deactivated {} inactive tokens older than 30 days", 
                        inactiveTokens.size());
            }
        } catch (Exception e) {
            log.error("Error cleaning up invalid tokens", e);
        }
    }





    // ===============================
    // MÉTODOS PRIVADOS PARA PUSH NOTIFICATIONS
    // ===============================

    /**
     * Verifica si un usuario está suscrito a notificaciones (tiene tokens activos)
     * Método público unificado que sirve tanto para uso interno como externo
     */
    public boolean isUserSubscribedToNotifications(Long userId) {
        try {
            long activeTokens = getActiveTokenCount(userId);
            boolean hasTokens = activeTokens > 0;

            log.debug("User {} subscription check: hasTokens={} (activeTokens={})", userId, hasTokens, activeTokens);
            return hasTokens;
        } catch (Exception e) {
            log.warn("Error checking subscription status for user {}: {}", userId, e.getMessage());
            return false;
        }
    }

    // Firebase messaging methods moved to PushNotificationService
    // to maintain proper separation of concerns

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
                .build();
    }

    /**
     * Envía notificación de recordatorio de pago próximo a vencer
     */
    @Async
    public void sendPaymentDueReminder(User user, double amount, LocalDateTime dueDate) {
        try {
            SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(user.getId())
                .title("💳 Recordatorio de Pago")
                .body(String.format("Tu pago de $%.2f vence el %s. ¡No olvides pagarlo a tiempo!", 
                      amount, dueDate.toLocalDate()))
                .type("payment_due")
                .saveToDatabase(true)
                .build();

            createAndSendNotification(request);
            log.info("Payment due reminder sent to user: {}", user.getId());
        } catch (Exception e) {
            log.error("Error sending payment due reminder to user: " + user.getId(), e);
        }
    }

    /**
     * Envía notificación de confirmación de pago verificado
     */
    @Async
    public void sendPaymentConfirmation(User user, double amount, String paymentMethod) {
        try {
            SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(user.getId())
                .title("✅ Pago Verificado")
                .body(String.format("¡Tu pago ha sido verificado con éxito de $%.2f via %s!", 
                      amount, paymentMethod))
                .type("payment_confirmation")
                .saveToDatabase(true)
                .build();

            createAndSendNotification(request);
            log.info("Payment confirmation sent to user: {}", user.getId());
        } catch (Exception e) {
            log.error("Error sending payment confirmation to user: " + user.getId(), e);
        }
    }

    /**
     * Envía recordatorio de clase próxima (1 hora antes)
     */
    @Async
    public void sendClassReminder(User user, String className, LocalDateTime classTime, String location) {
        try {
            SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(user.getId())
                .title("🏃‍♀️ Recordatorio de Clase")
                .body(String.format("Tu clase de %s comienza en 1 hora (%s). Ubicación: %s", 
                      className, classTime.toLocalTime(), location))
                .type("class_reminder")
                .saveToDatabase(true)
                .build();

            createAndSendNotification(request);
            log.info("Class reminder sent to user: {}", user.getId());
        } catch (Exception e) {
            log.error("Error sending class reminder to user: " + user.getId(), e);
        }
    }

    /**
     * Envía anuncio general a todos los usuarios
     */
    @Async
    public void sendGeneralAnnouncement(List<User> users, String title, String message) {
        try {
            for (User user : users) {
                SendNotificationRequest request = SendNotificationRequest.builder()
                    .userId(user.getId())
                    .title("📢 " + title)
                    .body(message)
                    .type("general")
                    .saveToDatabase(true)
                    .build();

                createAndSendNotification(request);
            }
            log.info("General announcement sent to {} users", users.size());
        } catch (Exception e) {
            log.error("Error sending general announcement", e);
        }
    }

    /**
     * Envía notificación de meta de entrenamiento alcanzada
     */
    @Async
    public void sendGoalAchievement(User user, String goalType, String achievement) {
        try {
            SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(user.getId())
                .title("🏆 ¡Meta Alcanzada!")
                .body(String.format("¡Felicitaciones %s! Has alcanzado tu meta: %s. ¡Sigue así!", 
                      user.getFirstName(), achievement))
                .type("goal_achievement")
                .saveToDatabase(true)
                .build();

            createAndSendNotification(request);
            log.info("Goal achievement notification sent to user: {}", user.getId());
        } catch (Exception e) {
            log.error("Error sending goal achievement notification to user: " + user.getId(), e);
        }
    }

    /**
     * Envía notificación bulk de recordatorio de clase próxima
     */
    @Async
    public void sendBulkClassReminder(List<User> users, String className, LocalDateTime classTime, String location) {
        try {
            if (users.isEmpty()) {
                log.info("No users to send class reminder for activity: {}", className);
                return;
            }

            // Calcular tiempo restante hasta la clase
            LocalDateTime now = LocalDateTime.now();
            long minutesUntilClass = ChronoUnit.MINUTES.between(now, classTime);
            
            String timeMessage;
            if (minutesUntilClass > 60) {
                long hours = minutesUntilClass / 60;
                long remainingMinutes = minutesUntilClass % 60;
                if (remainingMinutes == 0) {
                    timeMessage = String.format("en %d hora%s", hours, hours > 1 ? "s" : "");
                } else {
                    timeMessage = String.format("en %d hora%s y %d minuto%s", 
                        hours, hours > 1 ? "s" : "", remainingMinutes, remainingMinutes > 1 ? "s" : "");
                }
            } else if (minutesUntilClass > 0) {
                timeMessage = String.format("en %d minuto%s", minutesUntilClass, minutesUntilClass > 1 ? "s" : "");
            } else {
                timeMessage = "¡AHORA!";
            }

            // Obtener IDs de usuarios
            List<Long> userIds = users.stream()
                    .map(User::getId)
                    .collect(Collectors.toList());

            BulkNotificationRequest request = BulkNotificationRequest.builder()
                .userIds(userIds)
                .title("🏃‍♀️ Recordatorio de Clase")
                .body(String.format("Tu clase de %s comienza %s (%s). Ubicación: %s", 
                      className, timeMessage, classTime.toLocalTime(), location))
                .type("class_reminder")
                .saveToDatabase(true)
                .build();

            boolean sent = createAndSendBulkNotifications(request);
            
            if (sent) {
                log.info("Bulk class reminder sent for activity '{}' to {} users", className, users.size());
            } else {
                log.warn("Failed to send bulk class reminder for activity '{}'", className);
            }
        } catch (Exception e) {
            log.error("Error sending bulk class reminder for activity: " + className, e);
        }
    }

    // ===============================
    // GESTIÓN PROFESIONAL DE TOKENS
    // ===============================

    /**
     * Desactiva el token del dispositivo cuando el usuario se desloguea
     */
    @Transactional
    public boolean deactivateDeviceTokenOnLogout(String userEmail, String deviceToken) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isEmpty()) {
                log.warn("User not found for email: {} during token deactivation", userEmail);
                return false;
            }

            Long userId = userOpt.get().getId();
            Optional<UserDeviceToken> tokenOpt = deviceTokenRepository.findByUserIdAndToken(userId, deviceToken);
            
            if (tokenOpt.isPresent()) {
                deviceTokenRepository.deactivateByToken(deviceToken);
                log.info("🔓 Device token deactivated on logout for user: {} (ID: {})", userEmail, userId);
                return true;
            } else {
                log.debug("Token not found for user: {} during logout", userEmail);
                return false;
            }
        } catch (Exception e) {
            log.error("Error deactivating device token on logout for user: " + userEmail, e);
            return false;
        }
    }



    /**
     * Desuscribe al usuario de notificaciones push (desactiva todos sus tokens)
     */
    @Transactional
    public boolean unsubscribeFromPushNotifications(Long userId) {
        try {
            List<UserDeviceToken> userTokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(userId);
            if (userTokens.isEmpty()) {
                log.info("User {} has no active tokens to unsubscribe", userId);
                return true;
            }

            deviceTokenRepository.deactivateAllByUserId(userId);
            log.info("🔕 User {} unsubscribed from push notifications - {} tokens deactivated", 
                    userId, userTokens.size());
            return true;
            
        } catch (Exception e) {
            log.error("Error unsubscribing user {} from push notifications", userId, e);
            return false;
        }
    }



    /**
     * Obtiene la cantidad de tokens activos para un usuario
     */
    public long getActiveTokenCount(Long userId) {
        try {
            return deviceTokenRepository.countByUserIdAndIsActiveTrue(userId);
        } catch (Exception e) {
            log.error("Error getting active token count for user {}", userId, e);
            return 0;
        }
    }

}
