package com.personalfit.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.personalfit.dto.Notification.NotificationDetailInfoDTO;
import com.personalfit.dto.Notification.NotificationFormTypeDTO;
import com.personalfit.dto.Notification.NotificationTypeDTO;
import com.personalfit.enums.NotificationStatus;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.models.Notification;
import com.personalfit.models.User;
import com.personalfit.repository.NotificationRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Service Layer: Notification Center
 * 
 * Central hub for all user alerts and communications.
 * Orchestrates storing in-app notifications and triggering external Push
 * Notifications via FCM.
 */
@Slf4j
@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    @Lazy // Circular dependency resolution
    private UserService userService;

    @Autowired
    private FCMService fcmService;

    /**
     * Single User Notification.
     * Creates a database record and triggers an immediate FCM push.
     */
    public void createNotification(NotificationFormTypeDTO notification) {
        // [STEP 0] Log the raw payload exactly as it arrives from the client.
        // This is the single most useful line to diagnose the recurring 500s:
        // it shows whether userId/title/message actually reached the backend.
        if (notification == null) {
            log.error("createNotification received a NULL body. The request reached the controller but Jackson "
                    + "could not bind the JSON payload.");
            throw new BusinessRuleException("Notification payload is required",
                    "Api/Notification/createNotification");
        }
        log.info("createNotification START | rawUserId='{}' | titleLen={} | messageLen={}",
                notification.getUserId(),
                notification.getTitle() != null ? notification.getTitle().length() : null,
                notification.getMessage() != null ? notification.getMessage().length() : null);

        // [STEP 1] Parse the recipient id. A null/non-numeric id is a client error (400).
        Long userId = parseUserId(notification.getUserId());
        log.info("createNotification STEP 1 OK | parsed userId={}", userId);

        // [STEP 2] Resolve the recipient. A missing user raises EntityNotFoundException (404).
        User user = userService.getUserById(userId);
        log.info("createNotification STEP 2 OK | recipient resolved userId={}, name={}",
                user.getId(), user.getFullName());

        Notification newNotification = Notification.builder()
                .title(notification.getTitle())
                .message(notification.getMessage())
                .user(user)
                .status(NotificationStatus.UNREAD)
                .createdAt(LocalDateTime.now())
                .build();

        // [STEP 3] Persist the in-app notification. DB failures map to 400 (BusinessRuleException).
        try {
            notificationRepository.save(newNotification);
            log.info("createNotification STEP 3 OK | notification persisted | id={}, userId={}, title='{}'",
                    newNotification.getId(), user.getId(), notification.getTitle());
        } catch (Exception e) {
            log.error("createNotification STEP 3 FAILED | could not persist notification | userId={}, cause={}",
                    user.getId(), e.getMessage(), e);
            throw new BusinessRuleException("Failed to create notification: " + e.getMessage(),
                    "Api/Notification/createNotification");
        }

        // [STEP 4] Fire the push notification. This is best-effort and MUST NOT fail the request:
        // any FCM error is swallowed here so the in-app notification is still considered created.
        try {
            log.info("createNotification STEP 4 | dispatching FCM push | userId={}", user.getId());
            fcmService.sendNotification(user.getId(), notification.getTitle(), notification.getMessage());
            log.info("createNotification STEP 4 OK | FCM dispatch returned | userId={}", user.getId());
        } catch (Exception e) {
            // Intentionally NOT rethrown: a push failure should never produce a 500.
            log.warn("createNotification STEP 4 SKIPPED | FCM push failed (non-blocking) | userId={}, cause={}",
                    user.getId(), e.getMessage(), e);
        }

        log.info("createNotification END | success | userId={}", user.getId());
    }

    /**
     * Bulk Announcement.
     * Broadcasts a message to ALL users (excluding Admins).
     * Used for general facility announcements (e.g., "Gym closed for holiday").
     * 
     * @param title   Notification Title
     * @param message Notification Body
     * @return Count of users targeted.
     */
    public int createBulkNotification(String title, String message) {
        try {
            List<User> allUsers = userService.getAllNonAdminUsers();

            if (allUsers.isEmpty()) {
                log.warn("No non-admin users found for bulk notification");
                return 0;
            }

            LocalDateTime now = LocalDateTime.now();
            List<Notification> notifications = allUsers.stream()
                    .map(user -> Notification.builder()
                            .title(title)
                            .message(message)
                            .user(user)
                            .status(NotificationStatus.UNREAD)
                            .createdAt(now)
                            .build())
                    .collect(Collectors.toList());

            notificationRepository.saveAll(notifications);

            List<Long> userIds = allUsers.stream()
                    .map(User::getId)
                    .collect(Collectors.toList());
            fcmService.sendBulkNotification(userIds, title, message);

            log.info("Bulk notifications stored. Title: '{}' | Recipients: {}", title, allUsers.size());
            return allUsers.size();

        } catch (Exception e) {
            log.error("Bulk notification failed: {}", e.getMessage());
            throw new BusinessRuleException("Bulk notification failure: " + e.getMessage(),
                    "Api/Notification/createBulkNotification");
        }
    }

    public List<Map<String, Object>> getBulkNotificationRecipients() {
        try {
            List<User> recipients = userService.getAllNonAdminUsers();

            if (recipients.isEmpty()) {
                log.warn("No non-admin users found for bulk notification recipients");
            } else {
                log.debug("Bulk notification recipients resolved: count={}", recipients.size());
            }

            return recipients.stream()
                    .map(user -> {
                        Map<String, Object> recipient = new HashMap<>();
                        recipient.put("id", user.getId());
                        recipient.put("name", user.getFullName());
                        return recipient;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Bulk notification recipients lookup failed: cause={}", e.getMessage());
            throw new BusinessRuleException("Bulk notification recipients lookup failure: " + e.getMessage(),
                    "Api/Notification/getBulkNotificationRecipients");
        }
    }

    /**
     * Deletes a notification by its ID.
     */
    public void deleteNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notification ID: " + id + " not found",
                        "Api/Notification/deleteNotification"));

        try {
            notificationRepository.delete(notification);
            log.debug("Notification deleted: {}", id);
        } catch (Exception e) {
            throw new BusinessRuleException("Delete failed: " + e.getMessage(),
                    "Api/Notification/deleteNotification");
        }
    }

    /**
     * Inbox Retrieval.
     * Fetches user notifications ordered by newest first.
     */
    public List<NotificationTypeDTO> getAllNotificationsTypeDto(Long userId) {
        User user = userService.getUserById(userId);
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(this::convertToNotificationTypeDTO)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves detailed information for a specific notification.
     */
    public NotificationDetailInfoDTO getNotificationDetailInfo(Long id) {
        Optional<Notification> notification = notificationRepository.findById(id);
        if (notification.isEmpty()) {
            throw new EntityNotFoundException("Notification ID: " + id + " not found",
                    "Api/Notification/getNotificationDetailInfo");
        }

        Notification notif = notification.get();
        return NotificationDetailInfoDTO.builder()
                .id(notif.getId())
                .title(notif.getTitle())
                .message(notif.getMessage())
                .createdAt(notif.getCreatedAt())
                .status(notif.getStatus())
                .userId(notif.getUser().getId())
                .userName(notif.getUser().getFullName())
                .build();
    }

    /**
     * Marks a notification as read.
     */
    public void markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notification ID: " + id + " not found",
                        "Api/Notification/markAsRead"));

        notification.setStatus(NotificationStatus.READ);

        try {
            notificationRepository.save(notification);
            log.debug("Notification marked as read: {}", id);
        } catch (Exception e) {
            throw new BusinessRuleException("Status update failed: " + e.getMessage(),
                    "Api/Notification/markAsRead");
        }
    }

    /**
     * Marks a notification as unread.
     */
    public void markAsUnread(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notification ID: " + id + " not found",
                        "Api/Notification/markAsUnread"));

        notification.setStatus(NotificationStatus.UNREAD);

        try {
            notificationRepository.save(notification);
            log.debug("Notification marked as unread: {}", id);
        } catch (Exception e) {
            throw new BusinessRuleException("Status update failed: " + e.getMessage(),
                    "Api/Notification/markAsUnread");
        }
    }

    /**
     * Archives a notification, hiding it from the main inbox.
     */
    public void archiveNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notification ID: " + id + " not found",
                        "Api/Notification/archiveNotification"));

        notification.setStatus(NotificationStatus.ARCHIVED);

        try {
            notificationRepository.save(notification);
            log.debug("Notification archived: {}", id);
        } catch (Exception e) {
            throw new BusinessRuleException("Archive failed: " + e.getMessage(),
                    "Api/Notification/archiveNotification");
        }
    }

    /**
     * Unarchives a notification, moving it back to the inbox.
     */
    public void unarchiveNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notification ID: " + id + " not found",
                        "Api/Notification/unarchiveNotification"));

        notification.setStatus(NotificationStatus.READ);

        try {
            notificationRepository.save(notification);
            log.debug("Notification unarchived: {}", id);
        } catch (Exception e) {
            throw new BusinessRuleException("Unarchive failed: " + e.getMessage(),
                    "Api/Notification/unarchiveNotification");
        }
    }

    // ===============================
    // AUTOMATED SYSTEM NOTIFICATIONS
    // ===============================

    /**
     * Alert: Payment Expired.
     * Triggered by PaymentService's daily cron job.
     * Notifies:
     * 1. Affected Users (Direct message).
     * 2. Admins (Summary report).
     */
    public void createPaymentExpiredNotification(List<User> users, List<User> admins) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Notify individual users
        for (User user : users) {
            try {
                String title = "Membresia vencida";
                String message = "Tu membresia ha vencido. Renovala para seguir usando nuestros servicios.";

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);
                fcmService.sendNotification(user.getId(), title, message);

                log.debug("Expiration alert sent: userId={}", user.getId());
            } catch (Exception e) {
                log.warn("Failed to send expiration alert: userId={}, cause={}", user.getId(), e.getMessage());
            }
        }

        // 2. Notify Admins (Summary)
        if (!users.isEmpty() && !admins.isEmpty()) {
            for (User admin : admins) {
                try {
                    String title = "Membresias vencidas";
                    String message = users.size() + " usuario(s) tienen la membresia vencida hoy.";

                    Notification notification = Notification.builder()
                            .title(title)
                            .message(message)
                            .user(admin)
                            .status(NotificationStatus.UNREAD)
                            .createdAt(now)
                            .build();

                    notificationRepository.save(notification);
                    fcmService.sendNotification(admin.getId(), title, message);

                    log.debug("Expiration summary sent: adminId={}", admin.getId());
                } catch (Exception e) {
                    log.warn("Failed to send expiration summary: adminId={}, cause={}", admin.getId(), e.getMessage());
                }
            }
        }
    }

    /**
     * Alert: Birthday.
     * Triggered daily for users born on "today".
     */
    public void createBirthdayNotification(List<User> users, List<User> admins) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Wish the users
        for (User user : users) {
            try {
                String title = "Feliz cumpleanos";
                String message = "Feliz cumpleanos " + user.getFirstName() + ". Te deseamos un gran dia.";

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);
                fcmService.sendNotification(user.getId(), title, message);

                log.debug("Birthday wish sent: userId={}", user.getId());
            } catch (Exception e) {
                log.warn("Failed to send birthday wish: userId={}, cause={}", user.getId(), e.getMessage());
            }
        }

        // 2. Alert Admins (so they can greet users personally)
        if (!users.isEmpty() && !admins.isEmpty()) {
            for (User admin : admins) {
                try {
                    String userNames = users.stream()
                            .map(User::getFullName)
                            .collect(Collectors.joining(", "));

                    String title = "Cumpleanos de hoy";
                    String message = "Cumplen hoy: " + userNames;

                    Notification notification = Notification.builder()
                            .title(title)
                            .message(message)
                            .user(admin)
                            .status(NotificationStatus.UNREAD)
                            .createdAt(now)
                            .build();

                    notificationRepository.save(notification);
                    fcmService.sendNotification(admin.getId(), title, message);

                    log.debug("Birthday report sent: adminId={}", admin.getId());
                } catch (Exception e) {
                    log.warn("Failed to send birthday report: adminId={}, cause={}", admin.getId(), e.getMessage());
                }
            }
        }
    }

    /**
     * Alert: Absence Warning.
     * Triggered when a user hasn't attended for X consecutive days (e.g. 7).
     * Goal: Retention / Re-engagement.
     */
    public void createAttendanceWarningNotification(List<User> users, List<User> admins) {
        LocalDateTime now = LocalDateTime.now();

        for (User user : users) {
            try {
                String title = "Te extranamos";
                String message = "Pasaron mas de 7 dias desde tu ultima visita. Volve y segui cumpliendo tus objetivos.";

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);
                fcmService.sendNotification(user.getId(), title, message);

                log.debug("Absence warning sent: userId={}", user.getId());
            } catch (Exception e) {
                log.warn("Failed to send absence warning: userId={}, cause={}", user.getId(), e.getMessage());
            }
        }

        // Notify Admins about at-risk users
        if (!users.isEmpty() && !admins.isEmpty()) {
            for (User admin : admins) {
                try {
                    String title = "Usuarios en riesgo (ausentes > 7 dias)";
                    String message = users.size() + " usuario(s) llevan mas de una semana sin asistir.";

                    Notification notification = Notification.builder()
                            .title(title)
                            .message(message)
                            .user(admin)
                            .status(NotificationStatus.UNREAD)
                            .createdAt(now)
                            .build();

                    notificationRepository.save(notification);
                    fcmService.sendNotification(admin.getId(), title, message);

                    log.debug("Absence report sent: adminId={}", admin.getId());
                } catch (Exception e) {
                    log.warn("Failed to send absence report: adminId={}, cause={}", admin.getId(), e.getMessage());
                }
            }
        }
    }

    /**
     * Reminder: Payment Due Soon.
     * Triggered X days before expiration.
     */
    public void sendPaymentDueReminder(User user, Double amount, LocalDate expiresAt) {
        try {
            long daysUntilExpiration = java.time.temporal.ChronoUnit.DAYS.between(
                    LocalDate.now(), expiresAt);

            String title = "Recordatorio de pago";
            String message = String.format("Tu membresia vence en %d dia(s). Monto a pagar: $%.2f",
                    daysUntilExpiration, amount);

            Notification notification = Notification.builder()
                    .title(title)
                    .message(message)
                    .user(user)
                    .status(NotificationStatus.UNREAD)
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notification);
            fcmService.sendNotification(user.getId(), title, message);

            log.debug("Payment reminder sent: userId={}", user.getId());
        } catch (Exception e) {
            log.warn("Failed to send payment reminder: userId={}, cause={}", user.getId(), e.getMessage());
        }
    }

    /**
     * Reminder: Upcoming Class.
     * Batch notification for class participants.
     */
    public void sendBulkClassReminder(List<User> users, String activityName,
            LocalDateTime activityDate, String location) {
        LocalDateTime now = LocalDateTime.now();

        for (User user : users) {
            try {
                String title = "Recordatorio de clase";
                // Formatting date nicely could be an improvement here
                String message = String.format("Recordatorio: '%s' empieza pronto en %s.", activityName, location);

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);
                fcmService.sendNotification(user.getId(), title, message);

                log.debug("Class reminder sent: userId={}, activity={}", user.getId(), activityName);
            } catch (Exception e) {
                log.warn("Failed to send class reminder: userId={}, cause={}", user.getId(), e.getMessage());
            }
        }
    }

    /**
     * Monthly cleanup job.
     * Deletes every notification that is not archived.
     * 
     * Schedule: first day of every month at 00:00.
     */
    @Scheduled(cron = "0 0 0 1 * *")
    @Transactional
    public void purgeNonArchivedNotificationsMonthly() {
        try {
            long deletedCount = notificationRepository.deleteByStatusNot(NotificationStatus.ARCHIVED);
            log.info("Monthly notification cleanup complete. Deleted {} non-archived notifications.", deletedCount);
        } catch (Exception e) {
            log.error("Monthly notification cleanup failed: {}", e.getMessage(), e);
        }
    }

    // ===============================
    // HELPERS
    // ===============================

    /**
     * Safely parses the recipient id coming from the notification form.
     * A missing or non-numeric id is a client error (400), not a server fault (500).
     */
    private Long parseUserId(String rawUserId) {
        if (rawUserId == null || rawUserId.isBlank()) {
            // This is the prime suspect for the historical 500s: an empty/missing id.
            log.error("parseUserId FAILED | recipient id is null or blank | rawUserId='{}'. "
                    + "The client sent a request to /notifications/new without a valid userId.", rawUserId);
            throw new BusinessRuleException("Notification recipient (userId) is required",
                    "Api/Notification/createNotification");
        }

        try {
            Long parsed = Long.parseLong(rawUserId.trim());
            log.info("parseUserId OK | rawUserId='{}' -> userId={}", rawUserId, parsed);
            return parsed;
        } catch (NumberFormatException e) {
            // e.g. the literal string "undefined"/"null" coming from a bad frontend payload.
            log.error("parseUserId FAILED | recipient id is not numeric | rawUserId='{}'. "
                    + "Previously this threw an uncaught NumberFormatException and surfaced as HTTP 500.", rawUserId);
            throw new BusinessRuleException("Invalid notification recipient id: " + rawUserId,
                    "Api/Notification/createNotification");
        }
    }

    private NotificationTypeDTO convertToNotificationTypeDTO(Notification notification) {
        return NotificationTypeDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .createdAt(notification.getCreatedAt())
                .status(notification.getStatus())
                .userId(notification.getUser().getId())
                .userName(notification.getUser().getFullName())
                .build();
    }
}
