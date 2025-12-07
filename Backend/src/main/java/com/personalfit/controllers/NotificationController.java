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

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/new")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> newNotification(@RequestBody NotificationFormTypeDTO notification) {
        notificationService.createNotification(notification);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notificación creada exitosamente");
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notificación eliminada exitosamente");
        response.put("success", true);
        response.put("notificationId", id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<List<NotificationTypeDTO>> getAllNotifications(@PathVariable Long userId) {
        List<NotificationTypeDTO> notifications = notificationService.getAllNotificationsTypeDto(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<NotificationDetailInfoDTO> getNotificationInfo(@PathVariable Long id) {
        NotificationDetailInfoDTO notificationInfo = notificationService.getNotificationDetailInfo(id);
        return ResponseEntity.ok(notificationInfo);
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notificación marcada como leída");
        response.put("success", true);
        response.put("notificationId", id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/unread")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> markAsUnread(@PathVariable Long id) {
        notificationService.markAsUnread(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notificación marcada como no leída");
        response.put("success", true);
        response.put("notificationId", id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/archive")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> archiveNotification(@PathVariable Long id) {
        notificationService.archiveNotification(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notificación archivada exitosamente");
        response.put("success", true);
        response.put("notificationId", id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/unarchive")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> unarchiveNotification(@PathVariable Long id) {
        notificationService.unarchiveNotification(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notificación desarchivada exitosamente");
        response.put("success", true);
        response.put("notificationId", id);
        return ResponseEntity.ok(response);
    }
}
