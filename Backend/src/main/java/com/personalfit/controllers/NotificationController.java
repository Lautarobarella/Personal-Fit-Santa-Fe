package com.personalfit.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.dto.Notification.NotificationDetailInfoDTO;
import com.personalfit.dto.Notification.NotificationFormTypeDTO;
import com.personalfit.dto.Notification.NotificationTypeDTO;
import com.personalfit.services.NotificationService;

/**
 * Controller for Notification Management.
 * Handles the creation (Admin only) and consumption (Users) of system
 * notifications.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * Create a single notification for a specific user.
     * Admin only.
     */
    @PostMapping("/new")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> newNotification(@RequestBody NotificationFormTypeDTO notification) {
        notificationService.createNotification(notification);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notification created successfully");
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    /**
     * Send a broadcast notification to ALL users.
     * Admin only.
     */
    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createBulkNotification(@RequestBody Map<String, String> request) {
        String title = request.get("title");
        String message = request.get("message");

        int count = notificationService.createBulkNotification(title, message);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Bulk notifications created successfully");
        response.put("success", true);
        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a notification.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notification deleted successfully");
        response.put("success", true);
        response.put("notificationId", id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all notifications for a user.
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<List<NotificationTypeDTO>> getAllNotifications(@PathVariable Long userId) {
        List<NotificationTypeDTO> notifications = notificationService.getAllNotificationsTypeDto(userId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get details of a single notification.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<NotificationDetailInfoDTO> getNotificationInfo(@PathVariable Long id) {
        NotificationDetailInfoDTO notificationInfo = notificationService.getNotificationDetailInfo(id);
        return ResponseEntity.ok(notificationInfo);
    }

    /**
     * Mark notification as read.
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notification marked as read");
        response.put("success", true);
        response.put("notificationId", id);
        return ResponseEntity.ok(response);
    }

    /**
     * Mark notification as unread.
     */
    @PutMapping("/{id}/unread")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> markAsUnread(@PathVariable Long id) {
        notificationService.markAsUnread(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notification marked as unread");
        response.put("success", true);
        response.put("notificationId", id);
        return ResponseEntity.ok(response);
    }

    /**
     * Archive a notification.
     */
    @PutMapping("/{id}/archive")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> archiveNotification(@PathVariable Long id) {
        notificationService.archiveNotification(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notification archived successfully");
        response.put("success", true);
        response.put("notificationId", id);
        return ResponseEntity.ok(response);
    }

    /**
     * Unarchive a notification.
     */
    @PutMapping("/{id}/unarchive")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> unarchiveNotification(@PathVariable Long id) {
        notificationService.unarchiveNotification(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notification unarchived successfully");
        response.put("success", true);
        response.put("notificationId", id);
        return ResponseEntity.ok(response);
    }
}
