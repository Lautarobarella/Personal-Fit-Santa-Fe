package com.personalfit.services.notifications.implementation;

import com.personalfit.enums.NotificationStatus;
import com.personalfit.models.Notification;
import com.personalfit.repository.NotificationRepository;
import com.personalfit.services.notifications.interfaces.INotificationCommandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implementación del servicio de comandos de notificaciones
 * Responsable únicamente de operaciones de escritura (CRUD)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationCommandService implements INotificationCommandService {

    private final NotificationRepository notificationRepository;

    @Override
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

            Notification savedNotification = notificationRepository.save(notification);
            log.debug("Notification created successfully with ID: {}", savedNotification.getId());
            return savedNotification;
            
        } catch (Exception e) {
            log.error("Error creating notification: {}", e.getMessage(), e);
            throw new RuntimeException("Error creating notification", e);
        }
    }

    @Override
    @Transactional
    public boolean updateNotificationStatus(Long notificationId, NotificationStatus status) {
        try {
            Optional<Notification> optionalNotification = notificationRepository.findById(notificationId);
            if (optionalNotification.isPresent()) {
                Notification notification = optionalNotification.get();
                notification.setStatus(status);
                notificationRepository.save(notification);
                log.debug("Notification {} status updated to {}", notificationId, status);
                return true;
            }
            log.warn("Notification not found with ID: {}", notificationId);
            return false;
        } catch (Exception e) {
            log.error("Error updating notification status for ID {}: {}", notificationId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public boolean deleteNotification(Long notificationId) {
        try {
            if (notificationRepository.existsById(notificationId)) {
                notificationRepository.deleteById(notificationId);
                log.debug("Notification {} deleted successfully", notificationId);
                return true;
            }
            log.warn("Notification not found with ID: {}", notificationId);
            return false;
        } catch (Exception e) {
            log.error("Error deleting notification with ID {}: {}", notificationId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public void markAllAsReadByUserId(Long userId) {
        try {
            List<Notification> unreadNotifications = notificationRepository.findByUserIdAndStatus(userId,
                    NotificationStatus.UNREAD);
            unreadNotifications.forEach(notification -> notification.setStatus(NotificationStatus.READ));
            notificationRepository.saveAll(unreadNotifications);
            log.debug("Marked {} notifications as read for user {}", unreadNotifications.size(), userId);
        } catch (Exception e) {
            log.error("Error marking all notifications as read for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Error marking notifications as read", e);
        }
    }

    @Override
    @Transactional
    public List<Notification> createBulkNotifications(List<Notification> notifications) {
        try {
            // Establecer valores por defecto para todas las notificaciones
            notifications.forEach(notification -> {
                if (notification.getDate() == null) {
                    notification.setDate(LocalDateTime.now());
                }
                if (notification.getStatus() == null) {
                    notification.setStatus(NotificationStatus.UNREAD);
                }
                if (notification.getTargetRole() == null && notification.getUser() != null) {
                    notification.setTargetRole(notification.getUser().getRole());
                }
            });

            List<Notification> savedNotifications = notificationRepository.saveAll(notifications);
            log.info("Created {} notifications in bulk", savedNotifications.size());
            return savedNotifications;
            
        } catch (Exception e) {
            log.error("Error creating bulk notifications: {}", e.getMessage(), e);
            throw new RuntimeException("Error creating bulk notifications", e);
        }
    }
}