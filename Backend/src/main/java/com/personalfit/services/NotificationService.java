package com.personalfit.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

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
        User user = userService.getUserById(Long.parseLong(notification.getUserId()));

        Notification newNotification = Notification.builder()
                .title(notification.getTitle())
                .message(notification.getMessage())
                .user(user)
                .status(NotificationStatus.UNREAD)
                .createdAt(LocalDateTime.now())
                .build();

        try {
            notificationRepository.save(newNotification);
            log.info("Notification created for user: {} | Title: {}", user.getId(), notification.getTitle());

            // Trigger External Push
            fcmService.sendNotification(user.getId(), notification.getTitle(), notification.getMessage());

        } catch (Exception e) {
            throw new BusinessRuleException("Failed to create notification: " + e.getMessage(),
                    "Api/Notification/createNotification");
        }
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
            int count = 0;

            for (User user : allUsers) {
                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);

                // Trigger External Push
                fcmService.sendNotification(user.getId(), title, message);

                count++;
            }

            log.info("Bulk dispatch complete. Title: '{}' | Recipients: {}", title, count);
            return count;

        } catch (Exception e) {
            log.error("Bulk notification failed: {}", e.getMessage());
            throw new BusinessRuleException("Bulk notification failure: " + e.getMessage(),
                    "Api/Notification/createBulkNotification");
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
            log.info("Notification deleted: {}", id);
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
            log.info("Marked as Read: {}", id);
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
            log.info("Marked as Unread: {}", id);
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
            log.info("Archived: {}", id);
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
            log.info("Unarchived: {}", id);
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
                String title = "Membership Expired";
                String message = "Your membership has expired. Please renew to continue using our services.";

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);
                fcmService.sendNotification(user.getId(), title, message);

                log.info("Expiration alert sent to user: {}", user.getId());
            } catch (Exception e) {
                log.error("Failed to alert user {}: {}", user.getId(), e.getMessage());
            }
        }

        // 2. Notify Admins (Summary)
        if (!users.isEmpty() && !admins.isEmpty()) {
            for (User admin : admins) {
                try {
                    String title = "Expired Memberships";
                    String message = users.size() + " user(s) have expired memberships today.";

                    Notification notification = Notification.builder()
                            .title(title)
                            .message(message)
                            .user(admin)
                            .status(NotificationStatus.UNREAD)
                            .createdAt(now)
                            .build();

                    notificationRepository.save(notification);
                    fcmService.sendNotification(admin.getId(), title, message);

                    log.info("Expiration summary sent to admin: {}", admin.getId());
                } catch (Exception e) {
                    log.error("Failed to alert admin {}: {}", admin.getId(), e.getMessage());
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
                String title = "Happy Birthday!";
                String message = "Happy Birthday " + user.getFirstName() + "! Wishing you a fantastic day! 🎉";

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);
                fcmService.sendNotification(user.getId(), title, message);

                log.info("Birthday wish sent to user: {}", user.getId());
            } catch (Exception e) {
                log.error("Failed to wish user {}: {}", user.getId(), e.getMessage());
            }
        }

        // 2. Alert Admins (so they can greet users personally)
        if (!users.isEmpty() && !admins.isEmpty()) {
            for (User admin : admins) {
                try {
                    String userNames = users.stream()
                            .map(User::getFullName)
                            .collect(Collectors.joining(", "));

                    String title = "Birthdays Today";
                    String message = "Celebrating today: " + userNames;

                    Notification notification = Notification.builder()
                            .title(title)
                            .message(message)
                            .user(admin)
                            .status(NotificationStatus.UNREAD)
                            .createdAt(now)
                            .build();

                    notificationRepository.save(notification);
                    fcmService.sendNotification(admin.getId(), title, message);

                    log.info("Birthday report sent to admin: {}", admin.getId());
                } catch (Exception e) {
                    log.error("Failed to report birthdays to admin {}: {}", admin.getId(), e.getMessage());
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
                String title = "We Miss You!";
                String message = "It's been over 7 days since your last visit. Come back and crush your goals!";

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);
                fcmService.sendNotification(user.getId(), title, message);

                log.info("Absence warning sent to user: {}", user.getId());
            } catch (Exception e) {
                log.error("Failed to warn user {}: {}", user.getId(), e.getMessage());
            }
        }

        // Notify Admins about at-risk users
        if (!users.isEmpty() && !admins.isEmpty()) {
            for (User admin : admins) {
                try {
                    String title = "At-Risk Users (Absent > 7 days)";
                    String message = users.size() + " user(s) have been absent for over a week.";

                    Notification notification = Notification.builder()
                            .title(title)
                            .message(message)
                            .user(admin)
                            .status(NotificationStatus.UNREAD)
                            .createdAt(now)
                            .build();

                    notificationRepository.save(notification);
                    fcmService.sendNotification(admin.getId(), title, message);

                    log.info("Absence report sent to admin: {}", admin.getId());
                } catch (Exception e) {
                    log.error("Failed to report absence to admin {}: {}", admin.getId(), e.getMessage());
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

            String title = "Payment Reminder";
            String message = String.format("Your membership expires in %d day(s). Amount due: $%.2f",
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

            log.info("Payment reminder sent to user: {}", user.getId());
        } catch (Exception e) {
            log.error("Failed to send payment reminder to user {}: {}", user.getId(), e.getMessage());
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
                String title = "Class Reminder";
                // Formatting date nicely could be an improvement here
                String message = String.format("Reminder: '%s' starts soon at %s.", activityName, location);

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);
                fcmService.sendNotification(user.getId(), title, message);

                log.info("Class reminder sent to user: {} for activity: {}", user.getId(), activityName);
            } catch (Exception e) {
                log.error("Failed to send class reminder to user {}: {}", user.getId(), e.getMessage());
            }
        }
    }

    // ===============================
    // HELPERS
    // ===============================

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
