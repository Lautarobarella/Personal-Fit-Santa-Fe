package com.personalfit.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.enums.NotificationStatus;
import com.personalfit.services.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * Obtiene las notificaciones de un usuario específico
     */
    @GetMapping("/user/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable Long id) {
        try {
            List<NotificationDTO> notifications = notificationService.getAllByUserId(id);
            return ResponseEntity.ok(notifications);
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
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public ResponseEntity<String> markAllAsRead(@PathVariable Long userId) {
        try {
            notificationService.markAllAsReadByUserId(userId);
            return ResponseEntity.ok("All notifications marked as read");
        } catch (Exception e) {
            System.err.println("Error marking all notifications as read: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error updating notifications");
        }
    }
}
